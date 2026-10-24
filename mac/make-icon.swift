// Draws the Gorgon Notes app icon (the brand mark from static/index.html on a window-coloured tile)
// and writes <out>/AppIcon.icns. Usage: swift make-icon.swift <outdir>
import AppKit

let out = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "."
let set = "\(out)/AppIcon.iconset"
try? FileManager.default.createDirectory(atPath: set, withIntermediateDirectories: true)

func hex(_ v: UInt32) -> NSColor {
  NSColor(srgbRed: CGFloat(v >> 16 & 0xFF) / 255, green: CGFloat(v >> 8 & 0xFF) / 255, blue: CGFloat(v & 0xFF) / 255, alpha: 1)
}

func draw(_ px: Int) -> Data {
  let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: px, pixelsHigh: px, bitsPerSample: 8, samplesPerPixel: 4,
    hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
  let s = CGFloat(px) / 1024
  // macOS icon grid: 824pt body inset 100pt, corner ~185.
  let tile = NSBezierPath(roundedRect: NSRect(x: 100 * s, y: 100 * s, width: 824 * s, height: 824 * s), xRadius: 185 * s, yRadius: 185 * s)
  hex(0x1E1818).setFill(); tile.fill()
  hex(0x3A2C2B).setStroke(); tile.lineWidth = 8 * s; tile.stroke()
  // Mark: viewBox 32 → 22 units per... scale the 32-unit mark into a 560pt box centred on the tile.
  let u = 560 * s / 32, ox = 232 * s, oy = 232 * s
  func p(_ x: CGFloat, _ y: CGFloat) -> NSPoint { NSPoint(x: ox + x * u, y: oy + (32 - y) * u) }
  let frame = NSBezierPath(roundedRect: NSRect(x: ox + 3.25 * u, y: oy + 3.25 * u, width: 25.5 * u, height: 25.5 * u), xRadius: 6 * u, yRadius: 6 * u)
  frame.lineWidth = 2.5 * u
  hex(0xDFC9A0).setStroke(); frame.stroke()
  let notch = NSBezierPath()
  notch.move(to: p(12, 7)); notch.line(to: p(20, 7)); notch.line(to: p(16, 12)); notch.close()
  hex(0xA2482A).setFill(); notch.fill()
  NSGraphicsContext.restoreGraphicsState()
  return rep.representation(using: .png, properties: [:])!
}

for (name, px) in [("16x16", 16), ("16x16@2x", 32), ("32x32", 32), ("32x32@2x", 64), ("128x128", 128), ("128x128@2x", 256),
  ("256x256", 256), ("256x256@2x", 512), ("512x512", 512), ("512x512@2x", 1024)]
{
  try! draw(px).write(to: URL(fileURLWithPath: "\(set)/icon_\(name).png"))
}
let t = Process()
t.executableURL = URL(fileURLWithPath: "/usr/bin/iconutil")
t.arguments = ["-c", "icns", set, "-o", "\(out)/AppIcon.icns"]
try! t.run(); t.waitUntilExit()
