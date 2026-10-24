#!/bin/bash
# Build the Windows package of Gorgon Notes (on this Mac or on the GitHub Actions runner):
#   dist/GorgonNotes-windows.zip   server.py + static/ + cache/ + python.org embeddable Python + Gorgon Notes.bat
#   dist/GorgonNotes.exe           Go program (windows/launcher) embedding that zip; own window; self-updating
#   dist/version.txt               the version baked into both (a release tag, or dev-<stamp>)
#
#   windows/build.sh                                  dev build, no update checks unless origin is on GitHub
#   GN_VERSION=v0.1.0 GN_REPO=owner/name windows/build.sh   what .github/workflows/release.yml runs on a tag
#   PY_VERSION=3.14.9                                 the embeddable Python to download (cached in dist/)
#
# Nothing is compiled from Python; the friend's PC runs python\python.exe server.py from the unpacked zip.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PY_VERSION="${PY_VERSION:-3.14.9}"
PY_ZIP="python-${PY_VERSION}-embed-amd64.zip"
PY_URL="https://www.python.org/ftp/python/${PY_VERSION}/${PY_ZIP}"
DIST="$ROOT/dist"
NAME="GorgonNotes-windows"
OUT="$DIST/$NAME"
VERSION="${GN_VERSION:-dev-$(date +%Y-%m-%d-%H%M)}"
# owner/name on GitHub, for the launcher's update check: GN_REPO, else the git remote "origin".
REPO="${GN_REPO:-$(git -C "$ROOT" remote get-url origin 2>/dev/null | sed -E 's#.*github\.com[:/]##; s#\.git$##' || true)}"

mkdir -p "$DIST"
if [ ! -s "$DIST/$PY_ZIP" ]; then
  echo "Downloading $PY_URL"
  curl -fsSL -A "pg-dashboard/0.1" -o "$DIST/$PY_ZIP.part" "$PY_URL"
  mv "$DIST/$PY_ZIP.part" "$DIST/$PY_ZIP"
fi

# CDN game data for the zip, so the first run works before the CDN is reached (the server re-downloads
# it when the game version changes). The runner has no cache/; fetch it with the server's own code.
if [ ! -d "$ROOT/cache" ] && command -v python3 >/dev/null; then
  echo "Fetching CDN game data into cache/"
  (cd "$ROOT" && python3 -c 'import server
for n in ("areas", "attributes", "items", "npcs", "quests", "storagevaults", "tsysclientinfo"):
    server.cdn_data(n)
print("cache", server.cached_versions())') || echo "CDN fetch failed; the zip ships without cache/"
fi

rm -rf "$OUT"
mkdir -p "$OUT/python"
unzip -q "$DIST/$PY_ZIP" -d "$OUT/python"
# Keep the embeddable layout as shipped: python314._pth pins sys.path to the stdlib zip, which is all
# server.py needs (it imports nothing outside the standard library).

cp "$ROOT/server.py" "$ROOT/item-type-icons.json" "$OUT/"
cp -R "$ROOT/static" "$OUT/static"
if [ -d "$ROOT/cache" ]; then
  mkdir -p "$OUT/cache"
  for v in "$ROOT"/cache/v*/; do
    [ -d "$v" ] && cp -R "$v" "$OUT/cache/$(basename "$v")"
  done
fi
# capacity.json is the player's own data: not shipped.
find "$OUT" -name "__pycache__" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find "$OUT" -name ".DS_Store" -delete 2>/dev/null || true
echo "$VERSION" > "$OUT/build.txt"

# Windows text files get CRLF line endings (cmd.exe and Notepad are happiest with them).
crlf() { perl -pe 's/\r?\n/\r\n/' "$1" > "$2"; }
crlf "$ROOT/windows/Gorgon Notes.bat" "$OUT/Gorgon Notes.bat"
crlf "$ROOT/windows/README-WINDOWS.txt" "$OUT/README.txt"

( cd "$DIST" && rm -f "$NAME.zip" && zip -qr "$NAME.zip" "$NAME" )
echo "$VERSION" > "$DIST/version.txt"
echo "Built $DIST/$NAME.zip ($(du -h "$DIST/$NAME.zip" | cut -f1)), version $VERSION, folder $OUT"
echo "Python $PY_VERSION embedded; server.py, static/, cache/ copied; capacity.json left out."

# The Windows program: embeds the zip, unpacks it into %LOCALAPPDATA%\Gorgon Notes\app, starts the server
# hidden, shows the UI in its own WebView2 window (-H windowsgui: no console), updates itself from the
# GitHub releases of $REPO. Needs Go (brew install go); the WebView2 binding is pure Go.
if command -v go >/dev/null; then
  cp "$DIST/$NAME.zip" "$ROOT/windows/launcher/payload.zip"
  ( cd "$ROOT/windows/launcher" && go test ./... >/dev/null && GOOS=windows GOARCH=amd64 CGO_ENABLED=0 \
      go build -trimpath -ldflags "-s -w -H windowsgui -X main.build=$VERSION -X main.repo=$REPO" -o "$DIST/GorgonNotes.exe" . )
  echo "Built $DIST/GorgonNotes.exe ($(du -h "$DIST/GorgonNotes.exe" | cut -f1)), version $VERSION, updates from ${REPO:-nowhere (no GitHub remote)}"
else
  echo "Go not found: skipped GorgonNotes.exe (brew install go)."
fi
