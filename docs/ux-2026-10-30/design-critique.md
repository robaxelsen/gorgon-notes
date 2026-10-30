# Gorgon Notes: design critique (30 Oct 2026, 00:45 to 01:30 CET)

⚠️ DEGRADED: single-context (this run had no sub-agent tool, so impeccable's Assessment A (design review) and Assessment B (detector/browser) ran in one context, in that order; the interview step was substituted by inference from the brief. `impeccable detect` was not run against the repo because the task forbids repo-side writes and the detector's prior WARNs are already argued in DESIGN.md → Review decisions.)

Scope: the live app at `http://127.0.0.1:8787` (v0.11.0 page, server reporting `app.version` v0.10.0 + 5 commits), read-only. Rubrics: impeccable `critique` (Nielsen 0-4, cognitive-load checklist, Operate mode) and `design:design-critique` (first impression, usability, hierarchy, consistency, accessibility). Bar: Linear, Raycast, Notion, Stripe Dashboard, Apple system apps, Arc. Brief honoured: the binding brand commitment in PRODUCT.md ("a window Elder Game shipped, not a generic dashboard"), so nothing below asks for a hero, a card grid, a sidebar of gradients or a display face.

Evidence (all fresh tonight, CDP full-page captures with a 5 s settle; `--virtual-time-budget` hangs on Combat because of its 2 s poll, and `--timeout` fires before the 1 to 2.5 s API answers, so the headless-Chrome one-liner in the task cannot capture a settled Combat or Storage page):

- `/private/tmp/claude-501/-Users-robaxelsen-code-pg-dashboard/0a11d999-236b-4403-b26b-d404137d8e36/scratchpad/critique-shots/*-1440.png` (dark `-dark`, Daylight `-day`, `?sim=` states, full page)
- `/private/tmp/claude-501/-Users-robaxelsen-code-pg-dashboard/0a11d999-236b-4403-b26b-d404137d8e36/scratchpad/critique-shots/*-390.png` (true device emulation at 390 × 844, dsf 2; headless `--window-size` cannot go under 500, which the ROADMAP already notes)
- `/private/tmp/claude-501/-Users-robaxelsen-code-pg-dashboard/0a11d999-236b-4403-b26b-d404137d8e36/scratchpad/critique-shots/crop-party.png`, `crop-breakdown-notes.png` (1:1 crops of the Combat Party window and Breakdown notes)
- sibling captures reused: `/private/tmp/claude-501/-Users-robaxelsen-code-pg-dashboard/0a11d999-236b-4403-b26b-d404137d8e36/scratchpad/walk/{combat,combat-nolog,session-nolog,everyone}.png`
- one real bug found while shooting: `?theme=light` is not a theme value; the page says "Preview: unknown theme value 'light', ignored." (`static/app.js:70` accepts `dark | daylight | auto`). The task text and anyone following it get a dark page.

Page heights at 1440 wide (full page): Session 4,275 px, Combat 3,908 px (4,166 in Daylight), Vendors 4,170 px. Every main view is four to five screens tall.

---

## 1. First impression (the 3-second test, per view)

| View | What the eye lands on first | Does it answer the view's question in 3 s? | Verdict |
|---|---|---|---|
| Session | The tan h1 "Session" and the bold figure "4,534,668 XP" in the finding, then the two rust fix plaques in the margin | Yes: "4.5 M XP in 47 min, mostly Animal Handling, died 4 times". The best first line in the app. | Pass, but the two rust plaques (Export Character / Export Storage) pull harder than the answer; the fix for something that is only *warn* is the loudest surface on the page. |
| Combat | The dark-red selected row in the Fights table and the two rust plaques; the finding is a 3-line paragraph | Partly. The finding reads as a paragraph ("691,141 damage in 31 fights today, 785 a second while fighting. Best: 3,479 a second at 23:57, over 18 s. Your pets did 27% of it. Died 5 times. Counted from 23:45 yesterday: …"), so the one number a meter user wants (DPS now / last fight) is the 4th figure in the sentence. | Fail for a newcomer: nothing on the first screen says what the page is for or that it can share with friends; the sharing lives 2,800 px down. |
| Vendors | "1,625,006" councils left, then nine amber "3 h old" marks | Yes: "Vendors can still pay you 1,625,006 councils". | Pass; the amber repetition is the problem (see §4). |
| Storage | "507" slots free in the finding, then the two-column "Where there's room" bars | Yes: free slots, who is full, what merging frees. | Pass; the 28 provenance pills in the pane are the noise. |
| Character | The amber-marked Councils figure | Not quite: the view's question is skills, the first figure is money with a warning. | Partial. |
| Files / Teleports / Statehelm | A file tree; 15 identical footers; eight stepper sections | Files: yes for a developer. Teleports: yes, but the player's own zone is folded. Statehelm: yes ("34 gifts left this week across 8 trainers"). | Pass on copy, fail on length (2.9 k, 4.0 k, 4.5 k px). |

Emotional read: it does look like a Project: Gorgon window (warm charcoal, tan titles, khaki pane, Carlito, deadpan footers). That brief is met, and it is the app's biggest asset. What it does not look like is *finished*: the pages are long scrolls of equally-weighted windows, so the first impression is "a lot of windows" rather than "one answer, then detail".

---

## 2. Shell and navigation (all views)

Evidence: every 1440 capture; markup `static/index.html:26-49` (shell header), `:53-89` (rail), CSS `static/app.css:166-186`.

**What works**
- The rail as a floating game window (DESIGN.md → Review decisions "Rail floats") reads as the game's right-edge toolbar; the active state (gold label + 2 px edge, `app.css:177-179`) is unambiguous.
- Character scope, location line and the health pill in one 44 px bar is the right amount of chrome for Operate mode.
- The health pill ("2 to do") is per view and honest.

**Findings**
1. **Eight top-level destinations with no grouping and no order of importance** (`index.html:55-87`: Session, Combat, Vendors, Storage, Character, Files, Teleports, Statehelm). The working-memory rule in the critique rubric is ≤ 5 siblings before grouping. Files is a developer inspector, Teleports is a wiki lookup, Statehelm is one weekly ritual; they sit at the same rank as Session. A newcomer cannot tell which three tabs matter. Linear and Raycast keep ≤ 6 primary items and push tools under a "More"/settings group; Apple apps use a sidebar with section headers. Fix shape: two groups on the rail ("Play": Session, Combat, Vendors, Storage; "Reference": Character, Teleports, Statehelm, Files) with a 1 px rule and a 13 px dim group label, or demote Files to the About popover's "Inspect the files" link (which already exists, `app.js:4884`).
2. **No first-run surface at all.** `grep -i "welcome|get started|first run|onboard"` over `static/app.js` and `static/index.html` finds nothing except the Files empty line (`app.js:3574`). The About popover (`app.js:4878-4894`) is the only "what is this" text, and it opens from a 13 px "fan-made / About" button at the rail's foot. A first launch with no exports and no chat log lands on Session with four red "Needs the chat log." windows (see `?sim=nolog`, §7) and a margin that says "1 missing · 2 to do". That is a diagnosis, not an invitation. Every leader here (Linear's onboarding checklist, Raycast's first-launch walkthrough, Notion's empty-page prompts, Arc's first-run) gives the newcomer one ordered list of 2 to 3 steps and ticks them off. The app already has the data to do this (the health model knows chat log / character export / storage export state), so a "Set up in three steps" window on the first empty Session, with the three fix plaques in order and a tick as each one lands, costs no new data.
3. **The rail's status marks are unexplained.** The small amber triangle on Vendors/Storage/Character/Statehelm and the red square on Session/Combat/Files in `?sim=nolog` (`index.html` `.mark`, `app.css:181`) carry meaning only if the player has read DESIGN.md → Data health. There is no legend and no tooltip in the capture. Linear's sidebar badges are counts; Apple's are counts. A 10 px shape with no number is a mystery mark to a newcomer.
4. **The theme control is duplicated** (shell bar `index.html:40-44` and About popover `app.js:4889-4890`). Harmless, but it is one of only three controls in the shell bar and a newcomer reads it as important. It belongs in About (or the Reminders panel) only; the shell bar should hold scope, location, health and Reminders.
5. **The fan-made line sits in the shell bar as a permanent 13 px sentence** ("fan-made, not affiliated with Elder Game", `index.html:28-32`). The commitment is right; the placement makes it the second thing read on every page load. Leaders keep legal lines in About/footer. Keep it in the rail foot (already there) and About; drop it from the bar.

Nielsen scores (shell): visibility of status 4, match with real world 4, control & freedom 2 (no back from a sub-state except the hash), consistency 3, error prevention n/a, recognition over recall 2 (eight unlabelled-by-purpose tabs), flexibility 3, aesthetic/minimalist 2, help 1 (no onboarding, no legend).

---

## 3. Session (`#session`)

Evidence: `session-dark-1440.png`, `session-day-1440.png` (4,275 px); spec DESIGN.md → Views → Session.

**What works**
- The finding is the best sentence in the app: one bold figure, one skill, one death note, 75ch max (`app.css:195`). This is Stripe-grade summary copy.
- At a glance: four label-over-value cells, lead by weight not size (DESIGN.md "At-a-Glance Allowance"). Correct and restrained.
- The XP chart is a single gold line on a dark ground with two axis labels. Quiet, legible, no chart junk.
- Quiet windows on a zero day ("No level-ups yet today. Trainers don't keep office hours, so neither does this list.") are exactly the game's register.

**Findings**
1. **Ten windows in one scroll, all at the same visual rank** (`index.html:116-184`: At a glance, Here, Experience, XP by skill, Level-ups, Councils, Combat, Loot, What happened, Chat log). The page is 4,275 px. Only Experience gets the "primary" centred-title treatment (`app.css:230-235`); the other nine share one title weight, so the eye has no second level. Cognitive-load checklist: fails "chunking" (10 siblings), fails "progressive disclosure" (everything open), passes "single focus" only because the finding is good. Leaders: Linear's issue view is one column of ≤ 4 sections with the rest behind disclosure; Apple Health's Summary is favourites first, then "Show all". Fix shape: At a glance + Here + Experience stay; XP by skill / Level-ups / Councils / Combat / Loot / What happened / Chat log become a tabbed or collapsible lower deck with the four most-read open by default and the rest remembered in `pgdash.open`.
2. **Two different "Combat" blocks on two different pages.** The Session page has a Combat window (deaths/kills, `index.html:153-157`) and the rail has a Combat view. Same word, different content, a newcomer will open the wrong one. Rename the Session block "Deaths and kills" (that is its content) and leave the meter as Combat.
3. **The Here window is a second table on the first screen** (`session-dark-1440.png` y≈330-860): four NPC rows with "Buys …" and "Loves …" sub-lines, favor, councils, storage. It is useful but it is a Vendors + Storage digest inside Session, and it pushes Experience, the view's primary window, below the fold at 1440 × 900. Either Here becomes a one-line strip ("Ilmari Desert · 91,276 councils at 4 vendors · 10 slots free · next refill Urzab 5 d 22 h · Open") with the table behind a disclosure, or it moves under Experience.
4. **The margin repeats what the footers already said.** On Session the two warn plaques, their evidence paragraphs ("Since then you visited Rahu, Casino and Serbule, where your vaults are. You've searched your storage 9 times since it, so vault contents have likely moved. You've picked up 426 stacks of loot since it, so Slots Free is lower than shown.") and the "Also checked" list total about 1,000 px of column. The Storage evidence sentence is 3 lines of reasoning the player did not ask for on the Session page; the fix is one line. Keep the evidence behind the plaque (hover/expand), show the fix.
5. **Councils window sub-copy is a paragraph** ("Spending isn't written to the chat log, so this is what came in, not what's left. On hand at the character export of 29 Oct 21:40: 439,798. 3 h old · VIP menu → Export Character JSON"): three ideas, two of them caveats, in 13 px under four figures. One caveat per window, and the age/fix belongs in the footer that already exists directly below it.
6. **Daylight is a faithful inversion, with one lapse**: the chat log stays a dark window inside a light page (by design, DESIGN.md → Colors → Daylight). In `session-day-1440.png` that dark block at y≈2,680-3,300 is the heaviest thing on the page and it holds three lines of chat. A dark well that large for three lines reads as an error. Cap its min-height to content (+ one empty line) in Daylight, or give it the light chrome and keep only the feed lines dark.

Scores: hierarchy 6, density 5, empty states 8, copy 8.

---

## 4. Vendors (`#vendors`)

Evidence: `vendors-dark-1440.png`, `vendors-day-1440.png` (4,170 px).

**What works**
- The khaki pane with icon, favor tier, "Left of cap" with a coin, share-of-cap bar and reset timer is the one place the app looks like the Recipes window the brief points at, and the data model (councils left, counted resets) is unique and well presented.
- "Where to sell" (five bars) and "What they buy" (type chips with k-abbreviated councils) are good secondary answers.
- Area groups fold; the fold summary row ("Statehelm 12 vendors · 125,000") is scannable.

**Findings**
1. **The same warning is drawn nine times on one screen.** With the character export at warn (3 h), `vendors-dark-1440.png` shows the amber triangle + "3 h old" on: the finding suffix, all four At a glance labels, the At a glance footer (twice), the Where to sell footer, the What they buy footer, the Sell footer (twice), and the margin note; plus the rail mark and the pill. PRODUCT.md principle 5 says "Healthy is quiet"; the corollary is that *warn* should be said once per view. Linear shows a stale-sync badge once, in the header. Fix: the stamp/pill and the margin carry the age; At a glance labels carry it only when bad (missing/broken), footers say "Character export · 3 h ago" in plain dim text without the triangle.
2. **Four windows before the primary one.** At a glance, Where to sell, What they buy and Sell (`index.html:247-272`) all precede the Vendors pane (`:273-291`), which starts at y≈1,000. The view's question ("where can I still sell") is answered by the pane; the Sell planner is a 26 Oct feature that now sits between the answer and its table. Put Sell after the pane, or make it a tab of the pane ("Vendors / Sell plan").
3. **The Sell window's lead paragraph has four clauses and a two-line caveat in 13 px** ("Sell 3 stacks to Helena Veilmoor for about 5,043 councils. 49 pieces of gear in your bags are your call (about 92,072 at vendors). The other 78 stacks stay." then "only gear, books, documents and scrolls are offered for sale; materials, ingredients and the like are assumed to have a use (mark a type Sell in By item to sell it anyway). worn gear can't be told from carried in the export."). The caveat also starts lowercase twice. One sentence, one caveat, sentence case.
4. **102 vendor rows with no row limit.** Four areas open by default (DESIGN.md), which is ~40 rows at 36 px, then 14 folded areas, then a total. That is a reasonable default; the problem is that the header toolbar (search, All areas, Hide drained, `index.html:280-285`) is not sticky, so after one scroll the filter is gone. Stripe's and Linear's tables keep the filter bar pinned.
5. **Column header "Left ▾" is the only sort affordance and it is dim 13 px** (`app.css:353`). Sortable headers are indistinguishable from unsortable ones until hovered. Apple's and Linear's tables underline or arrow every sortable header.

Scores: hierarchy 6, density 5, scannability 7, colour 4 (amber everywhere), copy 6.

---

## 5. Storage (`#storage`)

Evidence: `storage-dark-1440.png`, `storage-day-1440.png` (viewport 1440 × 2400; the full page is tall enough that CDP's full-page capture timed out twice: 28 vaults plus the Items table).

**What works**
- The finding ("507 slots free. Otis, Qatik and Ragabir and 3 more are full. Merging split stacks would free 50 more.") answers the question in one line.
- "Where there's room" as a two-column bar list by area is the best secondary block in the app: scannable in one second, no table needed.
- The slot strip (filled / free / unknown cells, `app.css:419-422`) is the one micro-graphic that feels like the game's inventory grid and it carries real information.

**Findings**
1. **A provenance tag on every row.** Each vault row carries a pill ("from favor", "typed in by you", "fixed size", "from your stats") next to the Slots figure (`storage-dark-1440.png` x≈600-680). 28 pills of 13 px outlined text in a khaki table is the densest thing on the page and the information is the same for 22 of the 28 rows. Make the default silent and tag only the exceptions ("typed in by you", "unknown"); the margin's "Vault sizes" note already explains the rule.
2. **The number input for manual sizes sits inline in the table** (the "33", "9", "46" fields). It is the app's only write action and the only form control in a khaki pane; it looks like a filter. The margin note tells the player to "type it in the Slots column", which is right, but the field has no label and no affordance beyond a border. Give it a placeholder ("size?") and a visible focus/edit state, or move editing behind a pencil on hover like Notion's inline properties.
3. **"By merging ▲ 3 h old"**: the amber mark on the merge figure in At a glance is on a derived number whose source is the same export as the lead figure; the one mark on Slots Free says it. (Same §4.1 repetition.)
4. **Daylight pane**: the khaki (`--pane: #CDBB95`) against the warm-grey window (`#E9E6E1`) has less contrast than in dark; the pane measures 1.51:1 against the window (4.29:1 in dark), so in Daylight the khaki no longer reads as an inset surface, only as a tint; the "primary" centred title bar no longer separates from it. Add a 1 px `--pane-rule` frame around the pane in Daylight.

Scores: hierarchy 7, density 6, scannability 7.

---

## 6. Character (`#character`)

Evidence: `character-dark-1440.png` (2,289 px), `character-day-1440.png`.

**What works**
- The Skills pane (level, bonus, progress bar, %, XP to go, sorted by level) is a clean ledger and the "Show all 122 skills" fold keeps it to 12 rows.
- Currencies as a 3 × 3 label-over-value grid with "5 at zero" folded is exactly the right density.
- The export picker line ("Robchew · 29 Oct 21:40 (newest) · Elf · last area Eltibule · exported 29 Oct 21:40 · Open the file") is honest provenance in one line.

**Findings**
1. **Five windows of reference data with equal weight** (Skills, Currencies, Stats, Active quests, NPC favor). This is the one view where a tab strip would help and the markup already has one (`index.html:376-378` `.ctabs`, hidden at 1440). Show the tabs at every width; the `grid2` pairing (`app.css:218`) of Currencies+Stats beside Quests+Favor makes two unrelated scroll columns that end at different heights (the accepted `ragged-row` WARN in DESIGN.md), which at 1440 reads as unfinished.
2. **The finding leads with the least important fact.** "Weapon Augment Brewing is 50 XP from level 34" is the closest skill, but the lead figure in At a glance is Councils 439,798 with an amber mark. The question in DESIGN.md is "where does my character stand, and which skills are close?"; the first screen says "money, warn". Lead with the skill that is closest to a level and the highest skill; Councils belongs on Vendors.
3. **Margin noise from alts.** "Raspby has no exports · Raspby logged in 1 time since 21 Oct and has no exports yet · Next time you play Raspby: VIP menu → Export Character JSON and Export Storage JSON" and "Partial export · 2 d ago · An older partial export is ignored; a newer good one is in use." are two info notes about things that need no action today. They push the fold. Fold info-severity notes into "Also checked" by default.
4. **Stats shows 12 of 63 under six 13 px group captions** (Selling, Favor, Inventory, Work orders, Vitals, Movement, Identity). The captions are bold 13 px in the same colour as the values' labels, so the grouping is weak; a 1 px rule or 4 px more gap above each caption would do it.

Scores: hierarchy 5, density 6, scannability 6.

---

## 7. Files, Teleports, Statehelm

**Files** (`files-dark-1440.png`, 2,921 px): a three-column JSON inspector (file list pane, Contents tree, margin). It is well built (path breadcrumb, Copy path / value / link, Expand all, keyboard hints, the "in use / open / alt / partial" tags). It is also a developer tool at the same rank as Session in the rail. The finding ("95 files: 39 exports, your vault sizes, 8 game data files (v490, 22.8 MB) and 37 chat logs (83.9 MB) …") is a sentence no player asked for. Keep the view, reach it from About → "Inspect the files" and from every footer's source name (the Fights footer already links "Open the log"), and take it out of the primary rail.

**Teleports** (`teleports-dark-1440.png`, 3,956 px): 15 windows (one lead window + 14 zones), **each with the identical footer** "Project: Gorgon wiki · fetched 29 Oct 22:04 · confirmed there as of 28 Mar 2025 · codes rotate after major updates · Refresh". Fifteen copies of one provenance line is the signature move turned into wallpaper, and 14 "Refresh" buttons do the same thing. One footer on the lead window; the zone windows are sections of one list. Second finding: the zone the player is in (Eltibule, with the "you're here" chip) is **folded** while Anagoge Island, Serbule Hills and Serbule are open (`teleports-dark-1440.png` y≈240-1,400). DESIGN.md says "the zone you are in first"; first and closed is not the same as first and open. The monospace code boxes themselves are good: large, copyable, unmistakable.

**Statehelm** (`statehelm-dark-1440.png`, 4,502 px, the longest page): "Your trainers" is eight stacked sections, each with a − / + counter, a sentence, a per-trainer item table and a "Stop tracking" link, followed by "Pick trainers", a 44-row checkbox table. The counter control ("− 2 of 5 +") is the one stepper in the app and it is the right control. Findings: (a) the lead line under the window title is a 13 px three-line paragraph about Prodigy Potential and Monday US Eastern; one sentence belongs in the finding (it already is), the rest in the margin; (b) trainers with nothing to give ("Nothing in your bags or vaults matches what Smoke Tail likes") take the same height as trainers with three items; collapse them to one row; (c) the 44-row picker is open by default under the tracked list, so the page is 4.5 k px for an eight-trainer ritual; fold it behind "Pick trainers (8 of 44)".

---

## 8. Combat (`#combat`): the grandmother test

Evidence: `combat-dark-1440.png` (3,908 px), `combat-day-1440.png` (4,166 px), `crop-party.png`, `crop-breakdown-notes.png`, `walk/combat-nolog.png`, `walk/everyone.png`; markup `static/index.html:189-241`; copy `static/app.js:1591-1596` (everyone line), `:1629` (Discord state), `:1666-1667` (Party empty state), `:1893` (zero finding); spec DESIGN.md → Views → Combat.

### 8.1 What the page is, top to bottom, as a newcomer meets it

1. Title row: a three-line finding paragraph.
2. At a glance: Per second last fight · Damage · Fights · Kills · Damage taken.
3. **Fights**: a 35-row khaki table (Time, Length, Damage, Per second, You, Pets, Kills, Fought), a total row, "Show 3 skirmishes…", footer with "Open the log".
4. **Breakdown**: the picked fight: a 3-figure glance row, the per-second chart, By ability (7 bars), What hit you (4 rows), By enemy (table, 6 columns), **three lines of 13 px caveats** about damage over time and unsourced ticks, and a footer that says party members' hits are not in it. Two buttons in its title bar: "Copy for Discord", "Post fight to Discord".
5. **Party** (starts at y≈2,780 of 3,908): code field, Copy code, Leave, "joined 18:54" · Change channel, Remove, "[Status] Connected: fights post to the channel you picked (webhook "gorgon-notes")" · "Fighting now in Ilmari Desert: Robchew 162/s" · "Every fight also goes to the everyone's fights page, where anyone can see runs without a code · 130 fights sent today. Stop sending" · "3 fights · 1 min 5 s fighting · 8,889 damage · 2 kills" + Session select + rust **Post session to Discord** · a per-player table · "Fights" sub-list of six party fights each with its own "Post fight to Discord" text link · "Show 147 fights nobody else was in" · footer "Party room · gn-z4g5yhyzj3h9 · last message 00:39 · 359 fights sent / Fight numbers and character names go to the party room; anyone with the code can read them".

That is four sharing mechanisms (party code room, everyone's page, Discord per fight, Discord per session) and two copy mechanisms, in one window, under 2,700 px of tables, with no heading that says "share" and no step order. The newcomer's question ("how do I see my friends' damage next to mine?") is answered by none of the first four screens.

### 8.2 Findings, ranked

1. **The plug-and-play path is at the bottom of the longest column.** The Party window is the only thing on the page a newcomer cannot work out from the game itself, and it is last (`index.html:213`). The everyone's-fights page, which is the actual zero-setup answer ("open it, your fights are already there"), is a 13 px dim sentence with a text link inside that window (`app.js:1596`). Raycast puts "Connect" first in every extension; Linear's integrations are a settings page with one row per integration and a status chip. Fix shape: a **Share** window as the second window of the page (after At a glance, before Fights), two rows, each a sentence, a status chip and one button:
   - "Everyone's fights · your fights go there on their own · 130 sent today · ok" → [Open the page] (primary); the Stop sending link stays, dim.
   - "Discord · posts fights and sessions to the channel you picked (gorgon-notes)" → [Post the last session] / [Change channel].
   - The party code becomes a third row only when it still matters ("Party code gn-… · live numbers side by side · 2 in the room") or folds under "More ways to share".
   The per-player session table and the per-fight list stay, under the Share rows, as "Party today".
2. **Nothing on the page tells a newcomer it is a damage meter, or that it needs nothing from them.** The zero state is "No fights today. The meter starts with your first hit." (`app.js:1893`), which is good once you know what "the meter" is. The `?sim=nolog` state shows a title, a red "missing" stamp, two "Needs the chat log." windows and the Party window with a code field and a rust "Connect Discord" button (`walk/combat-nolog.png`): the loudest control on an empty page is the one thing the newcomer should *not* press first. The first-run Combat page should be one window: "Gorgon Notes measures your damage from the chat log. 1 Turn on Save Chat Logs (Settings → V.I.P.) ✓/✗ · 2 Fight something · 3 Your fights appear here and on everyone's fights page, no code needed." with the one fix plaque that is still needed. Discord and party code appear after the first fight exists.
3. **The finding is a paragraph, not an answer.** "691,141 damage in 31 fights today, 785 a second while fighting. Best: 3,479 a second at 23:57, over 18 s. Your pets did 27% of it. Died 5 times. Counted from 23:45 yesterday: that run was still going at midnight, when the game starts a new log." Six facts and a footnote in the view's one sentence (DESIGN.md's own rule is "one question, biggest block, one sentence"). Meters everywhere (Details!, Recount, FFLogs, PGCombatTracker) lead with *one* per-second number. Lead: "**785** damage a second today, over 31 fights. Best fight 3,479/s at 23:57." Pets, deaths and the midnight note belong in At a glance subs and the footer. While fighting, the "Fighting now: 189 damage a second…" form is right; make the number the lead figure in At a glance at 22 px, not the fourth cell.
4. **Breakdown's caveats outweigh its content.** Under By enemy, three lines of dim 13 px (`crop-breakdown-notes.png`): "Direct hits by name; damage over time from your log after your first hit on that enemy. The game's autopsy lists health and armor apart; this adds them." / "Damage over time (2,336) is every tick on an enemy after you or a pet first hit it, from your log; the game doesn't name a tick's source, so a party member's DoT on the same enemy is in it too." / "Ticks on enemies before you hit them, not counted: 200." plus the footer "Party members' hits aren't in your log; the Party window below puts their copies' numbers beside yours." Four caveats for one table. They are all true and all belong in one "How this is counted" disclosure or the margin, not under every fight.
5. **Two Discord buttons in the Breakdown title bar at equal weight** ("Copy for Discord", "Post fight to Discord", `index.html:208`) plus a third rust "Post session to Discord" in Party plus six "Post fight to Discord" text links in the party fight list. Nine Discord affordances on one page. One primary post action per surface; Copy becomes a secondary item next to it.
6. **"Leave" and "Remove" side by side with no object** (`crop-breakdown-notes.png` row 2-3). Leave leaves the party code; Remove removes the Discord channel. A newcomer reads Remove as "remove me". Label the object: "Leave party code", "Disconnect Discord".
7. **"Stop sending" is a destructive text button at the end of an informational sentence** (`app.js:1596`). It turns off the zero-setup feature in one click with no confirmation, and it is dim 13 px so the player who wants it cannot find it either. A labelled secondary button or a toggle in the Share row.
8. **35 fight rows open by default, no cap.** Linear's and Stripe's lists page or virtualise; the game's own windows scroll inside a fixed frame. The Fights pane should show the last 10 with "Show all 35" (the skirmish fold already exists as a pattern, `data-dminor`), so Breakdown and Share are one screen down, not three.
9. **The everyone's fights page (`walk/everyone.png`) is the better newcomer surface and it is a separate site.** It has one lead sentence ("192 fights from 2 players in the last 24 hours, grouped into 12 runs. Last fight received just now."), one toolbar, and one window per run with a 7-column table. It is calmer than the app's Combat page. Its own issues: the run window header mixes the title with a stats line in the same tan ("Povus Caves · 29 Oct 23:45 to 00:29 (30 Oct 00:29) (43 min 54 s)" is three timestamps for one run); every run repeats the Player/Health/Armor/Damage/Per second/Share/Kills header; Health and Armor are two columns most players never read before Damage, so Damage (the bold column) is the fourth cell; the bar under the player name has no scale. Reorder Damage · Per second · Share first, fold Health/Armor into a tooltip, and give the page a one-line "this is every Gorgon Notes user's fights; yours appear automatically" explainer for the friend who was sent the link.
10. **Live state has no motion or colour cue.** The "now" tag chip on the live row (`combat-dark-1440.png` first row) and the "Fighting now" wording are the only signals that the page is live. A meter's whole point is liveness; a 2 px pulse on the chip or the per-second figure (reduced-motion safe) would do it; the game's own HUD uses blinking for "in combat".

### 8.3 Grandmother flow, as it should read

Open app → Combat tab (or Session, with a "Combat" link in its deaths/kills window) → one window: "Your damage meter. Save Chat Logs is on ✓. Fight something and your fights appear here and on **everyone's fights** (link) on their own." → first fight closes → the finding becomes "785 a second, 1 fight" and the Share window shows "Sent to everyone's fights ✓ · [Open]". Discord is a second row with one button: "Post to Discord" → opens Discord's own picker. No code, no paste, no Join unless they scroll to "More ways to share". Every step she needs is one window, in order, with the one button that moves her forward in rust and everything else dim.

Scores (Combat): hierarchy 4, density 3, affordance 4, empty state 4, copy 5, liveness 5. Overall Combat 4/10 for a newcomer, 7/10 for the owner who built it.

---

## 9. Cross-cutting: type, spacing, colour, components, themes, accessibility

### 9.1 Typography (score 7)
Five sizes (13 / 15 / 16 / 20 / 22, DESIGN.md → Typography; `app.css:85, 125, 194, 228, 242`), one face (Carlito), tabular figures. That discipline is leader-grade and it is why the tables read well. Two problems:
- **Nothing on any page is bigger than 22 px**, by rule (the game's cap). On a meter page that means the live per-second number, the one figure the player glances at from across the room, is the same size as the h1 and smaller than a Raycast list row. The brief does not forbid one exception; the game itself paints floating combat numbers larger than any chrome text. Allow one "readout" size (28 to 32 px, tabular, weight 400) for the lead figure of Combat's At a glance and the live DPS only.
- **13 px carries too much.** Footers, stamps, column headers, chips, tags, caveats, group captions, rail labels and the fan-made line are all 13 px dim (`--text-dim: #A88E78` measures 5.68:1 on `--window` and 4.87:1 on `--footer`; both pass AA text). Because so much is 13 px dim, the dim layer has no hierarchy of its own: a footer with the fix in it looks like a footer with nothing in it. The fix text already gets the alert colour; the caveat paragraphs (Breakdown, Councils, Sell) should not share the footer's size and colour.

### 9.2 Spacing and rhythm (score 7)
4 px base, 16 px between windows, 12 px window padding, 32/36 px rows (`app.css:189, 218, 226, 240, 353-354, 384`). Consistent everywhere I measured. Two rhythm faults: (a) `grid2` pairs end at different heights (Character, Session Councils/Combat), which the accepted `ragged-row` WARN explains but the eye still reads as a broken grid; equalise the pair heights or stack them; (b) every window has a 32 px footer even when it says nothing new, so the page's vertical rhythm is title-body-footer-gap × 10, and the footers (the signature move) stop registering by the third window.

### 9.3 Colour (score 5)
- The palette is right for the brief: brown-black chrome, tan titles, one gold data hue, khaki pane, status colours only for status. Healthy *is* quiet: on an all-ok view the only colour is gold bars and tan titles.
- **Warn is not quiet.** With one export 3 h old, amber appears 9 to 12 times per view (§4.1) and the rust fix plaque, the most saturated surface in the system (`--rust: #782A18`, `app.css:14, 479-487`), is drawn twice in the margin of every view. In Daylight (`*-day-1440.png`) the plaques are the darkest objects on the page. A fix plaque is a call to action; two of them on every one of eight views, for a 3-hour-old export the player cannot refresh until they are next at a vault, is a shout. The plaque should appear when the fix is *possible now* (the health model already knows "Not now" and prints it under each plaque); otherwise a dim one-line "To refresh: VIP menu → Export Storage JSON".
- The dark-red selected row in the khaki pane (`--sel-bg: #421206`, `app.css:15`) is the one high-contrast moment on Combat and it is correct: it marks the fight the Breakdown is showing.

### 9.4 Component consistency (score 7)
- Window, title bar, footer, pane, chips, tabs, buttons, inputs are one family and used consistently across eight views. Good.
- Two title-bar styles (left-aligned, and centred-with-notch for "primary", `app.css:230-235`) are a real second level, but only one window per view gets it and on Combat it is the Fights table, not the thing a newcomer needs.
- **Buttons**: `.btn` (outlined), `.btn.primary` (rust), `.linkbtn` (text), `.chip`, `.plaque` (rust block). Five button looks. "Stop sending" (linkbtn), "Refresh" (linkbtn in a footer), "Show all 122 skills" (link), "Check again" (btn), "Connect Discord" (primary), fix plaques (primary-coloured blocks that are also buttons). The rust colour means "primary action" and "warning fix" at once; those are different intents and Linear/Stripe never share a colour between them.
- **Tags/pills**: "now", "in use", "alt", "partial", "typed in by you", "from favor", "same enemies", "same party", "you", "you're here", "reset" all use one outlined 13 px pill. Fine as a family, but the Storage table (§5.1) shows what happens when a tag is applied to every row.
- Sort affordance only on hover (§4.5).

### 9.5 Daylight (score 7)
Faithful: every token has a Daylight twin (`app.css:28-50`), the khaki pane stays, chat log and Contents stay dark by rule. Problems: the dark chat-log well on Session (§3.6); the rust plaques louder than anything (§9.3); and the Daylight segmented control in the shell bar is the only place where the active segment is a light pill on light ground with no border, which is below the 3:1 non-text contrast line (`app.css:140-142`; measured: `--window` on `--well` is 1.16:1 in Daylight and 1.14:1 in dark, so the checked pill is invisible in both themes and only the label colour carries the state). Add a 1 px `--control` border to the checked segment.

### 9.6 Accessibility (score 7, on inspection of markup and tokens; no audit run)
- Roles and labels are thorough (`role="tablist"`, `aria-labelledby` on every window, `aria-live` state lines, `sr` labels on inputs, `aria-current` on rail and Files rows).
- Contrast: text tokens are chosen at 4.5:1 and documented (DESIGN.md → Contrast). The two weak spots are non-text: the theme control's checked state (above) and the 10 px rail marks, which carry severity by colour and shape but have no text alternative in the capture.
- Touch: 44 px rows on phone by rule; the Statehelm − / + steppers and the Storage inline inputs are 32 px.
- Motion: none; `prefers-reduced-motion` is moot and the live state has no motion cue (§8.2.10).

---

## 10. Empty and first-run states (`?sim=nolog`, `?sim=noexport`, `?sim=stale`)

Evidence: `session-nolog-1440.png`, `session-noexport-1440.png` (3,965 px), `session-stale-1440.png` (4,864 px), `walk/combat-nolog.png`, `combat-nolog-1440.png`, `vendors-noexport-1440.png`, `storage-noexport-1440.png` (see §11 for the last three).

**The first-run page is the nolog page.** A fresh install with chat logging off lands on Session (`pgdash.tab` default) and sees, in one 1440 × 1000 viewport: the finding "No chat log to read, so there's no session to show. Turn on chat logging and this fills in as you play." (good), then **ten windows that each say "Needs the chat log."** with a red square and "missing" in every footer and "Settings → V.I.P. → Save Chat Logs" in red in seven of them, plus the fix plaque in Experience, plus the margin's red "Chat log · missing" with the same path, plus the pill "1 missing · 2 to do", plus red marks on three rail items. One missing setting is stated **about twenty times in red on one screen**. DESIGN.md's own rule ("one plaque per view") is honoured; the footers are what multiply it.

This is the opposite of what a newcomer needs. Linear's empty project is one illustration and one sentence and one button. Raycast's first run is three screens, one choice each. Apple's Health with no data is one card: "Set up". The fix here is not new copy (the copy is fine) but structure: when the chat log is missing, Session should render **one** window ("Set up", the Experience plaque, the "Not now / checked just now" line) and hide the other nine (they already hide their footers in the quiet zero-day state, DESIGN.md "Quiet windows on a zero day"; the same rule should apply to the missing-source state). Same for Combat: the Fights/Breakdown "Needs the chat log." pair collapses into the one set-up window, and the Party window waits for the first fight.

**`?sim=noexport`** is handled better: Here says "Needs the character export: favor and vendor councils come from it." once, the session data still shows, and the margin has the two missing plaques. The problem is that the two plaques are identical in size and colour to the warn plaques of a 3-hour-old export, so "missing" and "slightly old" look the same; only the margin's red square vs amber triangle differ. Missing deserves the plaque; old deserves a line.

**`?sim=stale`** (3 d): the finding gets an amber suffix, At a glance labels get "▲ 3 d old", the Here window gets both export ages in its footer, the margin gets two plaques. Correct and consistent with the live 3 h state; it inherits the repetition problem (§4.1).

**Loading states**: `combat-1440-dark.png` from the first (aborted) capture shows the Combat page mid-load with the finding already set to "No chat log to read, so there's nothing to measure…" while every footer says "Chat log · reading…". For two to three seconds on every cold open the page tells a player with a healthy log that there is no log. The finding should say "Reading the chat log…" until `/api/combat` answers (the At a glance already has loading bars for this).

Scores: empty states 4 (structure), 8 (copy).

### 8.4 Combat addendum from the sim states
- `combat-noexport-1440.png`: with no exports at all, the Combat pill reads "2 missing" and the margin shows two red "missing" plaques (Export Character JSON, Export Storage JSON) **on a view that reads only the chat log**. DESIGN.md → Review decisions ("Warn and bad items are listed on every view, so the pill can never hide something to act on") is the cause. For a newcomer on Combat it means the first two red things on the page are about data the meter does not need. The pill and the plaques should be filtered to the view's own sources (the margin already knows `views: [...]` per item, `/api/health` `items[].views`); other views' problems can be one dim line: "2 things to do on Vendors and Storage".
- `combat-nolog-1440.png`, `combat-nolog-day-1440.png`: the empty Combat page holds three rust blocks, Connect Discord (`index.html:227`, `.btn.primary`) being the largest in the main column, and two export plaques in the margin. The only block that matters (Save Chat Logs) is the one in the margin's first note. In Daylight the three rust blocks are the only saturated colour on a page of warm grey and they all look like "do this first".

### 10.1 The one first-run pattern that already works
`vendors-noexport-1440.png`: Vendors with no character export hides At a glance, shows the three secondary windows as one-line "Needs a character export." stubs, and puts **one sentence and one plaque inside the primary pane** ("Vendor caps come from your favor in the character export." + Export Character JSON). The finding says "No character export for Robchew yet, so there are no vendor caps to show. Export once and this fills in." That is the structure the Session and Combat nolog pages should copy (one window, one sentence, one plaque), with the three stubs and the duplicate margin plaque removed. Its remaining fault is the margin: the Character export fix is repeated there as a red text line and the Storage export plaque appears although Vendors needs it only for Slots Free.

`vendors-nolog-1440.png`: Vendors with no chat log shows three rust plaques in the margin (Save Chat Logs, Export Character JSON, Export Storage JSON) and a red pill "1 missing · 2 to do" over a page whose main numbers are all fine (the Vendors pane comes from the export). The chat log matters to Vendors only for "visited since the export" evidence; a missing log should not be the first red thing on a Vendors page.

`storage-noexport-1440.png` follows the Vendors pattern (finding "No storage export for Robchew yet, so there's nothing to count. Export once and this fills in.", one sentence and one plaque in the Vaults pane, three one-line stubs) and has the same leak: the margin repeats the Storage fix as a red line under a second plaque for the character export. `storage-nolog-1440.png`: the first red item on a Storage page whose every number is fine is "Chat log · missing" with a Save Chat Logs plaque, because the pill and margin are global (§8.4).

---

## 11. Phone (390 × 844, device emulation, secondary surface)

Evidence: `session-dark-390.png` (5,284 CSS px, about 13 screens), `combat-dark-390.png` (6,579 CSS px, about 16 screens), `crop-phone-session-top.png`, `crop-phone-combat-top.png` (1:1 crops of the first 950 CSS px). The remaining phone captures were stopped once these two confirmed the pattern; headless `--window-size` cannot go below 500, so every older "390" screenshot in `design/screenshots/` is the left 390 px of a 500 px viewport (ROADMAP already notes this).

1. **The health strip is the first two screens of every view on a phone.** DESIGN.md → Responsive says the strip is "one line when everything is ok, auto-expanded with fixes inline when anything is warn or bad". With two 3-hour-old exports, auto-expansion puts both rust plaques, both evidence paragraphs, the chat-log note and the "Also checked" list (about 900 CSS px) **above At a glance**. On Combat the live meter is a full screen and a half down. A phone glanced at between pulls should show the number first. Collapse the strip to its one line ("▲ 2 to do · Show") unless something is *bad*; the pill in the top bar already says it.
2. **Eight items in a 390 px tab bar.** The spec wrote the bar for five items at 78 px each; it now holds eight at about 48 px, so "Statehelm" truncates to "Statehel…" and "Teleports" touches its neighbours (`crop-phone-session-top.png`, y≈800). This is the same ranking problem as the rail (§2.1): a phone bar should hold four plus "More".
3. **The finding wraps to five lines at 390** (Combat) because it carries six facts (§8.2.3). On a phone the one-figure version matters even more.
4. What works: the stacked windows keep their footers readable, the two-line table rows (DESIGN.md < 640 rule) read well, tap targets are 44 px, the "Check again" button is first-class. The phone is a reasonable secondary surface once the strip and the bar are fixed.


---

## 12. Scores against the leaders (1 to 10)

Calibration: 10 = Linear's issue view or Apple Health on their best screen; 8 = Stripe Dashboard's home; 6 = a competent internal tool; 4 = a working proof of concept. The brand brief is the frame: a "generic dashboard" answer (cards, big KPIs, a blue sidebar) would be a *lower* score here, not a higher one.

| Dimension | Score | Why, in one line |
|---|---|---|
| Visual hierarchy | 5 | One good finding per view, then 5 to 15 windows at one rank; the primary window is rarely the one the question needs. |
| Information density | 4 | 3,900 to 4,900 px pages; 35-row tables open; every window footered; 28 provenance pills in one table; 15 identical footers on Teleports. |
| Typography scale | 7 | Five sizes, one face, tabular figures, 75ch findings; capped at 22 px so the live meter figure cannot lead; 13 px dim carries too many roles. |
| Spacing rhythm | 7 | 4 px grid honoured everywhere; ragged `grid2` pairs and footer-after-every-window flatten the rhythm. |
| Colour (healthy is quiet?) | 5 | Healthy *is* quiet. Warn is not: 9 to 20 amber/red repeats per view, two rust plaques on every view, the rust colour shared between "primary action" and "fix". |
| Component consistency | 7 | One window family used identically across eight views; five button looks and one pill for eleven meanings are the leak. |
| Affordance of controls | 5 | Sort only on hover; inline size inputs look like filters; Leave/Remove without objects; Stop sending as dim text; theme control's checked state at 1.16:1. |
| Empty states | 5 | Copy is 8/10 (the game's voice, exact fixes); structure is 3/10 (ten "Needs the chat log." windows, Connect Discord on an empty meter). |
| Copy length and tone | 7 | Findings are excellent; caveats are paragraphs (Breakdown ×4, Councils, Sell lead); About/fan-made line in the bar. |
| Scannability | 6 | Khaki panes and bar lists scan well; the Combat page and Statehelm do not; filter bars are not sticky. |
| Answers its question in 3 s | 6 | Session, Vendors, Storage: yes. Combat: no (paragraph finding, sharing at the bottom). Character: the wrong fact first. Files/Teleports: the question is a developer's or a wiki's. |
| First-run / onboarding | 2 | None exists; the nolog page is twenty red marks; no legend for the rail marks; eight equal tabs. |
| Brand brief (looks like Elder Game shipped it) | 8 | The strongest dimension: type, palette, density, footers, voice. The rust plaque block is the one element the game would never draw twice per screen. |

**Overall: 5.6 / 10** for a newcomer, 7 / 10 for the owner. The 7.5 target is reachable without a redesign: the brief, the palette, the type and the data model are already at 8; what is missing is editing (fewer, ranked windows), one first-run surface, and the Combat page turned inside out.

## 13. The three changes that move the score most

1. **One first-run window per view, and warn said once.** (+1.0) Collapse the missing-source state to one window (sentence + plaque), as Vendors already does; filter the pill and the margin plaques to the view's own sources; show the rust plaque only when the fix is possible now ("Not now" is already computed) and otherwise one dim line; drop the amber mark from every At a glance label and footer when the stamp already carries it. Files: `static/app.js` health rendering (`verdicts`, `setFoot`, `ageMarkOf`), `static/app.css:479-487`. This single change also makes the game-window brief stronger: the game never repeats a warning.
2. **Combat inside out: Share second, Fights folded, one number first.** (+0.8) Finding becomes one figure ("785 a second today, 31 fights"); At a glance's lead figure gets the one 28 to 32 px readout size and a live pulse; a Share window (Everyone's fights → Open; Discord → Post / Change channel; party code folded under "More ways") moves to second position; Fights shows 10 rows with "Show all 35"; Breakdown's four caveats become one "How this is counted" disclosure; Leave/Remove get objects. Files: `static/index.html:189-241`, `static/app.js:1591-1775, 1893`, DESIGN.md → Views → Combat.
3. **Rank the navigation and the page.** (+0.6) Rail in two groups (Play: Session, Combat, Vendors, Storage / Reference: Character, Teleports, Statehelm; Files under About), a legend or count on the rail marks; each view keeps At a glance + primary window open and folds the rest into a remembered lower deck (`pgdash.open` already exists); Teleports and Statehelm lose their per-section footers and open the section the player is in. Files: `static/index.html:53-89`, `static/app.css:166-186, 218`, per-view render functions in `static/app.js`.

Together these take the newcomer score to about 7.5 and the owner score to about 8 without touching the palette, the type, the footers as a concept, or a single data contract.

## 14. What to keep, explicitly

- The finding sentence pattern and its voice. Do not shorten it into a KPI.
- The khaki pane, the slot strip, the coin, the centred primary title with its notch.
- Window footers as provenance (one per window; the concept is right, the count is wrong).
- The everyone's fights page's calm: it is closer to the target than the app's own Combat page.
- The Daylight theme as a token-for-token twin.
- Carlito, five sizes, tabular figures, 75ch.

Questions skipped: this is a subagent report with no user channel; the three changes above are the recommended order, and the orchestrator decides what to improve next.
