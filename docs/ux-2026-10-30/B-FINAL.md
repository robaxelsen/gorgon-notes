# Problem B, final spec: Combat turned inside out, the plug-and-play party meter

30 Oct 2026. Base: the **grandmother** design (`B-grandmother/SPEC.md`, two of three judges' winner), shipped on the **minimal** design's contract and markup (engineer grafts 1 to 4), with the leader's Setup trigger, plaque rule, column order and fold hint. Every reject in the three judge reports is out. Repo at `68f89da`; line numbers into `static/index.html`, `static/app.js`, `static/app.css`, `server.py`, `cloud/src/worker.js`, `DESIGN.md` at that commit (re-verified for this document: `partyFightHtml` 1515, `liveLine` 1528, `sessionTable` 1574, `everyoneLine` 1589, `rosterLine` 1599, `renderDiscordForm` 1611, `renderParty` 1645, `initParty` 1698, `renderCombatView` 1796, `combatFinding` 1880, `renderFightPane` 1918, Breakdown notes 2004-2009; `room_poll` 1934, `party_live_tick` 2081, `party_thread` 2116, `party_merge` 2147, `session_rows` 2199, `party_sessions` 2236, `party_state` 2302, `party_roster` 2339, `combat-logging` 3464-3494, `party-sharing` 3541-3575). Live facts used: `/api/party` (roster of Robchew, feed members Akriex v0.11.0 and Robchew; room members Faechew v0.8.0, Woltlump v0.9.0, Ragnaurok v0.10.0), `/api/combat` (41 fights, 717,547, 662/s, best 3,479/s at 23:57), `/api/health` (`combat-logging` ok, `views []`).

**This spec assumes A-FINAL ships first or together**: the Setup window (`A-FINAL.md` §1), health scoping (§4), `plaqueNow`, the lower deck (`§3`), `NEEDS_NEWER`, `?sim=fresh|partiallog`, `combat-logging` warn and `combat-lines` (§5.2, §5.3). Nothing here re-specifies those; B only adds Combat's rows and windows to them. Rail groups, Files at the foot and the phone More item are A's diff and not in B's change list.

Mockup of the one state no runner-up drew correctly (the party state with every graft applied): `B-FINAL/mock-party.html` → `B-FINAL/shots/mock-party-1440.png`, `mock-party-390.png`, `mock-party-daylight-1440.png` (built by `B-FINAL/build.py` from the grandmother mock; the `<style>` diff is `B-FINAL/mock.css` minus its rail block, which is A's). Measured: 2,576 px tall at 1440 (was 3,378 to 3,908); the party table's first row at y ≈ 600; rust elements 1; amber in the main column 0; "server.py", "ntfy.sh", "PG_ROOM", "party room", "json block", "webhook" in the visible copy 0; steps in the app to see party damage after the in-game settings 0.

---

## 0. Where the judges disagreed, decided

| Question | Decision | Why (one line) |
|---|---|---|
| Winner: grandmother (engineer, design) or minimal (grandmother judge) | **grandmother's copy and states on minimal's contract and markup** | all three judges' grafts amount to exactly this; the grandmother judge's reason for minimal was "less rewriting", which grafts 1 to 4 remove |
| Setup trigger on Combat: chat-log bad only (design judge), chat-log bad or combat-logging warn (engineer), minimal's partial rule (grandmother judge) | **A-FINAL §1.1 as written**: `setupNeeded('combat')` when `chat-log`, `combat-logging` or `combat-lines` is not done; with fights today the Setup window sits first and the normal page follows; with none it replaces the page | one Setup window across A and B; a warn row with fights never hides the meter, which is what the design judge's reject protects |
| Solo state of Your party: folded bar (minimal, design judge graft 9) or open with one sentence (engineer, grandmother) | **open, one sentence plus "Open everyone's fights"; the owner folds it by hand and the fold is remembered** (`pgdash.open['deck-combat']`) | the zero-setup answer stays on the page for a first-timer; the owner's density is one click, once |
| Health and Armor: tooltip (engineer, grandmother), desktop columns (grandmother judge), text toggle (design judge) | **Damage first; Health and Armor behind a "Show health and armor" text toggle under the run table** (desktop columns when on; a dim line under the name on a phone), not persisted | reachable without hover, off the first read |
| "Post this run to Discord" when not connected: connect-then-post (grandmother judge) or the existing no-webhook branch (engineer) | **one `.btn` always; pressing it with nothing connected opens the Discord window, focuses Connect and says so in that window's state line** | the connect-then-post run id across a 10-minute pending poll is unspecified; two lines do the job |
| Too-old status: from the feed (leader) or only from a joined room (minimal, all judges) | **only from `roomMembers`; otherwise "not running Gorgon Notes"** | pre-29-Oct copies never touch the everyone DO (verified: Faechew, Woltlump, Ragnaurok are absent from it) |
| Sharing status: `members[].lastSeen` (grandmother, leader) or fight rows and ticks (minimal, engineer) | **a fight row in the last 24 h or a live tick** | `getFights` touches `members` on every `GET ?who=`, so a reading-only copy would look like a sharing one |
| VIP symptom: client rule tonight (engineer) or server verdict (A-FINAL) | **server verdict `combat-lines` (A-FINAL §5.3); the client has no own rule** | one verdict list drives every surface; A already ships it |
| Finding, not in a fight: one figure (decision) vs "best fight" second sentence (grandmother, accepted by the judges) | **one figure, one clause: "662 damage a second today, over 41 fights."; the best fight moves to the Fights sub-line in At a glance** | the decision says one figure; the Fights sub today repeats the finding's "/s over it" and had room |
| Finding, in a fight: with "over 42 s" (minimal) or without (grandmother) | **without**: "Fighting now: **1,312** damage a second against *X* and 2 others." | the lead readout's sub-line carries the seconds 60 px lower |
| Disclosure placement: `#notices` (minimal) or the top of Your party (grandmother, engineer, grandmother judge) | **top of Your party's body, the well-filled `.note-line`, OK · Stop sending; folds into that window's footer** | it folds 40 px, not a page jump; it is about the window it sits in |
| Disclosure repeat after Start sending (minimal) or never (grandmother) | **never**; the footer's "Start sending / Stop sending" is the permanent place | turning it back on is an explicit act by the player |
| Worker `names=`/`players=` and `area=` filters (grandmother, leader, design judge graft 7) | **not in this diff**; recorded as optional in ROADMAP | the 24 h feed is one page today; the filter runs in `party_mine` |
| Deck header on Combat's lower deck (A-FINAL: 2+ windows get one) | **none on Combat**: two folded bars, Private room and Discord, with no "Open all / Fold all" line | a header over two one-line bars is more chrome than content |
| Breakdown open or folded by default | **open**; the fold exists and is remembered | selecting a Fights row must show something |

---

## 1. Page order, what is open, the lead figure

Combat with a chat log, top to bottom (`index.html:189-242` reordered):

| # | Block | Open? | Content |
|---|---|---|---|
| 0 | Title row | always | h1 "Combat", the finding (§1.2), the chat-log stamp, Check again; `#d-follow` as today |
| 1 | **At a glance** `#w-d-glance` | open | lead "Per second now · live" (30 px readout, the live dot) or "Per second, last fight"; Damage; Fights; Kills; Damage taken. Footer left "Chat log · live · last line 00:28 · today"; right empty when ok (A-FINAL: the fix sits once, on the primary footer) |
| 2 | **Your party** `#w-d-party` | open (§2) | disclosure (once) → live line → state sentence + one button → member rows → run table → fight blocks → pane-under row; footer |
| 3 | **Fights** `#w-d-fights` | open, **primary**, 10 rows | khaki pane as today; `FIGHTS_SHOW = 10` newest by the active sort, a live fight always in them, the grand row over every fight in scope; pane-under "Show all 41 fights · 1 skirmish under 5 s and 500 damage folded" / "Show the last 10" (`dUI.all`, not persisted; the skirmish link stays `data-dminor`). Footer left as today (+ "Open the log"); right the midnight carry-over "Counted from 23:45 yesterday: that run was still going at midnight" when `c.carried`, else the chat-log fix when warn/bad, else empty |
| 4 | **Breakdown** `#w-d-break` | open, caveats folded | tools: "Copy as text" (`.linkbtn`, "Copy" on a phone), "Post fight to Discord" (`.btn`, "Post"); body as today up to By enemy; then one `details.howcount` "▸ How this is counted · direct hits by name, damage over time from your log, party members' hits not here" holding, in order: the By-enemy sentence, the damage-over-time sentence, the ticks-before-first-hit sentence, "Party members' hits are never in your log. Your party, above, puts their copies' numbers beside yours.", the party-per-chat-log sentence, the "Not placed" sentence. Footer right "Your party's hits are in Your party, from their own copies" (in a party) / "Nobody else was logged nearby, so the damage over time is yours or your pets'" (solo) |
| 5 | **Private room** `#w-d-room` | **folded** | §3.1 |
| 6 | **Discord** `#w-d-discord` | **folded** | §3.2 |
| M | Margin | as A-FINAL | Combat's own sources only: chat log, combat logging (warn), combat lines; "Also checked: game (logged in), combat logging (on), everyone's fights (131 sent today, last 00:28)"; the Elsewhere line. **No verdict ever says who in the party is sharing** (the window's title count does) |

Fold state of 2, 4, 5, 6: `pgdash.open['deck-combat']` through `saveOpen` (A-FINAL §3); defaults = the table. The fold button is A's `.foldh` in the h2; folded windows keep no footer.

### 1.1 Lead figure and liveness cue
`.fig.lead .val.readout { font-size: 30px; line-height: 1.1 }` (28 px under 768): the one size above the 22 px cap, used only for this figure on this view. Label "Per second now · live" preceded by `<span class="livedot" aria-hidden="true">`: an 8 px `--data` dot, `animation: breathe 1.6s ease-in-out infinite` (opacity 1 → .35 → 1). `prefers-reduced-motion: reduce` → `animation: none`; the word "live", the sub-line that changes every 2 s ("this fight · 24 s · last 10 s: 1,610/s") and the "now" chip on the fight row carry liveness. The same dot leads the "Fighting now" line in Your party. No fight open: no dot, label "Per second, last fight", sub "01:26 · 18 s" / "none yet". Nothing else on the page moves (DESIGN.md → Motion).

### 1.2 The finding (`combatFinding`, `app.js:1880-1900`)
- In a fight: "Fighting now: **1,312** damage a second against *Aktaari Royal Guard* and 2 others." + " *Doomstorm* is doing 61% of it." only when pets out-damage you (existing rule).
- Fights, not fighting: "**662** damage a second today, over 41 fights." ("this login" under that scope).
- Zero, everything set up: "No fights today. The meter starts with your first hit."
- Setup states, loading, old server: A-FINAL §1.4 and §4; old server "The DPS meter needs a newer Gorgon Notes." + the one reason sentence.
- What leaves the finding: pets → Damage sub "you 73% · pets 27%"; deaths → Damage taken sub "7 deaths, one to a kill mechanic"; best fight → Fights sub "18 min 4 s fighting · best 3,479/s at 23:57"; midnight → the Fights footer.

---

## 2. The "Your party" window

Source: the chat log's hunting party (`/api/party` `roster`, exists) over the everyone feed read without a code (§5). Title "Your party", count "4 · 2 sharing" (names the log saw including you · members with `status` sharing, you included when sending). Title tool: `<a class="btn" id="d-everyone-open" href="{everyone.url}" target="_blank" rel="noopener">Open everyone's fights</a>` ("Everyone's fights" on a phone). Under 640 px the title tools become a toolbar row at the top of the body (leader's `.party-tools-m`). The window is secondary (left title); Fights stays primary.

State line `#d-ystate` (`small dim`, `aria-live`, under the state sentence row): the window's own feedback (`[Status]` / `[Error]`, the game's tags), for the invite copy and Stop sending.

### 2.1 Body order (in a party, something to show)
1. **Disclosure** (once, §2.6).
2. **Live line** `p.small.party-live[aria-live=polite]`: "● Fighting now: **Robchew** 1,532/s · **Woltlump** 1,171/s" (area appended "in Povus Caves" only when it differs from the picked run's). Ticks from `live[]` filtered server-side (§5.3); gone when nobody in it fought in the last 20 s.
3. **State sentence + the one button** (`.party-state`): the sentence of §2.2 (names `em.t`), beside it "Copy an invite line" as `.btn.primary` when someone in the roster is not sharing, absent when all share. While a Setup window shows on the same page (partial state) the button is a plain `.btn`: one rust element per screen, the plaque owns it. Hint under it (`small dim`): "Paste it in party chat or Discord. It says what to install and which two settings to turn on."
4. **Member rows** `ul.list.party-members`: you first, then sharing members by damage today, then the rest alphabetically. Row = name (+ `you` tag) · status (shape + word) · right-aligned figure. Shapes are the ok ring (`icon-taupe`) and the info ring only; nothing amber, nothing red, ever.

| `roster.status[name]` | Row | Shape |
|---|---|---|
| you, sending | "Robchew [you] · sharing · 298,406 today" | ok ring |
| you, sending off | "Robchew [you] · not sending" | info ring |
| `sharing` | "Woltlump · sharing · 1,402,117 today" (+ " · fighting now" while a tick is live) | ok ring |
| `sharing`, no fight in scope | "Akriex · sharing, nothing from them today yet" | ok ring |
| `too-old` (a joined room's `roomMembers` says `app` < v0.11.0) | "Fraghonk · Gorgon Notes v0.9.0 · too old to share · starting it again updates it" | info ring |
| `not-running` | "Caboozles · not running Gorgon Notes" | none, `text-dim` |

"today" = damage over the member's rows in `fights` in the day scope, summed client-side.
5. **Run table** `.party-sess` (`sessionTable`, relabelled): head "This run · 30 fights · 17 min 3 s fighting · **2,406,038** damage · 12 kills"; tools: label **Run** + `<select id="d-prun" title="A run is fights in one area with no gap over 15 minutes">` ("Povus Caves 23:45 to now", older runs, "All today") + **"Post this run to Discord"** (`.btn`, `data-psess-post`, shown whenever the picked run has rows). Columns **Player · Damage (bold) · Per second · Share · Kills**; Health and Armor appear as `d-only` columns after Player only while `pUI.split` is on, toggled by the pane-under text button "Show health and armor" / "Hide health and armor" (`data-psplit`; on a phone they are a dim line under the name "health 221,500 · armor 21,660"). Rows sorted owner-first: key `(ownerDmg desc, owner before pet, dmg desc)`, pets as `.pet` rows indented with "Smarmfire Wall · Woltlump's pet" dim small. Post result: `[Status] Posted this run to Discord (table as text, plus a picture of it).` in the system line as today; not connected: the Discord window unfolds, `#d-dconnect` gets focus and `#d-dstate` reads "[Status] Connect Discord here first, then press Post this run to Discord again."
6. **Fight blocks** (`partyFightHtml`, unchanged markup): the last 10 shared fights with chips "same party" (`byRoster`), "same enemies" (`byIds`) and the new **"same cave, party not confirmed"** (`nearby`: joined by area and overlap alone; the hook for the planned Yes / No edit). The per-fight "Post fight to Discord" link is gone.
7. **Pane-under row**: "Show all 30 fights" / "Show the last 10", "Show 4 fights nobody else was in" / "Hide …" (existing `data-pall`, `data-psolo`).
8. **Footer** left "Party from your chat log · numbers from each player's own copy · read 00:28"; right "131 fights sent today" until the disclosure is acknowledged, then "131 fights sent today · Stop sending" (text button); sending off: "Not sending your fights · Start sending"; feed down: red square + "Everyone's fights not answering since 20:14 · 3 fights waiting" (the window's only bad treatment).

### 2.2 States (read aloud: one sentence, at most one button)

| State | Trigger | Sentence (exact) | Button | Below it |
|---|---|---|---|---|
| Loading | `S.party == null` | "Reading your party…" + one `.loading-bar` | none | nothing; footer "Everyone's fights · checking…" |
| Old Gorgon Notes | `/api/party` 404 (`S.partyOld`) | "Needs a newer Gorgon Notes: this page knows Your party, the copy it talks to does not." | none | nothing |
| No sharing address | `everyone.available` false | "This copy has no sharing address, so it can't read anyone's fights. Your own are in Fights below." | none | nothing; title tool hidden |
| Not in a party | `roster.inParty` false | "Not in a party. Join one in the game and it shows up here by itself, with everyone in it who runs Gorgon Notes." (`.empty`) | none (title tool stays) | nothing; footer kept |
| In a party, roster unknown | `inParty` true, `members` empty (`roster.unnamed`) | "You're in a party, but the chat log hasn't named anyone yet. Members show up here when they speak in party chat, join or leave." | **Copy an invite line** | your row; the run table and fight blocks when `nearby` rows matched, each block chipped "same cave, party not confirmed" |
| Nobody else sharing | every other member `not-running` / `too-old` | "Nobody else in your party is sharing yet. Send them the invite line; the table fills in by itself when they open the app." | **Copy an invite line** | member rows; no table and no blocks (your fights are in Fights already) |
| Some sharing | mixed | "*Woltlump* is sharing. *Caboozles* and *Fraghonk* aren't yet: send them the invite line and they show up here on their own." (`joinNames`; "isn't" / "aren't" agree) | **Copy an invite line** | rows, run table, blocks |
| All sharing | every member `sharing` | "Everyone in your party is sharing. Nothing to do." | none | rows, run table, blocks |
| Feed unreachable | `feed.error` newer than `feed.readAt` | "Can't reach everyone's fights since 20:14, so your party's numbers are from before that. The app tries again every 10 s." (dim, no plaque: nothing the player can do) | none | the last read table and rows (statuses unchanged); footer right red |
| Sending off | `everyone.on` false | the state's own sentence; your row reads "not sending"; the run table holds the others' rows | as the state | footer "Not sending your fights · Start sending" |
| Room joined too | `code` set | the same states; the count adds " · room gn-z4g5…"; rows gain `too-old` where the room knows it | as the state | the room's rows merge in (§5.2) |

The page name is **everyone's fights** everywhere (window, footer, margin, disclosure, Setup row 3, About); "shared fights page", "everyone page", "everyone's fights page" are retired.

### 2.3 How status is known (the honest rules, server side, §5.4)
`you`; `sharing` = a feed or room fight row from that name whose `end` is within 24 h, or a live tick within `ROOM_LIVE_MAX_SEC`; `too-old` = in a joined room's `roomMembers` with `app` below `v0.11.0` and not `sharing`; else `not-running`. Never from `feed.members[].lastSeen`. A member who never spoke, joined before you and never left is not in the roster (`docs/DATA-SOURCES.md:62`): the "roster unknown" state and the `nearby` rule cover it; the Yes / No edit stays the ROADMAP's next step.

### 2.4 Copy an invite line
Button `data-pinvite`; clipboard text built client-side (`inviteText(p)`) from `S.party.character` and `S.health.app.repo` (`robaxelsen/gorgon-notes`, the URL the self-updater reads):

```
Robchew's party damage meter: Gorgon Notes (fan-made, free). Three steps:
1. Get it: https://github.com/robaxelsen/gorgon-notes/releases/latest (Mac or Windows). Start it and leave it running. Already have it? Start it again; on Windows it updates itself.
2. In the game: Settings → GUI tab → Chat Logs → Save Chat Logs on. Then Settings → V.I.P. → Combat Logging: every "Log when…" row not Off, Log non-damaging abilities on. Log out and back in once.
3. Open Combat in Gorgon Notes. Our fights line up by themselves. No code.
```
`#d-ystate`: `[Status] Copied the invite line. Paste it in party chat or Discord.` / `[Error] Couldn't reach the clipboard. The line is:` followed by the text in a read-only `<textarea>` (selectable). Each line is under 200 characters; whether the in-game chat box takes the whole paste is unverified, which is why the hint names Discord.

### 2.5 Live line scope (server, §5.3)
A tick is shown when `who` is in roster ∪ {me}, or when the roster is unnamed and the tick's `area` equals my current area and its `fightStart` is within 20 s of my open fight's start. Strangers in the cave are never shown.

### 2.6 The one-time public-feed disclosure
First thing in Your party's body, `.note-line.disclose` (well fill, info ring), shown while `!store.get('pgdash.everyoneSeen')` and `everyone.available && everyone.on` and the view is not loading and no Setup window lists `chat-log` (a fresh install sees it the first time the meter is real; Setup row 3's `.un` carries the sentence "Your fights then go to everyone's fights by themselves, no code needed." until then):

> Your fights go to [everyone's fights], a page every copy of Gorgon Notes sends to, so your party sees them with nothing to set up. What goes: your character name, the area, the numbers, the party names in your log. Anyone with the link can read it; it keeps 30 days.
> **OK** · Stop sending

Both are text buttons on their own line (`data-once="ok"`, `data-pev="0"`); OK in `text`, Stop sending in `text-dim`. OK → `pgdash.everyoneSeen = 1`, the line goes, the footer right gains "· Stop sending". Stop sending → `POST /api/settings {shareEveryone:false}`, the same key set, `#d-ystate` reads `[Status] Your fights stay on this computer; your party can't see them. Undo` (30 s, the Leave pattern: `partyState`'s `{label, run}` form moved to `#d-ystate`), footer "Not sending your fights · Start sending", your row "not sending". Previews (`?sim=`) never write the key. Never shown again, on any view.

---

## 3. The two folded windows (static markup, one footer each)

Both are `.win.folded` sections after Breakdown with A's `.foldh` button in the h2; their bodies are **static markup moved from `index.html:217-231`**, never rewritten by `renderParty` (typed codes and fold state survive the 10 s poll; the `document.activeElement !== inp` guard at `app.js:1652` keeps working).

### 3.1 Private room `#w-d-room`
Title "Private room", count "not joined · a table only people with a code can read" / "gn-z4g5yhyzj3h9 · 2 in it · last message 00:39". Body: `.empty` "Your party already shows above with no code. A private room is for a group that would rather stay off everyone's fights (press Stop sending too), or for two parties that share a cave. One of you presses New code and pastes it into party chat; the others paste it here." then the existing `#d-pform` (`#pcode`, **Join**, **New code** moved in from the old title tools, **Copy code**, **Leave the room**) with `#d-pstate` and every `[Status]` / `[Error]` line kept, words changed: "party room" → "the room", "ntfy.sh" → "the fallback relay", `PG_ROOM` sentence → "This copy has no sharing address, so a room can't be joined here". Leave stays undoable ("[Status] Left the room gn-…. Undo"). Footer left "Private room · not joined" / "Private room · gn-… · 356 fights sent"; right "Fight numbers and character names go to the room; anyone with the code can read them", or the existing waiting / not-answering lines (red square form) with "the room" / "the fallback relay". A room that stops answering opens the window once and says so in its footer; it never colours the pill on its own (the `party-sharing` warn verdict does, as today).

### 3.2 Discord `#w-d-discord`
Title "Discord", count "not connected" / "waiting" / "connected · gorgon-notes" (`discord.connected.name`). Body: the existing `#d-dform`: **Connect Discord** (`.btn`, `primary` class removed from `index.html:227` and from `renderDiscordForm`), **Cancel**, **Change channel**, **Disconnect Discord** (was "Remove"), `#d-dstate`. Lines: not connected "Opens Discord in your browser to pick a server and a channel; you need Manage Webhooks there. Post this run to Discord and Post fight to Discord then go there."; waiting unchanged; connected "[Status] Connected: posts go to the channel you picked (gorgon-notes) · last post 00:14"; `canConnect` false "This copy has no sharing address, so Discord can't be connected here."; the 404 case keeps the word webhook, here only: "[Error] Discord removed that webhook (someone deleted it in the channel's Integrations). Connect Discord again." Footer left "Discord · connected · last post 00:14" / "Discord · not connected"; right "Posts carry the table as text and a picture of it". Who posts when several members are connected is still each copy's own press; the "posted by X" note is deferred (ROADMAP, no Worker state).

---

## 4. Setup, partial and loading states on Combat

**Fresh install** (`setupNeeded('combat')`, no fights): A-FINAL §1 verbatim: one window "Setup · 0 of 3 done", rows Save Chat Logs / Combat Logging / Hit something, one plaque only when `plaqueNow`, the dim "Next time you're in game" line otherwise, the Off rows named by the game's labels in step 2, the `combat-lines` symptom in row 3; At a glance, Your party, Fights, Breakdown, Private room and Discord all `hidden` (so no Connect Discord on an empty meter, B5); the margin's note points at the window; stamp amber "set up below", pill info "1 to set up", no red.

**Partial** (`combat-logging` warn or `combat-lines` not ok, `c.totals.fights > 0`): the Setup window first (rows 1 ok, 2 warn "2 of 7 rows Off", 3 as it is), then the normal page in §1 order; the pill "1 to do"; Copy an invite line is a plain `.btn` (§2.1 item 3); the finding is A-FINAL's "Almost there: 2 of the 7 Combat Logging rows are Off…" only when there are no fights, else §1.2.

**Loading** (`app.js:1796-1800`): `const reading = !old && (!c || (S.loading && !S.session)); const noLog = !reading && (!sessionHasLog() || (!!c && !c.log));` computed in that order; `setupNeeded` is false while `S.loading && !S.healthAt`. While reading: finding dim "Reading today's chat log…", stamp ok, At a glance three loading bars, Your party "Reading your party…", Fights "Reading the chat log…", Breakdown **not drawn** (`hidden`), the two folds folded, margin "Checking your sources…", pill "Checking…", favicon and title unchanged. Nothing red or amber before a verdict exists. Acceptance shot: `?sim=loading#combat` at 1440 and 390.

---

## 5. Server contract diff (DESIGN.md → Server contract)

All additive. An old page against the new server renders the room UI as today with a now-populated table; a new page against an old server reads no `source` and renders the old way; 404 keeps the "Needs a newer Gorgon Notes" line. `PARTY_VERSION` stays 1.

### 5.1 `GET /api/party` (30 Oct)
```diff
+ "source": "everyone" | "room" | "none",      // where fights/sessions/live come from: the feed when no code is joined, the room (feed rows merged in) when one is, none when the feed is off and no code
+ "feed": { "readAt": iso|null, "error": str|null, "errorAt": iso|null, "rows": int, "members": [{ "who", "lastSeen", "app" }] },
  "roster": { "inParty", "name", "members": [names, unchanged], "leader", "log", "notSharing": [unchanged],
+             "unnamed": bool,                                   // inParty and members empty
+             "sharing": ["Akriex", "Robchew"],
+             "status": { "Akriex": "sharing", "Woltlump": "too-old", "Caboozles": "not-running" },   // §2.3 rules; "you" for the character
+             "apps": { "Woltlump": "gorgon-notes v0.9.0" } },   // from roomMembers only
+ "invite": { "repo": "robaxelsen/gorgon-notes" },
+ "area": "Povus Caves",                                         // the current area the filter used
  "fights": [ …unchanged shape…, +"nearby": bool, +"via": "feed" | "room" | "local" per member ],
  "sessions", "live", "members", "ntfy", "transport", "roomMembers", "discord", "everyone": unchanged shape
```
`party_state` (`server.py:2302-2337`): `me, rows = party_local_rows(all_day=True)` **always**; `fights = party_merge(me, rows, party_mine(_party["remote"], roster, me, rows, area), since=None if not code else iso_dt(_party["since"]))`; `sessions = party_sessions(fights)`; `live` filtered per §5.3; `roster.status` per §5.4.

### 5.2 `party_mine(remote, roster, me, local_rows, area)` (new, before `party_merge`)
Keep a remote summary when `s["via"] == "room"` (the code is consent), or `s["who"] in roster["members"]`, or `me in (s.get("party") or [])`, or (`roster["inParty"]` and `s.get("area") == area` and it overlaps one local row's window), the last tagged `s["nearby"] = True`. `party_merge` (`2147-2203`) copies `nearby` onto the group when every remote member in it was kept by that rule alone (`byRoster` false). `area` = the newest local fight's area, else the session zone.

### 5.3 Reading the feed and ticking without a code
- `room_poll(code)` → `room_poll(code=None)` (`1934-1971`): with `code` None the request is `everyone/fights?after=<now-24h ms>&since=<_party["feedSince"]>&who=<me>` (both params exist, `worker.js:136-146`), up to 5 pages, rows keyed `who|start` as today with `via = "feed"`, `feedSince` cursor, `feed.readAt / error / errorAt / rows / members` from the answer; `live` from its `live`. With a code the room read runs as today **and** the feed read follows it (rows `via = "room"` win on a key clash).
- `party_thread` (`2116-2141`): with no code, `party_live_tick()` every 2 s and the feed poll every 10 s (2 s while someone in `live` fights) **while watching** (`time.time() - _party["lastReq"] < PARTY_IDLE_SEC`); `everyone_tick()` (publish) unchanged.
- `party_live_tick` (`2081-2113`): posts to `everyone/tick` when no code (the route exists, `worker.js:62-66, 126-140`); ticks go out while fighting whether or not a view is watching, as the room's do today. Shown ticks (§2.5) are filtered in `party_state`, not at the Worker.
- Scale note for ROADMAP: one GET per watching copy per 10 s (2 s while fighting) plus one tick per fighting copy per 2 s on the single everyone DO; five copies ≈ 2.5 req/s, far under the free plan, unmeasured beyond (problem map §7.1.8).

### 5.4 Status rules (server, new `party_member_status(roster, me, remote, live, room_members)`)
```python
MIN_SHARING_APP = (0, 11, 0)
def party_member_status(roster, me, remote, live, room_members):
    cut = datetime.now().astimezone() - timedelta(hours=24)
    sharing = {s["who"] for s in remote.values() if (iso_dt(s.get("end")) or cut) >= cut} | set(live)
    old = {m["who"]: m["app"] for m in room_members if app_tuple(m.get("app")) < MIN_SHARING_APP}
    st = {}
    for n in set(roster["members"]) | ({me} if me else set()):
        st[n] = "you" if n == me else "sharing" if n in sharing else "too-old" if n in old else "not-running"
    return st, sorted(n for n, s in st.items() if s == "sharing" or (s == "you" and everyone_on())), {n: old[n] for n in old if n in st}
```

### 5.5 `/api/health`
- `combat-logging` and `combat-lines`: A-FINAL §5.2, §5.3 (no change here).
- `party-sharing` (`3541-3575`): listed only while a code is joined, as today; its ok evidence **drops** the "… in your party per the chat log but not sharing: send them the code." tail and `notSharing` (the rows say it); the warn case unchanged but worded "The private room hasn't answered since 20:14; …".
- `everyone-feed`: today only warn. Add **ok** "131 fights sent today, last 00:28." (`views []`, folds into Also checked) and **info** "Sending is off; nothing of yours goes to everyone's fights." (`views []`) when off; the warn case unchanged, fix "Nothing to do but wait: the app retries every 10 s and sends what waits."
- No "Your party" verdict, no "N sharing" verdict (one fact, one place).

### 5.6 Worker
No change. Optional later (ROADMAP): `GET /everyone/fights?names=a,b,c` and `GET /everyone/live?area=` as additive filters; `/everyone/posted` stays deferred.

### 5.7 `POST /api/settings { shareEveryone }`, `POST /api/party` (new / code / null)
Unchanged. `{ paste }` stays accepted by the server; the UI for it is gone.

---

## 6. Copy altitude on this view
Retired from Combat's UI copy (grep targets): "server.py" (A's `NEEDS_NEWER`), "PG_ROOM", "ntfy.sh", "party room", "json block", "Party window", "Session" as a table label, "Post session", "everyone's fights page", "shared fights"; "webhook" survives only in the Discord 404 line. Nouns: **Your party**, **Private room**, **Run**, **everyone's fights**, **Copy an invite line**, **Post this run to Discord**, **Post fight to Discord**, **Copy as text**, **Leave the room**, **Disconnect Discord**, **Stop sending / Start sending**. System lines: "[Status] Posted this run to Discord (table as text, plus a picture of it)." · "[Status] Copied the fight as text." · "[Status] Your fights go to everyone's fights again; the ones waiting are sent now." · "[Status] Your fights stay on this computer; your party can't see them. Undo" · "[Status] Copied the invite line. Paste it in party chat or Discord." `fixText` rows: `party-sharing` → "Nothing to do but wait: the app retries every 10 s."; `everyone-feed` unchanged; both printed only when warn (A-FINAL §4).

---

## 7. DESIGN.md rewrites (new text, quoted)

**Typography → Hierarchy (`:452-463`)**, new bullet after Lead figure → "**Readout** (700, 30 px, 1.1, tabular; 28 on a phone): one figure on one view, the live per-second rate on Combat (`.fig.lead .val.readout`). The one exception to the 22 px cap: the live meter is the one surface the game itself never ships, so the pane-title cap it borrows does not bind. Nothing else may use it (30 Oct)." Five sizes stay five plus this one named exception.

**Motion (`:797-803`)**, new bullet → "**Live dot**: an 8 px `--data` dot breathing in opacity (1 → .35, 1.6 s) beside "Per second now · live" and "Fighting now". Under `prefers-reduced-motion: reduce` it holds still; the word "live" and the sub-line that changes every 2 s carry liveness. The only ambient motion in the app."

**Components → Buttons (`:619-624`)**, new sentence → "**One rust element per screen.** The plaque while a Setup window shows; otherwise at most one `.btn.primary` on the view (Combat: "Copy an invite line" while someone in the party is not sharing). Post, Connect and Copy are ghost buttons or text buttons."

**Components → Data health → Severity rules**, rows → "`everyone-feed`: ok "131 fights sent today, last 00:28." (views none); info "Sending is off; nothing of yours goes to everyone's fights." (views none); warn as before (views combat). `party-sharing`: listed only while a private room is joined; ok evidence names the room, last message and fights sent, never who in the party is sharing (the Your party window says that, once)."

**Components → Preview modes (`:754`)**, row → "`?sim=party`: a party of four per the chat log, two sharing, one `too-old` (a room joined), a live tick, three runs; `/api/combat` real. Notice "Preview: pretending you are in a party of four. Real data is unchanged." Never writes `pgdash.everyoneSeen`."

**Server contract → `GET /api/party` (`:975-992`)**, new paragraph → "**Your party from the everyone feed (30 Oct, no code).** With no code joined, `source` is `"everyone"`: the party thread reads `GET <room>/everyone/fights?after=<now-24h>&since=<cursor>&who=<me>` every 10 s while a view watches (2 s while someone fights), posts live ticks to `/everyone/tick` while fighting, and builds `fights` / `sessions` / `live` from the rows `party_mine` keeps: the poster is in my roster, or their `party` names me, or (roster unnamed) the same area overlapping one of my fights (`nearby: true`, chip "same cave, party not confirmed"). With a code the room's rows merge in (`via`). New fields: `source`, `feed{readAt,error,errorAt,rows,members}`, `roster.unnamed / sharing / status / apps`, `invite.repo`, `area`; `roster.members` stays a list of names. Status: `sharing` = a fight row in 24 h or a live tick (never `members.lastSeen`, which a read touches); `too-old` only from a joined room's `roomMembers` (older copies never reach the feed); else `not-running`."

**Voice → Words** add "Your party", "Private room", "Run", "everyone's fights" (the one name of the page); the retired list of §6. **Voice → Exact fix wording** rows `party-sharing` / `everyone-feed` per §6.

**Views → Window footers**, Combat rows → At a glance right "empty when ok" · Fights right "the midnight carry-over, else the chat-log fix when warn/bad" · Breakdown right "Your party's hits are in Your party, from their own copies" / solo form · new rows **Your party** ("Party from your chat log · numbers from each player's own copy · read 00:28" | "131 fights sent today · Stop sending" / "Not sending your fights · Start sending" / red "Everyone's fights not answering since 20:14 · 3 fights waiting"), **Private room** ("Private room · not joined" / "· gn-… · 356 fights sent" | the privacy line / the room's bad line), **Discord** ("Discord · connected · last post 00:14" / "· not connected" | "Posts carry the table as text and a picture of it"); folded windows have no footer.

**Views → Combat (`:1288-1309`)**: replace the Party, Everyone's fights line, Discord row and Sessions bullets with §1 to §3 of this spec (order; readout; finding; Fights 10 rows; Breakdown fold; Your party states, rows, invite, disclosure; Private room; Discord); the first-run, partial and loading paragraphs with §4; the Margin sources bullet with "chat log, combat logging (warn), combat lines; everyone's fights and the private room in Also checked unless they warn; never a verdict about who shares".

**Review decisions**, 30 Oct block, appended → "**Your party comes from the everyone feed with no code**; the party code is a folded Private room. · **One readout size (30 px) for the live rate on Combat**, named in Typography. · **The public-feed disclosure is said once**, in Your party, then lives in its footer. · **Member status is honest**: sharing from fight rows and ticks, too-old only from a joined room. · **Fights stays the primary window**; Your party is second and never changes rank. · **Fights shows 10 rows**; Breakdown's caveats sit under one disclosure. · **Paste-a-fight and per-fight Discord links are gone**; one Post this run on the table, Post fight on the Breakdown."

---

## 8. File:line change list, in shipping order, with effort

Effort: S ≤ 1 h, M 1 to 3 h, L 3 to 6 h. Steps 1 to 7 are one client commit (after A's steps 1 to 6); 8 to 10 the server the same night; 11 to 12 after.

| # | File:line | Change | Effort |
|---|---|---|---|
| 1 | `index.html:189-242` | reorder to glance → `#w-d-party` → fights → break; `#w-d-party` keeps h2 "Your party" + `#d-party-count`, title tool `#d-everyone-open` (`a.btn`), body = `#d-ystate` + `#d-party`; new `<section class="win folded" id="w-d-room">` (h2 with A's `.foldh`, count span, body = the old `#d-pform` with `#d-pnew` moved in, `#d-pleave` text "Leave the room", footer) and `#w-d-discord` (body = `#d-dform`, `#d-dconnect` without `primary`, `#d-dremove` text "Disconnect Discord", footer) after Breakdown; delete `#d-pastebox` (233-237); Breakdown tools: `#d-copy` → `linkbtn` "Copy as text" / "Copy", `#d-post` stays `.btn` | S |
| 2 | `app.css:705, 707-734, 727-731` | `#pcode` rule scoped under `#w-d-room`; delete `#d-pastebox*`; append the B block from `B-FINAL/mock.css` (`.readout`, `.livedot` + `@keyframes breathe` + reduced-motion, `.party-state`, `.party-hint`, `.party-members`, `.party-sess tr.pet`, `.note-line.disclose`, `details.howcount`, `.party-tools-m` under 640) | S |
| 3 | `app.js:1796-1878` `renderCombatView` | §4 branch order (`reading` first, `setupNeeded` from A, Breakdown hidden while reading); `figs` (`:1842-1847`): `readout` class and the live dot on index 0, Fights sub with `t.best`, Damage taken sub with deaths; footers per §7 (Fights right = carry-over); `renderParty()` stays the last call and owns Your party's state | M |
| 4 | `app.js:1880-1900` `combatFinding`; `:1918-1931` `renderFightPane` (`FIGHTS_SHOW`, `dUI.all`, the Show-all sentence with the skirmish tail, `data-dall` + `data-dminor` handler beside `[data-eall]` at `:2095`); `:2004-2009` + `renderByEnemy`'s last line → `details.howcount` with the fold-hint summary; `discordText` unchanged, button label "Copy as text", confirmation "[Status] Copied the fight as text." | M |
| 5 | `app.js:1515-1527` `partyFightHtml` (drop `data-pdisc`, add the `nearby` chip); `:1537-1556` `sessionRows` / `:1574-1587` `sessionTable` → `runTable` (label Run, tooltip, Damage first, `pUI.split` columns, owner-first sort, `data-psess-post` as `.btn` always, "Post this run to Discord"); `:1589-1597` `everyoneLine` → `discloseHtml(p)` + `partyFootRight(p)` (`pgdash.everyoneSeen`); `:1599-1606` `rosterLine` → `partyState(p)` (the §2.2 sentence + button) + `memberRows(p)`; `:1608` `pasteLink` removed; new `inviteText(p)`, `copyInvite()`, `ystate(kind, text, undo?)` (the `partyState` helper generalised to `#d-ystate`) | L |
| 6 | `app.js:1611-1643` `renderDiscordForm` (copy §3.2, no `primary`, the count span of `#w-d-discord`); `:1645-1697` `renderParty` → the §2.2 state machine over `p.source` (missing → old path), `renderRoom(p)` for `#w-d-room`'s count, body copy and footer, `setFoot` for the three windows; `:1698-1785` `initParty`: paste handlers out (`1752-1765`, `pUI.paste`), `data-pinvite`, `data-psplit`, `data-once` handlers in, `data-pev` → the Undo form, Leave text; `:1453-1475` `postDiscord`: the no-webhook branch unfolds `#w-d-discord` (`deckOpen`), focuses `#d-dconnect`, wording "Post this run to Discord"; `:1470` `renderPostButtons` loses `[data-pdisc]`; `:26-28` `FOCUS_ATTRS` + `data-pinvite`, `data-psplit`, `data-once`, `data-dall`, `data-pall`, `data-psolo`, `data-pev`, `data-psess-post` | L |
| 7 | `app.js:243-282` `fixText` rows `party-sharing` / `everyone-feed`; `:59-72, 213-240, 385-400` `?sim=party` fixture (`static/sim/party.json` or inline) + notice; `:5720-5722` unchanged (A owns) | S |
| 8 | `server.py:2302-2337` `party_state` (§5.1 fields, `party_local_rows(all_day=True)` always, `since=None` for the feed, `live` filter §2.5); new `party_mine` (§5.2) and `party_member_status` (§5.4) before `party_merge`; `party_merge` `2147-2203` carries `nearby` and `via` | M |
| 9 | `server.py:1934-1971` `room_poll(code=None)` (the feed read, `feedSince`, `feed.*`, `via`); `2116-2141` `party_thread` (poll and tick without a code, gated on watching); `2081-2113` `party_live_tick` (`everyone/tick` when no code); `_party` gains `feedSince`, `feedOkAt`, `feedErr`, `feedErrAt`, `feedRows`, `feedMembers`; `party_save` unchanged (nothing new persists) | M |
| 10 | `server.py:3541-3575` `party-sharing` evidence without the roster tail; after `3535` `everyone-feed` ok / info rows; `docs/API.md` for `/api/party` and the two verdicts | S |
| 11 | `DESIGN.md` per §7; `docs/SHARING.md` status ("the feed is the party meter; the code is the private option"); `docs/DISCORD.md` ("one Post this run, Post fight on the Breakdown; posted-by deferred"); `README.md:67-75` (each member runs Gorgon Notes, no code, the invite line); `cloud/src/everyone.html:84` (A's path fix; add the one-line explainer "Every Gorgon Notes player's fights, grouped into runs. Yours are already here if your copy is running."); `docs/ROADMAP.md` Next up + Session log (the §9 test list, the scale note, the optional Worker filters, the posted-by note) | M |
| 12 | `docs/DESIGN-PROCESS.md` screenshots via CDP: `#combat` (live, in a party when one is on), `?sim=party#combat`, `?sim=party&theme=daylight#combat`, `?sim=fresh#combat`, `?sim=partiallog#combat`, `?sim=loading#combat`, each at 1440 and 390 | S |

Total: about one evening for the client (5 and 6 are the bulk), half an evening for the server, one for docs and shots.

---

## 9. Proof and regressions

Instruments (problem map §3.3) on `?sim=party`, `?sim=fresh`, `?sim=partiallog`, `?sim=loading`, live; dark and Daylight; 1440 and 390: screens to the party table ≤ 1 (mock: 0.7); Fights rows open = 10; Breakdown caveat paragraphs open = 0; rust elements per screen = 1 (plaque on Setup, Copy an invite line otherwise, 0 when all share); amber in the main column = 0 on the party page; Discord-named affordances on the page = 2 (Post this run, Post fight) + the folded window; fix string occurrences on `?sim=fresh#combat` ≤ 2; "server.py / PG_ROOM / ntfy.sh / party room / json block" in Combat's DOM = 0; app steps to party damage after the in-game settings = 0; the loading shot has nothing red.

Regressions to guard (from minimal §9 and the engineer):
- `renderParty()` is called last in `renderCombatView` and rewrites `#d-party` every 10 s: nothing that holds focus or typed text lives inside it (the room and Discord forms are static markup in their own windows); every new button is in `FOCUS_ATTRS`.
- `party_local_rows(all_day=True)` always: one extra `party_merge` over ≤ 500 rows per `/api/party`; `PARTY_KEEP_SEC` (14 h) bounds `remote`; `since=None` shows the whole 24 h, the Run select and Show-all bound the page.
- The feed read is gated on `watching`; a closed window costs nothing; the tick is not gated (friends must see you fighting now).
- Old client + new server: every field additive, `roster.members` still names. New client + old server: missing `source` → the old render path; 404 → the one line.
- The disclosure never renders while `S.loading`, while a Setup window lists `chat-log`, or when `everyone.available` is false; `?sim=*` never writes `pgdash.everyoneSeen`.
- Reduced motion: `.livedot { animation: none }` under the media query, belt and braces over the global rule (`app.css:635-640`).
- Phone: `#d-fights` keeps its id (`app.css:875-879` grand-row rule); the run tools wrap under 400 px as today; the title tools become the `.party-tools-m` row under 640.
- `combatRound` (`app.js:1365`) bypasses `renderAll`: nothing module-level is reset per render (A-FINAL §0).
- One rust per screen in the partial state: `partyState` reads `setupShowing` and drops `primary`.
- `?sim=party` must not call `/api/party` POST or touch `party.json` (memory rule: never touch live party state; test server flows with a harness).

---

## 10. Still unverified (copy hedges until checked)
1. The Save Chat Logs tab on today's client (GUI → Chat Logs; four pieces of evidence, ROADMAP:19 open): the invite line and Setup step 2 state "GUI tab (before April 2026 under V.I.P.)".
2. `combatLog_* == 1` writing the file; `VIP_CombatLogging` as a section flag: A's provisional rule, marked in `evidenceData`.
3. VIP gating `[Combat]` lines: only the `combat-lines` warn sentence says it, hedged.
4. The roster filter on a real five-player evening (two-log check only, 26 Oct); the `nearby` chip exposes the fallback, the Yes / No edit resolves it later.
5. Whether the in-game chat box takes the three-line invite paste; the hint names Discord too.
6. Worker load with every fighting copy ticking every 2 s on the single everyone DO; measured after the first party evening (ROADMAP).
7. Daylight: the mock passes (`mock-party-daylight-1440.png`); the real build's live dot and the rust button need the same check once step 12 runs.
