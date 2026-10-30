# Problem A, final spec: first run, setup, navigation, page ranking

30 Oct 2026. Base: the **grandmother** design (`A-grandmother/SPEC.md`), the three judges' grafts applied and their rejects removed, resolved into one spec. Repo at `68f89da`; line numbers are into `static/index.html`, `static/app.css`, `static/app.js`, `server.py`, `DESIGN.md` at that commit (re-verified for this document). Live facts used: `/api/health` on 30 Oct 02:23 (chat-log ok → `session, combat, statehelm, files`; `combat-logging` ok, `views []`; `game.log` served; `settings.combatLog.*` served), `/api/combat` (`combatLines 7616`, `lastCombatAt`), `/api/session`.

Everything in the brief's "decisions already taken" is kept as given and not restated. Mockup of the one state no runner-up screenshot showed correctly (the winner's Setup window with the calm first run applied): `A-FINAL/mock-session-fresh.html` → `A-FINAL/shots/mock-session-fresh-1440.png`, `-390.png`, `-theme-daylight-1440.png`. Every other state is as the grandmother mockups show it, with the edits in §0.

---

## 0. Where the judges disagreed, decided

| Question | Decision | Why (one line) |
|---|---|---|
| Rail marks: bad only (minimal) or warn + bad (grandmother, leader) | **warn + bad, own sources only, never on the current view, never for a never-seen source** | the owner needs one cross-view cue for a stale export; a fresh install needs none |
| Deck defaults on Session: all folded (grandmother) or XP by skill + What happened open (minimal) | **XP by skill + What happened open; Here opens itself when the zone has a vendor you sell to or a vault of yours** | three judges grafted it; day-30 glance needs no click |
| `grid2` pairs on Session: JS "pair when both open" (grandmother) or drop (leader) | **drop `grid2` on Session; every deck window is full width** | one code path; folded bars side by side read as a layout accident |
| Once-per-view guards: module sets reset in `renderAll` (grandmother, minimal) or stateless (leader) | **stateless**: `plaqueNow(v)`, `setFoot(id, l, r, { primary })`, `srcFix(src, when, { primary })`, `plaqueInView` | `combatRound` (`app.js:1368`) bypasses `renderAll`, so anything reset there is stale on Combat after 2 s |
| "Hit something" diagnosis: client rule over `combatLines` (grandmother) or a server verdict (minimal, leader) | **server verdict `combat-lines`** (additive); client falls back to the pending form only when the verdict is absent | one verdict list drives every surface (DESIGN.md → Data health); the hedged VIP sentence is data, not a client guess |
| "Not yet" glyph: dashed ring (minimal) or plain ring (leader) | **one new glyph `shape('todo')`: the ok ring, dashed, `icon-taupe`, label "Not yet"** | a plain ring reads as an unticked checkbox; one glyph, not two |
| Window title "Set up" or "Setup" | **"Setup"** | the count "0 of 1 done" reads cleanly after a noun |
| Margin note beside a Setup window: full evidence (grandmother) or title + status + pointer (judges 1, 3) | **title + status + one line of evidence without the path + "Set up: the steps are in the window to the left."**; the folder path moves to the Setup window's footer | the path lives in exactly one place; the Off-row labels are said once (Setup step 2) |
| Where the Combat partial "Off now" list lives | **Setup row 2, step 2** ("Off now: …"); the margin note says "2 of 7 rows Off" and points | one fact, one place |
| Elsewhere line on the phone strip | **inside the strip's notes, hidden while the strip is collapsed**; the strip header stays one line | the header is the one line the phone chrome adds |
| Old-server wording | body "Needs a newer Gorgon Notes."; finding (when the view's primary is old) adds leader's reason sentence once | one sentence of why, said where the view fails, not in every footer |
| `pgdash.open` key for the deck | **`pgdash.open['deck-<view>']`**, an array of open window ids, through `saveOpen` | per-view arrays fit `saveOpen(table, open)` as written |
| Setup window on Statehelm (minimal) | **never**; also never on Teleports, Files | the trainer list works with nothing |

---

## 1. The Setup window

### 1.1 When it shows

```js
const NEEDS = { session: ['chat-log'], combat: ['chat-log', 'combat-logging', 'combat-lines'],
                vendors: ['character-export'], storage: ['storage-export'], character: ['character-export'] };
const notDone = src => { const v = V(src);
  if (!v) return src === 'combat-lines' ? false : true;                                  // old server: no verdict = not done (except the optional row)
  if (src === 'combat-logging') return v.severity === 'warn' || v.severity === 'bad';   // partial counts as not done on Combat
  if (src === 'combat-lines')   return v.severity !== 'ok';                             // pending or the VIP symptom
  return isMissing(v); };                                                               // bad with no age: never seen, or seen then gone
const setupNeeded = view => (NEEDS[view] || []).some(notDone) && !(S.loading && !S.healthAt);
```

`setupNeeded(view)` true → the view's main column renders **only** the title row and `#w-<k>-setup`; At a glance and every other window are `hidden` (no "Needs the chat log." stubs, no in-pane plaque). A warn export never opens it (stale is a line, not a setup state). On Combat the window also shows while `combat-logging` is warn or `combat-lines` is not ok **with the data windows below it** when fights exist (`c.totals.fights > 0`): the Setup window sits first, Fights follow; At a glance stays. When every needed row is ok the window is not rendered; the system line says what landed (`[Status] Chat log found: today's log. Session fills in as you play.`; the export line exists at `app.js:5729`) and `flashView()` runs. No toast, no animation.

Re-entry: About → "Show the Setup checklist again" (`#<view>?setup=1`): `showView` forces `renderSetup(view)` above the normal windows for that visit only (`S.setupForced = view`, cleared on the next view change; never persisted). Every row is then in its done/undone state.

Re-render paths that flip rows by themselves (no new polling): `healthRound` 30 s (`app.js:5621`), `tailRound` 2 s on a login/export line, `onExportLines` 1.5 s after `Saved report to`, `combatRound` 2 s on Combat, and the plaque (`checkAgain(fixKey)`, `app.js:5690`).

### 1.2 Markup

```html
<section class="win" id="w-s-setup" aria-labelledby="t-s-setup" hidden>
  <header class="win-bar primary"><h2 id="t-s-setup">Setup <span class="count" id="s-setup-count">0 of 1 done</span></h2></header>
  <div class="win-body">
    <div class="setup-row [done|wait]" data-step="chat-log">
      {shape}                                            <!-- todo ring · warn triangle · ok ring-check · bad square (seen-then-gone or broken) -->
      <div class="st"><b>Save Chat Logs</b><span class="when">the game's settings say it's off</span></div>
      <div class="un">Unlocks … (the gloss, said here only)</div>
      <ol>…numbered in-game steps, game labels in <em class="t">…</em>, only on the open row…</ol>
      <button type="button" class="plaque" data-fix="chat-logging" aria-label="Save Chat Logs. In the game, steps 1 to 4. Then press here to check."><span class="p1">Save Chat Logs</span><span class="p2">In the game, steps 1 to 4 · then press here to check</span></button>
      <p class="vip">…optional 13 px dim note…</p>
    </div>
    <p class="setup-later">Nothing else is needed for this page. … This window folds away when …; find it again under About.</p>
  </div>
  <footer class="win-foot"><span class="fl">Chat log · none yet · looked in ~/Library/…/ChatLogs, which doesn't exist</span><span class="fr">Reads the game's settings file, so a change shows within 30 s</span></footer>
</section>
```

Ids: `w-s-setup`, `w-d-setup`, `w-v-setup`, `w-t-setup`, `w-c-setup`. CSS: `A-grandmother/mock.css` "Set up window" block plus `.shape.sev-todo { color: var(--icon) }` and `.setup-row .st .when.warn { color: var(--alert) }`. Rows: exactly one row is **open** (steps + the plaque); done rows collapse to their first line (`.done`: ring-check, label 400 dim, status); rows after the open one are `.wait` (todo ring, label dim, the `.un` line only). The plaque is the view's only plaque (`plaqueInView = fixKey` is set by `renderSetup`, so `noteHtml` never draws a second). No "Not now" on a Setup row. `.plaque` max-width 440 px. Phone: the footer's path shortens to its last folder ("looked in …/ChatLogs, which doesn't exist") so the footer stays two lines.

Footer left per view: `Chat log · none yet · looked in {evidenceData.looked}{, which doesn't exist}` (Session, Combat while row 1 is open); `Chat log · live · last line 01:32 · settings file saved 01:12` (Combat, rows 2 and 3); `Character export · none yet · looked in {reportsDir}` (Vendors, Character); `Storage export · none yet · looked in {reportsDir}` (Storage). Footer right: `Reads the game's settings file, so a change shows within 30 s` when `health.settings.readable`, else `Can't read the game's settings file, so only the files themselves are checked`; on the export views `Checks by itself every 30 s`. No colour, no fix.

### 1.3 Rows per view and the closing line

| View | Rows (order) | `.setup-later` |
|---|---|---|
| Session | 1 Save Chat Logs | "Nothing else is needed for this page. Vendors, Storage and Character each need one export from the game's VIP menu; they ask when you open them. This window folds away when the log appears; find it again under About." |
| Combat | 1 Save Chat Logs · 2 Combat Logging · 3 Hit something | "Nothing else is needed for the meter. This window folds away with your first hit; find it again under About." |
| Vendors | 1 Export Character JSON | "Sell also needs Export Storage JSON; Storage asks for it." (only while `storage-export` is missing) + "This window folds away when the export lands; find it again under About." |
| Storage | 1 Export Storage JSON | "Vault sizes and favor come from Export Character JSON; Vendors asks for it." (only while `character-export` is missing) + the fold line |
| Character | 1 Export Character JSON | the fold line |

### 1.4 Exact copy, every state

Allowed in-game labels (nothing else, until ROADMAP:19 closes): "Save Chat Logs", the "Chat Logs" section, "GUI tab on current clients (it was under V.I.P. before April 2026)", "Settings → V.I.P. → Combat Logging", the seven "Log when…" rows, "Log non-damaging abilities", "VIP menu → Export Character JSON / Export Storage JSON".

```js
const STEPS = {
  'chat-logging': ['In the game, open <em class="t">Settings</em>.',
                   'Open the <em class="t">GUI</em> tab. <span class="dim">(Before April 2026 this was under V.I.P.)</span>',
                   'Under <em class="t">Chat Logs</em>, tick <em class="t">Save Chat Logs</em>.',
                   'Log out and back in. The log file appears then.'],
  'chat-logging-relog': ['Log out and back in. The game starts the log file at login.'],
  'combat-logging': ['In the game, open <em class="t">Settings → V.I.P. → Combat Logging</em>.',
                     'Set every <em class="t">Log when…</em> row to anything but Off.{offNow}',   // {offNow} = ' <span class="dim">Off now: {labels joined by " · "}.</span>'
                     'Tick <em class="t">Log non-damaging abilities</em>.'],
  'export-character': ['In the game, open the <em class="t">VIP menu</em>.', 'Press <em class="t">Export Character JSON</em> while fully logged in, not right before logging out.'],
  'export-storage':   ['In the game, open the <em class="t">VIP menu</em>.', 'Press <em class="t">Export Storage JSON</em>.'],
};
const COMBAT_ROW_LABEL = { MeAttackEnemy: 'Log when I attack enemies', PetAttackEnemy: 'Log when my pets attack enemies',
  EnemyAttackMe: 'Log when my enemies attack me', EnemyAttackPet: 'Log when my enemies attack my pets',
  MeIndirectlyDamaged: 'Log when I am healed or take indirect damage', PetIndirectlyDamaged: 'Log when my pet is healed or takes indirect damage',
  EnemyIndirectlyDamaged: 'Log when my others are healed or takes indirect damage' };   // the game's wording, typo included
```

**Row "Save Chat Logs"** (`data-step="chat-log"`). `.un`: "Unlocks Session and Combat. The game writes your chat to a text file as you play; Gorgon Notes reads that file and nothing else."

| Sub-state (server facts) | shape | `.when` | steps | plaque p1 / p2 |
|---|---|---|---|---|
| A never seen, settings unreadable or `LogChat` unknown | todo | "waiting for the game" | `chat-logging` 1 to 4 | "Save Chat Logs" / "In the game, steps 1 to 4 · then press here to check" |
| B never seen, `LogChat 0` | todo | "the game's settings say it's off" | 1 to 4 | same |
| C never seen, `LogChat 1`, no file | todo | "on in the settings · no log file yet" | `chat-logging-relog` as the whole list | "Log out and back in" / "Then press here to check" |
| D seen then gone (`isMissing && !neverSeen`) | bad square | "missing" (red) | 1 to 4 | same as A |
| E done (`chat-log` ok or warn) | ok | "on · being written" (warn: "on · silent since 20:58") | none | none |
| F game not running (`game.running === false`) in A to D | as above | as above | shown | **no plaque**; `.vip`: "Next time you're in game: steps 1 to 4. This page notices by itself." |

**Row "Combat Logging"** (`data-step="combat-logging"`, Combat only). `.un`: "Unlocks the meter: damage, per second, kills, what hit you. Each row is one kind of hit the game writes to the log." `.vip` (open states): "This section is on the V.I.P. tab, so it most likely needs VIP. No log-out needed: the game reads these rows as you fight."

| Sub-state | shape | `.when` | steps | plaque |
|---|---|---|---|---|
| G row 1 not done | todo (`.wait`) | "after Save Chat Logs" | none | none |
| H settings unreadable | todo | "settings file couldn't be read" | 1 to 3 | "Combat Logging" / "In the game, steps 1 to 3 · then press here to check" |
| I N rows Off and/or `LogNonAttacks 0` (`combat-logging` warn) | warn | "2 of 7 rows Off" (amber) / "Log non-damaging abilities off" / both joined by " · " | 1 to 3, step 2 with `{offNow}` | same |
| J done | ok | "every row on" | none | none |
| F' game not running in H/I | as above | as above | shown | no plaque; `.vip` gains "Next time you're in game: steps 1 to 3." |

**Row "Hit something"** (`data-step="combat-lines"`, Combat only).

| Sub-state | shape | `.when` | `.un` |
|---|---|---|---|
| K rows 1 or 2 not done | todo (`.wait`) | "waiting for the first combat line" | "The meter starts with your first hit and fills in by itself from then on. Your fights then go to everyone's fights by themselves, no code needed." |
| L rows done, `combat-lines` info (no line yet) | todo | "the log is growing, no combat line yet" | same, plus the verdict's evidence as a dim line: "The log holds 1,204 lines today and no combat line yet." |
| L' `combat-lines` warn (the VIP symptom, §5) | warn | "no combat line in 20 min of play" (amber) | same `.un`, plus the verdict's evidence: "The log grew by 2,310 lines since you logged in and none is a combat line. The game writes combat lines for VIP accounts; if you have VIP, check the Combat Logging rows above." No plaque (row 2 holds it when open; when row 2 is done the margin draws none either: nothing to press) |
| M ok (`combatLines > 0`) | the window is gone | | |

**Rows "Export Character JSON" / "Export Storage JSON"** (Vendors, Storage, Character). `.un` character: "Unlocks Vendors and Character, and the vault sizes on Storage. An export is a snapshot the game writes from its VIP menu; it goes stale as you play, and the page says when." Storage: "Unlocks Storage and the Sell plan on Vendors. A snapshot of every vault, from the VIP menu."

| Sub-state | shape | `.when` | steps | plaque |
|---|---|---|---|---|
| N never seen, logged in | todo | "none yet" | `export-character` / `export-storage` | "Export Character JSON" / "In the game: VIP menu · then press here to check" (Storage: "Export Storage JSON" / same) |
| O never seen, logged out or game closed | todo | "none yet · next time you're in game" | shown | no plaque; `.vip`: "Next time you're in game: VIP menu → Export Character JSON. This page notices by itself." |
| P seen then gone | bad | "missing" (red) | shown | as N / O |
| Q partial only (`partial-export` bad) | bad | "the last one came out partial" | step 2 reads "Export again while fully logged in, not right before logging out." | "Export Character JSON again" / "In the game: VIP menu · then press here to check" |
| R done | ok | "seen 21:30" | none | none |

**Title row while a Setup window shows.** Stamp line 2 is amber (`warn`) "set up below" for never-seen sources; red "missing" for seen-then-gone.

| View, state | Finding | Stamp l1 / l2 |
|---|---|---|
| Session A, B, F | "Nothing to show yet. Turn on **Save Chat Logs** in the game and this fills in as you play." | "No chat log yet" / ▲ "set up below" |
| Session C | "Nearly there: the game says chat logging is on, but no log file has appeared. Log out and back in." | same |
| Session D | "The chat log is gone. Turn on **Save Chat Logs** in the game again and this fills in as you play." | "No chat log found" / ■ "missing" |
| Combat A, B, F | "Nothing to measure yet. Turn on **Save Chat Logs** in the game and the meter starts with your first hit." | "No chat log yet" / ▲ "set up below" |
| Combat I | "Almost there: 2 of the 7 **Combat Logging** rows are Off in the game, so those hits never reach the log. Turn them on, then hit something." (one row: "1 of the 7 … is Off …"; `LogNonAttacks` only: "Almost there: **Log non-damaging abilities** is off in the game, so buffs and heals won't be in the log. Turn it on, then hit something.") | the chat stamp ("Live from today's chat log" / "last line 01:32"); the amber lives in the pill |
| Combat L' | "The chat log is growing but has no combat line yet. If you have been fighting, see the note below." | chat stamp |
| Vendors N, O | "No character export for Robchew yet, so there are no vendor caps to show. Export once and this fills in." (unchanged) | "No character export yet" / ▲ "set up below" |
| Storage N, O | "No storage export for Robchew yet, so there's nothing to count. Export once and this fills in." (unchanged) | "No storage export yet" / ▲ "set up below" |
| Character N, O | unchanged finding | "No character export yet" / ▲ "set up below" |

Shell copy on a fresh install: `#who` "No character yet" (dim); `#where` "Location shows once the chat log is on" (replaces "Location not known without a chat log", `app.js:5504`).

**Check again on a Setup view** (`app.js:5715-5722`), replies: no file → `[Error] Still no chat log file. [The game's settings file still says chat logging is off.] Steps 1 to 4 in the Setup window, then press Save Chat Logs there.`; `LogChat 1` and no file → `[Warn] Save Chat Logs is on; the file appears at your next login. Log out and back in, then check again.`; export missing → `[Warn] Nothing new. In game: VIP menu → Export Character JSON, then check again.` (logged out: the "Next time you're in game" form); a row flips → the existing `[Status] … loaded.` lines and `[Status] Chat log found: today's log. Session fills in as you play.`

### 1.5 Calm first run (the colour rule)

```js
const neverSeen = v => !S.seen[v.source];       // S.seen = store.json('pgdash.seen', {}) ∪ { 'chat-log': !!health.game?.log }
// computeVerdicts(): for every verdict with ageSec != null → S.seen[source] = true; persisted to pgdash.seen (not in a preview: PREVIEW.active skips the write and ?sim=fresh|nolog|noexport force neverSeen for the simmed sources)
```

| Surface | never seen (`isMissing && neverSeen`) | seen then gone (`isMissing && !neverSeen`) or broken |
|---|---|---|
| Setup row, margin note | todo ring, "to set up" / "none yet" | red square, "missing" |
| stamp line 2 | amber ▲ "set up below" | red ■ "missing" |
| pill | info ring, "1 to set up" | red ■, "1 missing" |
| rail mark | none | red square, title "…· needs the chat log" |
| tab title | no badge | "(!) " |
| favicon | taupe | red |

Red therefore appears on a fresh install **nowhere**; the one rust object is the plaque, the one amber is the stamp. `headerLine` (`app.js:449-459`) gains the `setup` count: parts in order "N to set up", "N missing", "N broken", "N to do"; `SHAPE_LABEL.todo = 'Not yet'`.

### 1.6 Read-aloud acceptance (unchanged from the winner, re-checked on the final mockup)

Session fresh: "Session. Nothing to show yet. Turn on Save Chat Logs in the game and this fills in as you play. No chat log yet, set up below. Setup, zero of one done. Save Chat Logs: the game's settings say it's off. Unlocks Session and Combat. … One, in the game, open Settings. Two, open the GUI tab. Three, under Chat Logs, tick Save Chat Logs. Four, log out and back in. Button: Save Chat Logs, in the game, steps one to four, then press here to check. Nothing else is needed for this page." ~80 words before the button, one red thing, zero unknown words that are not the game's own labels. 1440: the window ends at y = 570 of 900; 390: the plaque is above the bar.

---

## 2. Rail, foot, phone bar, About

### 2.1 Desktop rail (`index.html:53-89`, `app.css:165-186`)

```html
<nav class="rail" aria-label="Views">
  <div class="rail-items">
    <div class="rail-grp" role="group" aria-label="Play"><span class="rail-gl" aria-hidden="true">Play</span>
      <a class="ri" href="#session" data-view="session" title="Session: what today earned">…<span class="mark" data-mark="session"></span></a>
      <a class="ri" href="#combat" data-view="combat" title="Combat: your damage, fight by fight">…</a>
      <a class="ri" href="#vendors" data-view="vendors" title="Vendors: who can still pay you">…</a>
      <a class="ri" href="#storage" data-view="storage" title="Storage: where there is room">…</a>
      <button type="button" class="ri more" id="morebtn" aria-haspopup="dialog" aria-expanded="false" title="Character, Teleports, Statehelm, Files, About">…<span>More</span><span class="mark" data-mark="more"></span></button>
    </div>
    <div class="rail-grp ref" role="group" aria-label="Reference"><span class="rail-gl" aria-hidden="true">Reference</span>
      <a class="ri" href="#character" data-view="character" title="Character: skills, currencies, favor, quests">…</a>
      <a class="ri" href="#teleports" data-view="teleports" title="Teleports: Teleportation Machine codes, from the wiki">…</a>
      <a class="ri" href="#statehelm" data-view="statehelm" title="Statehelm: weekly gifts to trainers">…</a>
    </div>
  </div>
  <div class="rail-foot">
    <a class="rf" href="#files" data-view="files" title="Files: the files the app reads, as they are">{18 px page glyph}<span>Files</span></a>
    <button type="button" id="aboutbtn" aria-haspopup="dialog" aria-expanded="false" data-fan-aria><span class="fan">fan-made</span><span class="ab">About</span></button>
  </div>
</nav>
```

CSS: `.rail-grp { display: contents }` (so the phone bar's `flex: 1` cells keep working); `.rail-gl { font-size: 13px; line-height: 1; color: var(--text-dim); text-align: center; padding: 10px 0 2px }`; `.rail-grp.ref .rail-gl { border-top: 1px solid var(--rule); margin-top: 6px }`; `.rail a.ri, .rail button.ri { height: 56px }` (was 60; seven cells + two labels + the foot fit 824 px at 900 tall and 692 at 768); `.rail button.ri` copies `a.ri`'s layout, no border/background; `.rail .ri.more { display: none }`; `.rail-foot { display: flex; flex-direction: column; padding: 4px 0 8px }`; `.rail-foot a.rf { … min-height: 44px; font-size: 13px; color: var(--text-dim) }` (from `A-grandmother/mock.css`); the active Files state is `a.rf[aria-current="page"]` in `selection-gold`. `VIEWS`, `VIEW_TITLE`, routing, `pgdash.tab`, the Mac shortcuts: untouched (`app.js:10-11`, `5552-5565`).

**Marks** (`renderShellHealth`, `app.js:594-598`): per view, `viewItems(view).listed.filter(v => (v.severity === 'warn' || v.severity === 'bad') && !(isMissing(v) && neverSeen(v)))`, skipped when `view === S.view`; worst shape; the item's `title` and `aria-label` append the reason built from the worst mark verdict: ` · 1 to do: character export 3 h old` / ` · needs the chat log` / ` · 2 to do`. The `more` button carries the worst mark of the views it holds and `aria-current="page"` when one of them is open.

### 2.2 Phone bar (< 768) and the More sheet

`.rail-gl`, `.rail-grp.ref`, `.rail-foot` hidden; `.rail .ri.more { display: flex; flex: 1; height: 56px }`; five 78 px cells at 390. More opens `#morepop` (`openPop('morepop', btn)`, the `.pop` sheet, full screen under 768 by `app.css:583`): sections **Reference** (Character "skills, favor, quests", Teleports "Teleportation Machine codes, from the wiki", Statehelm "weekly gifts to trainers", 48 px rows: icon, name, purpose right-aligned, the view's mark), **Tools** (Files "the files the app reads", About "fan-made · v0.11.0"), **Theme** (the `.seg`, re-enabled inside the sheet: `.more-sheet .seg { display: inline-flex }`), footer `FAN_LINE`. Markup and CSS: `A-grandmother/mock-rail.html` + `mock.css` "More sheet". A `<button>`, never `<a href="#more">` (hash pollution).

### 2.3 About popover (`app.js:4877-4893`)

Sections, in order: the fan-made line + version; **Setup**: "4 of 4 done. Show the Setup checklist again, for a new computer or a friend." (`<a href="#session?setup=1" data-rem="close">`) or while something is undone "1 of 4 done · Show the Setup checklist." (the four: Save Chat Logs, Combat Logging, Export Character JSON, Export Storage JSON, counted from `S.verdicts`); **Where the data comes from**: "VIP exports in Reports/ (Character and Storage JSON) · Inspect the files", "Chat logs in ChatLogs/ (Settings → GUI → Chat Logs → Save Chat Logs; before April 2026 under V.I.P.)", "Game data from cdn.projectgorgon.com, version 490", "The game's settings file, for the logging switches", the Player.log line; **Marks on the rail** (legend, two rows): ▲ "something to do on that page (a number is getting old)", ■ "that page has nothing to read (a file that was there is gone, or broken)"; **Theme** (unchanged); footer unchanged. No file names outside Files.

---

## 3. Page ranking: deck 1 and the lower deck

**Rule.** A view = title row → At a glance (open) → the primary window (open) → the **lower deck**: every other window, full width, folded to its title bar with a one-line summary, in the view's order. The fold is a `<button class="foldh" data-deck="<id>" aria-expanded aria-controls>` in the h2 (the Teleports `.tpfold` pattern generalised; `TRI(open)`), the summary in `<span class="count sum">` (13 px dim, ellipsised, keeps `flex: 1`; the title never wraps). `.win.folded .win-body, .win.folded .win-foot { display: none }` **except** when the window's own source is `bad` (then the footer stays: a missing source is never hidden). A deck with 2+ windows gets the header line `<div class="deck-h"><span>More from today</span><button class="linkbtn" data-deckall="open">Open all</button> · <button class="linkbtn" data-deckall="fold">Fold all</button></div>` ("More" on Vendors/Storage/Character, "Other zones" on Teleports). Open state: `pgdash.open['deck-<view>']` (array of ids) via `saveOpen`; absent → the defaults below. One delegated `#main` click handler for `[data-deck]` / `[data-deckall]`; `data-deck` added to `FOCUS_ATTRS` (`app.js:26-28`). A search inside a folded window (Loot `#lootq`) opens it while the query is non-empty. Summaries carry a plain-text age when the window's source is older than the view's stamp source ("from exports 3 h old"), never a shape or colour.

| View | Open by default | Deck (order) and summaries | Notes |
|---|---|---|---|
| Session | At a glance, **Experience**, XP by skill, What happened | XP by skill "10 skills · Animal Handling 4,571,115" · What happened "13 areas · 6 deaths · last: entered Casino 01:30" · Here: Casino "2 vendors you know · 1 vault · from exports 3 h old" / "nobody you've met, none of your storage" / "needs a character export" · **Deaths and kills** "6 deaths · 2 kills · 7 by your pets" · Level-ups "2 · latest Mycology 61" / "none yet" · Councils "1,837 in · 324 stolen · net 1,513" · Loot "213 items · mostly Sugar" · Chat log "6 of 14 channels · 1,204 lines" | Here opens itself when the zone holds a vendor you sell to or a vault of yours; `#w-s-combat` renamed **"Deaths and kills"** (`index.html:154`; the rail's Combat is then the only "Combat"); the three `grid2` wrappers go (`index.html:140-174`) and the phone `order` overrides (`app.css:663-668`) |
| Combat | At a glance, the primary (Fights until Problem B lands) | Breakdown · Party (Problem B owns its content) | No Party toolbar (`#d-pform`, `#d-dform`, `#d-pnew`) renders until a log and a fight exist (`c.totals.fights > 0`); "Connect Discord" never on an empty meter; the Party "Session" select → "Run" |
| Vendors | At a glance, **Vendors** pane (sticky toolbar) | Where to sell "Serbule 412,000 · Casino 220,000 · 3 more" · What they buy "18 types" · Sell "7 stops · 41 items" | Sell moves under the pane (`index.html:264-272` after `273-292`) |
| Storage | At a glance, **Vaults** (sticky toolbar) | Where there's room "Serbule 48 free · Casino 30 · 4 more" · Stacks to merge "12 merges" · Items "470 stacks" | |
| Character | At a glance, **Skills** (sticky search) | Currencies "councils 439,798 · 6 more" · Active quests "14" · Stats "62" · NPC favor "322 NPCs · 9 Soul Mates" | `.ctabs` (`index.html:376-378`, `app.js:3294, 3457-3460`) removed; the deck is the phone's strip |
| Teleports | **Teleportation Machine** (sticky search), the zone you are in | every other zone folded, "12 landmarks · 20 codes" | one footer, on the lead window; zone windows have none (`app.js:5129-5133`: drop the per-zone `tpFootHtml`); one Refresh |
| Statehelm | At a glance, **Your trainers** | Pick trainers "44 trainers · 3 picked" (open while nothing is picked) | footer on At a glance (exports + chat log) and Pick trainers (game data); Your trainers has none |
| Files | unchanged | | a tool |

**Sticky filter bars.** The primary window's `.toolbar` gets `class="toolbar sticky"`: `position: sticky; top: 44px; z-index: 2; background: var(--window); margin: -12px -12px 8px; padding: 12px 12px 4px` (phone `top: 48px`). Prerequisite: `.win { overflow: clip }` instead of `hidden` (`app.css:223`; Chrome 90+, Safari 16+, WKWebView on macOS 13+, WebView2). Guard: the chat feed, the JSON tree and `.pane` scroll inside their own boxes, so nothing else changes; check the Files Contents window after the swap.

---

## 4. Health scoping, as code

Input: `items[].views` only (live, verified). Server fix §5.1 is a precondition: without it the bad chat-log verdict lists vendors/storage/character and the scoping below still draws a Save Chat Logs note on Storage.

```js
/* app.js:440-447 */
const STAMP_SRC = { session: 'chat-log', combat: 'chat-log', vendors: 'character-export', storage: 'storage-export', character: 'character-export', statehelm: 'storage-export', files: null, teleports: null };
function viewItems(view) {
  const own = v => v.source === 'server' || (v.source === 'vip' && v.severity !== 'ok') || (v.views || []).includes(view);
  const act = v => v.severity === 'warn' || v.severity === 'bad';
  const listed = S.verdicts.filter(own).sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity] || (plaqueNow(b) ? 1 : 0) - (plaqueNow(a) ? 1 : 0));
  const elsewhere = S.verdicts.filter(v => !own(v) && act(v));   // other views' problems: one dim line, never the pill
  const folded = S.verdicts.filter(v => !own(v) && !act(v));     // "Also checked: …"
  return { listed, elsewhere, folded };
}
/* app.js:449-459 */
function headerLine(list) {
  const c = { setup: 0, missing: 0, bad: 0, warn: 0, info: 0 };
  for (const v of list) { if (isMissing(v)) (neverSeen(v) ? c.setup++ : c.missing++); else if (c[v.severity] != null) c[v.severity]++; }
  const parts = []; if (c.setup) parts.push(`${c.setup} to set up`); if (c.missing) parts.push(`${c.missing} missing`); if (c.bad) parts.push(`${c.bad} broken`); if (c.warn) parts.push(`${c.warn} to do`);
  let h = parts.length ? parts.join(' · ') : 'All sources recent'; if (c.info) h += ` · ${plural(c.info, 'note')}`; return h;
}
const worstShape = list => list.some(v => isMissing(v) && !neverSeen(v) || v.severity === 'bad' && !isMissing(v)) ? 'bad' : list.some(v => v.severity === 'warn') ? 'warn' : list.some(v => isMissing(v)) ? 'info' : worstOf(list);
/* app.js:470-486 noteHtml */
const gameOn = () => S.health?.game?.running !== false;
function plaqueNow(v) {
  if (!(v.severity === 'warn' || v.severity === 'bad') || !v.fixKey || !plaqueFor(v.fixKey)) return false;
  if (isSnoozed(v.topic) || (v.source === 'vault-sizes' && storageMissing())) return false;
  if (/^export/.test(v.fixKey)) return loggedIn();                         // an export needs a fully logged-in character
  if (/logging$/.test(v.fixKey)) return gameOn();                          // a setting needs the game open
  return true;
}
// noteHtml: plaque iff plaqueNow(v) && plaqueInView !== v.fixKey && !setupLists(v.source); else one dim .fx line:
//   setupLists(v.source) → 'Set up: the steps are in the window to the left.' (phone: '… in the window below.')
//   !plaqueNow && warn/bad → fixText(v.fixKey, v.fixArgs) (already yields "Next time you're in game: …")
//   ok/info export, chat-logging-ok → 'To refresh: …' / 'If it ever stops: …'; party-sharing / everyone-feed ok/info → nothing (fixes the "Nothing to do but wait" line under a green check, app.js:480)
// The margin draws at most one plaque: a local `let drawn = false` in renderMargin, set by the first note that qualifies; stateless across renders.
// A note for a never-seen source: todo ring, title "Chat log · to set up", evidence without the folder sentence (server evidenceData.short), the pointer line.
/* app.js:487-521 renderMargin: after the notes */
// #melse (index.html:519, between #mnotes and #malso): hidden when !elsewhere.length || setupShowing
// text: `Elsewhere: ${n} to do on ${views as <a href="#view">links</a>, joined ', ' / ' and '}${ageHint}.`  e.g. "Elsewhere: 2 to do on Vendors and Storage (both exports 3 h old)."
/* app.js:583-601 renderShellHealth */
// pill: shape(worstShape(listed)) + headerLine(listed)        (never counts elsewhere)
// title badge and favicon from the CURRENT view's listed: '(!)' and red only when worstShape === 'bad'; '(N)' and amber for warn; nothing for never-seen
// rail marks: §2.1
/* app.js:2168 ageMarkOf (At a glance labels, Here labels): plain text, no shape, no colour; nothing for STAMP_SRC[S.view] */
const ageMarkOf = v => v && (v.severity === 'warn' || v.severity === 'bad') && v.source !== STAMP_SRC[S.view] ? ` <span class="age">${isMissing(v) ? (neverSeen(v) ? 'to set up' : 'missing') : ageWord(v.ageSec) + ' old'}</span>` : '';
/* app.js:524-550 footers */
function setFoot(winId, left, right, opts = {}) { … unchanged body; opts.primary is passed to srcFix by the caller … }
function srcAge(src, label) {   // ages in text-dim; only a seen-then-gone source keeps the red "missing"
  const v = V(src); if (!v) return esc(label);
  if (isMissing(v)) return neverSeen(v) ? `${esc(label)} · none yet` : `${esc(label)} · ${shape('bad', 's13')}<span class="age bad">missing</span>`;
  return `${esc(label)}${v.ageSec != null ? ' · ' + ago(NOW() - v.ageSec * 1000) : ''}`;
}
function srcFix(src, when, opts = {}) {   // the fix sentence once per view: only the primary window's footer, only warn/bad, never while a Setup window lists the source
  const v = V(src); if (!v || !v.fixKey || !opts.primary || setupLists(src)) return '';
  if (v.severity !== 'warn' && v.severity !== 'bad') return '';                       // the ok "If it ever stops" line lives in the margin only
  return `<span class="${v.severity === 'bad' ? 'txt-bad' : ''}">${esc((loggedIn() && when ? when + ' ' : '') + fixText(v.fixKey, v.fixArgs))}</span>`;
}
```
Primary `setFoot` calls (one per view, `{ primary: true }` to `srcFix`): `w-s-xp`, `w-d-fights`, `w-v-pane`, `w-t-vaults`, `w-c-skills`, `w-f-list`, `w-tp-find`, `w-sh-glance`. Experience's footer right is empty on a healthy page (`app.js:796`). `.finding .suffix { color: inherit }` (`app.css:196`): the stale suffix keeps its words, not its colour.

**Net effect.** Vendors with one 3-hour-old export: amber on the stamp and the pill (and the Vendors/Storage/Character rail marks when another view is open); plain "3 h old" in At a glance labels and footers; one fix sentence (primary footer); one plaque (margin). Session with the same exports: nothing amber; Here's summary says "from exports 3 h old"; the margin's Elsewhere line names Vendors and Storage. Fresh install: §1.5.

**Loading before missing** (`app.js:1796-1800`): `const reading = !old && (!c || (S.loading && !S.session)); const noLog = !reading && (!sessionHasLog() || (!!c && !c.log));` and `setupNeeded` is false while `S.loading && !S.healthAt`, so a cold open never flashes "missing" or the Setup window.

---

## 5. Server and Worker contract diff

All additive; old pages ignore unknown sources, old servers leave the client on its fallback (`app.js:308-360` computes chat-log and exports by age, with `views`, so a first run on an old server still gets the Setup window from browser verdicts).

### 5.1 `server.py:3315-3335`, the bad `chat-log` verdict
- `views=["session", "combat", "statehelm", "files"]` on **both** branches (`3331`, `3334`); today they list vendors, storage, character.
- `evidence_data={"looked": str(CHATLOGS), "exists": CHATLOGS.is_dir(), "logChat": settings.get("LogChat"), "settingsSavedAt": saved, "readable": bool(settings.get("readable")), "short": <the evidence without the Looked-in sentence>}` so the client prints the path in the Setup footer and the margin note without it.

### 5.2 `server.py:3464-3494`, `combat-logging`
```python
cl = settings.get("combatLog", {}); lna = settings.get("LogNonAttacks")
on = lambda v: isinstance(v, int) and v > 0            # provisional: 1 ("Chat Window (and log file if enabled)") is taken as writing the file; unverified
off = sorted(k for k in COMBAT_ROWS if not on(cl.get(k)))
ok = bool(cl) and not off and lna == 1
if ok: sev, ev, views = "ok", "Every \"Log when…\" row is on, and so is Log non-damaging abilities.", []
else:
    parts = []
    if off: parts.append(f"{join_labels(off)} {'are' if len(off) > 1 else 'is'} Off, so those hits never reach the log.")
    if lna != 1: parts.append("Log non-damaging abilities is off, so buffs and heals won't be in the log.")
    sev, ev, views = "warn", " ".join(parts) + " The meter counts what the log holds.", ["combat"]
add("combat-logging", sev, "Combat logging", ev, "combat-logging", views=views, server_only=True,
    evidence_data={"off": off, "logNonAttacks": lna, "vipCombatLogging": settings.get("VIP_CombatLogging")})   # VIP_CombatLogging reported, not read for the verdict (provisional: most likely the section's collapsed flag)
```
`COMBAT_ROW_LABEL` (the seven labels of §1.4) lives in `server.py` too, so the evidence string is right for every client. Session's Deaths and kills window keeps its one-line footer note when `evidenceData.off` holds `EnemyAttackMe`, `MeAttackEnemy` or `PetAttackEnemy` (client, from the verdict; `views` stays `["combat"]` so Session's pill never goes amber for a Combat setting).

### 5.3 New verdict `combat-lines` (after `3494`; needs today's `[Combat]` count and the login time, both already computed for `/api/combat` and `game`)
| Case | severity | `at` | evidence | views | fixKey |
|---|---|---|---|---|---|
| any `[Combat]` line today | ok | the first one today | "First combat line 18:44 · 6,965 so far today." | `["combat"]` | none |
| logged in < 20 min, or < 200 lines since login, or `combat-logging` not ok, or logged out | info | none | "No combat line yet today. The log holds 1,204 lines." | `["combat"]` | none |
| logged in ≥ 20 min, ≥ 200 lines since login, zero `[Combat]`, `combat-logging` ok | warn | none | "The log grew by 2,310 lines since you logged in and none is a combat line. The game writes combat lines for VIP accounts; if you have VIP, check the Combat Logging rows above." | `["combat"]` | `combat-logging` |
Title "Combat lines", `server_only`. `/api/combat` unchanged.

### 5.4 Served copy
- `server.py` holds no "Settings → V.I.P. → Save Chat Logs" string (verified by grep); the chat-log evidence's "log out and back in" sentence stays.
- `cloud/src/everyone.html:84`: "Settings → GUI → Chat Logs → Save Chat Logs" and no "server.py" (grep the file; the Worker `cloud/src/worker.js` is untouched by Problem A).
- `docs/API.md`: the `combat-lines` row, the `combat-logging` severity change, `evidenceData` fields.

---

## 6. Copy altitude

### 6.1 Glossary: each term once, where it is first met
| Term | Said once, here | Wording |
|---|---|---|
| chat log | Setup row 1 `.un` | "The game writes your chat to a text file as you play; Gorgon Notes reads that file and nothing else." |
| Combat Logging rows | Setup row 2 `.un` | "Each row is one kind of hit the game writes to the log." |
| VIP | Setup row 2 `.vip`; export row `.un` ("from its VIP menu") | "This section is on the V.I.P. tab, so it most likely needs VIP." |
| export | Setup export row `.un` | "An export is a snapshot the game writes from its VIP menu; it goes stale as you play, and the page says when." |
| everyone's fights | Setup row 3 `.un` | "Your fights then go to everyone's fights by themselves, no code needed." |
| councils, favor tiers, vaults, Slots Free, Statehelm, Teleportation Machine, Prodigy Potential | the game's own words, in tan where they are labels; no gloss, no About → Words | removing beats explaining |
| session (the view) vs a party run | the Party window's select → **Run** (Problem B inherits) | |

### 6.2 Retired from UI copy (grep targets)
| Today | Replacement | Where |
|---|---|---|
| "Needs a newer server.py." / "X need(s) a newer server.py" (`app.js` 35 hits, 27 in UI strings: `264, 290, 862, 984-985, 1063-1064, 1815, 1832-1835, 2315, 2652-2653, 3572, 3641, 3823, 4420, 4990, 5026, 5035, 5086, 5106, 5213, 5252, 5305, 5332`) | body `NEEDS_NEWER = 'Needs a newer Gorgon Notes.'`; footer right "<Window> needs a newer Gorgon Notes"; a finding whose primary window is old adds once: "This window is newer than the part of Gorgon Notes that reads the files: close every Gorgon Notes window, wait a few seconds, and start it again." `NEEDS_SERVER` (`:290`) ends "They need a newer Gorgon Notes." | `app.js`, DESIGN.md footers table |
| "Start it again: python3 server.py" (`app.js:264, 5040, 5088, 5202, 5214, 5307, 5510, 5710`) | "Start Gorgon Notes again." | `fixText('server')`, the down banner, Teleports/Statehelm findings and sys lines; README keeps the real command |
| `python.exe` in `STALE_FIX` (`:4862`) | "end the Gorgon Notes process in Task Manager first" | |
| `GorgonSettings.txt`, `Chat-26-10-30.log`, `Character_….json` outside Files | "the game's settings file", "today's chat log", "the character export of 21:40" | About (`:4885-4886`), the Chat log window footer, Session sys lines; Files keeps real names (`capacity.json` appears only there, `:3573-3647`) |
| "Settings → V.I.P. → Save Chat Logs" (`app.js:255, 256, 278, 796, 4885, 5720-5721`; `everyone.html:84`; `README.md:70`; DESIGN.md `1131, 1147-1148, 1197, 1275, 1284, 566, 762`) | "Settings → GUI → Chat Logs → Save Chat Logs"; the April-2026 note once (Setup step 2, About) | |
| `fixText('combat-logging')` (29 to 40 words, `:261`) | Combat: 'Settings → V.I.P. → Combat Logging: every "Log when…" row not Off, Log non-damaging abilities on.' Session: 'Settings → V.I.P. → Combat Logging: every "Log when…" row not Off. Deaths still count; kills and killers need it.' | the steps live in the Setup row |
| "Location not known without a chat log" (`:5504`) | "Location shows once the chat log is on" | |
| PG_ROOM, ntfy.sh, "party room", webhook, "json block", paste box (`app.js:1627-1694, 1740-1775`; `index.html:233-237`) | Problem B's Party copy ("Private room"; "webhook" only inside the Discord row's technical hint) | B's change list |
| "Not now" under a first-run plaque | removed from Setup rows; stays on margin plaques | `noteHtml` |

### 6.3 Fix wording table (`fixText` / `plaqueFor`, `app.js:249-282`; DESIGN.md → Voice → Exact fix wording)
| fixKey | In game | Logged out / closed | Plaque p1 / p2 |
|---|---|---|---|
| chat-logging | "Settings → GUI → Chat Logs → Save Chat Logs, then log out and back in" | "Next time you're in game: Settings → GUI → Chat Logs → Save Chat Logs, then log out and back in" | "Save Chat Logs" / "In the game, steps 1 to 4 · then press here to check" (Setup); "In game: Settings → GUI → Chat Logs, then log out and back in" (margin) |
| chat-logging-ok | "If it ever stops: Settings → GUI → Chat Logs → Save Chat Logs" | same | none |
| combat-logging | §6.2 | "Next time you're in game: …" | "Combat Logging" / "In the game, steps 1 to 3 · then press here to check" (Setup); "In game: Settings → V.I.P. → Combat Logging" (margin) |
| export-character / export-storage / export-again / vault-size / alt-export | unchanged | unchanged | Setup p2 "In the game: VIP menu · then press here to check"; margin unchanged |
| server | "Start Gorgon Notes again." | | |
| party-sharing / everyone-feed | printed only when warn/bad | | |
| vip | "Exports and Combat Logging live on the V.I.P. tab. Check your VIP status in game." | | |

---

## 7. DESIGN.md rewrites (new text, quoted)

**Layout → Shell → Rail bullet (`:482`)** → "**Rail**, 64 px wide, a floating window at the right edge (Review decisions). Two labelled groups of 56 px cells: **Play** (Session, Combat, Vendors, Storage) and **Reference** (Character, Teleports, Statehelm), 13 px dim labels, a 1 px `rule` above the second. The foot holds two tools: **Files** (18 px glyph + 13 px label, a link to `#files`) and the "fan-made / About" button."

**Layout → Responsive, < 768 row (`:494`)** → "Rail becomes a **sticky bottom tab bar**, 56 px plus safe-area inset, **four Play items and More** (78 px cells at 390). More opens a full-height sheet: Reference views with their purpose and marks, Files, About, the theme control. The health window becomes the **health strip**: one header line always; Show opens the notes, the Elsewhere line inside them."

**Components → Navigation rail and tab bar (`:552-557`)** → replace the item list with the two groups; add: "Every item carries a `title` and an `aria-label` with one purpose clause ("Vendors: who can still pay you") and, when marked, the reason (" · 1 to do: character export 3 h old"). **Status mark**: a 10 px amber triangle or red square for a warn or bad source **feeding that view** (`views[]`), never on the current view (its stamp and pill already say it), never for a source that has never been seen (a fresh install shows no marks). Files has no mark. The legend lives in About."

**Components → Window (`:522`)**, add: "**Folded** (lower deck): the title bar only, a ▶/▼ foldout button in the h2, a one-line summary in `.count.sum` (13 px dim, ellipsised), no body, no footer unless the window's own source is bad. Remembered per window in `pgdash.open['deck-<view>']`."

**New component after Window: Lower deck** → §3's rule paragraph and table, verbatim.

**Components → Buttons → Fix plaque (`:622`)** → "… Appears only for warn or bad notes that need a game action **and only when the action is possible now** (`plaqueNow`: logged in for exports, the game open for settings); otherwise the note shows its one dim line. **At most one plaque per view**: in the Setup window while it shows, else in the margin for the first actionable listed verdict. Line 2 says where and what pressing does; in the Setup window it always ends "then press here to check". No "Not now" in the Setup window."

**Components → Data health → Severity rules → Combat logging row (`:655`)** → "ok: every `combatLog_*` > 0 and `LogNonAttacks 1`. **warn** (views `combat`): any row 0 or missing → "Log when my pets attack enemies and Log when my enemies attack my pets are Off, so those hits never reach the log. The meter counts what the log holds."; `LogNonAttacks 0` → "Log non-damaging abilities is off, so buffs and heals won't be in the log." Provisional, unverified (30 Oct): level 1 ("Chat Window (and log file if enabled)") is taken as writing the file; `VIP_CombatLogging` is not read (most likely the section's collapsed flag) and is reported in `evidenceData.vipCombatLogging`. `evidenceData.off` keeps the keys; the labels are the game's. fixKey `combat-logging`, server only." Add the row **Combat lines (`combat-lines`)** with §5.3's three cases.

**Components → Data health → Margin window, "Filtered per view" bullet (`:670`)** → "**Filtered per view** by each verdict's `views`, full stop: only the sources that feed this view are listed (plus `server`, and `vip` when not ok). Other views' warn and bad items are one dim line with links, "Elsewhere: 2 to do on Vendors and Storage (both exports 3 h old)."; the rest folds into "Also checked: …". The header line counts only the listed items: "1 to set up" (a source never seen), "1 missing" (a source that was there and is gone), "1 broken", "2 to do". A note for a source the view's Setup window lists shows its title, status and one line of evidence, then "Set up: the steps are in the window to the left." and no plaque."

**Components → Data health → Other channels (`:679`)** → "…rail item marks (own sources, not the current view); tab title and favicon follow the **current view's** listed worst: "(!)" and red only for a broken or vanished source, "(2)" and amber for warn, nothing for a source never seen (a fresh install's tab is calm)."

**Components → Data health → Fix sentence rule (new bullet)** → "Amber is drawn once per view: the stamp's second line and the pill. At a glance labels and footers print ages as plain text; the fix sentence appears once, on the primary window's footer, only when its source is warn or bad; the ok "If it ever stops" / "To refresh" line lives in the margin only."

**Components → Preview modes (`:754`)**, two rows → "`?sim=fresh`: nolog and noexport in one load, and every source treated as never seen: the real first-run state. Notice "Preview: pretending nothing is set up. Real data is unchanged." · `?sim=partiallog`: `combat-logging` warn with `evidenceData.off = ["PetAttackEnemy", "EnemyAttackPet"]`, `combat-lines` info. Notice "Preview: pretending 2 Combat Logging rows are Off. Real data is unchanged." `?sim=nolog` and `?sim=noexport` now render the Setup window." Also the Check-again sentence in the nolog row (`:762`) per §1.4.

**Components → States, new bullet** → "**First run (Setup window)**: a view whose needed source was never seen renders one Setup window in place of its windows (Components → Setup window). The stamp says "set up below" in amber; the pill "1 to set up" with the info ring; no red anywhere. "Missing" (red) is reserved for a source that was there and is gone."

**New component after Data health: Setup window** → §1.1 to §1.5, verbatim.

**Voice → Words** → add "Setup", "Deaths and kills", "Run", "to set up"; the retired list of §6.2. **Voice → Format rules (`:1131`)** → "Settings paths: "Settings → GUI → Chat Logs → Save Chat Logs" (moved from V.I.P. on 14 Apr 2026 per the Steam patch note; the in-game look is still open, ROADMAP:19) and "Settings → V.I.P. → Combat Logging" (user's screenshot 27 Oct). Numbered in-game steps appear only inside the Setup window (`STEPS`); everywhere else the short path." **Voice → Exact fix wording (`:1146-1162`)** → the rows of §6.3.

**Views → Window footers (`:1190`)** intro → "`{age}` is plain `text-dim` for ok and warn (the stamp and pill carry amber); red "missing" only for a source that was there and is gone; "none yet" for one never seen. `{fix}` appears on the **primary window's** footer only, when its source is warn or bad. A folded deck window has no footer. Old server: "<Window> needs a newer Gorgon Notes"." Row edits: Session Experience right → empty; Teleports zone windows → "no footer"; Statehelm Your trainers → "no footer"; every "server.py" cell → "Gorgon Notes". Add the Setup window row (§1.2 footer).

**Views → Shell → About popover (`:1265`)** → the §2.3 list. **localStorage** → `pgdash.open['deck-<view>']`, `pgdash.seen`.

**Views → Session (`:1267-1287`)** → windows: 0 At a glance, 1 Experience (primary), then the lower deck in §3's order with XP by skill and What happened open by default; window 8 "Deaths and kills"; the "No chat log" paragraph (`:1284`) → "**First run** (`?sim=fresh`, `?sim=nolog`, or `chat-log` never seen): the Setup window per Components → Setup window; At a glance and every other window hidden; finding "Nothing to show yet. Turn on Save Chat Logs in the game and this fills in as you play."; stamp "No chat log yet" / amber "set up below"; `LogChat 0` known: "the game's settings say it's off" in the row status. A log that was there and is gone: the same window with the red square, "missing", and the finding "The chat log is gone. …"."

**Views → Combat (`:1288-1309`)** → the first-run states (nothing; partial; no combat lines) as §1.4; loading before missing; "no Party or Discord control renders until a log and a fight exist"; the Party "Session" select is "Run".

**Views → Vendors / Storage / Character** → the "No export" paragraphs → "the Setup window per Components → Setup window replaces the stubs and the in-pane plaque"; deck defaults per §3. **Teleports (`:1415-1429`)** → "the zone you are in open, every other folded; one footer, on the Teleportation Machine window; one Refresh". **Statehelm (`:1430-1443`)** → "footer on At a glance and Pick trainers; Your trainers has none; Pick trainers folds once anything is picked".

**Review decisions (`:1468`)**, new dated block "30 Oct" → "**Health is scoped to the view.** Strikes the 23 Oct "Warn and bad items are listed on every view": the pill, tab title, favicon and margin list only the view's own sources (`views[]`); other views' to-dos are the Elsewhere line and the rail marks, so nothing to act on is hidden. · **A fresh install is not broken.** A source never seen is "to set up" (todo ring, amber stamp, info pill, no mark); red is for a source that was there and is gone, or broken (`pgdash.seen`). · **One plaque per view, only when the fix is possible now.** · **Amber once per view**: stamp and pill. · **Rail in two groups; Files is a tool at the foot.** · **Two decks per view**; folded windows are full width and have no footer. · **`.win` clips with `overflow: clip`** so filter bars can stick. · **Combat Logging is a warn on Combat** when any row is Off (provisional rule on `combatLog_* > 0`). · **Save Chat Logs path is GUI → Chat Logs** per the 14 Apr 2026 patch note; the in-game look still closes ROADMAP:19. · **Session's Combat window is "Deaths and kills"**."

---

## 8. File:line change list, in shipping order, with effort

Steps 1 to 9 are client only and ship together with 10 (the `views` fix) in one commit; 11 to 12 the same night; 13 after. Effort: S ≤ 1 h, M 1 to 3 h, L 3 to 6 h.

| # | File:line | Change | Effort |
|---|---|---|---|
| 1 | `server.py:3331, 3334` | bad `chat-log` `views` → `["session","combat","statehelm","files"]`; `evidence_data` per §5.1 | S |
| 2 | `app.js:440-459` `viewItems`, `headerLine`, new `STAMP_SRC`, `neverSeen`, `worstShape`; `:363` `computeVerdicts` fills `S.seen` → `pgdash.seen` (skipped under `PREVIEW.active`); `index.html:518-519` `#melse` between `#mnotes` and `#malso`; `app.css:478` `.elsewhere` beside `.also` | scoping + the Elsewhere line | M |
| 3 | `app.js:583-601` `renderShellHealth` | pill from `listed` with `worstShape`; marks per §2.1 with titles; badge and favicon from the current view, calm for never-seen | S |
| 4 | `app.js:468-486` `noteHtml` + `plaqueNow`; `:524-550` `setFoot`/`srcAge`/`srcFix({ primary })`; `:2168` `ageMarkOf`; `app.css:196` suffix; the eight primary `setFoot` callers; `:796` Experience footer | one plaque, amber once | M |
| 5 | `app.js:147-153` `shape('todo')` + `SHAPE_LABEL.todo`; `:249-282` `fixText`/`plaqueFor` per §6.3, `STEPS`, `COMBAT_ROW_LABEL`, `NEEDS_NEWER`; the §6.2 string list (`server.py` ×27, `python3 server.py` ×8, `python.exe`, file names, `:5504`, `:5720-5721`, `:4885-4886`) | copy altitude | M |
| 6 | `index.html:115, 191, 246, 298, 365` add `#w-<k>-setup`; new `renderSetup(view)` (~150 lines: `NEEDS`, `setupNeeded`, the row tables of §1.4, `plaqueInView`); `renderSession` (`:741-770` finding/stamp, `:772-830` hide windows), `renderCombatView` (`:1796-1836`: `reading` first, Setup branch, hide `#d-pform #d-dform #d-pnew`, no "Connect Discord" on an empty meter), `renderVendors` (`:2262-2263, 2275-2276, 2307-2310`), `renderStorage` (`:2608, 2624-2627, 2655`), `renderCharacter` (`:3234-3242, 3299-3309`); `:5715-5722` Check-again replies; `app.css` "Set up window" block from `A-grandmother/mock.css` + `.sev-todo`; `app.js:59-72, 213-240, 385-400, 5518` `?sim=fresh` and `?sim=partiallog`; `:5553-5560` `?setup=1` | the Setup window | L |
| 7 | `index.html:53-89` rail groups, More button, Files at the foot; `app.css:165-186, 540-555` + the "Rail groups" block; `app.js:4895+` `#morebtn` → `openPop('morepop')`, `renderMore()`; `#morepop` beside `#aboutpop` (`index.html:528`); `:4877-4893` About (Setup section, legend, paths, no file names) | rail + More + About | M |
| 8 | `index.html:154` "Deaths and kills"; `app.js:1053-1090` comment and summary; DESIGN.md | rename | S |
| 9 | Lower deck: `index.html` Session `:121-184` (drop the three `grid2`, `foldh` buttons, `.deck`, `.deck-h`), Vendors `:252-292` (Sell after the pane), Storage `:304-359`, Character `:376-421` (`.ctabs` out), Statehelm `:498-509`; `app.js` `deckOpen(view)`, `saveOpen('deck-'+view, ids)`, the `[data-deck]`/`[data-deckall]` handler, summaries per renderer, Here's auto-open rule, `FOCUS_ATTRS` + `data-deck`; `app.css:887-892` `.tpfold` → `.foldh`, `.win.folded .win-foot`, `:223` `overflow: clip`, `.toolbar.sticky`, `:663-668` remove the Session phone order rules; Teleports `app.js:5118, 5129-5133` (current zone open, no zone footers, one Refresh); Statehelm `:5252` footers, picker folded when picked | ranking | L |
| 10 | `server.py:3464-3494` | `combat-logging` per §5.2 + `COMBAT_ROW_LABEL` | S |
| 11 | `server.py` after `:3494` | `combat-lines` verdict per §5.3 | M |
| 12 | `cloud/src/everyone.html:84`; `docs/API.md` | path, no server.py; the two verdict rows | S |
| 13 | `DESIGN.md` per §7; `README.md:67-75` (GUI path, April note); `windows/README-WINDOWS.txt`; `docs/DESIGN-PROCESS.md` screenshots (`?sim=fresh#session`, `?sim=fresh#combat`, `?sim=partiallog#combat`, `?sim=fresh&theme=daylight#session`, 1440 and 390 via CDP); `docs/ROADMAP.md` Next up + Session log (the three in-game checks of §10) | docs | M |

Total: about two evenings; steps 1 to 5 alone (one evening) already remove every export plaque from Combat and Session and make the fresh install calm.

---

## 9. Proof (PROBLEM-MAP §3.3 instruments) and regressions

Re-run `phase1/domstats.py` on `?sim=fresh`, `?sim=nolog`, `?sim=noexport`, `?sim=partiallog`, live, dark and Daylight, 1440 and 390. Targets: fix string ≤ 2 per page (Setup plaque + margin pointer); Session fresh = 1 window; plaques per page = 1; red objects on a fresh install = 0 (verified on `A-FINAL/shots/mock-session-fresh-*.png`: the plaque is rust, the stamp amber, the pill info, no marks, no "(!)"); export plaques on Combat/Teleports = 0; rail 4 + 3 in two groups, phone bar 5; amber on Vendors with one stale export = stamp + pill (+ marks off-view); first-run Combat primary buttons = 1; Session page ≤ 1,400 px at 1440 with the defaults open.

Regressions to guard: `overflow: clip` (check Files Contents and `.pane` scroll); `viewItems` scoping hides a bad export on Session (Here's summary and the Elsewhere line are the guards; `deliverMoments` reads `S.verdicts`, unchanged); `combatRound` re-renders Combat without `renderAll` (nothing module-level is reset; §0); deck defaults with `pgdash.open` absent; a search in a folded Loot window opens it; `.rail-foot` hidden under 768; old server 404 → browser verdicts still carry `views`; `?sim=*` never writes `pgdash.seen`; the Reminders ladder and the Session Combat window's info footer unchanged.

---

## 10. Still unverified (copy hedges until the in-game look)

1. Save Chat Logs under Settings → GUI → Chat Logs on today's client (four pieces of evidence; ROADMAP:19 open). The copy states only "GUI tab (before April 2026 under V.I.P.)".
2. `combatLog_* == 1` writing the file; `VIP_CombatLogging` as a section flag. The server treats 1 as on and does not read the VIP key; both marked provisional in DESIGN.md and `evidenceData`.
3. VIP needed for `[Combat]` lines: only the `combat-lines` warn sentence says it, hedged. One non-VIP friend's log settles it.
4. The logged-out variants of the Setup window (F, O) are specified, not mocked; shoot them with `?sim=fresh` once built (the game is closed most evenings, so they will be the first real screenshots).
