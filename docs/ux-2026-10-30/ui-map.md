# Gorgon Notes: UI map as a newcomer meets it (phase 1, code reader)

Date 2026-10-30, 00:40 to 01:15. Sources: `static/index.html` (533 lines), `static/app.js` (5,803 lines), `static/app.css` (934 lines), `DESIGN.md` (Views, Shell, Voice), `PRODUCT.md`, `docs/ROADMAP.md`, `docs/DPS-FEASIBILITY.md`, `docs/SHARING.md`, the live server (`GET /api/health`, `GET /api/party`), fresh headless-Chrome DOM dumps and screenshots of every view in three states (`live`, `?sim=noexport`, `?sim=nolog`) under `scratchpad/phase1/dom/` and `scratchpad/phase1/shots/`, and the 23-26 Oct screenshots in `design/screenshots/`. Counts in §8 come from `scratchpad/phase1/domstats.py` run over the DOM dumps (visible nodes only; `[hidden]`, `.sr` and `display:none` subtrees skipped).

Line references are `file:line` into the repo as of commit `68f89da`.

---

## 1. The shell every view sits in

### 1.1 What is on screen before any view content

| Piece | Where | What a newcomer sees | Code |
|---|---|---|---|
| Brand | header left | square mark, "Gorgon Notes", "fan-made, not affiliated with Elder Game" (13 px dim). The brand is a link to `#session`. | `index.html:27-31`, `app.js:5744-5747` |
| Scope | header | character name + server ("Robchew · Arisetsu") or a `<select>` when more than one character has exports; then the location line "Ilmari Desert (logged in)" / "Serbule (logged out 00:02)" / "No area yet today" / "Location not known without a chat log". | `index.html:32-37`, `app.js:5485-5506` |
| Health pill | header right | "2 to do", "1 missing · 2 to do", "All sources recent", "Checking…" with a shape (▲ / ■ / ✓). Click scrolls to and opens the margin. | `index.html:39`, `app.js:583-601`, `5759-5764` |
| Theme control | header right | segmented Auto / Dark / Daylight (also repeated inside About). Persisted `pgdash.theme`. | `index.html:40-44`, `app.js:5527-5548` |
| Reminders button | header right | bell + "Reminders" (+ dot when notifications are on). Opens the Reminders panel. | `index.html:45-48`, `app.js:4896` |
| Down banner | under header | red "Nothing is loading. The dashboard server isn't answering. Start it again: python3 server.py" | `index.html:51`, `app.js:5508-5510` |
| Rail | fixed **right** edge, 80 px (CSS `.canvas{margin-right:80px}`) | 8 icon+label items: Session, Combat, Vendors, Storage, Character, Files, Teleports, Statehelm, each with a 10 px warn/bad mark; foot: "fan-made / About" button. Phone: bottom tab bar, About hidden. | `index.html:53-89`, `app.css:165-186, 540-555` |
| Title row | top of main | h1 (view name), the **finding** sentence(s), optional `title-extra` (Character only: export picker), the **stamp** (two lines: source + age, amber/red when stale/missing) and the **Check again** button. | `index.html:93-103`, per-view render functions |
| Notices | under title row | preview note (`?sim=`/`?shift=` only) and the **system line** (`[Status]` / `[Error]` / ▲ / ⓘ one-liners, auto-clear after 30 s unless sticky; reminder lines add "Not now" and "Don't remind me about this"). | `index.html:104-107`, `app.js:4638-4651` |
| Main column | left | the view's windows (`section.win` with `win-bar` title, `win-body`, `win-foot` source/fix footer). | `index.html:109-513` |
| Margin | right of main (sticky, 320/336 px) | window "Where these numbers come from": header line ("2 to do"), one **note** per listed verdict (shape, title, age, evidence sentence, a red **fix plaque** button or a one-line fix, "Not now"), "Also checked: …" fold line, footer "Checked 00:54 · by the server" + "Reminders" link. Tablet: moves above the windows as a full-width window. Phone: collapsible strip. | `index.html:514-522`, `app.js:488-521`, `app.css:459-477, 528-572` |
| Pops | floating | Reminders panel (`#rempanel`) and About (`#aboutpop`), full-screen sheets on a phone. | `index.html:527-528`, `app.js:4824-4851` |
| Toasts | bottom corner | up to 3 transient + sticky reminder toasts with Close / Show. | `index.html:529`, `app.js:4656-4691` |

**Interactive controls in the shell alone, every view:** brand link, character select (when alts), health pill, 3 theme radios, Reminders, 8 rail links, About, Check again, margin "Reminders" link, plus a plaque + "Not now" per actionable margin note = **17 to 21 controls before the view's own**. The DOM dumps count 22-25 shell-level controls on every page (§8).

**Copy in the shell alone:** 170-275 words per page before the view's windows (brand line, location line, finding, stamp, margin notes and "Also checked" list). The margin's "Also checked" line alone lists up to 11 sources ("game state (logged in), partial exports (2 d), logout export setting, vault sizes, alts, combat logging, live game events, VIP, game data (v490), party sharing").

### 1.2 Routing

- Hash routes `#session #combat #vendors #storage #character #files #teleports #statehelm` (`VIEWS`, `app.js:10`). `route()` splits `#files?f=<id>&p=<pointer>` on `?` (`app.js:5552`). `go(view)` sets the hash; `showView()` toggles `[hidden]` on the eight `section.view` blocks, stores `pgdash.tab`, re-renders everything, scrolls to top, and on Combat kicks a `combatRound()` (`app.js:5553-5566`).
- Boot: hash wins, else `pgdash.tab`, else `session` (`app.js:5779-5783`). **There is no landing/overview/onboarding route**; a new install opens on Session.
- Cross-view links: Vendors At a glance "Slots Free" → `#storage`; Character info line and Storage Items summary "Open the file" → `#files?f=…`; Combat Fights footer "Open the log" → `#files?f=logs/…`; About "Inspect the files" → `#files`; capacity.json footer → `#storage`. No link anywhere points a newcomer from Session/Combat *to* a setup step beyond the fix plaques.
- The Mac app adds ⌘1-⌘8 per view (ROADMAP), not visible in the web UI.

### 1.3 localStorage keys (all through `store`, `app.js:78-90`; never written in preview mode)

| Key | Set by | Meaning |
|---|---|---|
| `pgdash.tab` | `showView` | last view |
| `pgdash.character` | `selectCharacter` | chosen character (header select, "Switch to X" toast) |
| `pgdash.xpScope` | Session / Combat Today·This login tabs (shared) | `day` / `login` |
| `pgdash.chans` | chat chips | enabled channel names |
| `pgdash.theme` | theme radios | auto / dark / daylight |
| `pgdash.sort` | every sortable table (`loot`, `fights`, `vendors`, `vaults`, `items`, `skills`, `favor`) | `{key,dir}` per table |
| `pgdash.open` | Vendors / Vaults area sections | open area names |
| `pgdash.file` | Files | last opened file id |
| `pgdash.reminders.v1` | Reminders panel, Not now, mute | enabled, per-topic notify/snooze/mute, quiet hours, sound, lastFired, deliveredMoments |
| `pgdash.migrated` | boot | POC-key migration done |

Server-side state (never localStorage): `party.json` (code, posted fights), `settings.json` (Discord webhook, `shareEveryone`, Statehelm picks/counts), `capacity.json` (vault sizes), `marks.json` (Sell/Keep marks).

### 1.4 Polling (`app.js:5784-5801`)

| Interval | What | Notes |
|---|---|---|
| boot | `fullRound()`: session → (combat+party if on Combat) → reports/vendors/storage/consolidation/plan/char/items(/files/statehelm) → health | `S.loading` stays true until this finishes, so first paint shows loading bars for 1-10 s |
| 2 s | `tailRound()` chat-log tail (`/api/tail`); a `Saved report to` line triggers an export re-read 1.5 s later | visible tab only |
| 2 s | `combatRound()` when on Combat (`/api/combat`; every 5th round also `/api/party`, i.e. 10 s) | |
| 30 s | `healthRound()`: session + health, then `deliverMoments()` | runs even when hidden (reminders) |
| 60 s | `exportsRound()`: reports, vendors, storage, consolidation, plan, char, items, files (if opened), statehelm (if opened) | visible tab only; also once on return after 55 s away |
| 30 s | re-tick ages (`computeVerdicts` + shell health) | |
| none | Teleports (wiki read on entering; server re-fetch daily) | |
| 2 s | Discord connect pending poll of `/api/settings` | only while "Waiting for Discord" |

Every re-render goes through `setHTML` diffing (`app.js:37-54`), so polling never visibly flickers; but every poll can rewrite footers and the margin, which is why a newcomer sees the "Checked 00:54" and ages ticking.

### 1.5 About popover (`app.js:4877-4893`)

Title "Gorgon Notes v0.10.0"; one sentence "Gorgon Notes is fan-made, not affiliated with Elder Game. It reads the files the game already writes on this computer."; version line ("This is v0.10.0 from this checkout (5 commits past it, uncommitted changes). **v0.11.0 is out.** … Releases"); "Where the data comes from" (5 bullets: VIP exports in Reports/ → Inspect the files, Chat logs in ChatLogs/ (Settings → V.I.P. → Save Chat Logs), Game data from cdn.projectgorgon.com v490, GorgonSettings.txt, Player.log: no live inventory events on Mac); a second Theme control; footer "Item art from the game's public CDN." **This is the only place in the UI that explains what the app is, and it is behind a 13 px "fan-made / About" button at the bottom of the rail, hidden on phones** (`app.css:555`). It never says what the views are for, what to do first, or that friends need their own copy for party DPS.

### 1.6 Reminders panel (`app.js:4789-4822`)

Opens from the header bell or the margin's "Reminders" link. Content: permission paragraph ("Reminders are off. They only fire while you're in game, and never more than once per topic per cooldown." + primary **Remind Me!** button; denied/unsupported variants explain the browser site settings), three groups of topics with a "Notify" checkbox each (To do: Login checklist, Arrived where your vaults are, Left after selling, Storage changed since the export, Wrapping up, Export confirmed [in page only], Storage nearly full [in page only]; Broken: Export came out partial; Good news: Vendor reset, Daily digest with "Can fire while the game is closed."), Quiet hours (checkbox + two time inputs), Sound ("Play a sound when data breaks"), Muted list, footer "Settings live in this browser only." That is **10 topics, 13+ controls** on a panel a newcomer meets with no explanation of what a "moment" is. Default: notifications off; everything still shows in page (system line + sticky toast with "Show").

### 1.7 Character select

Shown only when two or more characters have exports (`app.js:5490-5493`). Drives `?character=` on vendors/storage/health/statehelm, the Character export picker, the Storage Items picker; Session and Combat follow whoever is logged in and show a "The chat log follows X, who is logged in. Other views show Y." info line when those differ (`app.js:746-749`, `1821-1824`). A new install with one character never sees the select, so "which character is this" is only the header name.

---

## 2. View by view

Conventions used below: **Default** = visible without clicking at 1440 × 1400 with the user's live data (31 fights, 102 vendors, 27 vaults); **Fold** = behind a click/scroll; **Controls** = buttons, inputs, selects, links inside the view's windows (shell excluded); **Copy blocks** = distinct text runs of 6+ words (footers, empty lines, notes). Exact numbers in §8.

### 2.1 Session (`#session`), default landing view

**Question it answers (DESIGN.md:1268):** what did this session earn, and where did I go?

**Windows (10):** At a glance → Here: <zone> → Experience (primary, Today/This login tabs, XP chart) → [XP by skill | Level-ups] → [Councils | Combat] → [Loot (search, sortable) | What happened] → Chat log (channel chips + 500-line feed) (`index.html:113-186`).

**Controls (live):** 22 inside windows: 2 scope tabs, Here's "Show 8 more NPCs…" and "Next door" area links, Loot search + 2 sort headers + "Show all", 12-14 channel chips, "+N more" chip, "new lines ↓" pill. Plus "Show all 19" on Councils, "Back to <zone>" when peeking.

**Copy (live):** ~1,200 words in windows; the Chat log window alone is ~620 words of raw game lines (`[Status] You earned 120825 XP in Animal Handling.`, `The egg is flattened into a mess of shell and unborn aktaari by your cruel boot.`). Here: ~200 words (NPC table with "Buys Jewelry, Gem, Crystal, Augmentation Related · Consignment · Training · Augments", "Loves Silver Items, Paintings, Fish Dishes", "Soul Mates · 76,776 councils left"). Councils carries a 40-word explanatory note ("Spending isn't written to the chat log, so this is what came in, not what's left. On hand at the character export of 29 Oct 21:40: …").

**Default vs fold:** at 1440 × 1400 the fold lands inside the Here window or the Experience chart; XP by skill, Level-ups, Councils, Combat, Loot, What happened and Chat log are all below it. Here folds non-vendor NPCs ("Show 8 more NPCs (trainers, barter and others)"); Councils lists 10 then "Show all"; Loot 15 then "Show all"; What happened scrolls at 15 rows; the chat feed is capped at 500 lines.

**Self-explanation:** every footer says "Chat log · live · last line 00:52 · today"; Experience's footer always says "Logging: Settings → V.I.P. → Save Chat Logs"; empty states carry one dry line each ("No level-ups yet today. Trainers don't keep office hours, so neither does this list."). **Nothing says what Session is for, why there are ten windows, or which of them matter**; the finding ("691,141 XP in 2 h, mostly Animal Handling…") assumes the reader already knows the game's vocabulary.

**States:**
- *No chat log* (`?sim=nolog`, or `chat-log` verdict bad; screenshot `shots/session-nolog.png`): finding "No chat log to read, so there's no session to show. Turn on chat logging and this fills in as you play." (or "Chat logging is off in the game…" when `LogChat 0` is read), stamp "No chat log found / ■ missing", At a glance hidden, Experience shows the **Save Chat Logs** plaque ("In game: Settings → V.I.P. → Save Chat Logs"), and **eight other windows each say "Needs the chat log." with a red "Chat log · ■ missing" footer and the same "Settings → V.I.P. → Save Chat Logs" on the right** (`app.js:754-756, 789-793, 800, 812, 827, 980-982, 1059-1061, 1152, 1231-1235`). The margin repeats the chat-log note plus the two export notes with plaques. Result: the one fix is printed **11 times** on one screen (counted in the DOM: 8 footers + plaque + margin + finding).
- *No exports but a chat log* (`?sim=noexport`; `shots/session-noexport.png`): the view looks almost identical to live; only Here says "Needs the character export: favor and vendor councils come from it." and Councils' note changes to "A character export would show what's on hand: VIP menu → Export Character JSON".
- *Logged out:* "Last zone: X" title on Here, "there" wording, stamp "From today's chat log · last line 21:14", fixes switch to "Next time you're in game: …" (`app.js:249-270`).
- *Old server:* Councils and Combat windows say "Needs a newer server.py." with footer "Councils need a newer server.py" (`app.js:983-985, 1062-1064`); What happened footer "Logins, logouts, exports and deaths need a newer server.py".
- *Loading:* "Reading today's chat log…" finding, four loading bars, a 200 px grey block for the chart.

### 2.2 Combat (`#combat`)

**Question (DESIGN.md:1289):** how hard am I hitting, fight by fight? Built as a personal DPS meter; party sharing, Discord and the everyone feed were bolted onto the same page in four later passes (25, 26, 29 Oct).

**Windows (4):** At a glance → Fights (primary, Today/This login tabs, count) → Breakdown (tools: **Copy for Discord**, **Post fight to Discord**) → Party (tools: **New code**; body: party-code form, Discord row, everyone line, roster line, session table with its own select and **Post session to Discord**, fight blocks, paste box) (`index.html:189-242`).

**Controls (live, user's data):** 30 inside windows (12 in Fights: 2 tabs, 8 sort headers, 31 selectable rows counted as links only once, "Show 2 skirmishes…", "Open the log"; 2 in Breakdown; **16 in Party**: code field (read-only once joined), Copy code, Leave, Change channel, Remove, everyone's-fights link, Stop sending, Session select, Post session to Discord, Show all / Show 145 fights nobody else was in, per-fight "Post fight to Discord"). In the brand-new state the Party window still shows 4 controls (New code, code field, Join, Connect Discord).

**Copy (live):** ~1,240 words in windows; the Fights table is ~700 words of numbers; the Party window ~360 words including the footer "Fight numbers and character names go to the party room; anyone with the code can read them" and the everyone line "Every fight also goes to the everyone's fights page, where anyone can see runs without a code · 128 fights sent today. Stop sending". Breakdown ends with up to four dim explanatory paragraphs (party per the chat log, damage over time, ticks before your first hit, "Not placed: …") each 30-60 words (`app.js:2004-2009`), plus the By enemy footnote ("Direct hits by name; damage over time from your log after your first hit on that enemy. The game's autopsy lists health and armor apart; this adds them.").

**Default vs fold (screenshot `shots/combat-live.png`, 1440 × 1400):** the first screen is the finding (3 lines), At a glance (5 figures), and the top ~26 rows of the Fights table. **Breakdown, the damage chart, By ability, What hit you, By enemy and the whole Party window are below the fold**; with 31 fights the Party window starts roughly 1,600 px down. The Fights table has 8 columns (Time, Length, Damage, Per second, You, Pets, Kills, Fought), all sortable, all numbers. The Breakdown follows the newest/live fight unless a row is clicked (`pickedFight`, `app.js:1787-1794`), which nothing on the first screen announces except the pane-under line "Select a fight to see it by ability." (shown only when there are no skirmishes to fold, `app.js:1931`).

**Self-explanation:** the finding reads "691,141 damage in 31 fights today, 785 a second while fighting. Best: 3,479 a second at 23:57, over 18 s. Your pets did 27% of it. Died 5 times. Counted from 23:45 yesterday: that run was still going at midnight, when the game starts a new log." The Breakdown footer: "Party members' hits aren't in your log; the Party window below puts their copies' numbers beside yours." The Party empty copy (not joined): "Share fights with your party. One of you presses New code and pastes it into party chat; the others paste the code here (the whole chat line is fine) and press Join. Your last three fights and every one that closes from then on are shared, and everyone's shows up here side by side." (`app.js:1666`). **Nowhere on the view: that each friend must install the app, that chat logging + Combat Logging must be on for everyone, that there is an "everyone's fights" page which already groups runs with no code at all, or what the difference is between the Party window's fights, its session table, the Breakdown, the everyone page, and a Discord post.** The combat-logging fix (`app.js:261`) is a 40-word settings path shown only when the verdict is `info` and lists `combat`.

**Party window concepts a newcomer meets at once (`app.js:1645-1697`):** party code (`gn-…`), Join, New code, Copy code, Leave (with Undo), party room vs ntfy.sh fallback, Connect Discord / Change channel / Remove / Cancel, "waiting for Discord", everyone's fights page with Start/Stop sending, roster "per the chat log", "same enemies" / "same party" / "pasted" / "only you so far" / "without you" tag chips, Session select ("Ilmari Desert 00:45 to now", "All today"), Post session to Discord vs Post fight to Discord, "Show N fights nobody else was in", Paste a fight from Discord (only off the room). That is **~20 distinct nouns and 12 verbs in one window**.

**States:**
- *No chat log* (`shots/combat-nolog.png`): finding "No chat log to read, so there's nothing to measure. Turn on chat logging and the meter starts with your first hit."; stamp "No chat log found / ■ missing"; At a glance hidden; Fights and Breakdown "Needs the chat log." with the chat-log fix in both footers; Today/This login tabs disabled; **the Party window still renders its full form (New code, code field, Join, Connect Discord) and empty copy as if sharing were possible** (`app.js:1830-1838` returns before `renderParty()`, but the Party window's own HTML stays and the last render persists; in the dump it shows the 4 controls). The margin shows the chat-log plaque collapsed to its line (the Experience plaque exists only on Session, so on Combat **no plaque is on the main column at all**; the only red button is in the margin).
- *First paint / loading* (`shots/combat-live-tall.png`, captured ~2 s after load): the view shows the red **"No chat log found · ■ missing"** stamp and the finding "No chat log to read, so there's nothing to measure. Turn on chat logging and the meter starts with your first hit." while the footers still say "Chat log · reading…" and the margin "Checking your sources…". Cause: `renderCombatView` computes `noLog = !sessionHasLog() || …` before `reading = !old && !noLog && …` (`app.js:1798-1800`), so until `/api/session` answers `noLog` is true and the "missing" branch at `app.js:1812-1814` wins over the "reading" branch. Session guards this the other way round (`app.js:753` checks loading first). So every open of Combat on a slow first round (the README warns the first page can take ten seconds) starts with a false "missing" in red, which is the state a newcomer is most likely to screenshot.
- *No exports* (`shots/combat-noexport.png`): identical to live. Combat never needs an export; the margin still shows two export plaques ("Export Character JSON", "Export Storage JSON") on the right, i.e. **the most prominent buttons on the Combat page are about vendors/storage, not combat**.
- *Logged out:* finding switches from "Fighting now…" to the day summary; "Per second, last fight" leads At a glance.
- *Old server:* "The DPS meter needs a newer server.py." / "Needs a newer server.py." in both windows; Party: "Needs a newer Gorgon Notes: this page knows the Party window, the server it talks to does not."
- *Combat logging partly off:* footer fix "Settings → V.I.P. → Combat Logging: every "Log when…" row on a Log File option, Log non-damaging abilities on, and Save Chat Logs on. The meter needs every category." (`app.js:261`).
- *Not on the room* (`PG_ROOM` empty): "This copy is not on the party room (PG_ROOM is empty), so Discord can't be connected here".
- *Discord pending:* "Waiting for Discord: pick a server and a channel in your browser (until hh:mm)" + Cancel; result in the system line.

### 2.3 Vendors (`#vendors`)

**Question (DESIGN.md:1311):** where can I still sell, and how much will each vendor pay?

**Windows (5):** At a glance → [Where to sell | What they buy] → Sell (By stop / By item tabs; count " · N stops") → Vendors (primary; By area / One list tabs; toolbar: search, Area select, Hide drained, phone sort select; filter chips; khaki pane) (`index.html:245-294`).

**Controls (live):** area bars (5, `aria-pressed`), 12 goods chips + "N more types" chip, Sell tabs, per-row Sell/Keep radiogroups, "N other stacks stay · Show them", Vendors tabs, search, area select, checkbox, sort select, 7-8 sort headers, ~20 area section toggles, ~100 selectable rows, "Locked vendors" section, filter-clear chips. Easily **40+ controls**.

**Copy:** Sell's lead paragraph + caveat line ("only gear, books, documents and scrolls are offered for sale; materials, ingredients and the like are assumed to have a use (mark a type Sell in By item to sell it anyway). 3 recipe scrolls among the documents: one you haven't learned is worth more learned. worn gear can't be told from carried in the export.") is ~70 words; What they buy's hint ("Councils left per item type, in thousands where marked k. Tap one to filter the vendor list; the first twelve by councils are shown, 73 more behind the button.") ~30; every footer repeats "Character export · 3 h ago" + "After selling: VIP menu → Export Character JSON".

**Default vs fold:** screenshot `design/screenshots/vendors-1440-dark.png`: finding, At a glance (4 figures), Where to sell + What they buy, then the Vendors pane header and 3-4 rows at the fold. Sell sits between What they buy and Vendors (added 26 Oct, after that screenshot). Area sections: the four richest open, the rest collapsed; Locked vendors collapsed.

**States:**
- *No character export* (`app.js:2217, 2263, 2276, 2307-2310`): finding "No character export for Robchew yet, so there are no vendor caps to show. Export once and this fills in."; stamp "No character export found / ■ missing"; At a glance hidden except Slots Free; Where to sell and What they buy "Needs a character export."; Vendors pane replaced by "Vendor caps come from your favor in the character export." + the **Export Character JSON** plaque; Sell "Nothing to sell yet: no character export, so vendors and the sale price are unknown."; **every footer** "Character export · ■ missing / VIP menu → Export Character JSON". Fix printed 7+ times.
- *No storage export:* Sell "Needs a storage export." with its own missing footer; At a glance loses Slots Free.
- *Stale:* finding suffix "These are from a character export 1 day old." in amber; age marks on figures; margin plaque.
- *Old server:* "Resets since the export need a newer server.py" in the Vendors footer; Sell "Needs a newer Gorgon Notes."

### 2.4 Storage (`#storage`)

**Question (DESIGN.md:1333):** where is there room, and what am I holding?

**Windows (5):** At a glance → Where there's room (two-column area bars) → Vaults (primary; toolbar: search, "Hide empty, unused vaults", phone sort; pane with 8 columns incl. inline **size inputs** per unknown/manual vault) → Stacks to merge (By item / By stop tabs; "Held in several places, but they don't stack" sub-table) → Items (Export picker select, summary line with "Open the file", By location bars, search, Location select, sort select, 6-column table with foldout rows, "Show 200 more") (`index.html:297-361`).

**Controls (live):** ~12 area bars, search, checkbox, sort select, 7 sort headers, ~8 section toggles, 27 selectable rows, up to 8 size inputs (type a number, Enter/blur saves to `POST /api/capacity`), merge tabs, "Show all 17", export select, ~15 location bars, search, select, sort select, 6 sort headers, ~200 rows each with a possible foldout, "Show 200 more". **50+ controls.** The only write action in the data views (size input) is an unlabeled number box with the placeholder "size" inside a table cell (`app.js:2871`).

**Copy:** Stacks to merge lead ("Merge these 27 items and 33 slots come back: 32 in vaults, 1 in your inventory." + "Not counted: 16 split items that don't stack (gear and the like), 7 already in full stacks.") and the spread paragraph; provenance tags "from favor", "from your stats", "fixed size", "typed in by you", "needs character export"; pane-under hint "Select a vault to see only its items below. Sizes the game doesn't publish can be typed into the Slots column."

**Default vs fold (`design/screenshots/storage-1440-dark.png`):** finding, At a glance (up to 5 figures), Where there's room (12 areas), Vaults header + 4 rows at the fold; Stacks to merge and Items far below.

**States:**
- *No storage export* (`app.js:2576, 2608, 2624-2627, 2655, 3050`): finding "No storage export for Robchew yet, so there's nothing to count. Export once and this fills in."; At a glance hidden; Where there's room / Stacks to merge / Items "Needs a storage export."; Vaults pane replaced by "Vault contents come from the storage export." + **Export Storage JSON** plaque; every footer "Storage export · ■ missing / VIP menu → Export Storage JSON".
- *Storage export, no character export:* sizes "?" with inputs, tag "needs character export", margin character plaque.
- *Old server:* Stacks to merge "Needs a newer server.py."

### 2.5 Character (`#character`)

**Question (DESIGN.md:1360):** where does my character stand, and which skills are close?

**Windows (6 + 1 conditional):** "This export came out partial" (hidden unless partial/broken) → At a glance → phone-only tab strip (Skills / Currencies / Favor / Quests / Stats) → Skills (primary; search, sort select, 6 sortable columns, 12 rows then "Show all 118 skills") → [Currencies ("N at zero" toggle) | Stats (search, grouped; "Show all 62 stats")] → [Active quests (search) | NPC favor (search, 3 sortable columns, 60 rows then "Show all")] (`index.html:364-424`).

**Title-extra:** the export `<select>` ("Robchew · 29 Oct 21:40 (newest)", partial ones "(partial)") + "Human · last area Ilmari Desert · exported 29 Oct 21:40 · Open the file" (`app.js:3236-3239`). This is the only view with a control in the title row.

**Controls:** export select, 4 search inputs, sort select, 6 + 3 sort headers, 4 "Show all/fewer" links, 5 phone tabs. ~25.

**States:**
- *No export* (`app.js:3234, 3242, 3299-3303, 3309, 3327`): title-extra "No exports for Robchew"; finding "No character export for Robchew yet, so there are no skills, currencies or favor to show. Export once and this fills in."; Skills pane replaced by "Skills, currencies, stats, favor and quests all come from the character export." + **Export Character JSON** plaque; Currencies/Stats/Favor/Quests "Needs a character export."; every footer missing/fix.
- *Partial (`???`) export picked:* red finding "This export came out partial (name "???"), so it has no skills, quests or favor. Pick the newest good one, or export again."; the broken window with the **Export Character JSON again** plaque and "Show the newest good export" link.
- *Newest is partial, older good exists:* broken window "Your newest character export came out a bit… partial (name "???"), so it's ignored. The numbers below are from the last good one."
- *Older export picked:* stamp "… · older, picked"; margin note "Older export picked".

### 2.6 Files (`#files`)

**Question (DESIGN.md:1400):** what exactly is in the files this app reads, and are they current?

**Windows (2, side by side ≥ 1180):** Files (primary; list grouped Exports / Chat logs / Typed in by you / Game data v490 / older versions; two-line rows with chips "in use", "superseded", "alt", "partial", "won't parse", "open"; "Show N older exports", "Show N older logs") → Contents (dark; toolbar: search, Expand all, Collapse all, "Open raw · 91.7 KB"; path bar with breadcrumbs + Copy path / Copy value / Copy link; a WAI-ARIA JSON tree or a chat-log pager with "Show 500 earlier/later"; hint "Arrow keys move and open, * opens every sibling, type a letter to jump.") (`index.html:427-460`).

**Controls:** 5 group toggles, ~15 file links, 2 "Show older" links, search, 3 buttons, raw link, crumbs + 3 copies, every tree row (`treeitem`, thousands), "Show 200 more" rows, "Reload", "Retry", "Show newest". **This is a developer tool** (JSON inspector) placed sixth of eight in the rail with the same weight as Session.

**Finding (live):** "55 files: 15 exports, your vault sizes, 7 game data files (v490, 22.5 MB) and 32 chat logs (71.9 MB). The newest export is 3 h old. The chat log was written just now."

**States:**
- *No exports for this character* (`app.js:3679-3683`): the Exports group opens with "No exports for Robchew yet. Exports land in Reports/ once you use the VIP menu." + the Export Character JSON plaque; alts still listed.
- *Nothing at all* (`app.js:3574, 3650-3656`): "No files yet. Exports land in Reports/ once you use the VIP menu, the chat log appears with Save Chat Logs on, and game data is fetched the first time Vendors or Storage loads." + plaque. (This is the closest thing to a first-run explanation in the app, on the sixth tab.)
- *No chat log* (`?sim=nolog`): the Chat logs group is absent; finding ends "No chat log yet."
- *Old server:* "Needs a newer server.py to list the files."
- Also: invalid JSON (422) with line/column and the export-again plaque; file rewritten (409) amber note + Reload; file gone (404).

### 2.7 Teleports (`#teleports`)

**Question (DESIGN.md:1416):** what code do I type into the Teleportation Machine to get where I want?

**Windows (1 + one per zone, 14):** Teleportation Machine (primary; a 45-word requirements note "The one working machine is in Windy View Cave (Gazluk). It takes Teleportation 25 and 2 Aquamarine per trip, can't reach the Fae Realm, and its codes are relative to the sender, so they only work from that machine."; search; match line; state line) → 14 zone windows, each a foldout title ("Serbule · 9 landmarks · 15 codes", "you're here" tag), rows landmark + code buttons (click copies), **each with the same 20-word footer** "Project: Gorgon wiki · fetched 21:00 · confirmed there as of 28 Mar 2025 · codes rotate after major updates / Refresh" (`app.js:5118-5135`).

**Controls:** search, 14 fold buttons, ~214 code buttons, 15 Refresh links, Retry / Open the wiki page in error states.

**Default vs fold:** the zone you are in open, else the first three; the other 11 folded (titles + footers still shown, so the page is 15 windows tall).

**States:** no copy + wiki unreachable ("Couldn't read the wiki page." + Retry + Open the wiki page); server down; old server ("Needs a newer server.py to read the wiki."); stale copy (amber "3 d old"). **Not affected by exports or chat log** (only the "you're here" promotion needs the log), yet the margin still lists the two export plaques on this view when they are warn/bad (`viewItems`, `app.js:440-447`: any warn/bad verdict is listed on every view).

### 2.8 Statehelm (`#statehelm`)

**Question (DESIGN.md:1431):** which Statehelm trainers am I gifting this week, how many gifts does each still take, and what do I hold that they like?

**Windows (3):** At a glance (Gifts left this week, Items to give, Trainers picked) → Your trainers (primary; a 45-word lead "Each Statehelm trainer takes five gifts a week, and the week turns Monday at midnight US Eastern. Close Friends unlocks Prodigy Potential. The count comes from this week's chat log; set it with − and + when the game says otherwise."; one block per picked trainer with a − / + counter, "use the chat log's N" link, preference line, items table, "Stop tracking X") → Pick trainers (search; 44-row table with a checkbox per trainer, Likes, Favor, You hold) (`index.html:483-511`).

**Controls:** search, 44 checkboxes, per picked trainer: fold, −, +, use-log link, stop link; footer wiki link. 50+.

**States:** no picks: finding "Pick the trainers you gift below. Each takes 5 gifts a week, and Close Friends unlocks Prodigy Potential." and "No trainers picked yet. Tick them in Pick trainers below and they show up here with the items you can give."; no storage export: "Items to give —  / needs a storage export", per trainer "Needs a storage export to find the items you hold."; chat log missing: counts stay at the manual/zero value, footer carries "Chat log · ■ missing"; old server; server down with Retry.

---

## 3. A brand-new install, tab by tab (no exports, chat logging off, game maybe not running)

This combines the `?sim=nolog` and `?sim=noexport` previews (the app has no single "both" preview; `api()` at `app.js:213-237` handles them separately) with the code paths. The server's `/api/health` in that state lists `chat-log` bad (no log), `character-export` bad, `storage-export` bad (no file), `game` info "Not known without a chat log"; the browser fallback (`app.js:308-360`) does the same without the server.

| Tab | Title row | Main column | Margin | Buttons a newcomer sees |
|---|---|---|---|---|
| Session | "No chat log to read, so there's no session to show. Turn on chat logging and this fills in as you play." / "No chat log found · ■ missing" | Here: "Needs the chat log."; Experience: empty line + **Save Chat Logs** plaque; XP by skill, Level-ups, Councils, Combat, Loot, What happened, Chat log: each "Needs the chat log." + red footer with the same fix | "1 missing · 2 missing" header (chat log, both exports); chat-log note collapsed to its line; **Export Character JSON** and **Export Storage JSON** plaques | 3 red plaques, Check again, Today/This login, a disabled Loot search |
| Combat | "No chat log to read, so there's nothing to measure. Turn on chat logging and the meter starts with your first hit." / missing | Fights and Breakdown: "Needs the chat log."; Party: full form (**New code**, code field, **Join**, **Connect Discord**, empty copy about pasting codes into party chat) | same three notes; the chat-log plaque appears here in the margin (no plaque in the main column) | New code, Join, Connect Discord (primary, rust), 3 margin plaques, Copy/Post disabled |
| Vendors | "No character export for Robchew yet, so there are no vendor caps to show. Export once and this fills in." / "No character export found · ■ missing" | Where to sell, What they buy: "Needs a character export."; Sell: "Needs a storage export."; Vendors: sentence + **Export Character JSON** plaque; toolbar disabled | character plaque collapsed; storage plaque; chat-log plaque | 1 main plaque + 2 margin plaques, disabled search/select/checkbox/tabs |
| Storage | "No storage export for Robchew yet, so there's nothing to count…" | Where there's room, Stacks to merge, Items: "Needs a storage export."; Vaults: sentence + **Export Storage JSON** plaque | storage collapsed; character plaque; chat-log plaque | 1 main plaque + 2 margin plaques |
| Character | "No character export for Robchew yet, so there are no skills, currencies or favor to show…"; title-extra "No exports for Robchew" | Skills: sentence + plaque; Currencies, Stats, Quests, Favor: "Needs a character export." | character collapsed; storage + chat-log plaques | 1 + 2 plaques |
| Files | "No files yet. Exports land in Reports/ once you use the VIP menu, the chat log appears with Save Chat Logs on, and game data is fetched the first time Vendors or Storage loads." (only if literally no file, incl. game data) else "N files … No exports for Robchew yet. No chat log yet." | Files: the empty line + plaque, or the Game data group only; Contents: "Pick a file on the left." | all three listed | 1 + 2 plaques, 4 disabled toolbar controls |
| Teleports | "214 codes for 108 landmarks in 14 zones, from the wiki…" (works offline-independent of exports) | requirements note, search, 3 open zones + 11 folded, 15 identical footers | wiki note (ok) **plus** the three missing-data plaques from the other views | ~45 code buttons, 15 Refresh, 3 margin plaques |
| Statehelm | "Pick the trainers you gift below. Each takes 5 gifts a week, and Close Friends unlocks Prodigy Potential." | At a glance "0 / — / 0"; Your trainers "No trainers picked yet…"; Pick trainers: 44 checkboxes | three plaques | 44 checkboxes + 3 plaques |

**What the newcomer is never told on that first screen:** that the app needs two separate in-game actions (exports) plus one setting (Save Chat Logs) before anything shows; which of the three matters for what they want; that VIP is required for exports; how to open the VIP menu (DESIGN.md:1131 says the path is deliberately not stated because it is unverified); that Teleports and Statehelm's Pick list work with nothing; that Combat needs *only* the chat log (plus Combat Logging on) and no export at all. The plaques are correct per window but identical across tabs, so the same red button appears 3× per page and 20+ times across the app.

**Logged-out variant:** every fix reads "Next time you're in game: VIP menu → Export Character JSON, while fully logged in" (`app.js:252-254`); the header reads "Location not known without a chat log" or "X (logged out 00:02)". **Old server variant** (page newer than `server.py`, `staleServer()` `app.js:4855-4861`): a persistent broken toast "Gorgon Notes was updated, but the old server (v0.10.0) is still running behind this window. Close every Gorgon Notes window, wait a few seconds, then start Gorgon Notes again. If it comes back the same, end the python.exe under Gorgon Notes in Task Manager first." plus per-window "Needs a newer server.py." / "Needs a newer Gorgon Notes." lines.

---

## 4. Where the page explains itself, and where it does not

**Explains (always):**
- Every window footer: source + age on the left, fix or "To refresh: …" on the right (`setFoot`, DESIGN.md:1190-1233). 100% coverage, but it is the *same* sentence on every window of a view.
- The margin: evidence sentence per verdict ("Since then you visited Rahu, Casino and Serbule, where your vaults are. You've searched your storage 9 times since it, so vault contents have likely moved. You've picked up 444 stacks of loot since it, so Slots Free is lower than shown." — 45 words) and a plaque.
- The finding sentence: one summary per view, in the game's register.
- Empty states: one dry line each (`.empty`), e.g. "No fights today. The first hit you land or take opens one; 15 s without damage closes it."
- Three in-window lead paragraphs: Teleports requirements, Statehelm rule, Sell caveats; Party's not-joined paragraph; Councils' spending note; Breakdown's DoT notes.
- `title=` tooltips: sort headers, abilities ("Bee Stab: 25 hits · 1 crit (4%) …"), favor header, parent skills, item powers, stat raw keys, reset times, party rows.
- Search placeholders with an example ("Vendor, what they buy, or an item, e.g. figurine").
- Check again replies in the system line ("Nothing new since 21:40. In game: VIP menu → Export Character JSON, then check again.").
- Keyboard: `/` focuses the view's search, Esc clears, arrow keys on tabs/tree/chart; the only on-screen hint is the Files tree line.

**Does not explain:**
- **What the app is for** (only the About popover's one sentence and `<meta description>`), **what each tab is for** (no subtitle, no tooltip on rail items, no first-visit blurb), **which tab to start with**, and **the order of the three setup steps**.
- **Why a window exists.** Session has ten windows with one-word titles ("Here", "Councils", "What happened"); Combat's Party window has no sentence saying what "party" means here (friends running the same app) once joined.
- **Jargon with no gloss**: councils (currency), favor and tiers (Soul Mates, Like Family), VIP menu, Save Chat Logs, Combat Logging, export, partial export / "???", vaults, Slots Free, drained, cap, reset, DoT, "ticks", "indirect", "kill mechanic", "skirmish", Prodigy Potential, Close Friends, Statehelm, Teleportation Machine codes, "party room", ntfy.sh, webhook, "everyone's fights", "same enemies", "pasted", "superseded", "partial twin", "game data v490", "LogChat", "server.py", "python.exe", "PG_ROOM", "mtime". The copy is written for the owner who built it and knows the game and the repo.
- **Which controls matter.** Every window has the same chrome; a sort header and the Connect Discord primary button have the same visual weight as "Check again".
- **Priority between fixes.** Three red plaques on one page (chat log, character, storage) with no ordering, and they appear on views that do not need them (Teleports, Combat).
- **The Discord / party / everyone trio.** Post fight vs Post session vs Copy for Discord vs the everyone page link vs paste box: five sharing paths, none introduced.
- **Success feedback for setup**: after the first export the system line says "[Status] Character export loaded. Vendors can pay N councils." (`app.js:5668`) and the glance flashes, but nothing says "step 1 of 3 done".
- **Hidden keyboard features** (`/`, Esc, Enter/Space on rows, `*` in the tree) are undiscoverable except the one Files hint.
- **Phone**: the About button and the fan line vanish (`app.css:555`); the margin collapses to a one-line strip unless something is wrong.

---

## 5. Where the overwhelm comes from (quantified)

### 5.1 Windows and controls per view (live data, 1440 px; DOM counts from `domstats.py`, see §8 for the raw table)

Measured on the live DOM dumps (`scratchpad/phase1/domstats.txt`; "controls" = visible button/input/select/link elements inside the view's windows, selectable table rows not counted; "words" = visible text words inside the windows; "copy blocks" = distinct text runs of 6+ words).

| View | Windows | Controls in windows | Words in windows | Copy blocks | Simultaneous CTAs (buttons that *do* something beyond sort/filter/fold) | Below the fold at 1440 × 1400 |
|---|---|---|---|---|---|---|
| Session | 10 | 22 | 1,204 (Chat log 620, Here 207) | 49 | Check again, 2 scope tabs, 2 margin plaques, Show more ×3 = 8 | 7 of 10 windows |
| Combat | 4 | 30 (+31 selectable rows) | 1,240 (Fights 693, Party 361) | 26 | Check again, Copy for Discord, Post fight to Discord, Copy code, Leave, Change channel, Remove, Stop sending, Post session to Discord, per-fight Post, 2 margin plaques = **12** | Breakdown and Party (`shots/combat-live.png` ends inside the Fights table at row 27; at 36 px a row the table ends near 1,500 px, so Breakdown starts around 1,550 px and Party around 2,300-2,500 px) |
| Vendors | 5 | 51 (Vendors pane 30, What they buy 13) | 1,786 (Vendors pane 1,444) | 74 | Check again, Sell/Keep radios, 2 plaques | Sell and most of the Vendors pane |
| Storage | 5 | **168** (Items 119, Vaults 33, Where there's room 13) | **5,653** (Items 3,414, Stacks to merge 1,210, Vaults 921) | **256** | Check again, 6-8 size inputs, export select, Show newest, 2 plaques | Vaults body, Stacks to merge, Items |
| Character | 6 | 18 | 1,182 (Quests 405, Favor 403) | 36 | Check again, export select, 2 plaques | Currencies, Stats, Quests, Favor |
| Files | 2 | 39 (+3,882 tree entries on demand) | 518 | 25 | Check again, Expand/Collapse all, Open raw, 3 Copy, Reload | Contents tree |
| Teleports | 15 | **244** (214 code buttons, 14 folds, 15 Refresh) | 1,106 (15 identical 20-word footers = ~300) | 25 | Check again, 15 Refresh, 214 Copy-code | 11 folded zones |
| Statehelm | 3 | 78 (Pick trainers 46, Your trainers 32) | 1,447 (Pick 797, Your trainers 575) | 61 | Check again, 44 Track checkboxes, − / + ×8, use-log ×n, Stop tracking ×8 | Pick trainers |

Shell on top of each: 20-27 controls and 150-350 words (the margin's evidence sentences account for most of the variation: 331 words on Files, 148 on Storage noexport).

First-run states for comparison: Session nolog 4 controls / 156 words in windows (9 windows of placeholders); Combat nolog 8 / 50 (Party keeps its 4 setup controls); Vendors noexport 7 / 89; Storage noexport 6 / 81; Character noexport 6 / 96. The shell still carries 20-25 controls and 150-280 words on those pages, so **on a fresh install the chrome and the margin outweigh the content 3:1 in words and 4:1 in controls.**

### 5.2 Repetition

- The **fix sentence** "VIP menu → Export Character JSON" (or storage / chat-log) appears per view in: the stamp (as "missing"), the finding, every window footer (5-10×), the margin note, the plaque, the Check again system line. Measured in the dumps: on `?sim=nolog` Session, "Needs the chat log" + "Save Chat Logs" occur **18 times** in the visible DOM; on `?sim=noexport` Vendors, "Export Character JSON" occurs **7 times**.
- **Footers**: 60+ footer strings across the app, all of the form "<source> · <age> · <extra> / <fix>"; on Teleports the same 20-word footer is rendered 15 times on one page (`app.js:5129-5133`).
- **"Needs the chat log." / "Needs a character export." / "Needs a storage export."** placeholder windows: a first-run Session page shows 8 windows whose entire body is that sentence; Vendors 3; Storage 3; Character 4. DESIGN.md's own rule "No placeholder windows are drawn" (1286) applies to unbuilt data, not to these.
- **"Needs a newer server.py."** appears in 27 string occurrences in `app.js` and names a file a Windows user never sees (the Party window is the one place that says "Needs a newer Gorgon Notes" instead, `app.js:1656`).

### 5.3 Reading load

- The margin evidence sentences are 20-45 words each; three notes + "Also checked" is ~150 words of status text on every page.
- Breakdown's explanatory tail can reach 150 words (`app.js:2004-2009`).
- Session's Chat log window prints raw game log lines (500 cap) with 12-14 channel chips; counts like "Combat 6,895".
- Numbers dominate: Combat's Fights table alone is 31 × 8 numeric cells; the finding has 6 figures in two sentences.

### 5.4 Jargon density (terms a non-player or new player meets without a gloss)

Counted over the live DOM dumps of Session + Combat + Vendors + Storage: councils (×40+), favor tiers (×30), export (×60), VIP (×20), "chat log" (×70), vault/slot (×50), DoT / "damage over time" (×6), "party room" / ntfy.sh (×4), webhook (×2), server.py (×3 even when nothing is wrong, in About and fixes). Internal identifiers that leak: `gn-z4g5yhyzj3h9`, `Chat-26-10-30.log`, `Character_Robchew_Arisetsu.json`, "game data v490", "PG_ROOM", "python.exe", "settings.json" (Statehelm footer), "capacity.json".

### 5.5 Structural causes (from the code)

1. **One template for every window** (`index.html` `section.win` + `setFoot`): every data window gets a title, body, two-part footer. There is no lighter "card" or "hero" component, so the primary figure (DPS now, councils left) has the same frame as "Also checked".
2. **Every verdict is listed on every view when warn/bad** (`viewItems`, `app.js:440-447`), so Combat and Teleports show export plaques that have nothing to do with them; the pill, favicon and tab title aggregate the same.
3. **Fix text is pushed to every window footer** rather than to one place per view (`srcFix` callers: 40+).
4. **Views grew by accretion** (ROADMAP session log): Here, Councils, Combat windows added to Session 23-24 Oct; Party, Discord, sessions, everyone line added to Combat's Party window 25-29 Oct; Sell moved from Storage to Vendors 26 Oct. Nothing was removed.
5. **No hierarchy among the eight tabs**: the rail gives Files (a JSON inspector) and Statehelm (one week-long mechanic) the same rank as Session and Combat.
6. **Setup is expressed as errors**: the first-run state is rendered through the data-health model (bad verdicts → red plaques), so a fresh install looks like a broken one ("1 missing · 2 missing", red favicon, "(!)" in the tab title, `app.js:596-600`).
7. **Preview/dev affordances ship in the UI**: `?sim=` notes, "server.py", version/commit lines in About, "settings live in this browser only".

---

## 6. The Combat flow as a newcomer meets it (for part 2 of the brief)

Trace of what `renderCombatView` (`app.js:1796-1878`) and `renderParty` (`1645-1697`) put in front of someone who installed the app to "see everyone's damage":

1. Rail → Combat. First screen: a three-line finding of numbers, five figures, a 31-row × 8-column table. No sentence says "this is your own DPS from your chat log; to see friends, do X".
2. Scroll ~1,000 px: Breakdown of the newest fight (figures, chart, By ability, What hit you, By enemy, four footnotes). Tools: "Copy for Discord", "Post fight to Discord".
3. Scroll another ~600 px: Party. If not joined: an 60-word paragraph about pressing **New code** and pasting into party chat; a code field; **Join**; a rust **Connect Discord** button with the state line "Opens Discord in your browser to pick a server and a channel; Post to Discord then goes there"; the everyone line "Every fight also goes to the everyone's fights page … Stop sending" (link to the Worker URL, opens in a new tab); footer "Press New code, or paste a code from party chat. Fight numbers and character names go to the party room; anyone with the code can read them".
4. If joined (the owner's state, `GET /api/party`: code `gn-z4g5yhyzj3h9`, 3 members, 150 fights, 18 auto sessions, Discord connected, everyone on, 127 sent today): state line "joined 18:54"; roster line only when the chat log says you are in a party; session table with a **Session** select of 18 entries like "Ilmari Desert 00:45 to now" and **Post session to Discord**; "Fights" heading; the last 10 shared fights as bar lists with tag chips; "Show all 6 fights" / "Show 145 fights nobody else was in"; footer "Party room · gn-z4g5yhyzj3h9 · last message 00:39 · 357 fights sent".

What the flow requires but never states in order: (a) every friend installs Gorgon Notes (README "Playing with friends" only), (b) every friend turns on Save Chat Logs **and** Combat Logging (the fix text exists but only fires on a verdict), (c) one makes a code, pastes it in party chat, the others paste it back, (d) optionally one connects Discord, (e) or nobody does anything and the everyone page (`cloud/src/everyone.html`, a separate site with its own design) already shows the runs. Step (e) is the newest and simplest path and is mentioned in a dim 13 px line at the bottom of the page, after the code mechanics.

The combat-logging requirement is surfaced only as `fixText('combat-logging')` (`app.js:261`), a 40-word settings path, shown in a footer when the server's verdict is `info` with `views: ['combat']`; on the live server the verdict is `ok` with `views: []`, so a friend whose logging is off sees "Needs the chat log." or an empty meter and no combat-specific hint until the server judges it.

---

## 7. Screenshots and dumps produced

- `scratchpad/phase1/shots/<view>-live.png` for all eight views (1440 × 1400, dark, fresh, 01:03), plus `combat-live-tall.png` and `session-live-tall.png` (1440 × 5000; **these two caught the first-paint state, see the boot-flash note in §2.2**: Chrome's `--timeout` fired before the first round answered, and retakes with a longer timeout hung), `combat-noexport.png`, `combat-nolog.png`, `session-noexport.png`, `session-nolog.png`. Note for later phases: headless Chrome hangs on Vendors/Storage/Character/Files/Teleports/Statehelm when `--virtual-time-budget` is passed (a ResizeObserver re-render loop in those views, `app.js:2493-2496, 3097-3106`); drop that flag and use `--timeout=6000` instead (`scratchpad/phase1/shoot.sh`).
- `scratchpad/phase1/dom/<view>-<state>.html` for all 8 views × 3 states (`live`, `noexport`, `nolog`); `scratchpad/phase1/domstats.py` counts them into `scratchpad/phase1/domstats.txt`.

---

## 8. Raw counts from the DOM dumps

(see the table appended below by `domstats.py`)

```

=== character-live.html: 6 windows · 18 controls · 1182 words (shell: 25 ctl, 281 w)
  - w-c-glance «At a glance»: 0 ctl · 36 w · 1 copy blocks
  - w-c-skills «Skills»: 9 ctl · 215 w · 15 copy blocks
  - w-c-cur «Currencies»: 1 ctl · 44 w · 1 copy blocks
  - w-c-stats «Stats»: 2 ctl · 79 w · 1 copy blocks
  - w-c-quests «Active quests (104)»: 1 ctl · 405 w · 17 copy blocks
  - w-c-favor «NPC favor»: 5 ctl · 403 w · 1 copy blocks

=== character-noexport.html: 5 windows · 6 controls · 96 words (shell: 20 ctl, 190 w)
  - w-c-skills «Skills»: 3 ctl · 34 w · 3 copy blocks
  - w-c-cur «Currencies»: 0 ctl · 15 w · 1 copy blocks
  - w-c-stats «Stats»: 1 ctl · 15 w · 1 copy blocks
  - w-c-quests «Active quests»: 1 ctl · 16 w · 1 copy blocks
  - w-c-favor «NPC favor»: 1 ctl · 16 w · 1 copy blocks

=== character-nolog.html: 6 windows · 18 controls · 1182 words (shell: 27 ctl, 330 w)
  - w-c-glance «At a glance»: 0 ctl · 36 w · 1 copy blocks
  - w-c-skills «Skills»: 9 ctl · 215 w · 15 copy blocks
  - w-c-cur «Currencies»: 1 ctl · 44 w · 1 copy blocks
  - w-c-stats «Stats»: 2 ctl · 79 w · 1 copy blocks
  - w-c-quests «Active quests (104)»: 1 ctl · 405 w · 17 copy blocks
  - w-c-favor «NPC favor»: 5 ctl · 403 w · 1 copy blocks

=== combat-live.html: 4 windows · 30 controls · 1240 words (shell: 23 ctl, 272 w)
  - w-d-glance «At a glance»: 0 ctl · 50 w · 2 copy blocks
  - w-d-fights «Fights 31»: 12 ctl · 693 w · 13 copy blocks
  - w-d-break «Breakdown 00:53 · 20 s · Ilmari Desert»: 2 ctl · 136 w · 4 copy blocks
  - w-d-party «Party 6 of 151»: 16 ctl · 361 w · 7 copy blocks

=== combat-noexport.html: 4 windows · 30 controls · 1240 words (shell: 22 ctl, 233 w)
  - w-d-glance «At a glance»: 0 ctl · 50 w · 2 copy blocks
  - w-d-fights «Fights 31»: 12 ctl · 693 w · 13 copy blocks
  - w-d-break «Breakdown 00:53 · 20 s · Ilmari Desert»: 2 ctl · 136 w · 4 copy blocks
  - w-d-party «Party 6 of 151»: 16 ctl · 361 w · 7 copy blocks

=== combat-nolog.html: 3 windows · 8 controls · 50 words (shell: 25 ctl, 274 w)
  - w-d-fights «Fights»: 2 ctl · 19 w · 1 copy blocks
  - w-d-break «Breakdown»: 2 ctl · 25 w · 1 copy blocks
  - w-d-party «Party»: 4 ctl · 6 w · 0 copy blocks

=== files-live.html: 2 windows · 39 controls · 518 words (shell: 23 ctl, 331 w)
  - w-f-list «Files 95»: 29 ctl · 376 w · 17 copy blocks
  - w-f-view «Contents 3,882 entries»: 10 ctl · 142 w · 8 copy blocks

=== files-noexport.html: 2 windows · 30 controls · 360 words (shell: 20 ctl, 223 w)
  - w-f-list «Files 62»: 27 ctl · 346 w · 16 copy blocks
  - w-f-view «Contents»: 3 ctl · 14 w · 0 copy blocks

=== files-nolog.html: 2 windows · 30 controls · 385 words (shell: 25 ctl, 353 w)
  - w-f-list «Files 58»: 20 ctl · 243 w · 10 copy blocks
  - w-f-view «Contents 3,882 entries»: 10 ctl · 142 w · 8 copy blocks

=== session-live.html: 10 windows · 22 controls · 1204 words (shell: 23 ctl, 217 w)
  - w-s-glance «At a glance»: 0 ctl · 31 w · 1 copy blocks
  - w-s-zone «Here: Ilmari Desert»: 3 ctl · 207 w · 11 copy blocks
  - w-s-xp «Experience»: 2 ctl · 25 w · 2 copy blocks
  - w-s-skill «XP by skill»: 0 ctl · 29 w · 1 copy blocks
  - w-s-lvl «Level-ups»: 0 ctl · 25 w · 2 copy blocks
  - w-s-coin «Councils»: 0 ctl · 85 w · 5 copy blocks
  - w-s-combat «Combat»: 0 ctl · 42 w · 2 copy blocks
  - w-s-loot «Loot»: 4 ctl · 86 w · 3 copy blocks
  - w-s-what «What happened»: 0 ctl · 54 w · 1 copy blocks
  - w-s-chat «Chat log»: 13 ctl · 620 w · 21 copy blocks

=== session-noexport.html: 10 windows · 19 controls · 1040 words (shell: 22 ctl, 178 w)
  - w-s-glance «At a glance»: 0 ctl · 31 w · 1 copy blocks
  - w-s-zone «Here: Ilmari Desert»: 0 ctl · 29 w · 2 copy blocks
  - w-s-xp «Experience»: 2 ctl · 25 w · 2 copy blocks
  - w-s-skill «XP by skill»: 0 ctl · 29 w · 1 copy blocks
  - w-s-lvl «Level-ups»: 0 ctl · 25 w · 2 copy blocks
  - w-s-coin «Councils»: 0 ctl · 78 w · 4 copy blocks
  - w-s-combat «Combat»: 0 ctl · 42 w · 2 copy blocks
  - w-s-loot «Loot»: 4 ctl · 86 w · 3 copy blocks
  - w-s-what «What happened»: 0 ctl · 54 w · 1 copy blocks
  - w-s-chat «Chat log»: 13 ctl · 641 w · 22 copy blocks

=== session-nolog.html: 9 windows · 4 controls · 156 words (shell: 23 ctl, 237 w)
  - w-s-zone «Here»: 0 ctl · 16 w · 1 copy blocks
  - w-s-xp «Experience»: 3 ctl · 38 w · 2 copy blocks
  - w-s-skill «XP by skill»: 0 ctl · 18 w · 1 copy blocks
  - w-s-lvl «Level-ups»: 0 ctl · 16 w · 1 copy blocks
  - w-s-coin «Councils»: 0 ctl · 16 w · 1 copy blocks
  - w-s-combat «Combat»: 0 ctl · 16 w · 1 copy blocks
  - w-s-loot «Loot»: 1 ctl · 16 w · 1 copy blocks
  - w-s-what «What happened»: 0 ctl · 10 w · 0 copy blocks
  - w-s-chat «Chat log»: 0 ctl · 10 w · 0 copy blocks

=== statehelm-live.html: 3 windows · 78 controls · 1447 words (shell: 23 ctl, 220 w)
  - w-sh-glance «At a glance»: 0 ctl · 75 w · 4 copy blocks
  - w-sh-mine «Your trainers 8 trainers · 34 gifts left»: 32 ctl · 575 w · 22 copy blocks
  - w-sh-pick «Pick trainers 44 trainers»: 46 ctl · 797 w · 35 copy blocks

=== statehelm-noexport.html: 3 windows · 78 controls · 1429 words (shell: 22 ctl, 167 w)
  - w-sh-glance «At a glance»: 0 ctl · 65 w · 4 copy blocks
  - w-sh-mine «Your trainers 8 trainers · 34 gifts left»: 32 ctl · 567 w · 22 copy blocks
  - w-sh-pick «Pick trainers 44 trainers»: 46 ctl · 797 w · 35 copy blocks

=== statehelm-nolog.html: 3 windows · 78 controls · 1439 words (shell: 25 ctl, 251 w)
  - w-sh-glance «At a glance»: 0 ctl · 71 w · 3 copy blocks
  - w-sh-mine «Your trainers 8 trainers · 34 gifts left»: 32 ctl · 571 w · 21 copy blocks
  - w-sh-pick «Pick trainers 44 trainers»: 46 ctl · 797 w · 35 copy blocks

=== storage-live.html: 5 windows · 168 controls · 5653 words (shell: 23 ctl, 251 w)
  - w-t-glance «At a glance»: 0 ctl · 48 w · 1 copy blocks
  - w-t-room «Where there's room»: 13 ctl · 60 w · 1 copy blocks
  - w-t-pane «Vaults»: 33 ctl · 921 w · 47 copy blocks
  - w-t-merge «Stacks to merge · 50 slots»: 3 ctl · 1210 w · 70 copy blocks
  - w-t-items «Items»: 119 ctl · 3414 w · 137 copy blocks

=== storage-noexport.html: 4 windows · 6 controls · 81 words (shell: 20 ctl, 148 w)
  - w-t-room «Where there's room»: 0 ctl · 17 w · 1 copy blocks
  - w-t-pane «Vaults»: 4 ctl · 29 w · 2 copy blocks
  - w-t-merge «Stacks to merge»: 0 ctl · 17 w · 1 copy blocks
  - w-t-items «Items»: 2 ctl · 18 w · 1 copy blocks

=== storage-nolog.html: 5 windows · 168 controls · 5653 words (shell: 25 ctl, 300 w)
  - w-t-glance «At a glance»: 0 ctl · 48 w · 1 copy blocks
  - w-t-room «Where there's room»: 13 ctl · 60 w · 1 copy blocks
  - w-t-pane «Vaults»: 33 ctl · 921 w · 47 copy blocks
  - w-t-merge «Stacks to merge · 50 slots»: 3 ctl · 1210 w · 70 copy blocks
  - w-t-items «Items»: 119 ctl · 3414 w · 137 copy blocks

=== teleports-live.html: 15 windows · 244 controls · 1106 words (shell: 23 ctl, 247 w)
  - w-tp-find «Teleportation Machine 214 codes»: 2 ctl · 66 w · 2 copy blocks
  - w-tp-eltibule «7 landmarks · 13 codes you're here»: 15 ctl · 76 w · 2 copy blocks
  - w-tp-anagoge-island «3 landmarks · 11 codes»: 13 ctl · 51 w · 1 copy blocks
  - w-tp-serbule-hills «9 landmarks · 15 codes»: 17 ctl · 73 w · 1 copy blocks
  - w-tp-serbule «17 landmarks · 32 codes»: 34 ctl · 117 w · 1 copy blocks
  - w-tp-sun-vale «11 landmarks · 21 codes»: 23 ctl · 87 w · 1 copy blocks
  - w-tp-red-wing-casino «3 landmarks · 5 codes»: 7 ctl · 46 w · 1 copy blocks
  - w-tp-kur-mountains «9 landmarks · 14 codes»: 16 ctl · 70 w · 1 copy blocks
  - w-tp-ilmari «5 landmarks · 8 codes»: 10 ctl · 50 w · 1 copy blocks
  - w-tp-rahu «5 landmarks · 12 codes»: 14 ctl · 61 w · 2 copy blocks
  - w-tp-gazluk «14 landmarks · 27 codes»: 29 ctl · 125 w · 5 copy blocks
  - w-tp-povus «14 landmarks · 37 codes»: 39 ctl · 132 w · 5 copy blocks
  - w-tp-vidaria «8 landmarks · 13 codes»: 15 ctl · 66 w · 1 copy blocks
  - w-tp-statehelm «3 landmarks · 6 codes»: 8 ctl · 46 w · 2 copy blocks
  - w-tp-fae-realm «no codes»: 2 ctl · 40 w · 2 copy blocks

=== teleports-noexport.html: 15 windows · 244 controls · 1106 words (shell: 22 ctl, 208 w)
  - w-tp-find «Teleportation Machine 214 codes»: 2 ctl · 66 w · 2 copy blocks
  - w-tp-eltibule «7 landmarks · 13 codes you're here»: 15 ctl · 76 w · 2 copy blocks
  - w-tp-anagoge-island «3 landmarks · 11 codes»: 13 ctl · 51 w · 1 copy blocks
  - w-tp-serbule-hills «9 landmarks · 15 codes»: 17 ctl · 73 w · 1 copy blocks
  - w-tp-serbule «17 landmarks · 32 codes»: 34 ctl · 117 w · 1 copy blocks
  - w-tp-sun-vale «11 landmarks · 21 codes»: 23 ctl · 87 w · 1 copy blocks
  - w-tp-red-wing-casino «3 landmarks · 5 codes»: 7 ctl · 46 w · 1 copy blocks
  - w-tp-kur-mountains «9 landmarks · 14 codes»: 16 ctl · 70 w · 1 copy blocks
  - w-tp-ilmari «5 landmarks · 8 codes»: 10 ctl · 50 w · 1 copy blocks
  - w-tp-rahu «5 landmarks · 12 codes»: 14 ctl · 61 w · 2 copy blocks
  - w-tp-gazluk «14 landmarks · 27 codes»: 29 ctl · 125 w · 5 copy blocks
  - w-tp-povus «14 landmarks · 37 codes»: 39 ctl · 132 w · 5 copy blocks
  - w-tp-vidaria «8 landmarks · 13 codes»: 15 ctl · 66 w · 1 copy blocks
  - w-tp-statehelm «3 landmarks · 6 codes»: 8 ctl · 46 w · 2 copy blocks
  - w-tp-fae-realm «no codes»: 2 ctl · 40 w · 2 copy blocks

=== teleports-nolog.html: 15 windows · 244 controls · 1106 words (shell: 25 ctl, 296 w)
  - w-tp-find «Teleportation Machine 214 codes»: 2 ctl · 66 w · 2 copy blocks
  - w-tp-eltibule «7 landmarks · 13 codes you're here»: 15 ctl · 76 w · 2 copy blocks
  - w-tp-anagoge-island «3 landmarks · 11 codes»: 13 ctl · 51 w · 1 copy blocks
  - w-tp-serbule-hills «9 landmarks · 15 codes»: 17 ctl · 73 w · 1 copy blocks
  - w-tp-serbule «17 landmarks · 32 codes»: 34 ctl · 117 w · 1 copy blocks
  - w-tp-sun-vale «11 landmarks · 21 codes»: 23 ctl · 87 w · 1 copy blocks
  - w-tp-red-wing-casino «3 landmarks · 5 codes»: 7 ctl · 46 w · 1 copy blocks
  - w-tp-kur-mountains «9 landmarks · 14 codes»: 16 ctl · 70 w · 1 copy blocks
  - w-tp-ilmari «5 landmarks · 8 codes»: 10 ctl · 50 w · 1 copy blocks
  - w-tp-rahu «5 landmarks · 12 codes»: 14 ctl · 61 w · 2 copy blocks
  - w-tp-gazluk «14 landmarks · 27 codes»: 29 ctl · 125 w · 5 copy blocks
  - w-tp-povus «14 landmarks · 37 codes»: 39 ctl · 132 w · 5 copy blocks
  - w-tp-vidaria «8 landmarks · 13 codes»: 15 ctl · 66 w · 1 copy blocks
  - w-tp-statehelm «3 landmarks · 6 codes»: 8 ctl · 46 w · 2 copy blocks
  - w-tp-fae-realm «no codes»: 2 ctl · 40 w · 2 copy blocks

=== vendors-live.html: 5 windows · 51 controls · 1786 words (shell: 23 ctl, 219 w)
  - w-v-glance «At a glance»: 1 ctl · 74 w · 4 copy blocks
  - w-v-where «Where to sell»: 5 ctl · 37 w · 2 copy blocks
  - w-v-buy «What they buy»: 13 ctl · 83 w · 3 copy blocks
  - w-v-sell «Sell · 1 stop»: 2 ctl · 148 w · 7 copy blocks
  - w-v-pane «Vendors»: 30 ctl · 1444 w · 58 copy blocks

=== vendors-noexport.html: 4 windows · 7 controls · 89 words (shell: 20 ctl, 147 w)
  - w-v-where «Where to sell»: 0 ctl · 17 w · 1 copy blocks
  - w-v-buy «What they buy»: 0 ctl · 17 w · 1 copy blocks
  - w-v-sell «Sell»: 0 ctl · 15 w · 1 copy blocks
  - w-v-pane «Vendors»: 7 ctl · 40 w · 3 copy blocks

=== vendors-nolog.html: 5 windows · 51 controls · 1788 words (shell: 25 ctl, 267 w)
  - w-v-glance «At a glance»: 1 ctl · 74 w · 4 copy blocks
  - w-v-where «Where to sell»: 5 ctl · 37 w · 2 copy blocks
  - w-v-buy «What they buy»: 13 ctl · 83 w · 3 copy blocks
  - w-v-sell «Sell · 1 stop»: 2 ctl · 150 w · 7 copy blocks
  - w-v-pane «Vendors»: 30 ctl · 1444 w · 58 copy blocks
```
