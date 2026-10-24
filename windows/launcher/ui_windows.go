//go:build windows

package main

import (
	"os/exec"
	"syscall"
	"unsafe"

	webview2 "github.com/jchv/go-webview2"
)

var (
	user32                        = syscall.NewLazyDLL("user32.dll")
	procMessageBoxW               = user32.NewProc("MessageBoxW")
	procSetProcessDpiAwarenessCtx = user32.NewProc("SetProcessDpiAwarenessContext")
	procSetProcessDPIAware        = user32.NewProc("SetProcessDPIAware")
	shell32                       = syscall.NewLazyDLL("shell32.dll")
	procShellExecuteW             = shell32.NewProc("ShellExecuteW")
)

const (
	mbOK           = 0x0
	mbIconError    = 0x10
	mbIconInfo     = 0x40
	swShowNormal   = 1
	createNoWindow = 0x08000000
	// DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2: crisp text on high-DPI screens (Windows 10 1703+).
	dpiPerMonitorV2 = ^uintptr(3) // (DPI_AWARENESS_CONTEXT)-4
)

func utf16(s string) *uint16 {
	p, _ := syscall.UTF16PtrFromString(s)
	return p
}

func messageBox(title, text string, flags uintptr) {
	procMessageBoxW.Call(0, uintptr(unsafe.Pointer(utf16(text))), uintptr(unsafe.Pointer(utf16(title))), flags)
}

func alert(title, text string) { messageBox(title, text, mbOK|mbIconError) }

// hideWindow keeps python.exe from opening a console of its own.
func hideWindow(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: createNoWindow}
}

func openBrowser(url string) {
	procShellExecuteW.Call(0, uintptr(unsafe.Pointer(utf16("open"))), uintptr(unsafe.Pointer(utf16(url))), 0, 0, swShowNormal)
}

// showUI opens the app window and returns when the player closes it. Without the WebView2 runtime
// (Windows ships it with Edge; very old Windows 10 installs may lack it) it falls back to the default
// browser and a message box that keeps the server alive until dismissed.
func showUI(url, dataDir string) {
	if r, _, _ := procSetProcessDpiAwarenessCtx.Call(dpiPerMonitorV2); r == 0 {
		procSetProcessDPIAware.Call()
	}
	w := webview2.NewWithOptions(webview2.WebViewOptions{
		AutoFocus: true,
		DataPath:  dataDir,
		WindowOptions: webview2.WindowOptions{
			Title:  appName,
			Width:  1280,
			Height: 860,
			Center: true,
		},
	})
	if w == nil {
		logf("WebView2 unavailable; opening the browser instead")
		openBrowser(url)
		messageBox(appName, "Gorgon Notes is open in your browser at "+url+"\n\n"+
			"(The WebView2 runtime that gives it its own window was not found; it comes with Microsoft Edge.)\n\n"+
			"Close this message to stop Gorgon Notes.", mbOK|mbIconInfo)
		return
	}
	defer w.Destroy()
	w.Navigate(url)
	w.Run()
}
