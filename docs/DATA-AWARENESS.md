# Core requirement: keep the player aware of data quality

> **Priority: critical. This applies to every feature and to the Mac app.**
> The dashboard is only as good as its inputs, and several inputs are manual snapshots (VIP exports) or depend on in-game settings. The app must **always tell the player, at the right moment and through the right channel, exactly what to do to get the best data**. It must never silently show stale or incomplete numbers.

Added 2026-10-23 at the user's explicit request. Treat this as an acceptance criterion: a feature isn't done until it states its data freshness and how to improve it.

## 1. Principles
1. **Never silently stale.** Every number backed by a snapshot shows its age, and turns warning-colored past a threshold.
2. **Always actionable.** Every warning says the exact fix: "VIP menu → Export Storage JSON", not "data may be stale".
3. **Right moment.** Remind when acting is possible and useful (in game, near storage, after selling), not at random.
4. **Right channel.** Escalate from passive (badge) to active (notification) by importance; respect focus and don't spam.
5. **Verify the fix.** When the player acts (e.g. exports), confirm it worked ("Storage updated, 637 free slots") or flag that it didn't (broken `???` export).

## 2. What to monitor (data health model)
One central **Data Health** object, computed server-side, drives every channel. Each item has a status (ok / stale / missing / broken), a reason, and a fix.

| Check | How to detect | Fix shown to player |
|---|---|---|
| Storage export age | newest `*_items_*.json` `Timestamp` per character | VIP → Export Storage JSON |
| Character export age | `Character_<Name>_*.json` `Timestamp` | VIP → Export Character JSON |
| **Broken export** | `Character: "???"`, `Race: "Error"`, empty quests/recipes | Re-export while fully logged in (not right before logout) |
| Activity since export | chat log after export time, only lines while that character was logged in: storage/vendor areas visited, `You received N Councils`, 1+ storage searches, 50+ stacks of loot since the storage export (built 24 Oct; the `export-stale` moment fires on a search, or on a zone change after 50 more stacks, unless it is within 15 min after entering a vault area, where the `zone-storage` reminder already fired; then on the next one, and again after 2 h, until the next storage export) | Re-export: your storage/vendor numbers have changed |
| Chat logging on | `GorgonSettings.txt` → `LogChat 1`; and today's chat log is growing while game runs | Settings → GUI → "Log All Chat" |
| Combat logging levels | `GorgonSettings.txt` → `combatLog_*`, `LogNonAttacks` | Enable for death tracker |
| Game running / logged in | `Project Gorgon` process (binary inside `MacPlayer.app`, verified 2026-10-23); `Logged In As` / `Logged Out` lines | — (context for reminders) |
| Player.log live events | presence of `LocalPlayer: Process` lines | Unknown fix (open question); explain what's missing |
| Alts missing/stale | characters seen in chat logins or reports vs exports present | Log into alt → export both |
| Manual vault sizes | vaults with unknown capacity; safebox size drifts (server-driven 1–150) | Check size in game, enter on Vendors & Space |
| Game patch / CDN version | `fileversion.txt` changed | Auto-refresh CDN cache; tell player data was refreshed |
| VIP active | exports stop appearing / VIP menu missing | Renew VIP (exports need it) |

## 3. Moments that trigger reminders (examples)
- **Game launched / logged in:** show a short checklist: "Storage export 3 days old · Character export OK · Chat logging ON".
- **Arrived in a zone with your storage/vendors** since last export: "Export Storage after you're done here".
- **Left a zone after vendor sales** (councils received): "Export Character JSON to update vendor caps".
- **Broken export detected:** immediately: "That export came out partial. Export again".
- **Before logout is too late**, so remind ~when the player seems to be wrapping up (long idle in a city, or a storage visit late in the session).
- **Vendor reset:** "Kib reset: 60k councils available again" (positive nudges keep the player engaged with fresh data).
- **Storage nearly full** (from fresh data): "Otis full, Marna 2 free".
- **New day / new chat log** with no export in N days: daily digest.

## 4. Delivery channels (pick per severity; all configurable, with snooze)
**Now (POC, browser):**
- In-page **Data Health bar** at the top of every tab (green/yellow/red pills per source with the fix on hover/click).
- Browser **Notification API** (permission prompt) for active reminders; **favicon badge** and **tab title** prefix like `(!) Gorgon`.
- Optional sound cue.
- **Files view** (built 24 Oct): every JSON file the app reads, listed with its save time, age and an "in use" / "superseded" / "partial" / "won't parse" chip, the in-use row flagged "stale" or "broken" from the same verdicts; the open file's footer carries its source, age and fix, and an export that will not parse shows the "Export Character JSON again" plaque. Same checks as the table above, no new ones; it lets the player see the raw data behind a verdict.
- POC shortcut: macOS notifications from Python via `osascript -e 'display notification …'`.

**Mac app (Swift menu-bar app):** built 2026-10-23: menu-bar state with count, menu listing each problem + fix, native notifications bridged from the web Reminders (actions Open / Pause 1 hour). Not yet: Dock badge, HUD overlay, focus-aware hold.
- **Menu-bar icon state**: green / yellow / red dot, plus a short text like "Exp 3d".
- **Native notifications** (`UNUserNotificationCenter`) with **action buttons** ("Snooze 1h", "Open dashboard", "I exported").
- **Dock badge** if run as a Dock app.
- **Floating HUD overlay**: a small, non-activating, click-through, always-on-top `NSPanel` over the game window (works for windowed/borderless). The closest thing to "in-game" notifications. Shows freshness pills and the current reminder, and fades out.
- **Focus-aware**: hold non-urgent notifications while the game is fullscreen and in combat (no combat lines for N seconds = safe), deliver on zone change.

**Beyond the Mac (optional):**
- Phone push via **ntfy.sh** or **Pushover** (e.g. "vendor reset", "daily digest").
- macOS **Shortcuts** / URL scheme (`pgdash://health`) so the player can build their own automations; Shortcuts actions like "Get Data Health".

**In-game:** the game has no addon/UI API, so we can't draw inside it. Alternatives: the HUD overlay above; and teaching the player to bind the VIP menu to a keybind if the game allows it.

## 5. Automation ideas (investigate carefully)
- **Auto-reload on export:** already done (reports polled every 60 s). Make it instant with file watching (FSEvents) and confirm with a toast.
- **Auto-export via input automation** (AppleScript/Accessibility clicking VIP → Export): **do not build by default.** First check Project Gorgon's rules on input automation. If allowed, offer it strictly opt-in, only when the player triggers it (e.g. a hotkey or notification button), and never unattended.
- **Export-on-logout helper:** detect the "wrapping up" signals and fire the reminder *before* logout (broken exports happen right before logout).
- **History snapshots:** every export is stored (SQLite) so "what changed since last export" can be shown, which motivates exporting.

## 6. Anti-spam rules
- Max one active (notification-level) reminder per topic per N hours; snooze per topic.
- Severity levels: info (badge only) → warn (banner/HUD) → act-now (notification) → broken (notification + sound).
- Quiet hours setting; never notify when the game isn't running unless it's a positive event the player opted into (vendor reset, digest).
- Every reminder has "Don't remind me about this".

## 7. Build order
1. Data Health model + `/api/health` + in-page health bar (POC). Include GorgonSettings checks and broken-export detection.
2. Browser notifications + favicon/title badge; `osascript` notifications for the POC.
3. Activity-since-export heuristics (ROADMAP item 5).
4. In the Mac app: menu-bar state, native notifications with actions, then the HUD overlay.
5. Optional: phone push, Shortcuts/URL scheme.
