#!/bin/zsh
# Builds "Gorgon Notes.app" into mac/build/. `./build.sh install` also copies it to /Applications and opens it.
set -euo pipefail
cd "${0:A:h}"
REPO="${0:A:h:h}"
APP="build/Gorgon Notes.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
swiftc -O -swift-version 5 -target "$(uname -m)-apple-macos13.0" GorgonNotes/main.swift -o "$APP/Contents/MacOS/GorgonNotes"
sed -e "s|@SERVER_DIR@|$REPO|" -e "s|@PYTHON@|$(command -v python3)|" GorgonNotes/Info.plist > "$APP/Contents/Info.plist"
[[ -f build/AppIcon.icns && build/AppIcon.icns -nt make-icon.swift ]] || swift make-icon.swift build
cp build/AppIcon.icns "$APP/Contents/Resources/"
codesign --force --sign - "$APP"
echo "Built $APP"
if [[ "${1:-}" == install ]]; then
  osascript -e 'quit app "Gorgon Notes"' 2>/dev/null || true
  sleep 1
  rm -rf "/Applications/Gorgon Notes.app"
  cp -R "$APP" /Applications/
  open "/Applications/Gorgon Notes.app"
  echo "Installed to /Applications"
fi
