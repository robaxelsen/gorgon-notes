# pg-dashboard: Gorgon Notes

Project Gorgon personal dashboard, app name **Gorgon Notes** (`APP_NAME` in `static/app.js`). Folder name stays pg-dashboard.

**Critical requirement:** keep the player aware of data quality and the exact action to improve it (`docs/DATA-AWARENESS.md`). Every feature must show freshness + fix.

**Session handoff (always):** the user clears sessions often, so the repo must be enough to resume cold. Start every session from `docs/ROADMAP.md` → "Next up". As work happens (not only at the end), keep `docs/ROADMAP.md` current:
- "Next up": the ordered next steps, decisions waiting on the user, and anything half-done (file + what's left).
- "Session log": one dated entry per session: what was planned, what got done, what changed in which files.
- Move finished items to "Done so far"; record new plans, open questions and verified facts in the matching doc (DATA-SOURCES, DESIGN.md, etc.).
Update before any long-running/background job starts and again when it ends.

Read these before working:
- `DESIGN.md`: design system and per-view spec. **Follow DESIGN.md for any UI work** (tokens, components, voice, review decisions)
- `PRODUCT.md`: product brief (user, purpose, principles)
- `docs/DATA-AWARENESS.md`: critical requirement spec (notifications, health model)
- `docs/ROADMAP.md`: current status, next steps, open questions, Mac app plan
- `docs/DATA-SOURCES.md`: where game data lives and its formats (verified)
- `docs/GLOGGER-COMPARISON.md`: feature gap vs glogger
- `docs/SHARING.md`: how party members could share fight data (ntfy.sh first, Cloudflare room later); research 25 Oct
- `docs/DISCORD.md`: Discord posting today and the "Connect a channel" plan (OAuth2 webhook.incoming via the Worker); research 26 Oct
- `docs/DISTRIBUTION.md`: plan for sharing with friends (Mac signing/notarization, Windows exe, CI); paused
- `README.md`: how to run, API, UI tabs
- `docs/DESIGN-PROCESS.md`: how the redesign was made, final screenshots, outstanding review issues

Conventions:
- `server.py` is Python stdlib only; the UI (`static/index.html`, `static/app.css`, `static/app.js`) is vanilla JS with CSS tokens for dark and Daylight. Keep it dependency-free until the Mac app rewrite.
- Exports come from the in-game VIP menu (Export Character/Storage JSON), not chat commands. Don't state game UI/commands from memory; verify first.
- CDN requests need a User-Agent header.
- Server runs under launchd (`local.gorgon-notes.server`). Restart: `launchctl kickstart -k gui/$(id -u)/local.gorgon-notes.server` (log `/tmp/gorgon-notes.log`). Don't start a second copy with nohup.
- Mac app: `mac/GorgonNotes/main.swift`, rebuild + reinstall with `mac/build.sh install`. It embeds the web UI, so most UI work needs no rebuild.
- Visual check: headless Chrome `--screenshot` against `http://127.0.0.1:8787/#<tab>`.
