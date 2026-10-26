// Gorgon Notes: menu-bar shell around the local web UI (server.py on 127.0.0.1:8787).
// - Menu-bar icon shows data health from /api/health (amber/red count when something needs doing).
// - The web UI lives in a WKWebView that stays loaded while the window is hidden, so the web app's
//   Reminders keep running; its `new Notification(...)` calls are bridged to native notifications.
// - Starts server.py itself only if nothing answers on the port (normally the LaunchAgent runs it).
// Build: mac/build.sh (swiftc, no Xcode).

import Cocoa
import ServiceManagement
import UserNotifications
import WebKit

let info = Bundle.main.infoDictionary ?? [:]
let port = info["GNPort"] as? String ?? "8787"
let base = URL(string: "http://127.0.0.1:\(port)/")!
let views = ["session", "combat", "vendors", "storage", "character", "files", "teleports"]

// Replaces window.Notification inside the page. Permission is injected at document start.
let notificationShim = """
(() => {
  const post = m => window.webkit.messageHandlers.gn.postMessage(m);
  class GNNotification {
    constructor(title, o = {}) {
      this.title = title; this.onclick = null;
      post({ kind: 'notify', title: String(title), body: String(o.body || ''), tag: String(o.tag || '') });
    }
    close() {}
    static async requestPermission() { const p = await post({ kind: 'permission' }); GNNotification.permission = p; return p; }
  }
  GNNotification.permission = '%PERM%';
  // The baked value is from launch; re-read it on every page load and whenever the window comes back
  // (e.g. from System Settings → Notifications), so a denied → allowed change needs no relaunch.
  const refresh = () => post({ kind: 'permissionState' }).then(p => {
    if (!p || p === GNNotification.permission) return;
    GNNotification.permission = p;
    window.dispatchEvent(new Event('gn-permission'));
  }).catch(() => {});
  refresh();
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.Notification = GNNotification;
  window.GORGON_NATIVE = true;
})();
"""

final class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate, NSMenuDelegate,
  WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandlerWithReply, UNUserNotificationCenterDelegate
{
  var statusItem: NSStatusItem!
  var window: NSWindow!
  var web: WKWebView!
  var health: [String: Any]?
  var fixes: [String: String] = [:]
  var serverProcess: Process?
  var lastError: String?
  let defaults = UserDefaults.standard

  // MARK: Launch

  func applicationDidFinishLaunching(_ note: Notification) {
    NSApp.setActivationPolicy(.accessory)
    // A main menu with the standard Edit items: without it the window has no ⌘X / ⌘C / ⌘V / ⌘A (the key
    // equivalents are dispatched through the main menu, and a menu-bar app has none by default). The
    // items have no target, so they travel the responder chain to the web view's focused field.
    let mainMenu = NSMenu()
    let appItem = NSMenuItem(); mainMenu.addItem(appItem)
    let appMenu = NSMenu(title: "Gorgon Notes"); appItem.submenu = appMenu
    appMenu.addItem(action("Quit Gorgon Notes", #selector(NSApplication.terminate(_:)), "q", target: NSApp))
    let editItem = NSMenuItem(); mainMenu.addItem(editItem)
    let edit = NSMenu(title: "Edit"); editItem.submenu = edit
    edit.addItem(withTitle: "Undo", action: Selector(("undo:")), keyEquivalent: "z")
    edit.addItem(withTitle: "Redo", action: Selector(("redo:")), keyEquivalent: "Z")
    edit.addItem(.separator())
    edit.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
    edit.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
    edit.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
    edit.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
    NSApp.mainMenu = mainMenu
    statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    statusItem.button?.image = symbol("scroll")
    statusItem.button?.imagePosition = .imageLeading
    let menu = NSMenu()
    menu.delegate = self
    statusItem.menu = menu

    let center = UNUserNotificationCenter.current()
    center.delegate = self
    let open = UNNotificationAction(identifier: "open", title: "Open Gorgon Notes", options: [.foreground])
    let snooze = UNNotificationAction(identifier: "snooze", title: "Pause 1 hour", options: [])
    center.setNotificationCategories([UNNotificationCategory(identifier: "gn", actions: [open, snooze], intentIdentifiers: [])])

    ensureServer {
      self.permissionState { perm in
        self.makeWindow(permission: perm)
        // Opened by hand (not at login): show the window straight away.
        if ProcessInfo.processInfo.systemUptime > 300 { self.showWindow(view: nil) }
      }
    }
    pollHealth()
    Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { _ in self.pollHealth() }
  }

  func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
    showWindow(view: nil)
    return true
  }

  func applicationWillTerminate(_ note: Notification) {
    serverProcess?.terminate()
  }

  // MARK: Server

  func ensureServer(then done: @escaping () -> Void) {
    get("api/health", timeout: 2) { data in
      if data != nil { return done() }
      guard let dir = info["GNServerDir"] as? String, let py = info["GNPython"] as? String else { return done() }
      let p = Process()
      p.executableURL = URL(fileURLWithPath: py)
      p.arguments = [dir + "/server.py"]
      p.currentDirectoryURL = URL(fileURLWithPath: dir)
      p.standardOutput = FileHandle.nullDevice
      p.standardError = FileHandle.nullDevice
      do { try p.run(); self.serverProcess = p } catch { self.lastError = "Couldn't start server.py: \(error.localizedDescription)" }
      DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { done() }
    }
  }

  func get(_ path: String, timeout: TimeInterval = 5, _ done: @escaping (Data?) -> Void) {
    var req = URLRequest(url: base.appendingPathComponent(path))
    req.timeoutInterval = timeout
    URLSession.shared.dataTask(with: req) { data, resp, _ in
      let ok = (resp as? HTTPURLResponse)?.statusCode == 200
      DispatchQueue.main.async { done(ok ? data : nil) }
    }.resume()
  }

  // MARK: Health → menu-bar icon

  func pollHealth() {
    get("api/health") { data in
      guard let data, let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        self.health = nil
        self.updateIcon()
        return
      }
      self.health = obj
      self.updateIcon()
      self.loadFixes(data)
    }
  }

  var actionable: [[String: Any]] {
    let items = health?["items"] as? [[String: Any]] ?? []
    return items.filter { ["warn", "bad"].contains($0["severity"] as? String ?? "") }
  }

  func updateIcon() {
    guard let button = statusItem.button else { return }
    guard health != nil else {
      button.image = symbol("scroll", tint: .systemRed)
      button.attributedTitle = NSAttributedString(string: "")
      button.toolTip = "Gorgon Notes: server not answering"
      return
    }
    let todo = actionable
    let bad = todo.contains { $0["severity"] as? String == "bad" }
    if todo.isEmpty {
      button.image = symbol("scroll")
      button.attributedTitle = NSAttributedString(string: "")
    } else {
      let color: NSColor = bad ? .systemRed : .systemOrange
      button.image = symbol("scroll", tint: color)
      button.attributedTitle = NSAttributedString(
        string: " \(todo.count)",
        attributes: [.foregroundColor: color, .font: NSFont.monospacedDigitSystemFont(ofSize: 12, weight: .semibold)])
    }
    let summary = health?["summary"] as? [String: Any]
    button.toolTip = "Gorgon Notes: \(summary?["header"] as? String ?? "")"
  }

  // Fix wording comes from the web app's fixText(), so the menu says exactly what the UI says.
  func loadFixes(_ data: Data) {
    guard let web, let json = String(data: data, encoding: .utf8) else { return }
    let js = """
      if (typeof fixText !== 'function') return '{}';
      const out = {};
      for (const i of JSON.parse(j).items || []) if (i.fixKey) try { out[i.id] = fixText(i.fixKey, i.fixArgs || {}); } catch (e) {}
      return JSON.stringify(out);
      """
    web.callAsyncJavaScript(js, arguments: ["j": json], in: nil, in: .page) { result in
      if case .success(let v) = result, let s = v as? String, let d = s.data(using: .utf8),
        let m = try? JSONSerialization.jsonObject(with: d) as? [String: String]
      {
        self.fixes = m
      }
    }
  }

  func symbol(_ name: String, tint: NSColor? = nil) -> NSImage? {
    let img = NSImage(systemSymbolName: name, accessibilityDescription: "Gorgon Notes")
    guard let tint, let img else {
      img?.isTemplate = true
      return img
    }
    let conf = NSImage.SymbolConfiguration(paletteColors: [tint])
    return img.withSymbolConfiguration(conf)
  }

  // MARK: Menu

  func menuNeedsUpdate(_ menu: NSMenu) {
    menu.removeAllItems()
    let summary = health?["summary"] as? [String: Any]
    let header = health == nil ? "Server not answering on port \(port)" : "Data: \(summary?["header"] as? String ?? "")"
    menu.addItem(disabled(header))
    if let app = health?["app"] as? [String: Any], let v = app["version"] as? String {
      let latest = app["latest"] as? String
      let newer = app["newer"] as? Bool ?? false
      var line = "Gorgon Notes \(v)"
      if let l = latest { line += newer ? " · \(l) is out: pull and rebuild" : " · newest release \(l)" }
      menu.addItem(disabled(line))
    }
    if let e = lastError { menu.addItem(disabled(e)) }

    for item in actionable {
      let title = item["title"] as? String ?? ""
      let evidence = item["evidence"] as? String ?? ""
      let fix = fixes[item["id"] as? String ?? ""] ?? ""
      let bad = item["severity"] as? String == "bad"
      let text = NSMutableAttributedString(
        string: (bad ? "● " : "▲ ") + title,
        attributes: [.font: NSFont.boldSystemFont(ofSize: 13), .foregroundColor: bad ? NSColor.systemRed : NSColor.systemOrange])
      text.append(NSAttributedString(string: "\n" + wrap(evidence), attributes: [.font: NSFont.menuFont(ofSize: 12)]))
      if !fix.isEmpty {
        text.append(NSAttributedString(
          string: "\n" + wrap(fix), attributes: [.font: NSFont.menuFont(ofSize: 12), .foregroundColor: NSColor.secondaryLabelColor]))
      }
      let mi = NSMenuItem(title: title, action: #selector(openView(_:)), keyEquivalent: "")
      mi.attributedTitle = text
      mi.target = self
      mi.representedObject = (item["views"] as? [String])?.first
      menu.addItem(mi)
    }

    menu.addItem(.separator())
    menu.addItem(action("Open Gorgon Notes", #selector(openMain), "o"))
    for (i, v) in views.enumerated() {
      let mi = action(v.capitalized, #selector(openView(_:)), "\(i + 1)")
      mi.representedObject = v
      mi.indentationLevel = 1
      menu.addItem(mi)
    }
    menu.addItem(action("Check Again", #selector(checkAgain), "r"))

    menu.addItem(.separator())
    menu.addItem(action("Reminders…", #selector(openReminders), ""))
    let paused = pausedUntil.map { $0 > Date() } ?? false
    let pause = action(paused ? "Resume Notifications" : "Pause Notifications for 1 Hour", #selector(togglePause), "")
    menu.addItem(pause)
    menu.addItem(action("Send Test Notification", #selector(testNotification), ""))
    let login = action("Open at Login", #selector(toggleLogin), "")
    login.state = SMAppService.mainApp.status == .enabled ? .on : .off
    menu.addItem(login)

    menu.addItem(.separator())
    menu.addItem(action("Quit Gorgon Notes", #selector(NSApplication.terminate(_:)), "q", target: NSApp))
  }

  func disabled(_ s: String) -> NSMenuItem {
    let mi = NSMenuItem(title: s, action: nil, keyEquivalent: "")
    mi.isEnabled = false
    return mi
  }

  func action(_ title: String, _ sel: Selector, _ key: String, target: AnyObject? = nil) -> NSMenuItem {
    let mi = NSMenuItem(title: title, action: sel, keyEquivalent: key)
    mi.target = target ?? self
    return mi
  }

  func wrap(_ s: String, width: Int = 52) -> String {
    var lines: [String] = []
    var line = ""
    for word in s.split(separator: " ") {
      if line.count + word.count + 1 > width, !line.isEmpty {
        lines.append(line)
        line = ""
      }
      line += (line.isEmpty ? "" : " ") + word
    }
    if !line.isEmpty { lines.append(line) }
    return lines.joined(separator: "\n")
  }

  @objc func openMain() { showWindow(view: nil) }
  @objc func openView(_ sender: NSMenuItem) { showWindow(view: sender.representedObject as? String) }

  @objc func checkAgain() {
    pollHealth()
    web?.evaluateJavaScript("typeof fullRound === 'function' && fullRound().then(() => { computeVerdicts(); renderAll(); })")
  }

  @objc func openReminders() {
    showWindow(view: nil)
    web?.evaluateJavaScript("document.getElementById('remindbtn')?.click()")
  }

  var pausedUntil: Date? {
    get { defaults.object(forKey: "pausedUntil") as? Date }
    set { defaults.set(newValue, forKey: "pausedUntil") }
  }

  @objc func togglePause() {
    pausedUntil = (pausedUntil.map { $0 > Date() } ?? false) ? nil : Date().addingTimeInterval(3600)
  }

  @objc func testNotification() {
    requestPermission { granted in
      if granted {
        self.notify(title: "Gorgon Notes", body: "Notifications work. Reminders arrive like this.", tag: "test", force: true)
      } else {
        self.alert("Notifications are off for Gorgon Notes. Turn them on in System Settings → Notifications → Gorgon Notes.")
      }
    }
  }

  @objc func toggleLogin() {
    do {
      if SMAppService.mainApp.status == .enabled { try SMAppService.mainApp.unregister() } else { try SMAppService.mainApp.register() }
    } catch {
      alert("Couldn't change Open at Login: \(error.localizedDescription)\nMove Gorgon Notes to /Applications and try again, or add it in System Settings → General → Login Items.")
    }
  }

  func alert(_ text: String) {
    NSApp.activate(ignoringOtherApps: true)
    let a = NSAlert()
    a.messageText = "Gorgon Notes"
    a.informativeText = text
    a.runModal()
  }

  // MARK: Window + web view

  func makeWindow(permission: String) {
    let conf = WKWebViewConfiguration()
    let ucc = WKUserContentController()
    ucc.addScriptMessageHandler(self, contentWorld: .page, name: "gn")
    ucc.addUserScript(WKUserScript(
      source: notificationShim.replacingOccurrences(of: "%PERM%", with: permission),
      injectionTime: .atDocumentStart, forMainFrameOnly: true))
    conf.userContentController = ucc
    web = WKWebView(frame: .zero, configuration: conf)
    web.navigationDelegate = self
    web.uiDelegate = self
    web.underPageBackgroundColor = NSColor(red: 0x16 / 255, green: 0x11 / 255, blue: 0x11 / 255, alpha: 1)
    web.setValue(false, forKey: "drawsBackground")

    window = NSWindow(
      contentRect: NSRect(x: 0, y: 0, width: 1440, height: 940),
      styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
    window.title = "Gorgon Notes"
    window.minSize = NSSize(width: 390, height: 560)
    window.backgroundColor = web.underPageBackgroundColor
    window.isReleasedWhenClosed = false
    window.delegate = self
    window.contentView = web
    window.center()
    window.setFrameAutosaveName("GorgonNotesMain")
    web.load(URLRequest(url: base))
  }

  func showWindow(view: String?) {
    guard let window else { return }
    NSApp.setActivationPolicy(.regular)
    window.makeKeyAndOrderFront(nil)
    NSApp.activate(ignoringOtherApps: true)
    if let view, views.contains(view) { web.evaluateJavaScript("location.hash = '#\(view)'") }
  }

  func windowShouldClose(_ sender: NSWindow) -> Bool {
    // Keep the page alive (Reminders keep running); just hide and leave the Dock.
    window.orderOut(nil)
    NSApp.setActivationPolicy(.accessory)
    return false
  }

  // Only the local UI loads in the window; every other link opens in the default browser.
  func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    if let url = action.request.url, url.host != "127.0.0.1", url.scheme?.hasPrefix("http") == true {
      NSWorkspace.shared.open(url)
      return decisionHandler(.cancel)
    }
    decisionHandler(.allow)
  }

  func webView(_ webView: WKWebView, createWebViewWith c: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
    // window.open from the page: web links only, like decidePolicyFor; never hand another URL scheme to the system.
    if let url = action.request.url, url.scheme?.hasPrefix("http") == true { NSWorkspace.shared.open(url) }
    return nil
  }

  func webView(_ webView: WKWebView, didFailProvisionalNavigation nav: WKNavigation!, withError error: Error) {
    // Server not up yet (e.g. right after login): retry.
    DispatchQueue.main.asyncAfter(deadline: .now() + 5) { webView.load(URLRequest(url: base)) }
  }

  func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { webView.reload() }

  // MARK: Notification bridge (page → native)

  func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
    guard let body = message.body as? [String: Any], let kind = body["kind"] as? String else { return replyHandler(nil, nil) }
    switch kind {
    case "permission":
      requestPermission { granted in replyHandler(granted ? "granted" : "denied", nil) }
    case "permissionState":
      permissionState { state in replyHandler(state, nil) }
    case "notify":
      notify(title: body["title"] as? String ?? "", body: body["body"] as? String ?? "", tag: body["tag"] as? String ?? "")
      replyHandler(nil, nil)
    default:
      replyHandler(nil, nil)
    }
  }

  /// The current authorization without prompting: "granted", "denied" or "default".
  func permissionState(_ done: @escaping (String) -> Void) {
    UNUserNotificationCenter.current().getNotificationSettings { settings in
      let perm: String
      switch settings.authorizationStatus {
      case .authorized, .provisional: perm = "granted"
      case .denied: perm = "denied"
      default: perm = "default"
      }
      DispatchQueue.main.async { done(perm) }
    }
  }

  func requestPermission(_ done: @escaping (Bool) -> Void) {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
      DispatchQueue.main.async { done(granted) }
    }
  }

  func notify(title: String, body: String, tag: String, force: Bool = false) {
    if !force, let until = pausedUntil, until > Date() { return }
    let c = UNMutableNotificationContent()
    c.title = title
    c.body = body
    c.categoryIdentifier = "gn"
    c.userInfo = ["tag": tag]
    let id = tag.isEmpty ? UUID().uuidString : tag
    UNUserNotificationCenter.current().add(UNNotificationRequest(identifier: id, content: c, trigger: nil))
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent n: UNNotification, withCompletionHandler done: @escaping (UNNotificationPresentationOptions) -> Void) {
    done([.banner, .list])
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler done: @escaping () -> Void) {
    DispatchQueue.main.async {
      if response.actionIdentifier == "snooze" {
        self.pausedUntil = Date().addingTimeInterval(3600)
      } else {
        self.showWindow(view: self.view(forTag: response.notification.request.content.userInfo["tag"] as? String ?? ""))
      }
      done()
    }
  }

  // The page tags notifications with their topic (e.g. "zone-storage:Serbule"); map to a view.
  func view(forTag tag: String) -> String? {
    let topic = tag.split(separator: ":").first.map(String.init) ?? ""
    // Same as TOPIC_VIEW in static/app.js.
    let map = ["zone-storage": "storage", "after-selling": "vendors", "before-logout": "storage", "broken-export": "character",
      "vendor-reset": "vendors", "digest": "vendors", "login-checklist": "session", "storage-full": "storage", "export-confirmed": "session",
      "export-stale": "storage"]
    return map[topic]
  }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
