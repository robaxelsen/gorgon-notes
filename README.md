# Gorgon Notes (pg-dashboard)

Personal dashboard for **Project: Gorgon** built from VIP exports, chat logs and the public game data CDN. Proof of concept: a Python standard-library server plus a single HTML page. It has no dependencies and no build step. Source and Windows releases: https://github.com/robaxelsen/gorgon-notes (MIT). Windows users download `GorgonNotes.exe` from the [latest release](https://github.com/robaxelsen/gorgon-notes/releases/latest); it keeps itself current.

## Run

```bash
python3 server.py          # → http://127.0.0.1:8787
```

Env overrides: `PG_PORT` (default 8787), `PG_DIR` (game data dir), `PG_PLAYER_LOG`. `--open` opens the browser once the server listens. The game folder is found per OS (Mac `~/Library/Application Support/unity.Elder Game.Project Gorgon`, Windows `%USERPROFILE%\AppData\LocalLow\Elder Game\Project Gorgon`); startup prints the folder and how many exports and chat logs it holds, or how to set `PG_DIR`.

## Windows (test build for friends)

`windows/build.sh` (on the Mac, or on GitHub Actions for a tag `v*`, see `.github/workflows/release.yml`) builds three things in `dist/`:
- `version.txt`: the version baked into the other two (`GN_VERSION`, a release tag; else `dev-<stamp>`).
- `GorgonNotes.exe` (20 MB, the one to send, once; the CI-built copy is at `https://github.com/robaxelsen/gorgon-notes/releases/latest/download/GorgonNotes.exe`): a Windows program written in Go (`windows/launcher/`, cross-compiled with `GOOS=windows`, no cgo, `-H windowsgui` so no console). It embeds the zip below, unpacks it once into `%LOCALAPPDATA%\Gorgon Notes\app` (again only when the build stamp in `build.txt` changes; existing files are overwritten, nothing deleted, so `capacity.json` survives), starts `python\python.exe server.py` hidden with its output in `%LOCALAPPDATA%\Gorgon Notes\gorgon-notes.log`, waits for the port, and shows the UI in its own window through WebView2 (the Edge engine Windows ships; pure-Go binding `github.com/jchv/go-webview2`, window data in `%LOCALAPPDATA%\Gorgon Notes\webview2`). Closing the window kills the server. If port 8787 already answers with this build it only shows the window; if it answers with an older build (an earlier start's window still open, or an orphaned server) it asks that server to quit (`POST /api/quit`, since v0.7.1) and starts its own; a server too old to know the route keeps running and the page says what to do (`staleServer` in `static/app.js`, which compares the server's version with `PAGE_BUILD`, stamped by `windows/build.sh`). If the server dies at start, a message box shows its last log lines. Without the WebView2 runtime it opens the default browser and a message box that keeps the server alive until dismissed. The Windows counterpart of `mac/GorgonNotes/main.swift`, without the menu-bar icon and native notifications. **Self-updating:** built with `-X main.repo=<owner>/<name>` (from the git remote `origin`, or `GN_REPO`), each start fetches `https://github.com/<owner>/<name>/releases/latest/download/version.txt` (4 s budget) and, when that is newer than `build.txt` (tags beat dev builds, tags compare numerically; `windows/launcher/version.go`), downloads `GorgonNotes-windows.zip` from the same place and unpacks it over the app folder before starting. A failed check or download is logged and ignored. `GN_NO_UPDATE=1` skips it; `GN_UPDATE_URL` points it elsewhere (smoke tests).
- `GorgonNotes-windows.zip` (14 MB, the fallback and the update payload): `server.py`, `static/`, `cache/`, `item-type-icons.json`, the python.org embeddable Python 3.14.9 and `Gorgon Notes.bat`, which does the same from the extracted folder.

Nothing needs installing on the PC. `windows/README-WINDOWS.txt` ships in the zip as `README.txt` with the start steps for both, the one-time SmartScreen click, where the data comes from and what to report back. Unsigned, no installer, no tray icon or native notifications; see `docs/DISTRIBUTION.md` for the proper-release plan. Rebuild after any `server.py` or `static/` change with `windows/build.sh`; the launcher alone can be checked with `cd windows/launcher && GOOS=windows go vet .` and smoke-tested on the Mac with `go build -o /tmp/l . && GN_SMOKE_SECONDS=10 PG_PORT=8798 /tmp/l`.

Open a tab directly with a hash: `#session`, `#combat`, `#character`, `#vendors`, `#storage`, `#files`. Files takes sub-state after `?`: `#files?f=<file id>&p=<JSON pointer>` opens one file at one node (what "Copy link" produces).

## Mac app and run at login

Two layers, both set up on 2026-10-23:

1. **Server at login (LaunchAgent).** `mac/local.gorgon-notes.server.plist` is installed in `~/Library/LaunchAgents/`; launchd runs `server.py` at login and restarts it if it dies. Log: `/tmp/gorgon-notes.log`.
   - Restart after editing `server.py`: `launchctl kickstart -k gui/$(id -u)/local.gorgon-notes.server`
   - Remove: `launchctl bootout gui/$(id -u)/local.gorgon-notes.server && rm ~/Library/LaunchAgents/local.gorgon-notes.server.plist`
2. **`Gorgon Notes.app`** (`mac/GorgonNotes/main.swift`, AppKit + WKWebView, built with `swiftc`, no Xcode). Build and install: `mac/build.sh install` (→ `/Applications`). First build takes a few minutes while Swift builds its module cache.
   - Menu-bar scroll icon: plain when data is fine; amber/red with a count when something needs doing. The menu lists each problem with its evidence and the exact fix (wording from the web app's `fixText()`), the six views (⌘1–6, Combat is ⌘2), Check Again, Reminders…, Pause Notifications for 1 Hour, Send Test Notification, Open at Login.
   - Window: the same web UI. Closing hides it but keeps the page running, so the web app's Reminders keep working; its `new Notification()` calls are bridged to native macOS notifications (actions: Open, Pause 1 hour).
   - Uses whatever server answers on 8787; if none does, it starts `server.py` itself (path baked into `Info.plist` at build time).
   - Shows the window when opened by hand; stays in the menu bar only when launched within 5 min of boot (login).
   - Ad-hoc signed (`local.gorgon-notes`); only for this Mac.

## Files

| Path | What |
|---|---|
| `server.py` | JSON API + static server. Parses chat logs, reads reports, fetches/caches CDN data |
| `static/index.html` | UI shell and view markup (spec: `DESIGN.md`); Carlito from Google Fonts |
| `static/app.css` | All styles; dark (game) and Daylight tokens |
| `static/app.js` | All UI logic, vanilla JS, no build step |
| `item-type-icons.json` | Vendor item type → representative item, each checked by eye against its CDN icon |
| `capacity.json` | Manually entered slot counts for vaults whose size isn't exported (created on first save) |
| `cache/v<N>/` | Cached CDN files per game client version (`areas.json`, `storagevaults.json`, `npcs.json`, `attributes.json`, `quests.json`, `items.json`, `tsysclientinfo.json`; 22.5 MB for v488). The Files tab lists and opens them |
| `DESIGN.md` | Design system and per-view spec (tokens, components, server contract, voice, review decisions). **Follow it for any UI work** |
| `PRODUCT.md` | Product brief: user, purpose, brand commitments, principles (impeccable product schema) |
| `docs/` | Findings, glogger comparison, roadmap — **start with `docs/ROADMAP.md`**. `docs/DESIGN-PROCESS.md` records how the redesign was made |
| `design/research/` | Game visual-identity research, old-UI feature inventory, taste baseline, reference sprites and icons (reference only, never shipped) |
| `design/concepts/` | Write-ups of the three redesign concepts and `DECISION.md` |
| `design/archive/` | Old POC UI and server (`*-v0-poc.*`), pre-fix2 code, the DESIGN.md draft before critique 2, and the concept pages (`concepts/concept-{a,b,c}.html`, which used to live in `static/concepts/` and are no longer served) |
| `design/screenshots/` | Final screenshots of every view (1440 dark/Daylight, 390 dark/Daylight) |
| `design/shots/` | Scratch screenshots and inspector runs from each design and review pass |
| `.taste-skill/`, `.impeccable/` | State files of the two design skills (dealt directions, design.json) |
| `windows/` | Windows package: `build.sh`, the Go single-file launcher (`launcher/main.go`), the `Gorgon Notes.bat` launcher, `README-WINDOWS.txt`; output in `dist/` (not shipped with the repo) |
| `mac/` | Mac app sources, build script, LaunchAgent plist |

## API

| Endpoint | Returns |
|---|---|
| `GET /api/session?scope=day\|login&character=` | XP per skill, XP/hr, level-ups, loot, areas, deaths and kills (`combat`, `combat31d`, `death` events), councils in and out (`councils`: received incl. coins looted or given, casino wins as `gaming`, stolen, recovered, net, events, the on-hand balance from the selected character's export; spending is never logged) from the newest chat log |
| `GET /api/tail?log=&offset=` | New chat lines since `offset` (UI polls every 2 s) |
| `GET /api/reports` | All files in `Reports/` with type/character/timestamp |
| `GET /api/report?file=` | One raw report JSON (path-traversal guarded) |
| `GET /api/vendors` | Per-NPC vendor cap, councils spent, remaining, reset time, next tier |
| `GET /api/storage` | Per-vault used / capacity / free, value, next favor tier |
| `GET /api/plan?character=` | The sell-and-store trip for the inventory: per stack sell (vendor, about-price from the character export's sale multiplier) or store (vault with room, one that holds the type first), grouped into stops by area; gear listed as the player's call; `{"error": "no items export"}` when there is none |
| `GET /api/consolidation?character=` | Split stacks across vaults from the newest storage export: slots back by merging, destination per item, pickup plan by area; `{"error": "no items export"}` when there is none |
| `POST /api/mark` `{typeId, mark}` | The keep list for the Sell and store plan: `sell` / `store` per item type (`null` removes), saved in `marks.json` beside `capacity.json` |
| `POST /api/capacity` `{vault, slots}` | Save (or clear with `null`) a manual vault size; `400 {error}` unless `slots` is a whole number 1 to 999; `403` unless the body is `application/json` from the app's own origin |
| `GET /api/health?character=` | `app` (this copy's version from `build.txt` or the git tag, the newest GitHub release, `newer`), one data-health verdict per source (exports, chat log, settings, alts, VIP, game data), game state, reminder moments; activity since an export counts only lines while that character was logged in (`activityThresholds`: 1 storage search, 50 loot stacks) |
| `GET /api/icons?names=&typeIds=&types=` | CDN icon IDs for item names, storage TypeIDs and vendor item types |
| `GET /api/lookup?quests=&powers=&item=` | Readable quest names and item power text from game data; `item=` resolves an item name fragment to the vendor type words its items carry (`{query, items, examples, types: [{type, items}]}`, the Vendors search) |
| `GET /api/files` | Every file the app knows (Files tab): exports in `Reports/` with their head fields, `partial` / `newest` / `source` flags and a `valid: false` + `error` line for a file that won't parse, `capacity.json` (listed even when absent), every cached CDN file (`cdn/v<ver>/<name>.json`) and every chat log (`logs/Chat-YY-MM-DD.log`, newest first, the newest flagged `newest` with the DPS meter's `combatLines` / `lastLineAt` / `lastCombatAt`), each with `bytes`, `mtime`, `mtimeNs`; `csvSkipped` counts the CSV twins (never served) |
| `GET /api/file/node?id=&path=&offset=&limit=&depth=&maxNodes=&mtime=&locate=` | One node of a file by RFC 6901 pointer: a page of children (200, max 1,000; `depth` > 1 fills breadth-first up to `maxNodes`, 2,000 default) or a scalar's full value; `total` node count on the root; `locate=1` adds `pos`; cross-file `link`s into cached game data; `409` when `mtime` no longer matches, `422 {line, col, msg}` for invalid JSON, `404 {"error": "no such path"}` |
| `GET /api/file/search?id=&q=&limit=&mtime=` | Case-insensitive substring over keys and values of one file: hits in document order with `path`, `where`, `snippet`, `pos`; `total` up to 10,000, `capped`, `partial` after a 2 s budget; `q` under 2 characters is `400` |
| `GET /api/file/lines?id=&offset=&limit=&q=&mtime=` | A page of a chat log's lines (`{n, ts, msg}`, default the newest 500, `limit` up to 2,000, `total`, `more`) or, with `q`, every line containing it (file order, up to `limit`, `matches` counted to 10,000, `capped`); `logs/` ids only, `400` for anything else |
| `GET /api/file/raw?id=&path=&mtime=` | The whole file streamed from disk (never parsed, `Content-Disposition: inline`, `nosniff`; `text/plain` for a chat log) or one subtree pretty-printed (`413` over 1 MB) |
| (party room) | `cloud/`: the Cloudflare Worker + Durable Object the app shares fights through since 26 Oct (`cloud/README.md`); ntfy.sh is the fallback. `PG_ROOM` overrides the URL, empty turns it off |
| `GET /api/settings`, `POST /api/settings` `{discordWebhook}` | The Discord webhook for "Post to Discord", kept in `settings.json` beside `capacity.json`, shown back with its token hidden; `connected` says it came through Connect Discord, `pending` that a Connect is waiting. The UI only ever posts `null` (Remove); a URL is still accepted for scripts |
| `POST /api/discord/connect` `{}` / `{cancel:true}` | Connect Discord: answers the party room's `/discord/start` URL to open in a browser (Discord's own server + channel picker); the server then claims the webhook from the room within 10 minutes (`docs/DISCORD.md`) |
| `POST /api/discord` `{fight}` / `{party}` | Post a fight (its id) or a merged party fight to the webhook as an embed: a table of players and pets (health, armor, damage, per second, share, kills) as a code block, a few facts, and a PNG of the same table when the page drew one (`preview: true` answers the card for the page to draw, then `image` carries the PNG) |
| `GET /api/party`, `POST /api/party` `{action: "new"}` / `{code}` / `{code: null}` / `{paste}` | Fight sharing over ntfy.sh (`docs/SHARING.md`): the party code, the link's health (last success, last error, posted, pending, received) and the merged party fights since the join; `party.json` beside `capacity.json` holds the code and what was posted |
| `GET /api/combat?scope=day\|login` | Personal DPS meter from the newest chat log's `[Combat]` lines, read incrementally: fights (15 s damage gap), you vs pets, per-ability rows, damage taken, kills, deaths, kill mechanics, unattributed indirect damage, a per-second timeline per fight, a live "now" figure; `{}` with no chat log |
| `GET /api/zone?area=&character=` | Current zone panel: NPCs in the area (default: current area from the chat log) with favor, vendor councils left, storage, services, gift loves, notes; zone totals; adjacent areas with councils/slots; `matched: false` for a chat area name game data doesn't know, `guessed: true` for the shared short names Caves / Dungeon / Home |

Additive fields (old clients ignore them): `/api/session` gains `loggedIn`, `loggedInAt`, `loggedOutAt`, `lastLineAt`, `playing`, `events[]` (incl. `death` events), `channels{}`, `combat`, `combat31d`, `councils`; `/api/vendors` rows gain `exportResetAt`, `spentAtExport`, `resetSinceExport`, `restored`, plus top-level `resetSummary` and `cdnVersion`; `/api/storage` gains `cdnVersion`; `/api/health` gains `activityThresholds`, per-item `evidenceData` and `export-stale` moments; `/api/zone` gains `matched` and `guessed`; `/api/health` items of the export, vault-sizes, cdn and alt sources gain `files` in `views`. File ids for `/api/file/*` are `reports/<name>`, `app/capacity.json`, `cdn/v<ver>/<name>.json` or `logs/Chat-YY-MM-DD.log`, nothing else is served (`400 bad file id` / `404`); the chat-log health item lists `files` in `views` too. Field shapes are in `DESIGN.md` → Server contract.

Preview modes (browser only, never saved): `?shift=72`, `?sim=stale|broken|nolog|noexport|loading|down`, `?theme=dark|daylight|auto`.

## UI views

Every block is a game-style window whose footer says where its numbers came from, how old they are and the exact in-game fix. A margin ("Where these numbers come from") lists the sources for each view; the tab title, favicon and rail marks follow the same verdicts.

- **Combat**: the personal DPS meter: damage a second now (polled every 2 s while open), damage today / this login split you vs pets, fights (time, length, damage, per second, kills, what you fought; skirmishes folded), a breakdown of any fight with its damage-a-second chart, by ability and by what hit you, and "Copy for Discord". Party members' hits are never in your chat log, so the meter is personal; the **Party** window below it shares fights with the party instead: one member presses New code and pastes it into party chat, the others paste it (the whole chat line is fine) and are joined, and from then on every closed fight, plus the last three, goes to an ntfy.sh topic named by the code and everyone's fights show side by side (merged by time overlap; `docs/SHARING.md`). Set `PG_NTFY` to use another ntfy server.
- **Session**: at a glance, **Here: <zone>** (NPCs where you are: favor, councils left, storage, services, gift loves; next-door areas to peek at; "Last zone" when logged out; says so when the chat log, the character export or game data can't place you), cumulative XP chart (Today / This login), XP by skill, level-ups, loot (icons, search, sort), councils (received, stolen, recovered, net; Gaming wins folded; the balance from the character export with its age; spending is not in the log and the window says so), combat (deaths with killer and area, kills, pet kills, 31-day totals), what happened (logins, areas, level-ups, exports, deaths), chat log with channel colours and filters.
- **Vendors**: councils left, drained, resets since the export; where to sell (area filter), what they buy (item-type filter), vendor table by area or one list with favor, next tier, share of cap, resets and locked vendors.
- **Storage**: a **Sell and store** window plans the trip that empties your bags, by stop (sell this to Sir Coth for about 9,321, store these at Joeh) or by item, with gear left as your call, a Sell / Store mark per item type that the plan remembers (`marks.json`), and the vendor trash sitting in your vaults listed with its worth; Stacks to merge also lists items held in several places that cannot merge (gear) with where each copy is; slots free, full and unknown vaults; where there's room; vault table with slot strips, size provenance and inline size entry; Stacks to merge (one item in more than one place: slots back, where to put each, pickup plan by area); items from any storage export with icons, readable powers and merged stacks. With no storage export every window says "Needs a storage export." and the fix is the export itself (no vault-size note, no Slots column hint).
- **Character**: export picker (partial exports labelled), skills, currencies, grouped stats, NPC favor, active quests with readable names.
- **Files**: every file the app reads (exports in `Reports/`, `capacity.json`, the cached game data, and the chat logs in `ChatLogs/` with the one the DPS meter and Session are reading marked "in use") with size, date and which one is in use, stale, partial or superseded; a chat log opens as its last 500 lines (earlier pages on demand, a plain-text search over the whole file, re-read every minute while the game writes it; "Open the log" on Combat jumps to it); a lazy, keyboard-operable JSON tree of any JSON file (collapse and expand, 200 children a page, Expand all up to 2,000 nodes), search within the file, copy path / value / link, Open raw, and links between files (an item's `TypeID` to `items.json`, a quest to `quests.json`). Deep links: `#files?f=<id>&p=<pointer>`; "Open the file" on Character and Storage → Items, "Inspect the files" in About. Read-only: it never writes anything.
- **Reminders** (header button): opt-in browser notifications at moments (login, arriving where your vaults are, after selling, storage changed since the export (a storage search, or 50+ stacks of loot since it), wrapping up, broken export, vendor resets), with snooze, mute, quiet hours and a sound for broken data. In the Mac app the same reminders arrive as native notifications.

## Refreshing data in game

VIP menu (Settings → VIP) → **Export Character JSON** / **Export Storage JSON**. (There are no `/outputcharacter` or `/outputitems` chat commands that work for us.) Chat logging must be on: Settings → GUI → "Log All Chat" (bottom).
