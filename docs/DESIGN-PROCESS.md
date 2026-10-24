# How the redesign was made

Record of the overnight redesign of 22 to 23 Oct 2026. An autonomous agent run did all of it while the user was asleep, so no interview took place. This file explains how the current UI came about and where each piece of evidence is kept. The spec for the result is **`DESIGN.md`** (repo root), and the product brief is **`PRODUCT.md`**.

**Brief (from the user):** a completely new design whose *only* influence is that it should look like an app Elder Game (Project Gorgon's studio) designed itself. Not a generic dashboard and not generic "fantasy". The product requirement from `docs/DATA-AWARENESS.md` stays: every view must say how fresh its data is and exactly what to do in game to improve it.

## Final screenshots

Real player data, retaken 24 Oct about 02:57 at the final gate of the leftovers pass (Session, Storage and their nolog / noexport / merge states; Vendors and Character from the 02:05 gate of the 23 Oct (night) feature batch) (character Robchew, logged out after midnight, a quiet day with 0 XP; the first set was taken 23 Oct 11:53). Desktop is 1440 x 1000. Phone is a true 390 x 844 device emulation at 2x through CDP (`~/.claude/skills/taste-skill/scripts/lib/cdp.mjs`); `--window-size` cannot go that narrow and makes every view look clipped on the right. All captures have `scrollWidth == innerWidth` and no JS errors.

| View | 1440 dark (default) | 1440 Daylight | 390 dark | 390 Daylight |
|---|---|---|---|---|
| Session | [png](../design/screenshots/session-1440-dark.png) | [png](../design/screenshots/session-1440-light.png) | [png](../design/screenshots/session-390-dark.png) | [png](../design/screenshots/session-390-light.png) |
| Vendors | [png](../design/screenshots/vendors-1440-dark.png) | [png](../design/screenshots/vendors-1440-light.png) | [png](../design/screenshots/vendors-390-dark.png) | [png](../design/screenshots/vendors-390-light.png) |
| Storage | [png](../design/screenshots/storage-1440-dark.png) | [png](../design/screenshots/storage-1440-light.png) | [png](../design/screenshots/storage-390-dark.png) | [png](../design/screenshots/storage-390-light.png) |
| Character | [png](../design/screenshots/character-1440-dark.png) | [png](../design/screenshots/character-1440-light.png) | [png](../design/screenshots/character-390-dark.png) | [png](../design/screenshots/character-390-light.png) |
| Files (24 Oct 12:50 gate; `items.json` open with two items expanded at 1440, the character export with Skills → Unknown expanded and the Contents window scrolled into view at 390) | [png](../design/screenshots/files-1440-dark.png) | [png](../design/screenshots/files-1440-light.png) | [png](../design/screenshots/files-390-dark.png) | [png](../design/screenshots/files-390-light.png) |

Also from the gate (dark only): the Storage No export state [1440](../design/screenshots/storage-noexport-1440-dark.png) / [390](../design/screenshots/storage-noexport-390-dark.png) (`?sim=noexport`: every window says "Needs a storage export.", no vault-size note), the Session no-chat-log state [1440](../design/screenshots/session-nolog-1440-dark.png) / [390](../design/screenshots/session-nolog-390-dark.png) (`?sim=nolog`: Here, Councils and Combat say "Needs the chat log."), the Stacks to merge window scrolled into view [1440](../design/screenshots/storage-merge-1440-dark.png) / [390](../design/screenshots/storage-merge-390-dark.png), and the Councils / Combat pair on the phone [390](../design/screenshots/session-councils-combat-390-dark.png). The Here window is hidden in these captures (logged out after midnight, today's log names no area; its states are in the table below). Files states (24 Oct, 1440 dark, the 422 and 409 ones through a local proxy because nothing may be written into Reports/): [invalid JSON](../design/screenshots/files-invalid-1440-dark.png) (red line with line and column, the "Export Character JSON again" plaque, the row chipped "won't parse"), [file rewritten while open](../design/screenshots/files-changed-1440-dark.png) (amber note with Reload, loaded rows kept) and [no exports](../design/screenshots/files-noexport-1440-dark.png) (`?sim=noexport`: the Exports group's line and one plaque, "Pick a file on the left."). From the 12:50 final gate (live server, dark): the list with the newest character export auto-opened [1440](../design/screenshots/files-list-1440-dark.png) / the pane alone on the phone [390](../design/screenshots/files-list-390-dark.png), [capacity.json](../design/screenshots/files-capacity-1440-dark.png) (six rows, each with "Open in storagevaults.json"), [a file that is gone](../design/screenshots/files-gone-1440-dark.png) (`#files?f=reports%2Fnope.json`: "This file is gone." with Retry, footer "nope.json · gone") and [search](../design/screenshots/files-search-1440-dark.png) ("amethyst" in `items.json`: 23 matches, the hit term bold in each snippet).

![Session, 1440 dark](../design/screenshots/session-1440-dark.png)
![Vendors, 1440 Daylight](../design/screenshots/vendors-1440-light.png)

The health states (`?sim=stale|broken|nolog|noexport|loading|down`, `?shift=72`) were captured during review. See `design/shots/build/sim-*.png`, `design/shots/rev-fidelity/` and `design/shots/pass3/`.

### Here window (zone panel), 24 Oct

Captured after the zone panel browser check (CDP, same 1440 and true 390 x 844 emulation). The player was logged out after midnight, so today's log named no area; a scratch reverse proxy rewrote `/api/session` and `/api/health` to logged in or logged out in Casino. Everything else is real data (Robchew, character export 14 min old, storage export 23 h old, so the footer shows the amber age and "After storing: VIP menu → Export Storage JSON").

| State | 1440 dark | 390 dark |
|---|---|---|
| Here: Casino (logged in) | [png](../design/screenshots/session-zone-1440-dark.png) | [png](../design/screenshots/session-zone-390-dark.png) |
| Next door: Eltibule (peek, "Back to Casino" in the title bar) | [png](../design/screenshots/session-zone-peek-1440-dark.png) | [png](../design/screenshots/session-zone-peek-390-dark.png) |
| Last zone: Casino (logged out, "Next time you're in game:" fix) | [png](../design/screenshots/session-zone-loggedout-1440-dark.png) | [png](../design/screenshots/session-zone-loggedout-390-dark.png) |

## Tools: two design skills

Both skills are installed under `~/.claude/skills/`:

- **taste-skill** ([github.com/Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)). Its app-screen mode is `references/app-screens.md`. It supplied dealt style directions, the house rules (one noun h1 per screen, a finding line, no boxed-zero hero metrics, colour on data only), and the browser inspector `scripts/inspect.mjs --app` plus `scripts/lint.mjs --app`, which were run as gates at 1440, 768 and 390. Its state is kept in `.taste-skill/`.
- **impeccable** ([github.com/pbakaus/impeccable](https://github.com/pbakaus/impeccable)). It supplied the `PRODUCT.md` / `DESIGN.md` formats (product schema 1, design-system front matter with tokens), the critique procedure, and `impeccable detect`, the anti-pattern detector. Its state is kept in `.impeccable/design.json`.

Where a skill rule clashed with the game's own look, the game won and the clash is written up in `DESIGN.md`. Example: the taste skill bans all-caps labels, but the game's sub-tabs (TODAY / THIS LOGIN) are all-caps gold.

## 1. Research

| File | What it found |
|---|---|
| [`design/research/pg-visual-identity.md`](../design/research/pg-visual-identity.md) | The game's real look, taken from the installed client (UnityPy, IL string tables read-only), the Steam screenshots and the CDN. Project Gorgon is **not** parchment-and-gold fantasy. It is a flat, dark, warm-charcoal UI: window body `#1E1818`, thin warm-brown frames, tan titles `#DFC9A0` (hard-coded in the game), khaki content panes, rust bevelled list buttons, Calibri at small sizes, painted 64 px item icons, chat in bright utility colours, and a dry, deadpan voice. |
| [`design/research/app-inventory.md`](../design/research/app-inventory.md) | Every feature, state, API field and localStorage key in the old POC UI, plus data that was available but not shown. This became the must-keep checklist (DESIGN.md "Feature coverage"). |
| [`design/research/taste-baseline.md`](../design/research/taste-baseline.md) | The "before" measured with the taste inspector. Findings: an emoji in the header, no screen h1, KPI-tile rows of zeros, a stock-blue system-font look, and freshness buried in grey footnotes. The three biggest fixes: a data-health strip, a noun h1 plus a finding per screen, and a face taken from the game. Raw runs are in `design/research/taste-before/`. |
| `design/research/game-ui/`, `design/research/icons/` | Reference sprites, Steam crops (the Recipes window drove the final composition) and 18 CDN icons. They are for reference only and are never shipped. |

## 2. Three concepts

Each concept was a self-contained page that read the live API. The pages are archived in `design/archive/concepts/concept-{a,b,c}.html`; they were served from `static/concepts/` during exploration and were moved out of `static/` afterwards so they are no longer served or scanned. The write-ups are in `design/concepts/`. Three independent critics scored each concept out of 50, 10 points for each of five dimensions.

| Concept | Idea | Avg /50 | Authenticity | Craft | Usability | Data awareness | Feasibility |
|---|---|---|---|---|---|---|---|
| [A: In-game window](../design/concepts/concept-a.md) | One more stack of the game's own windows: dark frame, tan titles, footer strips, gold caps tabs, rust buttons, right-edge toolbar | 35.67 | **7.17** | **6.83** | 6.33 | 7.50 | **7.83** |
| [**B: Elder Game ledger**](../design/concepts/concept-b.md) | Khaki ledger panes (area sections, subtotals over a double rule) plus a "where these numbers come from" margin | **36.0** | 7.00 | 6.50 | 6.50 | **8.33** | 7.67 |
| [C: Companion](../design/concepts/concept-c.md) | A quiet, modern companion web app in the game's colours, Carlito type and voice, with no skeuomorphism | 34.33 | 5.00 | 6.67 | **6.83** | 8.17 | 7.67 |

What the critics said about each:
- **A:** the strongest chrome, but with no content pane it read as "a recoloured dark admin theme". On every tab the rust call to action warned about a harmless partial export, the same file was amber in one place and red in another, and it was dark only. On a phone the top strip could not be reached once the player scrolled.
- **B:** the only concept a player would place inside the game at a glance (checked against `steam-crop-recipes.png`). Its margin grammar (status shape, age, evidence, fix) was the best data awareness. Counting vendor resets since the export back into the totals turned stale data into correct data instead of only flagging it. Against it: the khaki was too light and glared, the margin showed the same 7 or 8 notes on every view, a Noto Serif heading face, and bookish names ("Day book", "Council ledger").
- **C:** the most usable, with the best per-view filtered health rail and the best voice ("None yet. The trainers will wait."). All three critics gave it 5/10 for authenticity because it is a SaaS layout in PG colours, and its Session view broke at 390 px.

Screenshots: `design/shots/concept-{a,b,c}-*`, `design/shots/decision/dec-{a,b,c}-session.png` and the critic captures in `design/shots/critic-{a,b,c}/`.

## 3. Decision

Full reasoning: [`design/concepts/DECISION.md`](../design/concepts/DECISION.md).

**B wins, rebuilt inside A's window anatomy, with C's best ideas grafted on.** In one line: *Project Gorgon windows (from A) holding darker khaki ledger panes (from B), with a per-view "where these numbers come from" margin (B's grammar, filtered the way C filters), in Carlito, dark by default with a khaki Daylight theme.*

- Taken from A: every block is a window with a title bar and a footer strip that gives source, age and the exact fix. Also the ALL-CAPS gold sub-tabs, `[Status]`/`[Alert]`/`[Error]` system lines, vault slot strips, the right-edge toolbar (a bottom tab bar on phones) and a minimap-style location line.
- Taken from C: the margin filtered per view, stale reasons drawn from the player's own activity ("You have sold 3 times since it"), the zero state collapsing, the voice, automatic reload when the chat log shows `Saved report to`, errors kept inside the block that failed, `?sim=` preview modes, and clickable area bars.
- The decision ends with a 27-item must-solve list. It covers severity logic (one verdict per fact through a single health computation, healthy is quiet, a server-side `/api/health`), calibration (darker khaki, no serif headings, coin medallions, game nouns for view names), information architecture (free space lives on Storage, identical stacks merged, Character at parity), phone layout, and robustness (refresh never breaks an edit). It also sets the gates: lint and inspect at 0 FAIL, with every WARN argued.

## 4. DESIGN.md and its critique rounds

`PRODUCT.md` was written first in impeccable's product schema. Every fact in it comes from the repo or the brief; anything inferred is marked "(inferred)". `DESIGN.md` followed as the full system: tokens in YAML front matter (dark, Daylight, khaki pane, selected row, chat channels), contrast measured for each pair, named rules, components, the server contract, voice, accessibility, a per-view spec and feature coverage.

- **Critique round 1** ran on the first draft. The draft as it stood before round 2 is kept at `design/archive/DESIGN-pre-critique2.md` (1,050 lines).
- **Critique round 2** rewrote the spec to 1,225 lines. Among other changes, the "Figures strip" became an **At a glance window** (no boxed zeros), and new sections were added for **Window footers** (the source, age and fix wording on every window), **Preview modes**, and the additive **`/api/vendors`** fields.
- **Polish-pass review decisions.** Rulings from later reviews are appended at the end of DESIGN.md under "Review decisions" so later passes don't reopen them. Examples: the health pill is per view, the One Light Surface Rule is measured on the first screen, the rail floats as a window, Daylight data colour is `#76590C` for contrast, sources that don't exist yet are counted as "missing" rather than "broken", zero-day windows are quiet, and block writes are diffed.

## 5. Implementation

The old POC is archived as `design/archive/index-v0-poc.html` and `design/archive/server-v0-poc.py`.

- **UI** split into `static/index.html` (shell and view markup, 338 lines), `static/app.css` (705 lines, dark and Daylight tokens) and `static/app.js` (about 2,800 lines, vanilla JS). It is still dependency-free with no build step. Carlito (the metric clone of the game's Calibri) is loaded from Google Fonts. Item art comes from the game CDN.
- **Server** grew from 391 to about 1,200 lines and is still stdlib only. Every existing endpoint stays backward compatible. New endpoints:
  - `GET /api/health`: one verdict per source (exports, partial exports, chat log, GorgonSettings checks, alts, VIP, CDN version), plus game state and reminder moments. It reads the whole day's log for activity since each export.
  - `GET /api/icons` and `GET /api/lookup`: icon IDs and readable names served from the CDN cache.
  - Additive fields on `/api/session`, `/api/vendors` and `/api/storage`.
  - Validation on `POST /api/capacity`.
- **Data awareness in practice.** Every window footer gives its source and age, then "when to act: exact fix". Each view has a margin, "Where these numbers come from", with only the sources it depends on, and warn or bad items always listed. The title stamp and **Check again** sit on every view. Other channels follow the same verdict: an age mark on stale lead figures, a stale suffix on the finding sentence, rail marks, the tab title badge, the favicon colour, and opt-in browser **Reminders** (snooze, mute, quiet hours).
- **Build passes**, with screenshots under `design/shots/`:
  - `build/`: the first full build, including all `?sim` states.
  - `gate/`: inspector gate runs.
  - `fix/`, then `fix2/`: the code before fix2 is kept as `design/archive/*-pre-fix2.*`.
  - `gate-fix2/`, then `pass3/`.
  - `rev-fidelity/`: a fidelity review against the spec and the game references.
  - `review/`: the final reviews.
  - `final/`: the last capture before this record.

## 6. Review rounds

Four independent final reviews, each combining a design critique with the impeccable detector and the taste inspector:

| Review | Result | Main points |
|---|---|---|
| 1 | Pass | It was a single-context review, not the dual-agent run that impeccable's critique asks for, because no sub-agent tool was available. Findings: duplicate partial-export and auto-export notes; the vault-size note dropping names beyond 4; noisy empty windows on a zero-XP day; feeds cut through their top row; the chip strip hiding channels; detector hits in the old concept files. |
| 2 | **Fail (1 blocking)** | Background polling (30 to 60 s) rebuilt blocks with `innerHTML` and threw keyboard focus to `<body>` (WCAG 2.4.3 / 2.1.1), reproduced with CDP. Non-blocking: Skills table too long; finding line about 127 characters wide; the character `<select>` rebuilt every round; blank vendor icon frames; the mobile Reminders focus trap passing through `<body>`; small phone targets. |
| 3 | Pass | Parity check against the old UI. Free-slot vault names were lost from the Vendors tile; "Areas visited" was merged into What happened (accepted); the XP chart and loot could only be checked with injected data, because today has 0 XP. |
| 4 | Pass | Fidelity to DESIGN.md: the nolog preview still claimed "logged out"; Drained had no stale mark; the rail floated instead of sitting flush; a Daylight token drifted from the spec; the margin said "broken" for sources that are simply missing; the Session plaque did not say "on Storage". |

**After the reviews.** The blocking focus bug is fixed. Every block write now goes through a diffing `.html` setter, which rewrites a block only when its markup changed and returns focus to the same control afterwards (DESIGN.md "Block writes are diffed"). In the code or in the live app I also confirmed fixes for these:
- the auto-export note is folded into "Also checked";
- vault-size names end with "and N more";
- zero-day windows are quiet;
- the feeds have a top fade and padding, so no row is cut;
- the chip strip has a "+N more" chip;
- `.finding` is capped at 70ch with `text-wrap: pretty`;
- Skills shows 12 rows with "Show all";
- vendors without art get an initial-letter slot;
- the Reminders focus trap wraps explicitly;
- `.check` labels are 44 px tall on phones;
- the Vendors Slots tile names the full vaults again;
- in the nolog preview the game item and the location line read "not known";
- Drained has its stale mark;
- missing sources are counted as "missing";
- the plaque says "on Storage";
- the concept pages have moved out of `static/`.

The rail and the Daylight token were kept as they are, and the reasons are recorded in DESIGN.md's review decisions. The Qatik size (9) that a review agent cleared during testing is back in `capacity.json`.

## 7. Outstanding (non-blocking)

- **Name not confirmed.** "Gorgon Dashboard" was a working name; **renamed to "Gorgon Notes" on 2026-10-23** (see `docs/NAMING.md`). DESIGN.md suggests alternatives in the game's naming style ("Gorgon Notes", "Gorgon Companion"). A rename means editing `APP_NAME` in `static/app.js` and the fallback `<title>` in `static/index.html`.
- **Not seen with real activity:** the XP chart, XP by skill, level-ups and the loot table have only been checked with injected data. Re-check after a play session that earns XP and loot.
- **Not re-checked after the fixes:** whether the `?sim=noexport` vault-size note drops its "type it in the Slots column" line while the Vaults pane is replaced.
- **Review method:** a proper dual-agent impeccable critique has not run yet; it needs a sub-agent tool.
- **Accepted WARNs** (argued in DESIGN.md): `palette-cream` on the text colour, `ragged-row` beside the sticky margin, `unused-canvas` on Storage at 1440, and `below-fold` on Character.
- **Review agents must test against a copy of `capacity.json`**, never the player's file.
- **Out of scope for this pass:** Mac app channels (menu bar, HUD, native notifications) and auto-export automation (see `docs/ROADMAP.md`).
