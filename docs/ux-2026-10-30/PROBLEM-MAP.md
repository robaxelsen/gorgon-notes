# PROBLEM MAP: Gorgon Notes, phase 1 synthesis (30 Oct 2026, 01:20 to 01:50)

Inputs: the six phase-1 reports in this folder (`ui-map.md`, `combat-flow.md`, `design-critique.md`, `walkthrough.md`, `research-ux.md`, `research-pg.md`), their screenshots and DOM dumps, plus read-only checks I ran against the repo at `68f89da`, the live server (GET only), the everyone feed, and the game's `GorgonSettings.txt`. Report sections are cited as `report §n`; code as `file:line`. "Verified here" means I checked it myself in this pass.

Ranking rule for §1 and §2: how many reports found it independently × severity × which personas it stops (P1 grandmother, P2 Windows friend, P3 owner; `walkthrough §7`).

---

## 0. The verdict in one paragraph

All six reports converge: the data model, voice, palette and footers are already at leader grade (brand brief 8/10, `design-critique §12`), but the app has **no first-run surface at all** and renders a fresh install as a broken one (red favicon, "(!)" title, "1 missing · 2 missing", nine placeholder windows, one setting stated 11 to 20 times), the eight-item rail gives a JSON inspector the rank of the damage meter, every view is four to five screens of same-rank windows, and one stale export is restated 9 to 12 times per view on views that never read it. Combat is the worst case: the finding is a six-fact paragraph, the group meter and the only zero-setup answer (the everyone page, a 13 px dim link) sit ~2,700 px down behind a 31-row numeric table, the window mixes five sharing paths with ~35 terms and 11 buttons, and the second in-game setting the meter needs (Combat Logging) is a grey `info` note that never colours anything. Newcomer score 5.6/10 overall, 4/10 on Combat (`design-critique §12, §8.2`). The 7.5 target needs three structural edits, not a restyle, and the plug-and-play party meter is mostly a last-mile change because the everyone feed already carries every fight code-free and the Worker already serves it room-style (`combat-flow §3.2`).

---

## 1. Problem A: "overwhelming / a newcomer can't tell what is worth using" (ranked)

### A1. No landing, no onboarding, no setup flow; first run is rendered through the error model. CRITICAL (6/6 reports)
- Boot = hash → `pgdash.tab` → `'session'` (`static/app.js:5779-5783`, verified here). No route explains the app; `grep -i "welcome|get started|onboard"` finds nothing but the Files empty line (`app.js:3574`), which is the closest thing to a first-run explanation and sits on the sixth tab (`ui-map §2.6`, `design-critique §2.2`).
- `?sim=nolog` Session: 9 windows whose whole body is "Needs the chat log." + a red "missing" footer each; the fix string occurs 18 times in the visible DOM (`ui-map §2.1, §5.2`; `dom/session-nolog.html`), "about twenty red statements of one setting on one screen" counting marks and the pill (`design-critique §10`; `critique-shots/session-nolog-1440.png`, `walk/session-nolog.png`).
- The only "what is this" text is About: one sentence + a file list + version/commit lines, behind a 13 px "fan-made / About" rail-foot button that is `display:none` under 768 px (`app.js:4877-4893`, `app.css:555`; `ui-map §1.5`).
- Setup is expressed as health verdicts: chat-log/character/storage `bad` → red favicon, "(!)" tab title, pill "1 missing · 2 missing", three plaques per page (`app.js:440-447, 596-600`; `ui-map §3, §5.5.6`). A fresh install looks like a broken one.
- Nothing says: the three setup actions in order, which tab each unlocks, that VIP is needed for exports, that Teleports/Statehelm-pick/Combat need no export, or how to open the VIP menu (`ui-map §3` "What the newcomer is never told"; `walkthrough §1`).
- Research: NN/g 2006 "the initial display tells users what is important"; Apple HIG: the one permission (here, the chat log) may be requested up front with its benefit, everything else postponed; NN/g 2021 empty state = status + cue + pathway; no tour (`research-ux §1.1, §1.2, §1.6, §4.1-4.2`). The pattern that already works in-app: Vendors `?sim=noexport` (one sentence + one plaque in the primary pane, stubs elsewhere) (`design-critique §10.1`).

### A2. The same status fact is said 3 to 20 times per screen, on views that do not use the source. MAJOR (6/6)
- `viewItems` lists every `warn`/`bad` verdict on every view regardless of `views` (`app.js:440-447`, verified here). Live `/api/health` (verified here): `character-export` views = `vendors, character, storage, statehelm, files`; `storage-export` = `storage, statehelm, vendors, files`; neither names `combat`, yet Combat and Teleports carry both export plaques (`shots/combat-noexport.png`, `critique-shots/combat-noexport-1440.png` "2 missing" on a view that reads only the chat log; `storage-nolog-1440.png` a Save Chat Logs plaque on a view that never reads the log) (`design-critique §8.4, §10.1`; `walkthrough §6.4, §6.10`; `research-ux §1.8-1.9`).
- With one 3-hour-old export, amber appears 9 to 12 times on Vendors (finding suffix, four At a glance labels, six footers, margin, rail mark, pill) (`design-critique §4.1`, `vendors-dark-1440.png`). Two rust plaques (`--rust #782A18`, `app.css:479-487`) are drawn in the margin of all eight views; in Daylight they are the darkest objects on the page (7.87:1) (`design-critique §9.3`).
- `setFoot`/`srcFix` are called 40+ times; Teleports renders one 20-word wiki footer 15 times with 14 "Refresh" buttons (`app.js:5129-5133`; `ui-map §5.2`; `design-critique §7`).
- "Needs a newer server.py." occurs 27 times in `app.js` and names a file Windows users never see; only the Party window says "Needs a newer Gorgon Notes" (`app.js:1656`) (`ui-map §5.2`; `walkthrough §5`).
- The OK "Party sharing" item prints its fix sentence ("Nothing to do but wait…") under a green check because the `quiet` test at `app.js:480` covers only export/chat-logging keys (`walkthrough §4 glance 3`, `app.js:265, 479-482`).
- Effect: P3 is trained to ignore the one pill that would tell him the log stopped (`walkthrough §4 glance 3`); P2's first night is spent under "2 missing" for files the meter does not read (`walkthrough §1`). Stripe/Grafana rule: colour only for "attention required", only "the servers in trouble" (`research-ux §1.8-1.9`).

### A3. Eight equal-weight destinations, no grouping, no purpose labels, unexplained marks; phone bar truncates. MAJOR (5/6)
- Rail `static/index.html:53-89`: Session, Combat, Vendors, Storage, Character, Files, Teleports, Statehelm; identical 60 px items (`app.css:165-186`); no `title`, no subtitle; 10 px status marks with no legend (`app.css:181`) (`ui-map §1.1`; `design-critique §2.1, §2.3`; `walkthrough §2 step 2`).
- Files is a developer JSON inspector (39 controls + 3,882 tree entries, hint "Arrow keys move and open, * opens every sibling") at the same rank as Session; Statehelm is a 44-checkbox weekly ritual (`ui-map §2.6, §2.8, §5.5.5`).
- `DESIGN.md:494` still specifies a five-item phone bar; it now holds eight at ~48 px, "Statehel…" truncated (`design-critique §11.2`, `crop-phone-session-top.png`).
- Research: ≤ 5 siblings before grouping; Linear/Raycast keep ≤ 6 primaries; LukeW "obvious always wins" means keep the daily four visible and demote only utilities (`research-ux §1.1, §1.11, §4.3`).
- Two "Combat" blocks on two pages: the Session window named Combat shows deaths/kills; the rail's Combat is the meter (`index.html:153-157`; `design-critique §3.2`; `walkthrough §2 step 1`: the word "damage" appears nowhere on Session).

### A4. Every view is 4 to 5 screens of same-rank windows; density is the lowest-scoring dimension (4/10). MAJOR (4/6)
- Full-page heights at 1440: Session 4,275 px (10 windows, `index.html:116-174`, verified here), Combat 3,908, Vendors 4,170, Teleports 3,956, Statehelm 4,502 (`design-critique §1, §3-7`).
- DOM counts (`domstats.txt`, `ui-map §5.1`): Storage 168 controls / 5,653 words (Items window alone 119 / 3,414); Teleports 244 controls (214 code buttons); Statehelm 78; Vendors 51 / 1,786 (pane 1,444 words, 102 rows); Session's Chat log window 620 words of raw game lines with 12-14 channel chips. Shell + margin add 20-27 controls and 150-350 words before any content; on a fresh install chrome outweighs content 3:1 in words and 4:1 in controls (`ui-map §5.1`).
- Structural causes: one window template for everything (no lighter card/hero), views grew by accretion with nothing removed, no collapse control on `.win` (`ui-map §5.5`; `walkthrough §4 glance 2`).
- Per-view: Session's Here table (a Vendors+Storage digest) pushes Experience, the primary window, below the fold; Councils carries a 40-word caveat paragraph (`design-critique §3.3, §3.5`). Vendors has four windows before its primary pane; the filter bar is not sticky (`§4.2, §4.4`). Storage tags all 28 vault rows with a provenance pill (`§5.1`). Character leads with Councils (an amber money figure) though its question is skills; `.ctabs` exists but is hidden at 1440; `grid2` pairs end ragged (`§6`). Teleports folds the zone the player is in while opening three others (`§7`). Statehelm's 44-row picker is open by default (`§7`).
- Research: Grafana "general to specific", Stripe's fixed five numbers, Ström's density = value ÷ space, so the redundant copies lower density (`research-ux §1.8-1.10, §3, §4.4`).

### A5. Jargon and internal identifiers in primary copy with no gloss. MAJOR (4/6)
- Game terms without a one-line gloss: councils, favor tiers (Soul Mates, Like Family), VIP menu, export, partial "???", vaults, Slots Free, drained, cap, DoT, ticks, "kill mechanic", skirmish, Prodigy Potential (`ui-map §4, §5.4`; `walkthrough §5` table).
- Infrastructure words: "party room" (never defined), ntfy.sh (`app.js:1657, 1690-1694`), `PG_ROOM` (`app.js:1628`), webhook in the *connected* state line (`app.js:1627`), "json block" (`index.html:234`), server.py, python.exe, settings.json, capacity.json; identifiers `gn-z4g5yhyzj3h9`, `Chat-26-10-30.log`, `Character_Robchew_Arisetsu.json`, "game data v490" (`ui-map §5.4`; `walkthrough §6.8`).
- "Session" means the view in the rail and a party run in the Party window's dropdown; the definition is a tooltip (`index.html:55`, `app.js:1578`; `walkthrough §6.13`).

### A6. The two self-explanation surfaces are hidden or settings-shaped; keyboard features are undiscoverable. MINOR (2/6)
- About: as A1. Reminders: 10 topics, 13+ controls, "Remind Me!" primary, "Settings live in this browser only", no explanation of what a moment is; theme control duplicated in the shell bar and About (`app.js:4789-4822, 4889-4890`; `ui-map §1.6`; `design-critique §2.4`).
- `/`, Esc, Enter/Space on rows, `*` in the tree: the only on-screen hint is the Files tree line (`index.html:454`; `ui-map §4`).
- Apple HIG: postpone nonessential setup; Reminders, theme and character select are first-screen chrome before the app has anything to remind about (`research-ux §1.6`).

### A7. Control affordance faults. MINOR (2/6)
- Sortable headers look like unsortable ones until hover (`app.css:353`); Storage's only write action is an unlabeled number input with placeholder "size" inside a cell (`app.js:2871`); theme control's checked segment measures 1.16:1 (Daylight) / 1.14:1 (dark) (`app.css:140-142`); five button looks, with rust meaning both "primary action" and "fix" (`.btn.primary` vs `.plaque`); one outlined pill for eleven tag meanings; "Stop sending" is a dim `.linkbtn` at the end of a sentence with no confirmation; Leave/Remove without objects (`design-critique §4.5, §5.2, §9.4, §9.5`; `ui-map §2.4`).
- Plaques are `<button>`s whose only visible effect is focusing a window (`app.js:477, 5715`); P1 presses one twice and concludes the page is broken (`walkthrough §2 step 1`).

### A8. Loading flash: Combat claims "No chat log found · missing" in red for the first seconds of every cold open. MINOR as a bug, MAJOR for the screenshot a newcomer takes (3/6)
- Verified here: `sessionHasLog()` is `!!(S.session && S.session.log) && …` (`app.js:728`), false while `S.session` is null; `noLog = !sessionHasLog() || …` is computed before `reading = !old && !noLog && …` (`app.js:1798-1800`), so until `/api/session` answers the `else if (noLog)` branch (`app.js:1811-1814`) sets the red stamp. Session guards the other way (`app.js:753`). Captured in `shots/combat-live-tall.png` and `critique-shots/combat-1440-dark.png` (footers "Chat log · reading…", margin "Checking your sources…", stamp red "missing") (`ui-map §2.2`; `design-critique §10`).
- Related: `?theme=light` is not a theme value (`app.js:70` accepts `dark|daylight|auto`); the task's `?theme=light` screenshots are dark (`design-critique` preamble, verified here).

### A9. Session is the landing tab and packs ten windows plus a raw chat feed. MINOR (3/6)
- `index.html:116-174`: At a glance, Here, Experience, XP by skill, Level-ups, Councils, Combat, Loot, What happened, Chat log; seven of ten below the fold at 1440 × 1400 (`ui-map §2.1`). The finding is the best sentence in the app and should be kept (`design-critique §3`, `§14`).

---

## 2. Problem B: "Combat is hard" (ranked), with the exact step count today

### 2.0 Step count to see party damage, as the product stands at `68f89da`

**Per player, before any sharing works (own meter)** (`combat-flow §1.1-1.3`; `research-pg §6`):

| # | Step | Where it is told | Can the app verify it? |
|---|---|---|---|
| 0 | Have VIP (every community README says combat lines need it; unverified) | nowhere in the app (`vip` verdict only says "Exports need VIP") | symptom only: log grows, zero `[Combat]` lines |
| 1 | In game: turn on **Save Chat Logs** (app says Settings → V.I.P.; evidence says Settings → GUI → Chat Logs, see §4) | fix string `app.js:255/278`, 11-20 times on the nolog page | yes: `LogChat` in `GorgonSettings.txt`, log file mtime |
| 2 | In game: Settings → V.I.P. → **Combat Logging**: seven "Log when…" rows not Off, "Log non-damaging abilities" on | a 29-40 word `info` note (`app.js:261`), grey, folded into "Also checked" unless the verdict lists the view | yes: `combatLog_*` (server reads them, `server.py:3046-3062`) |
| 3 | Log out and back in so a log file appears | only when the settings file already says on (`server.py:3326`; `app.js:5720`) | yes: file appears |
| 4 | Install and start Gorgon Notes (Windows: SmartScreen "More info → Run anyway") | README / Windows README only | n/a |
| 5 | Click **Combat** in the rail (the app opens on Session, `app.js:5780`) | nothing says "the meter is under Combat" | n/a |
| 6 | Land one hit; wait for the 2 s poll | "The meter starts with your first hit." | yes |

= **6 steps (7 with VIP), 3 of them in-game settings the app can only name.** Give-up points: P1 at step 1 or 2, P2 at step 2 (`walkthrough §7`).

**Path A, party code room** (`combat-flow §2A`; `index.html:213-240`):

| Who | # | Step |
|---|---|---|
| Leader | 7 | Scroll ~2,700 px under Fights and Breakdown to **Party** |
| Leader | 8 | Press **New code** (clipboard gets `gn-` + 12 chars) |
| Leader | 9 | Alt-tab to the game, paste into party chat |
| Each friend | 0-6 | The whole own-meter list on their machine |
| Each friend | 10 | Find the line in the game's chat, copy or retype it (copying from the in-game chat is unverified; the alphabet was chosen for retyping, `server.py:1658`) |
| Each friend | 11 | Open Gorgon Notes → Combat → scroll to Party |
| Each friend | 12 | Paste into the field (a whole chat line auto-joins, undiscoverable) or type + **Join** |
| Each friend | 13 | Wait ≤ 10 s; only the last three fights before the join clock are back-filled (`server.py:1698-1738, 2157-2158`) |
| Everyone | 14 | Read the session table / per-fight list; pick a Session in the dropdown |

= **9 steps for the leader, 11 for each friend**, through a window with 11 buttons, one field, one select, 5 tag chips, 2 toggles and ~35 distinct terms (`combat-flow §2.x`). The code never expires and nothing says whether to make a new one tomorrow (`walkthrough §6.7`).

**Path B, the everyone page** (`combat-flow §2B`): steps 0-6 per player, then 7. scroll to the Party window, 8. find the 13 px dim link in the "Every fight also goes to…" line (`app.js:1591-1596`), 9. open `https://gorgon-notes-room.rob-30c.workers.dev/everyone` in a browser, 10. find your run among every user's runs (Show / Player filter). = **zero configuration, three discovery steps, one URL nobody can remember**, and it only shows copies running the 29 Oct code: verified here, the feed's last 24 h hold Robchew (posting as `v0.10.0`, the git checkout) and Akriex (`v0.11.0`); Faechew v0.8.0, Woltlump v0.9.0 and Ragnaurok v0.10.0 (room members per `/api/party`) are absent.

**Path C, Discord** (`combat-flow §2C`): Connect Discord (needs Manage Webhooks in that server, unsaid in-app) → Discord's picker → back; then choose among three "Post … to Discord" buttons with three scopes plus "Copy for Discord"; N connected members → N posts of the same run (`docs/DISCORD.md` "Why it does not scale").

**Target the reports agree on** (`combat-flow §3.5`; `research-ux §5.2`; `design-critique §8.3`; `research-pg §5-6`): after the unavoidable in-game settings (1-2, verified live by a checklist), **zero app steps**: open the app → Combat is already showing → "Your party" appears by itself from the chat-log roster over the everyone feed → one button "Copy an invite line" for anyone not sharing → Discord as one opt-in with one "Post this run". Code room and paste box demoted or removed.

### B1. Two in-game settings are needed; the page shouts one and whispers the other; misconfiguration produces a confident, silent, empty meter. CRITICAL (5/6)
- `server.py:3464-3494` (verified here): `add("combat-logging", "ok" if ok else "info", …)`, so Combat Logging off or partial never colours the stamp, pill or favicon; the fix is `app.js:261`, shown only when the verdict's `views` lists `combat` (live today: `ok`, `views: []`). With Save Chat Logs on but categories Off, the page says "No fights today. The meter starts with your first hit." (`app.js:1893`) while the player is hitting things; `docs/DPS-FEASIBILITY.md:119` proposed a "no combat lines" diagnosis, not built (`walkthrough §6.1`; `combat-flow §1.5` severity note; `research-pg §0.5`).
- The check also gates on `VIP_CombatLogging == 1` (`server.py:3467, 3471-3479`), which is probably the section's collapsed/expanded flag (see §4), and treats level 1 as "reduced" (`3486-3490`) though the option name says it writes the file too (`research-pg §0.2-0.3`).

### B2. The group meter and the zero-setup answer are last on a four-screen page. CRITICAL (6/6)
- `renderCombatView` order (`app.js:1796-1878`; `index.html:189-242`): At a glance → Fights (31-35 open rows, 8 sortable numeric columns) → Breakdown (chart, bars, By enemy, four caveat paragraphs `app.js:2004-2009`) → Party at y ≈ 2,700-2,800 of 3,400-3,900 px (`shots/combat-1440.png`, `combat-dark-1440.png`; `ui-map §2.2`, `walkthrough §1, §6.3`, `design-critique §8.1`).
- The live "Fighting now in <area>: X 322/s" line (`app.js:1562`) and the session table (`1575-1587`) are inside Party; P3 scrolls three screens every evening; no pin/collapse/reorder (`walkthrough §4 glance 2`).
- The everyone page link is a `small dim` 13 px line at the end of the Party window (`app.js:1591-1596`); the page itself is the calmest, clearest surface in the product (`walk/everyone.png`; `walkthrough §1`, `design-critique §8.2.9, §14`).

### B3. Five sharing paths in one window, never reconciled in one sentence. MAJOR (5/6)
- Party code room, everyone page (Start/Stop sending), Discord per personal fight (Breakdown `index.html:208`), Discord per merged fight (`app.js:1521`), Discord per session (`app.js:1579`), Copy for Discord, paste-a-fight box: nine Discord affordances on one page (`design-critique §8.2.5`; `walkthrough §6.9`; `ui-map §2.2`).
- The not-joined copy sells the code (`app.js:1666`) directly under a line saying every fight already goes to a page "where anyone can see runs without a code" (`app.js:1596`); P2 asks "code or no code?" with ten minutes to the raid; P1 reads it as a privacy alarm and presses Stop sending (`walkthrough §2 step 5, §3 step 3, §6.6`).
- Paste-a-fight is dead code in the default build: hidden when `transport.kind === 'room'` (always, `ROOM_DEFAULT` `server.py:1667`) and posts carry no json block since 26 Oct (`combat-flow §2C`).

### B4. The code path itself: 11 buttons, a secret relayed through game chat, a join clock that hides earlier fights. MAJOR (4/6)
- See §2.0 Path A. Jackbox-style code where the game already supplies the group; ESO's LibGroupCombatStats model (the game's group is the channel) fits and the app already parses the roster (`research-ux §2.1-2.2, §5.1`). Honest limit: the chat log has **no shared party id** (party name defaults to "My Group" 57/78 times, joining prints no roster, `docs/DATA-SOURCES.md:62`, `server.py:1152-1176`), so the roster can only ever be a filter over the feed, never a room key (`combat-flow §3.3`).

### B5. The no-log state shows the Party window's live controls, including a rust "Connect Discord", over an empty body. MAJOR (4/6)
- `renderCombatView` returns at `app.js:1836` before `renderParty()` at `1877`; the toolbar controls in `index.html:215-231` stay visible: "gn-…", Join, New code, Connect Discord (`.btn.primary`) with nothing inside (`walk/combat-nolog.png`; `walkthrough §2 step 3, §6.5`; `ui-map §2.2`; `design-critique §8.2.2, §8.4`). It is the only red non-plaque button on the page; pressing it opens Discord and leaves "Waiting for Discord… (until hh:mm)" for ten minutes (`app.js:1625`, `server.py:2434`).

### B6. The finding is a paragraph; the live number cannot lead; no liveness cue. MAJOR (3/6)
- "691,141 damage in 31 fights today, 785 a second while fighting. Best: 3,479 a second at 23:57, over 18 s. Your pets did 27% of it. Died 5 times. Counted from 23:45 yesterday: …" (`app.js:1880-1900`): six facts and a footnote; wraps to five lines at 390 px. Nothing in the app is larger than 22 px by rule, so the per-second figure is the size of the h1 (`design-critique §8.2.3, §9.1, §11.3`). The only live signals are the "now" chip and the "Fighting now" wording (`§8.2.10`).

### B7. The health chrome cries wolf on a working meter. MAJOR (4/6)
- As A2, measured on Combat: a full meter under a red "2 missing" pill and two export plaques (`walk/combat-noexport.png`); on the empty meter three rust blocks, the one that matters (Save Chat Logs) in the margin's first note (`design-critique §8.4`; `walkthrough §1, §6.4`).

### B8. Fix instructions are menu paths, not steps, and the Save Chat Logs path is probably the wrong tab. MAJOR (4/6)
- `app.js:252-278`: "Settings → V.I.P. → Save Chat Logs", no "in the game window", no step numbers, no relog step (known conditionally at `server.py:3326`), no "then hit something", no picture; "Check again" is a no-op until the game acts (`walkthrough §6.11`; `research-ux §1.2, §2.2.4, §5.6`). Every meter that works (Warcraft Logs, PGCombatTracker) puts the exact path and a settings screenshot first.
- Tab location: see §4 and §6.1.

### B9. Sharing to a public feed starts at boot with no consent surface outside the Party window. MAJOR (2/6)
- `main()` runs `party_load()`/`party_thread()` (`server.py:5149-5150`); `everyone_tick` every 10 s with no code (`2129-2132`); `everyone_on()` is True when `settings.json` lacks `shareEveryone` (`1874-1876`, verified here). Each fight carries name, area, times, enemy ids and up to 12 party members' names (who may not use the app), kept 30 days; the Worker has no auth, any client may post any `who` (`worker.js:115-125`) (`combat-flow §1.2 step 6, §3.4`). Default-on was the user's explicit ask (`docs/SHARING.md` status 29 Oct). The only in-app notice is the dim Party line (`app.js:1589-1597`). Research: say it once, at the moment it matters, with the benefit, then fold (AirDrop/Hodor "Hide Me"; Apple HIG) (`research-ux §2.2.7, §5.2.5`).

### B10. Secondary Combat faults. MINOR (3/6)
- Breakdown ends in four caveat paragraphs (DoT attribution) under every fight (`crop-breakdown-notes.png`; `design-critique §8.2.4`). "Leave" and "Remove" side by side with no object (`§8.2.6`). Pet rows sort above their owner in the session table ("Smarmfire Wall · Woltlump's pet") (`walkthrough §6.15`). Tag chips ("same enemies", "same party", "only you so far", "without you", "pasted") have tooltips only (`app.js:1517-1520`). Nothing says every party member must run the app until after joining (`README.md:75`, `app.js:1604-1605`; `walkthrough §6.14`). The Mac app's ⌘2 opens Combat but the web UI never does; Combat polling only while `S.view === 'combat'` (`app.js:5789`) (`combat-flow §1.2 step 7`).

### B11. Only copies with the 29 Oct code post to the everyone feed; three of five friends are invisible there. MINOR today, blocking for a code-free design (2/6)
- Verified here (see §2.0 Path B). The Windows exe self-updates on start (`windows/README-WINDOWS.txt:17-19`), so the fix is "ask them to restart", but a design that drops the code must say who is missing and why.

---

## 3. Design-score baseline and what 7.5/10 requires

### 3.1 Baseline (`design-critique §12`, calibrated 10 = Linear issue view / Apple Health, 8 = Stripe home, 6 = competent internal tool, 4 = working POC; a generic-dashboard answer scores *lower* under the PRODUCT.md brand brief)

| Dimension | Score | One-line why |
|---|---|---|
| Visual hierarchy | 5 | one good finding, then 5-15 windows at one rank |
| Information density | 4 | 3.9-4.9 k px pages, 35-row tables open, footer on every window |
| Typography scale | 7 | five sizes, one face, tabular figures; capped at 22 px; 13 px dim carries too many roles |
| Spacing rhythm | 7 | 4 px grid honoured; ragged `grid2`, footer-after-every-window |
| Colour (healthy is quiet?) | 5 | healthy yes; warn no (9-20 repeats, rust shared by "action" and "fix") |
| Component consistency | 7 | one window family; five button looks, one pill for eleven meanings |
| Affordance | 5 | sort on hover, inline inputs, Leave/Remove, Stop sending, theme 1.16:1 |
| Empty states | 5 | copy 8, structure 3 |
| Copy length and tone | 7 | findings excellent; caveats are paragraphs |
| Scannability | 6 | panes scan; Combat and Statehelm do not; filters not sticky |
| Answers its question in 3 s | 6 | Session/Vendors/Storage yes; Combat no; Character wrong fact |
| First-run / onboarding | 2 | none |
| Brand brief | 8 | the strongest dimension |

**Overall 5.6/10 newcomer, 7/10 owner. Combat: 4/10 newcomer (hierarchy 4, density 3, affordance 4, empty state 4, copy 5, liveness 5), 7/10 owner.** `research-ux §6` scores by the leaders' own rules: meets no-tour, status everywhere, fix stated, voice, ledger density; misses a home, rail tiering, relevance-scoped health, one-fact-one-place, code-free party.

### 3.2 What 7.5 requires (the three moves, `design-critique §13`, with `research-ux §3-5` and `combat-flow §3.5` folded in)

1. **One first-run surface per view, and warn said once (+1.0).** When a source is missing, Session and Combat render one "Set up" window (ordered steps, live ticks from `/api/health`, the one plaque), hide the placeholder windows (the zero-day quiet rule already exists); filter pill, margin and plaques to the view's own sources (`items[].views` already exists); plaque only when the fix is possible now ("Not now" is already computed), else one dim line; amber mark once (stamp/pill), not on every label and footer. Files: `app.js` `viewItems`, `setFoot`, `ageMarkOf`, `srcFix` callers; `app.css:479-487`.
2. **Combat turned inside out (+0.8).** Finding = one figure ("785 a second today, 31 fights"); one 28-32 px readout size for the lead figure and the live DPS, with a reduced-motion-safe pulse; a Share / "Your party" window second (party table from the feed by roster, Everyone's page → Open as a real button, Discord → one Post, code folded under "More ways"); Fights shows 10 rows + "Show all"; Breakdown's caveats become one "How this is counted" disclosure; Leave/Remove get objects; loading branch fixed; Party controls hidden until a log exists; combat-logging severity raised on Combat. Files: `index.html:189-242`, `app.js:1591-1775, 1796-1900, 1893`, `server.py:3493`, DESIGN.md → Combat.
3. **Rank the navigation and the page (+0.6).** Rail in groups (Play: Session, Combat, Vendors, Storage / Reference: Character, Teleports, Statehelm; Files under About → "Inspect the files", which exists at `app.js:4884`), counts or tooltips on marks, phone bar four + More; each view keeps At a glance + primary open and folds the rest into a lower deck remembered in `pgdash.open`; Teleports/Statehelm one footer per view, current zone open; rename Session's Combat window. Files: `index.html:53-89`, `app.css:166-186, 218`, per-view renderers.
4. **Copy altitude (no score given, needed for P1):** gloss game terms once, retire server.py/PG_ROOM/ntfy.sh/webhook/json block from UI copy, numbered in-game steps with the verified tab and a settings picture.

Keep (`design-critique §14`): the finding sentence and voice, the khaki pane, slot strip, coin, centred primary title, one footer per window as provenance, the everyone page's calm, Daylight as a token twin, Carlito / five sizes / 75ch.

### 3.3 How a later phase can prove 7.5 (instrument, so the score is not an opinion)
Re-run `domstats.py` on the same three states and re-shoot the same views; targets: fix string ≤ 2 occurrences per page; zero export plaques on Combat/Teleports; Combat page ≤ 2 screens to the party table; Session nolog = 1 window; rail ≤ 5 primary items; phone bar ≤ 5; first-run Combat ≤ 1 primary button; steps-to-party-damage after in-game settings = 0; the 13-dimension table re-scored by the same rubric.

---

## 4. Facts verified about in-game settings and community tools

| Fact | Status | Evidence |
|---|---|---|
| `GorgonSettings.txt` line format is `i<TAB>key<TAB>default<TAB>value`; the server reads the last column (`server.py:3046-3062`) | **verified here** | file lines 287-288, 295, 1348-1349, 1359, 1386 |
| Live values on this Mac: `LogChat 1`, `GUI_ChatLogs 1`, `VIP_ChatLogs 0`, `VIP_CombatLogging 1`, all seven `combatLog_* 2`, `LogNonAttacks 1`, `AutoExportCharacterOnLogout 0` | **verified here** | same; `/api/health` `settings` agrees |
| Sibling keys `VIP_Benefits, VIP_BookMode, VIP_Reports, VIP_SpecialReports, GUI_Chat, GUI_Colors, GUI_Nameplates, GUI_Other, GUI_Sizing, GUI_TargetSelection, GUI_WindowsAndHud` exist and are 0/1 flags | **verified here** | file; supports (does not prove) the section-flag reading of `VIP_CombatLogging` |
| Save Chat Logs moved from the V.I.P. tab to **Settings → GUI → Chat Logs** on 14 Apr 2026 | high confidence, **not seen in game** | Steam news "Move Chat Log settings from VIP to GUI" (`dl/steamnews.json`); client string table has `GUI_ChatLogs`, `GUI_ChatLogs_Stored_Location`, no `VIP_ChatLogs`; glogger and GorgonSurveyTracker READMEs (post-April) say GUI, bottom; `GUI_ChatLogs 1` live (`research-pg §0.1, §3.1, §7`) |
| App copy says "Settings → V.I.P. → Save Chat Logs" in 19 places (`app.js:255, 256, 278, 796, 4885, 5720-5721`, README.md:70, DESIGN.md, everyone.html, server.py) after the user's 27 Oct decision (`docs/ROADMAP.md:18`); ROADMAP:19 keeps it open | **verified here** | grep; `docs/DPS-FEASIBILITY.md:73` records both positions |
| Combat Logging stays under **Settings → V.I.P.**; seven rows with exact labels and keys (`combatLog_MeAttackEnemy … EnemyIndirectlyDamaged`), "Log non-damaging abilities" = `LogNonAttacks`; hint "Remember to enable 'Save Chat Logs' above…" | verified (client strings + PGCT screenshots `dl/pgct-img/*.png` + user's 27 Oct screenshot) | `research-pg §3.1` |
| Each row's options are exactly "Off" / "Chat Window (and log file if enabled)" / "Log File Only (if enabled)" | verified (client strings) | `research-pg §0.2` |
| Mapping 0/1/2 and "level 1 also writes the file" | inferred, **unverified** | option names; `server.py:3486-3490` calls 1 "reduced" |
| `VIP_CombatLogging` is a section-collapse flag, not a switch | inferred, **unverified** | sibling pattern above; `server.py:3467` gates on it |
| VIP required for `[Combat]` lines | **unverified** | every tool README says so; client has `VIP_CombatLogging_NotVIP`; wiki VIP page lists only reports (`research-pg §3.2`) |
| A party member's hits never appear in your log; enemy `#id`s match across logs | verified 26 Oct (Akriex's log) | `docs/DPS-FEASIBILITY.md` q4 |
| No shared party id in the log; "My Group" default 57/78; join prints no roster | verified | `docs/DATA-SOURCES.md:62`, `server.py:1152-1176` (`combat-flow §3.3`) |
| No PG tool shows party damage; all read owner-only `[Combat]` lines; the autopsy is UI-only on every platform since the 21 Oct patch killed `Player.log` events; no glogger fork has DPS code | verified (GitHub API, glogger `docs/TODO.md:21-24`, code search) | `research-pg §0.4, §2, §3.3, §4` |
| Tool landscape: PGCombatTracker 6★ (last release Mar 2025), Kaeus browser tracker 0★ active (no pets, 25 s gap, open issue "baby spiders dont seem to count dps"), MultiTool 3★ Windows overlay (not resizable), glogger 7★ very active (v1.7.0 29 Oct) with a setup wizard and no meter | verified | `research-pg §2` |
| Complaints: pets uncounted, unresizable windows, folder pickers failing, tools breaking after patches, setup instructions with no or stale menu path | verified | `research-pg §2` |
| Halloween update sanctions log-reading overlays ("the first legal add ons"); auto-export now fires on area change with councils spent, raw favor, vendor reset times | verified (Steam news) | `research-pg §3.1, §3.4` |
| Chat log unchanged by the 21 Oct patch (6,965 `[Combat]` lines today) | verified | `research-pg §4` |
| Everyone feed: Worker routes `/everyone/fights|tick|live` as a room (`worker.js:62-66`), `after=` paging, no auth, 30-day retention, 20,000-row cap, single DO; page groups by overlap + roster + shared player | verified (code + live GET) | `combat-flow §2B, §3.2` |
| Feed members last 24 h: Robchew (`v0.10.0`, 131 rows), Akriex (`v0.11.0`, 109); room members Faechew v0.8.0, Woltlump v0.9.0, Ragnaurok v0.10.0 absent from the feed | **verified here** | GET `/everyone/fights`, `/api/party` |
| Server behind the live page is `v0.10.0` +5 commits, dirty; `v0.11.0` is tagged | **verified here** | `/api/health` `app` |
| Live health: `combat-logging` ok `views: []`; `chat-log` views `session, combat, statehelm, files`; `character-export` views `vendors, character, storage, statehelm, files`; `storage-export` views `storage, statehelm, vendors, files` | **verified here** | GET `/api/health` |
| Headless Chrome: `--virtual-time-budget` hangs on Combat (2 s poll) and on Vendors/Storage/Character/Files/Teleports/Statehelm (ResizeObserver loop, `app.js:2493-2496, 3097-3106`); `--window-size` cannot go under 500 px | verified by three reports | `ui-map §7`, `design-critique` preamble, `walkthrough` preamble; use `--timeout=6000` or CDP (`shoot.sh`) |

---

## 5. Technical levers for plug-and-play (what can be defaulted, auto-detected, removed)

| Lever | Kind | What exists today | What is missing | Cost | Source |
|---|---|---|---|---|---|
| Open on Combat when the game is running and `now.inFight` or the day has fights; else Session; else the setup window | default | `app.js:5780` boot; `/api/combat now`, `/api/health game` | the rule | tiny | `combat-flow §3.1`, `research-ux §4.1` |
| "Your party" table from the everyone feed, no code: point `room_poll` at `everyone/fights?after=&who=`, run `party_merge`/`party_sessions` with `since=None`, filter by the chat-log roster + area overlap | auto | Worker serves it (`worker.js:62-66, 142-153`); `party_merge` 2147, `party_sessions` 2236; roster parsed (`server.py:961-1000, 1152-1176`) | the URL switch, the filter, the UI | medium | `combat-flow §3.2`, `research-ux §5.1` |
| Live "Fighting now" without a code: post to `/everyone/tick`, show ticks whose `area` = mine and `who` in roster or current merged fight | auto | `/everyone/tick|live` exist; `party_live_tick` 2081-2113 | scoping rule | small | `combat-flow §3.2.2` |
| Per-name sharing status ("sharing · 46,310" / "not running Gorgon Notes") from feed `members` + roster; one "Copy an invite line" button | auto + one button | feed returns `members`; roster line exists (`app.js:1599-1606`) | the status row and the invite text | small | `research-ux §2.2.5, §5.2.4` |
| Live setup checklist: Save Chat Logs (`LogChat`, file mtime growing), Combat Logging (every `combatLog_* > 0`, `LogNonAttacks`), "combat lines seen today" (count), exports | auto-detect | `read_settings` 3046; health verdicts; `[Status] Saved report to` detection | a "chat log grows, zero `[Combat]` lines today" verdict (DPS-FEASIBILITY:119); severity `warn`/`bad` on Combat instead of `info` (`server.py:3493`); base the check on `combatLog_*` not `VIP_CombatLogging`; accept level 1 pending verification | small | `walkthrough §6.1`, `research-pg §5.1, §6`, `research-ux §4.2` |
| VIP symptom: log grows, zero `[Combat]` lines all session → say "the game writes combat lines for VIP accounts" | auto-detect | nothing | the verdict | small | `research-pg §6.1` |
| Scope pill/margin/plaques to the view's sources | default | `items[].views` per verdict (live, verified) | change `viewItems` (`app.js:440-447`) | tiny | all reports |
| Plaque only when the fix is possible now; else one dim line | default | "Not now" / logged-out wording already computed (`app.js:249-270`) | the rule | small | `design-critique §9.3` |
| Loading branch before no-log branch | fix | `app.js:1798-1800` | reorder | tiny | `ui-map §2.2` |
| Hide the Party window / Connect Discord until a log and a first fight exist; never style Connect Discord as primary on an empty meter | default | `renderCombatView` returns early (`app.js:1836`) | hide the toolbar too | tiny | `walkthrough §6.5` |
| Remove from the default UI: paste box + Add/Cancel (dead code), New code / Join / Copy code / Leave (keep under "More ways" or drop), two of the three Post buttons, Copy for Discord as secondary, the duplicate theme control, "server.py" wording (27 occurrences), ntfy.sh / `PG_ROOM` / webhook / json block strings | remove | all in `index.html:189-242`, `app.js:1376-1785` | editing | small | `combat-flow §2C, §3.5`, `walkthrough §6.8-6.9`, `design-critique §2.4` |
| Discord: one opt-in (Connect) + one "Post this run" on the session table; a "posted by X" note so friends do not post duplicates | default | connect flow built and good; posting per copy | the note needs room-side state (option C deferred) | medium | `combat-flow §2C`, `walkthrough §6.9` |
| First-use disclosure for the public feed: one line, once, with the benefit and Stop; then fold to the footer | default | `everyoneLine` (`app.js:1589-1597`) | the once-rule and placement at the top of Combat | small | `combat-flow §3.5.1`, `research-ux §5.2.5` |
| Ambiguity edit "Also here: X — in your party? Yes / No" stored in the everyone DO, applied before grouping (the ROADMAP's planned edit store) | new | design sketch in `docs/SHARING.md`; `docs/ROADMAP.md` next step | the DO endpoint and the chip | medium | `combat-flow §3.5.6` |
| Friends' copies: the Windows exe self-updates at start | existing | `windows/README-WINDOWS.txt:17-19` | tell them to restart; show who is missing | none | `combat-flow §3.6` |
| Rail groups / lower deck / sticky filters / one footer per view / 28-32 px readout size | design | `pgdash.open` exists; `.ctabs` exists hidden | CSS + markup | medium | `design-critique §13` |
| Mac app HUD panel (`NSPanel`, polls `/api/combat/live`) | later | planned in `docs/DPS-FEASIBILITY.md:123` | everything; full-screen behaviour unverified | large | `research-pg §5` |

**Cannot be removed by any client-side design:** a friend who does not run the app never gets numbers (only a name); VIP (if it is required); Discord's Manage Webhooks; a true party key from the log (filter only); identity is a character name with no auth (impersonation possible; the planned edits inherit this) (`combat-flow §3.3-3.4`; `research-pg §6`). **Scale caveat:** the everyone DO is one object; every fighting copy ticking every 2 s lands on it; Worker free plan 100k requests/day; unmeasured (`combat-flow §3.6`).

---

## 6. Contradictions between reports (and how I read them)

1. **Where Save Chat Logs lives.** `research-pg` (§0.1, §7): Settings → GUI → Chat Logs, high confidence, four independent pieces of evidence plus `GUI_ChatLogs 1` live. `combat-flow §1.1`, `walkthrough §5`, `ui-map §2.1`: quote the app's "Settings → V.I.P. → Save Chat Logs" as the verified path (it is the user's 27 Oct decision, `ROADMAP:18`, made from a screenshot of the *Combat Logging* section whose hint says "above", a sentence written for the pre-April layout). `research-ux §1.2, §2.2.4, §5.6`: says the UI *currently* shows "Settings → GUI → Log All Chat"; that is a 23-26 Oct screenshot (`combat-nolog-1440-dark.png`), stale since 27 Oct (verified here: live copy says V.I.P.). Reading: the evidence favours GUI → Chat Logs for Save Chat Logs and V.I.P. → Combat Logging for the rows; the app has them both under V.I.P.; one in-game look closes it (ROADMAP:19 is already open). Nothing should ship a settings screenshot or numbered steps before that look.
2. **Session window count.** 10 (`ui-map §2.1`, `design-critique §3.1`, verified here `index.html:116-174`) vs "eleven" (`walkthrough §1, §6.4`). The walkthrough overcounts by one; the nolog Session renders 9 placeholder windows (At a glance hidden).
3. **Where the Party window starts.** ~1,600 px (`ui-map §2.2`, Fights ends at row 27 → "Party around 2,300-2,500"), ~2,700 of 3,378 (`walkthrough §1`), ≈2,780 of 3,908 (`design-critique §8.1`). Different captures (29-35 rows, dark vs Daylight). No disagreement in substance: three screens down.
4. **Which copies post to the everyone feed.** `combat-flow §2B` says v0.11.0+ only; verified here the owner's copy posts as `v0.10.0` (git checkout +5 commits, which carries the 29 Oct code) and Akriex as `v0.11.0`; `/api/party` still lists Akriex at v0.10.0 from an older `lastSeen`. Rule: copies carrying the 29 Oct `everyone_*` code; the tag is a proxy.
5. **Level 1 of Combat Logging.** `combat-flow §1.1` repeats the app: "only 2 is verified to write damage numbers"; `research-pg §0.2` infers level 1 also writes the file from the option names. Both say unverified. Phase 2 should accept `> 0` provisionally and verify by flipping one row.
6. **Landing surface.** `research-ux §1.8, §3` proposes a fixed home of 4 tiles (Stripe) *and* §4.1 "land on real data, no welcome"; `design-critique §10, §13` and `walkthrough §6.2` propose landing on Combat (or the one-window setup) with no home. Tension: a tile home adds a level; Nielsen's two-level limit and LukeW favour landing on a view. User decision (§7.3).
7. **Rail grouping.** `design-critique §2.1` two visible groups (Play / Reference, Files under About); `research-ux §4.3` four visible + a dimmer "More" (Character, Files, Teleports, Statehelm, Settings); `walkthrough §6.2` "Tonight" (Combat, Session) + "Your character". All demote Files; they differ on whether Character/Teleports/Statehelm stay visible. User decision (§7.5).
8. **Keep or remove the party code.** `combat-flow §3.5.4` "advanced or drop"; `research-ux §5.4` keep as "Private room"; `design-critique §8.2.1` fold under "More ways to share"; `research-pg §5.3` "advanced path". All demote; only privacy argues for keeping it (`combat-flow §3.2`). User decision (§7.2).
9. **Counting the repetition on the nolog page.** 11 (`ui-map §2.1`, DOM: footers + plaque + margin + finding), 12 (`walkthrough §1`), ~20 (`design-critique §10`, including marks and pill). Different units; all "far too many".
10. **Severity of the loading flash.** `ui-map` calls it the state a newcomer is most likely to screenshot (major); `design-critique §10` lists it minor. Both agree on cause and fix.
11. **Brand vs leaders.** `research-ux` benchmarks Stripe/Linear/Grafana; `design-critique` warns that a generic-dashboard answer scores *lower* under PRODUCT.md ("a window Elder Game shipped"). Not a contradiction in findings, but phase 2 must take the leaders' *rules* (one question, one place per fact, two levels) and not their *looks*.
12. **Combat empty-state line.** `combat-flow §1.3` cites `app.js:1871` and `design-critique`/`walkthrough` cite `:1893` for "No fights today…"; both exist (window empty line vs finding). Trivial.
13. **`?theme=light`.** The task text uses it; `app.js:70` ignores it (verified). Use `?theme=daylight`.

---

## 7. What is MISSING

### 7.1 Claims still unverified (ranked by how much the design depends on them)
1. The tab and exact label of Save Chat Logs in today's client (GUI → Chat Logs vs V.I.P.). Blocks every fix string, the checklist and any settings picture (CLAUDE.md: never state game UI from memory).
2. Whether `combatLog_* == 1` ("Chat Window (and log file if enabled)") writes the file. Decides the checklist rule and the "reduced" warning.
3. Whether `VIP_CombatLogging` is a section flag (collapse the section in game, re-read the file). Decides whether the health check misreports "off".
4. Whether a non-VIP account writes `[Combat]` lines (ask one non-VIP friend). Decides step 0 and the grandmother's eligibility.
5. Whether text can be copied from the in-game chat window (moot if codes go).
6. Whether the friends' exes have updated (Faechew v0.8.0, Woltlump v0.9.0, Ragnaurok v0.10.0) and whether a self-update is enough.
7. Whether the roster-filter merge is right for a real five-player evening (only a two-log check exists, 26 Oct) and how often two parties share a cave.
8. Worker load with `/everyone/tick` from many fighters (single DO, 2 s ticks, 100k req/day free plan).
9. Whether a forwarded Discord post shows the code-block table (`ROADMAP` open).
10. Phone rendering at a true 390 px (headless min 500; only the critique used CDP emulation).
11. That the Windows exe opens on Session (asserted from the Windows README, not run).
12. Accessibility: no audit run; marks and the theme control's checked state are the known non-text failures (`design-critique §9.6`).
13. No real newcomer was observed; P1/P2 are inferred personas. The 5.6 / 4 scores are one critic's calibration.

### 7.2 Angles not researched
- The everyone page as the *in-app* party section (it is the clearest surface; nobody designed how its run cards would live inside Combat or on a phone).
- The "I was not in this group" / "in your party? Yes / No" edit UX (only a storage sketch in `docs/SHARING.md`).
- Reading older logs on start ("fights fought while closed" for more than a day; `ROADMAP` open) and its effect on the "nothing to do" promise.
- A merged "Tonight" view (Session + Combat) raised by `walkthrough §6.2`; not explored.
- The Reminders/notification model for a newcomer beyond `ui-map §1.6` (10 topics is its own overwhelm).
- The Mac menu-bar app and a HUD overlay as the live surface (`DPS-FEASIBILITY:123`; MultiTool precedent; full-screen behaviour unknown).
- Windows first-run end to end (SmartScreen, first paint time, where the window opens).
- Visual benchmarks: no screenshots of Details!, Hodor Reflexes, FFLogs live view or PGCombatTracker's UI were examined, only text.
- Privacy copy and retention policy wording for the public feed (names of non-users in rosters); `combat-flow §3.4` raises it, no copy proposed.
- Heal meter, time markers, ability icons, Recovered lines (`research-pg §5` feature gaps; out of scope for UX but cheap).
- Vendors reading the new auto-export fields (councils spent, reset times) (`research-pg §7`).
- Daylight-specific first-run checks (plaque loudness is measured; the setup window is not designed in Daylight).

### 7.3 Questions only the user can answer
1. In game, now: which tab holds "Save Chat Logs" and what is its exact label? Does collapsing the Combat Logging section flip `VIP_CombatLogging` in the file? Does setting one "Log when…" row to the chat-window option still write damage lines to the file?
2. Party code: remove it, or keep it as a "Private room" under a disclosure? Is privacy from the public feed something you or your friends want?
3. Public sharing default-on: keep it, with a one-time disclosure line on Combat? What should it say about party members' names?
4. Landing: open on Combat when fighting (else Session), a one-window setup when nothing is set up, or a home/overview of four tiles?
5. Rail: which views are daily for you and your friends? Files under About? Character, Teleports, Statehelm visible or under "More"?
6. Can you provide a current screenshot of the game's Settings → GUI and Settings → V.I.P. tabs so the setup window can show the picture (CLAUDE.md forbids stating game UI from memory)?
7. Discord: one "Post this run" button only? When four members are connected, who posts, or should the room mark a run "posted by X"?
8. Will you ask Faechew, Woltlump and Ragnaurok to restart (self-update), and one non-VIP friend to check for `[Combat]` lines?
9. Is an amber pill acceptable when Combat Logging rows are off (today it is grey `info`)?
10. Who is the grandmother, precisely: VIP or not, solo or in your party, Mac or Windows? (If solo, only the own-meter path matters; if non-VIP, the whole plan depends on §7.1.4.)
11. Do you accept one readout size above the game's 22 px cap for the live DPS figure (brand-brief exception)?
12. Is the Mac HUD overlay in scope this round, or web UI only?
13. Should the Combat view be renamed (e.g. "Damage") so the word a newcomer was told appears in the rail?

---

## Evidence index
- Reports: `/private/tmp/claude-501/-Users-robaxelsen-code-pg-dashboard/0a11d999-236b-4403-b26b-d404137d8e36/scratchpad/phase1/{ui-map,combat-flow,design-critique,walkthrough,research-ux,research-pg}.md`
- DOM dumps and counts: `scratchpad/phase1/dom/*.html`, `scratchpad/phase1/domstats.txt` (`domstats.py`)
- Screenshots: `scratchpad/phase1/shots/*.png` (1440 live/noexport/nolog, two `-tall` first-paint captures), `scratchpad/critique-shots/*-1440.png`, `*-390.png`, `crop-*.png`, `scratchpad/walk/{combat,combat-nolog,combat-noexport,session,session-nolog,everyone}.png`, repo `design/screenshots/*.png` (23-27 Oct, some with the pre-27-Oct "GUI → Log All Chat" wording)
- Downloads: `scratchpad/phase1/dl/` (Steam news JSON, PGCombatTracker settings screenshots `pgct-img/savechatlogs.png`, `pgct-img/combatlogging.png`, Kaeus page)
- Live checks this pass (GET only): `/api/health`, `/api/party`, `https://gorgon-notes-room.rob-30c.workers.dev/everyone/fights`; `~/Library/Application Support/unity.Elder Game.Project Gorgon/GorgonSettings.txt` (read-only)
