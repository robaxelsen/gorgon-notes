# Cognitive walkthrough: three first-time (or glancing) users of Gorgon Notes

Date 2026-10-30. Method: cognitive walkthrough (Wharton/Polson): for every step ask (1) will the user know what to do, (2) will they see the control, (3) will they connect the control with the goal, (4) will they understand the feedback. The copy quoted below is the real copy in `static/index.html`, `static/app.js`, `server.py` and `cloud/src/everyone.html`, read at the commit `68f89da` (v0.11.0), not paraphrased from memory. Screenshots: `design/screenshots/*.png` (23-27 Oct, some carry the old "Settings → GUI → Log All Chat" wording that was replaced on 27 Oct), the fresh full-page `scratchpad/shots/combat-1440.png` and `session-1440.png` (00:49 today), and my own `scratchpad/walk/combat-nolog.png` (`?sim=nolog#combat`, 00:53 today) plus `walk/combat-noexport.png`, `walk/session-nolog.png`, `walk/combat.png`, `walk/session.png`, `walk/everyone.png` (taken during this walkthrough; the first batch hung because headless Chrome never finished the `--virtual-time-budget` run against the page's 2 s polling, the retry used a `--timeout` per shot).

The three personas:

- **P1, the grandmother.** Never saw the app. The game is open. She was told "open this and it shows your damage". No idea what a chat log, an export, Discord or a webhook is. Reads English well, reads screens slowly, does what a page literally tells her and nothing more. Will not open a menu in the game she has never opened.
- **P2, the Windows friend.** Downloaded `GorgonNotes.exe` from the release page tonight. Plays PG, has VIP, uses Discord daily. Wants one thing: compare damage with the party tonight. Has used glogger-style meters before. Patience: ten minutes before the raid.
- **P3, the owner on day 30.** Knows every window. Glances at the page on a second screen between fights. Wants: how did that fight go, how are we doing, post the run to Discord when it ends. Patience: two seconds per glance.

What they all meet first is the same page, so section 1 maps the first screen once; sections 2 to 4 walk each persona; section 5 is the jargon inventory; section 6 the ranked pain points; section 7 the give-up points per persona.

---

## 1. What every newcomer sees on first open (shared facts)

**The page opens on Session, not on Combat.** `static/app.js:5779-5780`: the start view is the URL hash, else `localStorage pgdash.tab`, else `'session'`. Nobody told P1 or P2 to add `#combat` to the URL. The Windows exe opens its WebView2 window on the root URL (`windows/README-WINDOWS.txt` "The Gorgon Notes window opens"), so P2 lands on Session too.

**The first screen (Session, with a chat log; `scratchpad/shots/session-1440.png`)**, top to bottom:
1. Header (`index.html:26-50`): brand "Gorgon Notes · fan-made, not affiliated with Elder Game", a character dropdown ("Robchew"), a location ("Beneath Ilmari (logged in)"), a health pill ("⚠ 2 to do", `app.js:449-459` `headerLine`: "N missing · N broken · N to do · N notes" or "All sources recent"), an Auto/Dark/Daylight segmented control, and "Reminders".
2. Title row (`index.html:93-103`): H1 "Session", a one-line finding ("4,534,668 XP in 49 min, mostly Animal Handling. No level-ups yet. Died 4 times, last killed by Aktaari Royal Guard."), a stamp "Live from today's chat log · last line 00:48", a "Check again" button.
3. Eleven windows on Session alone (`index.html:116-184`): At a glance, Here, Experience (with a chart), XP by skill, Level-ups, Councils, Combat (deaths/kills only), Loot (with a search box), What happened, Chat log (with 12 channel chips and a scrolling feed).
4. A right-hand margin "Where these numbers come from" (`index.html:514-522`) listing every data source with a coloured shape, an age, evidence prose and red "plaque" buttons (`app.js:470-485` `noteHtml`): "Export Character JSON / In game: VIP menu, while fully logged in", "Export Storage JSON / In game: VIP menu", each with a "Not now" link, then "Also checked: game state (logged in), partial exports (2 d), logout export setting, vault sizes, alts, combat logging, live game events, VIP, game data (v490), party sharing" and "Checked 00:48 · by the server".
5. A rail on the right edge (`index.html:53-89`) with eight icons and one-word labels: Session, Combat, Vendors, Storage, Character, Files, Teleports, Statehelm; "fan-made / About" at the bottom. Red and amber dots on several icons (`app.js:596-600`).

**What is not on that screen:** no sentence saying what the app is for, no "start here", no hint that Combat is the damage meter, no ordering of the eight views by importance, no distinction between the three views a newcomer needs (Combat, maybe Session) and the five they do not (Vendors, Storage, Character, Files, Teleports, Statehelm). The rail labels are nouns from the game, not jobs ("Combat" could as well be a combat log reader). The About dialog (`app.js:4877-4893`) says "Gorgon Notes is fan-made, not affiliated with Elder Game. It reads the files the game already writes on this computer." and then lists file paths and a CDN version: it is a provenance panel, not a welcome.

**With no chat log (`walk/combat-nolog.png`, `design/screenshots/session-nolog-1440-dark.png`):** eleven windows each saying "Needs the chat log." (`app.js:766, 981, 1060, 1152, 1827`), eleven footers each saying "Chat log · ✖ missing · Settings → V.I.P. → Save Chat Logs", the finding "No chat log to read, so there's nothing to measure. Turn on chat logging and the meter starts with your first hit." (`app.js:1813`), the pill "✖ 1 missing · 2 to do", a red dot on five rail icons, and the margin's red plaque "Save Chat Logs / In game: Settings → V.I.P. → Save Chat Logs" (`app.js:277`). The fix is correct and repeated twelve times; it is the only thing the page says, in twelve places, with no step numbers, no picture of the game's Settings window, and no sentence about **why** ("the meter reads the game's chat log file"). The margin still shows two amber "Export … JSON" plaques of equal visual weight beside it, so the one thing to do is one of three red/amber boxes.

**With no exports but a working meter (`walk/combat-noexport.png`, `?sim=noexport#combat`):** the finding reads "691,141 damage in 31 fights today, 785 a second while fighting…", the At a glance row and the Fights table are full, and the header pill says "✖ 2 missing" in red, with two red plaques in the margin ("Character export · missing / No character export for Robchew yet. / Export Character JSON", "Storage export · missing / Export Storage JSON"). The margin ranks exports as *missing* (severity bad, `app.js:323` and `:400`) and lists every bad item on every view (`app.js:437-440`), so the first evening of a user who came only for the damage meter, and whose meter works perfectly, is spent under a red "2 missing" verdict about files the meter does not use. This is P2's actual first night.

**The everyone's fights page (`walk/everyone.png`, `cloud/src/everyone.html`):** "192 fights from 2 players in the last 24 hours, grouped into 12 runs. Last fight received just now." Then one card per run: "Povus Caves · 29 Oct 19:32 to 20:06 (34 min 10 s)", "34 fights · 20 min 6 s fighting · 6,529,211 damage · 26 kills", a Player / Health / Armor / Damage / Per second / Share / Kills table with a share bar under each name, pets labelled "· Robchew's pet", a "▸ 34 fights in this run" foldout, a footer naming the players and "last fight received 3 h ago". No code, no settings, no fixes, no margin. It is the simplest and most legible surface in the whole product and it is reachable only through a 12 px dim link at the bottom of the fourth window of the second tab.

**The Combat page with data (`scratchpad/shots/combat-1440.png`, 1440×3378 px, about four screens tall):** At a glance (5 figures), Fights (a 29-row table, 9 columns), Breakdown (a chart, By ability bars, What hit you, By enemy table, three paragraphs of dim caveats), then **Party** at the very bottom (code field, Join, Copy code, Leave, "Change channel", "Remove", the everyone's-fights line, a session table, a Session dropdown, a red "Post session to Discord", then ten fight blocks with bars, then "Show 144 fights nobody else was in"). The thing the user's brief calls "one website to see all players' damage meters" is the fourth window, 2,700 px down, under three windows of personal numbers.

---

## 2. Persona 1: the grandmother

Goal she was given: "open this and it shows your damage". Game is open. Assume the owner installed it on her Mac and opened `http://127.0.0.1:8787` (or the menu-bar app) for her; she has never touched the game's settings. Two sub-cases: (a) chat logging already on (the owner set it up), (b) not on (the realistic case: `?sim=nolog`).

### Step 1: first open
- **Sees:** the Session page (section 1). In case (b): "Session" / "No chat log to read, so there's no session to show. Turn on chat logging and this fills in as you play." (`app.js:755`), eleven grey boxes saying "Needs the chat log.", a red pill "1 missing · 2 to do", a column of red and amber boxes on the right, eight icons on the far right.
- **Expected to do:** click "Combat" in the rail.
- **Does the page tell her?** No. Nothing says "your damage is under Combat". The word "damage" appears nowhere on Session (the Session "Combat" mini-window shows deaths and kills: `app.js:1053-1090`, "No deaths or kills today").
- **Jargon met:** "Session", "chat log", "Councils", "XP by skill", "Level-ups", "export", "VIP menu", "JSON", "Statehelm", "Teleports", "fan-made, not affiliated with Elder Game", "Check again", "Reminders", "Auto / Dark / Daylight".
- **Likely action:** reads the big red boxes first because they are red. "Export Character JSON / In game: VIP menu, while fully logged in" (`app.js:272`). She does not know what the VIP menu is or what JSON is. The plaque is a `<button>` (`app.js:477`) and looks like one; pressing it does nothing visible beyond focusing the window it names (`app.js:5715`), so she presses it twice and concludes the page is broken.
- **Give-up risk:** high. The only reason she continues is that the rail icon with crossed swords and the word "Combat" is the one word that matches what she was told. (In case (b) that icon also carries a red dot, which reads as "broken", not "go here".)

### Step 2: deciding what to click
- **Sees:** eight equal icons. "Combat" is second. No ordering, no description on hover (the `<a class="ri">` elements have no `title`, `index.html:59-62`).
- **Expected:** click Combat. Fifty-fifty she clicks "Character" instead ("it's about my character"), landing on "No character export for Robchew yet, so there are no skills, currencies or favor to show. Export once and this fills in." (`app.js:3242`), which sends her into the export maze.
- **Tells her?** No.

### Step 3: finding the combat meter
- **Sees (case a, `shots/combat-1440.png`):** "Combat / 688,898 damage in 29 fights today, 801 a second while fighting. Best: 3,479 a second at 23:57, over 18 s. Your pets did 27% of it. Died 5 times." Then At a glance: "Per second, last fight 721/s", "Damage 688,898", "Fights 29", "Kills 1", "Damage taken 10,230". Then a 29-row table. This step works for her **if the chat log was already on**: the finding is one plain English sentence and the big figure is labelled. She has achieved "it shows your damage". Good.
- **Sees (case b, `walk/combat-nolog.png`):** "Combat / No chat log to read, so there's nothing to measure. Turn on chat logging and the meter starts with your first hit." Two boxes "Needs the chat log." with footers "Settings → V.I.P. → Save Chat Logs". And a third box, **Party**, showing a text field "gn-…", "Join", "New code", and a red "Connect Discord" button, with an empty body (`renderCombatView` returns at `app.js:1836` before `renderParty()` at `1877`, so the window's body `#d-party` is never filled in the no-log state; the controls in `index.html:215-231` are visible by default). The only red button on the page that is not a fix plaque is "Connect Discord".
- **Expected:** read the fix, go into the game, open Settings, find the V.I.P. tab, turn on Save Chat Logs.
- **Tells her?** It names the path. It does not say: that this is a setting *inside the game window*, that "V.I.P." is a tab in the game's Settings, that she may have to log out and in for the file to appear (the server knows this: `server.py:3326` adds "No log file has appeared yet: log out and back in, then check again." only when the settings file says LogChat is on), or that nothing on this page will change until her first hit after that. There is no "I did it, what now?" moment: the page re-polls every 2 s (`app.js:1364` `combatRound`) and the finding will silently switch; she will not know to wait or to press "Check again".
- **Jargon:** "chat log", "V.I.P.", "Save Chat Logs", "meter", "first hit", "gn-…", "Join", "New code", "Connect Discord", "Copy for Discord", "Post fight to Discord", "Breakdown", "This login".
- **Give-up:** very high in case (b). She does not know what a chat log is, the sentence "there's nothing to measure" reads as a verdict, and the red "Connect Discord" button is the most clickable thing on the page.

### Step 4: getting data flowing (in-game setup)
- **Sees:** nothing in the app helps beyond the path string. The README (`README.md:67-71`) has the same path plus "VIP auto-export"; she will never see the README.
- **Expected:** in the game: Settings → V.I.P. → Save Chat Logs. Then fight something. Then (she does not know this) also check **Combat Logging** levels. `server.py:3480-3494`: the meter is only verified to write damage numbers when `VIP_CombatLogging` is 1 and every `combatLog_*` category is 2 ("Log File"); when any is below, the margin shows an *info* (grey) item "Combat logging" with the fix text (`app.js:261`) "Settings → V.I.P. → Combat Logging: every "Log when…" row on a Log File option, Log non-damaging abilities on, and Save Chat Logs on. The meter needs every category." That is a 29-word instruction with three sub-settings, shown as a grey "note" (severity info, `server.py:3493`), folded into "Also checked: … combat logging" unless the view is listed. If her Combat Logging rows are on "Off" or "Chat Only", Save Chat Logs alone gives her a chat log with **no damage lines**: the finding becomes "No fights today. The meter starts with your first hit." (`app.js:1893`) while she is hitting things. Nothing on the page then says "your log has no [Combat] lines; the Combat Logging rows are the reason" (DPS-FEASIBILITY.md:119 proposes exactly that fix line; it is not built).
- **Tells her?** Half. The one-setting case is named twelve times; the two-setting reality is a grey note she will not find.
- **Jargon:** "Log when…", "Log File option", "Log non-damaging abilities", "category", "VIP".
- **Give-up:** certain if Combat Logging is not already at Log File. She did the one thing the page said, the page still says "No fights today", and the page is confident it is right.

### Step 5: seeing the party together
- Not her goal ("it shows your damage"), but she scrolls past the Breakdown and hits the Party window. Case (a) copy (`app.js:1666`): "Share fights with your party. One of you presses New code and pastes it into party chat; the others paste the code here (the whole chat line is fine) and press Join. Your last three fights and every one that closes from then on are shared, and everyone's shows up here side by side." Footer (`app.js:1667`): "Party room · not joined · Press New code, or paste a code from party chat. Fight numbers and character names go to the party room; anyone with the code can read them". Above it (`app.js:1596`): "Every fight also goes to the everyone's fights page, where anyone can see runs without a code · 127 fights sent today. Stop sending".
- **Expected:** nothing; but she reads "anyone with the code can read them" and "Every fight also goes to the everyone's fights page, where anyone can see" as a privacy alarm, with "Stop sending" as the safe-looking link. She presses Stop sending. System line: "Your fights stay off everyone's fights page until you press Start sending." (`app.js:1775`). She has now turned off the feature the owner built for the group.
- **Tells her?** It tells her what the mechanism is, not what it is for or whether she needs it. "party chat", "party room", "everyone's fights page", "code", "runs" are all undefined.
- **Give-up:** she stops here either way.

### Step 6: sharing with Discord
- **Sees:** "Connect Discord" (red, `index.html:227`, state line `app.js:1629` "Opens Discord in your browser to pick a server and a channel; Post to Discord then goes there") and on the Breakdown "Copy for Discord" / "Post fight to Discord" (`index.html:208`).
- **Expected:** nothing; she has no Discord. If she presses Connect Discord, a browser tab opens Discord's login page; the state line reads "Waiting for Discord: pick a server and a channel in your browser (until 01:05)" (`app.js:1625`) for ten minutes, then "Nothing came back from Discord in 10 minutes. Press Connect Discord again." (`server.py:2434`) as an [Error].
- **Give-up:** she closes the Discord tab and the app now shows an error she caused by pressing the reddest button.

**P1 verdict:** succeeds only if someone else set up the game's two logging settings in advance and she was told the word "Combat". Otherwise she gives up at step 3 or 4. Nothing on the page is written for her; everything is written for someone who already knows what a chat log, an export and a party code are.

---

## 3. Persona 2: the Windows friend, tonight

### Step 1: first open
- **Sees:** the Windows SmartScreen prompt (`README.md:34`, documented, fine), then a window titled Gorgon Notes on Session. Possibly the first-run states: no exports and no chat log at once, because he has never pressed either in-game control. Then: pill "2 missing · 1 to do", eleven "Needs the chat log." boxes, the margin with three plaques (Save Chat Logs, Export Character JSON, Export Storage JSON) of equal weight, "Location not known without a chat log" in the header (`app.js:5504`).
- **Expected:** go to Combat.
- **Tells him?** No. But he knows what a DPS meter is and "Combat" is a reasonable guess. He also knows what a chat log is (glogger needed one), so the fix reads fine to him. He is annoyed that two export plaques shout at him for features he did not come for: the first impression is "this app wants three things from me before it works".
- **Jargon:** fine for him except "Statehelm" and "Teleports" (he knows the words from the game but not what the views do).

### Step 2: finding the meter and getting data flowing
- **Sees:** `walk/combat-nolog.png`. Fix "Settings → V.I.P. → Save Chat Logs". He does it, logs out and in (he has done this for glogger), fights a mob.
- **Does the page tell him the second setting?** Only as the grey "Combat logging" info note, and only if his `GorgonSettings.txt` is readable and the categories are below 2; then the fix text (`app.js:261`) is the 29-word sentence. If he has glogger history, his categories are likely already at Log File and this works. If not, he gets "No fights today. The meter starts with your first hit." while fighting and no explanation. Fifty-fifty.
- **Feedback once it works:** the finding switches to "Fighting now: 229 damage a second over 7 s against Skeleton Assassin" (`app.js:1884`). Good: this is the glogger moment and it reads well.
- **Give-up:** medium. He has the mental model; the page does not help him but does not block him either.

### Step 3: seeing the party together (the actual goal)
- **Sees:** he scrolls past At a glance, the Fights table and the Breakdown (with its "By enemy" table and three caveat paragraphs: "Damage over time (16,151) is every tick on an enemy after you or a pet first hit it, from your log; the game doesn't name a tick's source, so a party member's DoT on the same enemy is in it too." `shots/combat-1440.png`) to Party. He reads (`app.js:1666`): "One of you presses New code and pastes it into party chat; the others paste the code here (the whole chat line is fine) and press Join."
- **Expected:** press New code, paste the code into the game's party chat; or wait for the owner's code and paste it. Also: every party member must be running Gorgon Notes with chat logging on (`README.md:75`). The page's Party window never says that last fact in the not-joined state; it only becomes visible after joining as "In your party per the chat log: X, Y. Not sharing yet: Y. Send them the code." (`app.js:1604-1605`), which presumes the friend knows "sharing" means "running this app with a code".
- **Tells him?** Mostly. The copy is the clearest paragraph in the app. What it does not say: what the code is for in one phrase ("so your copies find each other"), that it is per evening or permanent (the code is kept in `party.json` until Leave: nothing on the page says whether to make a new one tomorrow), what "the party room" is (footer `app.js:1694`: "Fight numbers and character names go to the party room; anyone with the code can read them"), and that there is a second route, the everyone's fights page, which needs no code at all (`app.js:1596`). Two routes to one goal, one paragraph each, no sentence saying which to use. He will reasonably ask "do I need a code or not?"
- **Flow friction:** "New code" copies the code to the clipboard and says "[Status] Joined gn-x7… and copied it. Paste it into party chat." (`app.js:1702`). He has to alt-tab to the game, open party chat, paste. The others then have to find the line in chat, copy it (the game's chat is selectable but not everybody knows), alt-tab to their app, paste in the field. The paste-to-join from a whole chat line (`app.js:1497-1504`) is a nice touch that nobody will discover without being told; the field placeholder is "gn-…" (`index.html:220`).
- **Jargon:** "party code", "gn-", "party room", "same enemies", "same party" tag chips (`app.js:1518-1519`), "only you so far" / "without you", "Session" dropdown with "All today" and a title tooltip "A session is a run of fights in one area with no gap over 15 minutes" (`app.js:1578`, tooltip only), "pasted", "Paste a fight from Discord" (only without the room).
- **Timing trap:** "Your last three fights and every one that closes from then on are shared" (`app.js:1666`). If the party already did five pulls before everyone joined, only three of his appear, with no way to send the rest (the everyone feed does send the whole day, but that is on another website).
- **Give-up:** medium-high. Not because of a wall but because of three independent walls in a row: the second in-game setting, the four-alt-tab code exchange, and the unanswered "code or no code" question, with the raid about to start.

### Step 4: the "one website" (everyone's fights)
- **Sees:** the link "everyone's fights page" in a dim small line (`app.js:1591`, class `small dim party-everyone`). Opens `https://gorgon-notes-room.rob-30c.workers.dev/everyone` (`cloud/src/everyone.html`): "Everyone's fights · Gorgon Notes · every fight the apps sent, grouped into runs", Show (6 h/24 h/3 days/7 days), Player filter, Refresh, then runs. Footnotes: "How fights get here: each player's own Gorgon Notes sends a fight when it ends… Nothing of yours here? Start Gorgon Notes with chat logging on (Settings → V.I.P. → Save Chat Logs); the Party window shows what was sent." and "Strangers fighting in the same area at the same time can land in one run: saying "I was not in this group" is the next step."
- **Expected:** find tonight's run and read the table.
- **Tells him?** Yes, as far as it goes. But: the URL is a workers.dev address he cannot remember, there is no link to it from anywhere but the dim line at the bottom of the fourth window; the page is public and shows every user's fights, so his party is mixed with strangers in a long list; "Player" filter helps only if he knows to use it; and the two models ("Party window with a code" vs "everyone page without one") are never reconciled in one sentence anywhere.
- **Give-up:** low once found; the page itself is simple. The problem is finding it.

### Step 5: sharing with Discord
- **Sees:** "Connect Discord" in the Party window. Presses it; the system browser opens Discord's authorize page where he picks a server and channel (`docs/DISCORD.md` flow 2-5); the Worker's page says "Connected… Go back to Gorgon Notes"; the app's state line flips to "[Status] Connected: fights post to the channel you picked (webhook "gorgon-notes")" (`app.js:1627`).
- **Expected:** press "Post session to Discord" (red, appears only when a session has rows and Discord is connected, `app.js:1579`) or "Post fight to Discord" on a merged fight head (`app.js:1521`) or on the Breakdown (`index.html:208`).
- **Tells him?** The connect flow is good (this is the one industry-standard flow in the app). The problems: (1) he needs **Manage Webhooks** permission on the Discord server (`docs/DISCORD.md:167`); if he lacks it the picker shows no servers and the app says nothing about why; (2) three different "Post … to Discord" buttons in three places with three scopes (one personal fight, one merged party fight, one session), and the Breakdown's "Post fight to Discord" posts *his personal* breakdown, not the party table, which is not what "compare damage with the party" wants; (3) with four friends connected, four copies post the same session four times (`docs/DISCORD.md:187`: "4 members → 4 posts"); the page never says "let one of you post".
- **Jargon:** "webhook" appears in the connected state line ("webhook "gorgon-notes""), in the paste-box label (`index.html:234` "A fight from a Gorgon Notes post on Discord, with its json block"), in `app.js:1627` "the webhook you pasted earlier", and in `server.py:2635` "Discord removed that webhook (someone deleted it in the channel's Integrations)". "PG_ROOM is empty" (`app.js:1628`) is a server environment variable name shown in the UI.
- **Give-up:** low for the connect; medium for "which button".

**P2 verdict:** gets there in 15 to 25 minutes if his Combat Logging rows are already on Log File and someone in the party already made a code; otherwise he gives up at the second in-game setting or at the "code or no code" fork, and falls back to screenshots.

---

## 4. Persona 3: the owner on day 30, glancing between fights

### Glance 1: how did that fight go?
- **Sees:** `shots/combat-1440.png` top: the finding and the At a glance row. "Per second, last fight 721/s · 00:28 · 24 s", "Damage 688,898 · you 73% · pets 27%". Good: one glance answers it. The live finding "Fighting now: 1,234 damage a second over 7 s against …" is excellent copy.
- **Pain:** the title row is small (H1 + a 14 px finding) and the At a glance figures are ~28 px; on a second screen at arm's length the numbers are readable but the context ("last fight" vs "now") is in 12 px dim subtext. The window footers ("Chat log · live · last line 00:49 · today") are always-on provenance noise for someone who checked that a month ago.

### Glance 2: how is the party doing right now?
- **Sees:** the live party line "Fighting now in Rahu Sewers: Icebrg 322/s · Papersky 188/s" (`app.js:1562`) is **inside the Party window, 2,700 px down**, below the 29-row Fights table and the Breakdown. The session table (one row per player and pet) is also there. To glance at the group he must scroll three screens or keep the page scrolled to the bottom, where the top-of-page finding is off screen. There is no way to pin, collapse or reorder windows (no collapse control on `.win`, `index.html:192-240`).
- **Expected:** see the group table at a glance.
- **Tells him?** n/a; he knows. The layout fights him every evening.
- **Pain:** the primary group-meter surface is last in reading order. The Fights table (29 rows today, could be 150: "Show 144 fights nobody else was in") pushes it further down each hour.

### Glance 3: margin and pill noise
- **Sees:** pill "⚠ 2 to do" every day for a month because character/storage exports age past the thresholds (`app.js:290`, 1 and 2 days). The two amber plaques "Export Character JSON", "Export Storage JSON" sit above the Combat page's own notes on every view (`app.js:437-440` `viewItems`: warn/bad items are listed on *every* view regardless of `views`). The "Not now" snooze is 4 h (`app.js:4625`). For someone who uses only Combat and never cares about vendors, these are permanent false alarms that train him to ignore the pill, which is the one surface that would tell him when the chat log actually stops (chat-log warn at 15 min silence, `server.py:3340`).
- **Also:** the "Party sharing" OK item carries the fix text "Nothing to do but wait: the app retries every 10 s. Copy for Discord on the Breakdown shares a fight by hand." (`app.js:265`, shown through the `else if (fix)` branch at `app.js:479-482` because the `quiet` test at `:480` only covers export/chat-logging keys): an instruction under a green check that reads as if something is wrong (`walk/combat-nolog.png`, right column).

### Glance 4: post the run to Discord
- **Sees:** the Session dropdown ("Rahu 00:38 to 00:39") and the red "Post session to Discord" in the Party window head (`app.js:1579-1581`). Works in two clicks. Good.
- **Pain:** auto-sessions are "same area, ≤ 15 min gap" (`app.js:1578` tooltip), so a dungeon run that crosses two areas becomes two sessions and two posts; manual Start/Stop was removed (`docs/ROADMAP.md`, 26 Oct 21:30) pending a room-side design. He knows this; a friend who posts the "wrong" session does not.
- **Pain:** three "Post … to Discord" buttons (Breakdown, each party fight head, session head), and "Copy for Discord" beside one of them, with no visible rule for which to use.

### Glance 5: did my fights go up?
- **Sees:** `app.js:1596`: "Every fight also goes to the everyone's fights page, where anyone can see runs without a code · 127 fights sent today. Stop sending" (small, dim). Footer: "Party room · gn-z4g5yhyzj3h9 · last message 00:39 · 356 fights sent". Two counters for two feeds in two places, each in 12 px dim.
- **Pain:** neither counter says "and the last one was 2 min ago", which is the only question ("is it still sending?"). The health margin covers the down case (`server.py:3541`, warn only when down *and* pending), so the healthy case is invisible, which is correct by the design's rules but gives the glancer no reassurance.

**P3 verdict:** everything he needs exists; it is in the wrong order (personal first, group last), with a permanent amber pill he no longer reads, and with the party's live line three screens down.

---

## 5. Jargon inventory (what a newcomer meets, where, and whether the page explains it)

| Term | Where (file:line) | Who meets it | Explained on the page? |
|---|---|---|---|
| chat log | finding `app.js:755, 1813`; every footer `app.js:766, 1827`; margin `server.py:3330` | P1, P2 | Never defined. "The game only writes one with Save Chat Logs on." says how to get one, not what it is or why the meter needs it. |
| Save Chat Logs / V.I.P. | `app.js:252, 277` | P1, P2 | Path only. No "in the game's Settings window". No note that the file appears after relogging unless the settings file already says on (`server.py:3326`). |
| Combat Logging, "Log when…", Log File, Log non-damaging abilities, category | `app.js:261`; `server.py:3480-3494` | P1, P2 | Named only in a grey info note; three sub-settings in one sentence. The page never says "your log has no damage lines". |
| VIP / VIP menu / Export Character JSON / Export Storage JSON / "while fully logged in" | plaques `app.js:272-274`; margin every view | all | "JSON" is a file-format word in a button label. Nothing says exports are irrelevant to the damage meter. |
| export "came out partial (name "???")" | `app.js:3243, 393` | P2 (if logout export) | Literal but cryptic. |
| Session (the view) vs Session (a party run) vs "This login" | rail `index.html:55`; `app.js:1578` | all | Two meanings of Session on one Combat page (the view in the rail, the dropdown in the Party window). |
| Councils, favor, Statehelm, Teleports, Prodigy Potential | rail; `index.html:493` | P1 | Game words; fine for players, noise for P1. |
| party code, gn-…, New code, Join | `index.html:215-224`; `app.js:1666, 1499` | P1, P2 | Mechanism explained; purpose ("so your copies find each other") and lifetime (never expires until Leave) not. |
| party room | `app.js:1659, 1667, 1694` | P1, P2 | Never defined. It is the Cloudflare Worker; the word "room" has no referent for the user. |
| ntfy.sh | `app.js:1657` (while checking), `1690-1691` (fallback) ; `index.html` none | P2, P3 | A third-party hostname in a footer: "sharing over ntfy.sh meanwhile, so only others on ntfy.sh see you". Meaningless to every persona. |
| PG_ROOM | `app.js:1628` "This copy is not on the party room (PG_ROOM is empty)" | P2 (if the Worker URL is missing) | An environment variable name in UI copy. |
| everyone's fights page, runs, "grouped into runs" | `app.js:1591-1596`; `cloud/src/everyone.html` | P2, P3 | "Runs" defined only in the page's footnote; the relation to the Party window (two feeds, two counters) never stated. |
| webhook | `app.js:1627`; `index.html:234`; `server.py:2635` | P2 | Appears in the *connected* state ("webhook "gorgon-notes""), after the flow was designed to hide it. |
| json block | `index.html:234`; `app.js:1750, 1758` | P2 | Legacy paste path; only shown without the room, but the label is in the HTML. |
| same enemies / same party / only you so far / without you / pasted (tag chips) | `app.js:1517-1520` | P2, P3 | Tooltips only (`title=`), no legend. |
| Damage over time, "ticks", "Not yours", "indirect", "kill mechanic" | Breakdown notes, `DESIGN.md:1300-1301`; `shots/combat-1440.png` | P2, P3 | Three dim paragraphs under the Breakdown; accurate, but they are the most-read text on the page because they sit between the chart and the Party window. |
| "Needs a newer server.py" / "Needs a newer Gorgon Notes" | `app.js:984, 1063, 1832, 1656` | P2 (stale exe) | "server.py" is a file name on Windows where no such file is visible; the Party window was fixed to say "Gorgon Notes" (`app.js:1656`), the other windows were not. |
| [Status] / [Error] tags | `app.js:1393` | P1 | The game's own voice; fine for players, odd for P1. |
| "Check again", "Not now", "Remind Me!", "Reminders are off. They only fire while you're in game" | `index.html:101`; `app.js:478, 4794` | P1 | "Check again" what? The stamp above it is the only hint. |
| "Open the log", "Open raw", JSON tree, pointer | Files view `index.html:445, 454`; `app.js:1821` | P3 | Developer surface exposed as a top-level tab. |
| Durable Object, Worker, scope | not in the UI (docs only: `README.md:85`, `docs/SHARING.md`) | nobody | Correctly kept out of the page. "scope" appears only as `?scope=` and in "Fights scope" aria-labels. |

---

## 6. Top 15 pain points, ranked

Ranking = personas hit × severity (give-up > confusion > friction). P1 = grandmother, P2 = Windows friend, P3 = owner.

1. **The damage meter needs two in-game settings; the page names one.** Save Chat Logs is shouted twelve times; the Combat Logging rows (all on "Log File") are a grey info note (`server.py:3480-3494`, severity info, `app.js:261`). A user who does the one thing sees "No fights today. The meter starts with your first hit." while hitting things (`app.js:1893`) with no diagnosis. Hits P1, P2 (give-up), P3 (support burden for friends). *Evidence:* DPS-FEASIBILITY.md:119 proposes "No combat lines today: chat log on?"; not built.

2. **Nothing on first open says what to do first or where the meter is.** Default view is Session (`app.js:5780`); no welcome, no "start here", eight equal rail items with noun labels and no descriptions (`index.html:53-89`); About is a provenance list (`app.js:4877-4893`). Hits P1 (give-up), P2 (confusion), P3 (n/a). 

3. **The group meter is the fourth window, three screens down.** The Party window with the live "Fighting now" line (`app.js:1562`), the session table and the merged fights sits under At a glance, a 29-to-150-row Fights table and the Breakdown with its caveat paragraphs (`index.html:189-242`; `shots/combat-1440.png` at ~2,700 px). Hits P2 (cannot find "compare with the party"), P3 (every evening), P1 (scrolls into it by accident).

4. **The no-log state is a wall of twelve identical fixes plus two unrelated export plaques; and the no-export state marks a working meter "2 missing" in red.** Eleven "Needs the chat log." boxes and footers on Session (`design/screenshots/session-nolog-1440-dark.png`), three on Combat (`walk/combat-nolog.png`), and the margin's three red/amber plaques of equal weight (`app.js:437-440` lists every warn/bad on every view; a missing export is severity *bad*, `app.js:323, 400`, `server.py` character-export item). With exports absent and the meter full, the pill reads "✖ 2 missing" (`walk/combat-noexport.png`). One job is presented as three jobs, and the damage meter is judged by files it does not read. Hits P1 (give-up), P2 (first night: "this app says two things are missing and I did not come for either"), P3 (trains him to ignore the pill).

5. **In the no-log state the Party window shows live controls with an empty body.** `renderCombatView` returns at `app.js:1836` before `renderParty()` (`:1877`), so the window shows "gn-…", Join, New code and a red "Connect Discord" (`index.html:215-231`) with nothing inside and an empty footer (`walk/combat-nolog.png`). The only red non-plaque button on the page is the one a newcomer should not press yet. Hits P1 (presses it, ends in a 10-minute "Waiting for Discord"), P2 (confusion).

6. **Two sharing routes (party code vs everyone's page), never reconciled.** The not-joined copy (`app.js:1666`) sells the code; the dim line above it (`app.js:1596`) says every fight already goes to a page "where anyone can see runs without a code". No sentence says when to use which, and the everyone page's URL is reachable only through that dim link. Hits P2 (the "code or no code?" fork before a raid), P3 (two feeds, two counters), P1 (reads it as a privacy problem and presses Stop sending, `app.js:1592-1596, 1775`).

7. **The code exchange is four alt-tabs and a chat paste nobody will discover.** New code → clipboard → game party chat → friend copies the chat line → friend's app field (`app.js:1702, 1497-1504`). Paste-to-join from a chat line is clever and invisible; the field placeholder is "gn-…" (`index.html:220`). The code never expires, and the page never says whether to make a new one next time. "Your last three fights … are shared" (`app.js:1666`) silently drops earlier pulls. Hits P2 (friction, timing trap), P3 (explains it to each friend).

8. **Infrastructure words in the UI: "party room", "ntfy.sh", "PG_ROOM", "webhook", "json block", "server.py".** `app.js:1657, 1659, 1690-1694, 1628, 1627; index.html:234; app.js:984, 1063, 1832`. Hits P2 (confusion in error states), P3 (footer noise), P1 (every one of them).

9. **Three "Post … to Discord" buttons with three scopes and no rule.** Breakdown "Post fight to Discord" (personal, `index.html:208`), per merged fight "Post fight to Discord" (`app.js:1521`), session head "Post session to Discord" (`app.js:1579`), plus "Copy for Discord". Four connected friends make four identical posts (`docs/DISCORD.md:187`). Hits P2 (posts the wrong thing), P3 (friends post duplicates).

10. **The health pill and margin cry wolf on Combat.** Export age thresholds of 1 d / 2 d (`app.js:290`) keep "⚠ 2 to do" lit permanently for a combat-only user; "Not now" snoozes 4 h (`app.js:4625`). The OK "Party sharing" item shows the fix sentence "Nothing to do but wait…" under a green check (`app.js:265, 479-482`). Hits P3 (daily), P2 (first impression), P1 (red boxes first).

11. **Fix instructions are paths, not steps.** "Settings → V.I.P. → Save Chat Logs" (`app.js:252`) and the 29-word Combat Logging sentence (`app.js:261`) have no step numbers, no "in the game window", no "then log out and in" (the server knows when this applies, `server.py:3326`), no "then hit something", no picture. The game's Settings window is the one UI the app cannot show, so a screenshot or a numbered list is the industry answer (compare Overwolf/Details!/ACT setup screens). Hits P1 (give-up), P2 (slower).

12. **Window footers and caveat paragraphs are always on, at full length, for everyone.** Every window carries "Chat log · live · last line 00:49 · today" plus a fix slot (`app.js:524-530`); the Breakdown ends with three dim paragraphs on damage-over-time attribution (`DESIGN.md:1300`). Correct by the data-awareness rule, but the same density for day 1 and day 30 is what "overwhelming" means in the user's brief. Hits P3 (noise), P1 (reads all of it, understands none), P2 (skips the Party window because it looks like more of the same).

13. **"Session" means two things on the Combat page.** The rail's Session view (`index.html:55`) and the Party window's Session dropdown ("Rahu 00:38 to 00:39", "All today", tooltip-only definition `app.js:1578`). Hits P2, P3.

14. **Nothing says the meter is per person and that every party member must run the app with logging on, until after joining.** The fact lives in `README.md:75` and in the post-join roster line (`app.js:1604-1605` "Not sharing yet: … Send them the code."), and in the Breakdown footer "Party members' hits aren't in your log; the Party window below puts their copies' numbers beside yours." (`app.js:1876`). A friend who joins and sees "only you so far" tags (`app.js:1517`) does not know the others need to install anything. Hits P2, P3.

15. **Tag chips and table columns without a legend.** "same enemies", "same party", "only you so far", "without you", "pasted" (`app.js:1517-1520`, tooltips only); session table Health / Armor / Damage / Per second / Share / Kills with pets as separate rows ("Smarmfire Wall · Woltlump's pet" above "Woltlump" in `shots/combat-1440.png`, because rows sort by damage and the pet out-damaged its owner), so the "who did most" question gets a pet's name as the answer. Hits P2, P3.

Honourable mentions (real, lower weight): the Preview banner wording "Preview: pretending there's no chat log. Real data is unchanged." is only for dev and fine; the plaques are `<button>`s that do nothing visible for P1 (`app.js:477, 5715`); "Check again" has no object; the theme control and Reminders are header-level prominence for day-1 irrelevance; the Files, Teleports and Statehelm tabs have equal rail weight with Combat; "Needs a newer server.py" on Windows (`app.js:984, 1063, 1832`); the everyone page is public and unfindable at the same time.

---

## 7. Where each persona gives up (summary)

| Persona | Step | Trigger | Quote they are looking at |
|---|---|---|---|
| P1 (chat log off) | 3 | Red "Connect Discord" is the only red button that is not a fix; or the twelve "Needs the chat log." | "No chat log to read, so there's nothing to measure." (`app.js:1813`) |
| P1 (chat log on, Combat Logging not Log File) | 4 | Did the one named thing; meter still empty | "No fights today. The meter starts with your first hit." (`app.js:1893`) |
| P1 (everything pre-set) | succeeds at 3 | the finding sentence works | "688,898 damage in 29 fights today, 801 a second while fighting." (`app.js:1894`) |
| P2 | 2 or 3 | Second in-game setting (grey note), then "code or no code?" with ten minutes left | "Share fights with your party. One of you presses New code…" (`app.js:1666`) beside "Every fight also goes to the everyone's fights page … without a code" (`app.js:1596`) |
| P3 | never gives up; loses the glance | Party window three screens down; pill permanently amber | "⚠ 2 to do" (`app.js:449-459`) |

What already works and should be kept: the one-sentence findings (`app.js:1880-1900`, `910`), the live "Fighting now" line, paste-to-join from a chat line, Connect Discord via Discord's own picker, undoable Leave, the session table's shape, the everyone page's three footnotes (the clearest explanation of the model anywhere in the product, and it is on the wrong page), and the server's chat-log evidence that names the folder it looked in and reads the game's settings file (`server.py:3315-3331`), which is exactly the diagnostic the Combat Logging case lacks.
