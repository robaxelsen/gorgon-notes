# How the redesign was made

Record of the overnight redesign of 22 to 23 Oct 2026, and (first section) of the plug-and-play redesign of 30 Oct 2026. An autonomous agent run did all of it while the user was asleep, so no interview took place. This file explains how the current UI came about and where each piece of evidence is kept. The spec for the result is **`DESIGN.md`** (repo root), and the product brief is **`PRODUCT.md`**.

**Brief (from the user):** a completely new design whose *only* influence is that it should look like an app Elder Game (Project Gorgon's studio) designed itself. Not a generic dashboard and not generic "fantasy". The product requirement from `docs/DATA-AWARENESS.md` stays: every view must say how fresh its data is and exactly what to do in game to improve it.

## 30 Oct 2026: the plug-and-play redesign

User, 30 Oct 00:35: "make the app easier to use: it gets overwhelming, a newcomer can't tell what is worth using or how to start; the design is nice but lacking; aim for 7.5/10 against industry leaders", and "Combat is especially hard; … make it so easy a grandmother could follow the flow; as plug-and-play as possible." An autonomous run of workflow agents in four phases; every report is kept in `docs/ux-2026-10-30/`.

- **Phase 1, understand** (00:35 to 01:50, 7 agents): a UI map, a trace of the combat flow, a design critique, a cognitive walkthrough, UX research on the category leaders and research on the Project: Gorgon community and its tools, synthesised into **`PROBLEM-MAP.md`**. The problem map: no first-run surface (a fresh install rendered as a broken one, one setting stated 11 to 20 times per page); health chrome not scoped to the view's sources; eight equal rail items; every view 4 to 5 screens of same-rank windows; Combat with the party meter ~2,700 px down behind the Fights table, five sharing paths, a silent meter when Combat Logging is off, and the zero-setup everyone feed as a dim link. Newcomer score 5.6/10, Combat 4/10.
- **Phase 2, design** (to 03:10, 15 agents): three designs per problem (a design leader's, a minimal one, a "grandmother" user-first one), each judged by three judges (design leader, engineer, grandmother), then finals and one integrated spec: **`A-FINAL.md`** (first run, the Setup window, health scoping, the ranked rail, the lower deck, copy), **`B-FINAL.md`** (Combat turned inside out, Your party from the everyone feed with no code, the server contract) and **`SPEC.md`** (the merge, nine work packages, the instrument targets). Both winners were the user-first designs, built on the minimal design's additive `/api/party` contract.
- **Phase 3, build** (03:10 to about 10:00): 7 build agents in git worktrees (P0 foundation, S1 server health verdicts, S2 Your party from the feed, P1+P2 health scoping and the Setup window, P3 rail and About, P5 lower deck, P4 Combat), merged in spec order; 7 read-only checks (instruments, desktop, phone, party flow on a fake room, semantic merge, accessibility; `ISSUES.md`, 51 findings → 44 issues); 4 fix agents (health/setup/shell, Combat/party, the other renderers, server); then this close (docs, DESIGN.md consolidation, the copy sweep, the proof run below) as part of about 16 closing agents.
- **Decisions taken without the user** (DESIGN.md → Review decisions → 30 Oct): the party code survives as a folded "Private room"; the public feed stays default-on with a one-time disclosure; the landing tab stays the remembered one (default Session); Combat Logging warns on Combat with a provisional rule (level 1 and `VIP_CombatLogging` unverified); the chat-log setting is named on the GUI tab with the April 2026 note, the in-game look still open; Session with defaults accepted at 1,522 px; the amber glyph reads "To do".

### Screenshots (30 Oct proof run)

Real player data on a harness copy of the final tree (port 8862, the game folder read-only, no Worker, so Your party says "no sharing address" outside `?sim=party`), CDP via `~/.claude/skills/taste-skill/scripts/lib/cdp.mjs`, full page. 1440 is dsf 1; 390 is a true 390 × 844 device emulation at dsf 2 (SPEC §5 #12: emulation, not a real phone). Daylight at 1440 only. Named `<view>-<state>-<width>-<theme>.png` in `design/screenshots/` (git-ignored, like the earlier set). The player logged in during the run: the dark 1440 set shows "Casino (logged out 01:38)", the Daylight set "Casino (logged in)" with the plaques a running game allows.

| URL | 1440 dark | 1440 Daylight | 390 dark |
|---|---|---|---|
| `#session` | [png](../design/screenshots/session-default-1440-dark.png) | [png](../design/screenshots/session-default-1440-daylight.png) | [png](../design/screenshots/session-default-390-dark.png) |
| `#combat` | [png](../design/screenshots/combat-default-1440-dark.png) | [png](../design/screenshots/combat-default-1440-daylight.png) | [png](../design/screenshots/combat-default-390-dark.png) |
| `#vendors` | [png](../design/screenshots/vendors-default-1440-dark.png) | [png](../design/screenshots/vendors-default-1440-daylight.png) | [png](../design/screenshots/vendors-default-390-dark.png) |
| `#storage` | [png](../design/screenshots/storage-default-1440-dark.png) | [png](../design/screenshots/storage-default-1440-daylight.png) | [png](../design/screenshots/storage-default-390-dark.png) |
| `#character` | [png](../design/screenshots/character-default-1440-dark.png) | [png](../design/screenshots/character-default-1440-daylight.png) | [png](../design/screenshots/character-default-390-dark.png) |
| `#teleports` | [png](../design/screenshots/teleports-default-1440-dark.png) | [png](../design/screenshots/teleports-default-1440-daylight.png) | [png](../design/screenshots/teleports-default-390-dark.png) |
| `#statehelm` | [png](../design/screenshots/statehelm-default-1440-dark.png) | [png](../design/screenshots/statehelm-default-1440-daylight.png) | [png](../design/screenshots/statehelm-default-390-dark.png) |
| `#files` | [png](../design/screenshots/files-default-1440-dark.png) | [png](../design/screenshots/files-default-1440-daylight.png) | [png](../design/screenshots/files-default-390-dark.png) |
| `?sim=fresh#session` | [png](../design/screenshots/session-fresh-1440-dark.png) | [png](../design/screenshots/session-fresh-1440-daylight.png) | [png](../design/screenshots/session-fresh-390-dark.png) |
| `?sim=fresh#combat` | [png](../design/screenshots/combat-fresh-1440-dark.png) | [png](../design/screenshots/combat-fresh-1440-daylight.png) | [png](../design/screenshots/combat-fresh-390-dark.png) |
| `?sim=fresh#vendors` | [png](../design/screenshots/vendors-fresh-1440-dark.png) | [png](../design/screenshots/vendors-fresh-1440-daylight.png) | [png](../design/screenshots/vendors-fresh-390-dark.png) |
| `?sim=partiallog#combat` | [png](../design/screenshots/combat-partiallog-1440-dark.png) | [png](../design/screenshots/combat-partiallog-1440-daylight.png) | [png](../design/screenshots/combat-partiallog-390-dark.png) |
| `?sim=party#combat` | [png](../design/screenshots/combat-party-1440-dark.png) | [png](../design/screenshots/combat-party-1440-daylight.png) | [png](../design/screenshots/combat-party-390-dark.png) |
| `?sim=loading#combat` | [png](../design/screenshots/combat-loading-1440-dark.png) | [png](../design/screenshots/combat-loading-1440-daylight.png) | [png](../design/screenshots/combat-loading-390-dark.png) |
| `?sim=stale#vendors` | [png](../design/screenshots/vendors-stale-1440-dark.png) | [png](../design/screenshots/vendors-stale-1440-daylight.png) | [png](../design/screenshots/vendors-stale-390-dark.png) |
| `?sim=stale#session` | [png](../design/screenshots/session-stale-1440-dark.png) | [png](../design/screenshots/session-stale-1440-daylight.png) | [png](../design/screenshots/session-stale-390-dark.png) |
| `?sim=noexport#combat` | [png](../design/screenshots/combat-noexport-1440-dark.png) | [png](../design/screenshots/combat-noexport-1440-daylight.png) | [png](../design/screenshots/combat-noexport-390-dark.png) |
| `?sim=nolog#storage` | [png](../design/screenshots/storage-nolog-1440-dark.png) | [png](../design/screenshots/storage-nolog-1440-daylight.png) | [png](../design/screenshots/storage-nolog-390-dark.png) |

These replace the 23 to 24 Oct per-view set (`session-`, `vendors-`, `storage-`, `character-`, `files-`, `combat-` `1440`/`390` × `dark`/`light`) and the superseded states `session-nolog-*`, `combat-nolog-1440-dark`, `storage-noexport-*` (now the Setup window) and `session-councils-combat-390-dark` (the side-by-side pair is gone). Kept from the earlier set because no 30 Oct shot covers them: the Here window states below, the Files states (`files-invalid`, `-changed`, `-noexport`, `-list`, `-capacity`, `-gone`, `-search`), `storage-merge-*` and `combat-break-*`.

![Session first run, 1440 dark](../design/screenshots/session-fresh-1440-dark.png)
![Combat with a party (preview), 1440 dark](../design/screenshots/combat-party-1440-dark.png)

### Measured

**Instrument table** (SPEC §3.0 targets; measured 30 Oct 09:39 to 09:50 on a harness copy of the final tree, port 8862, real game folder read-only, no Worker (`PG_ROOM` empty), CDP at 1440 (dsf 1) and true 390 × 844 (dsf 2), settle 3.5 s, 8 s for six phone pages that were still "Checking…" at 3.5 s; counts of rendered elements; DOM dumps and per-page JSON in the scratch `phase3/proof/`). The player logged in during the run, so the Daylight and some phone shots show "Casino (logged in)" and the plaque where the dark 1440 ones show "logged out".

| Target | Expected | Measured | Met |
|---|---|---|---|
| Fix strings per page (Save Chat Logs / Export Character JSON / Export Storage JSON in footers, margin, stamp, note lines; Setup steps excluded) | ≤ 2 | Session 1 · Combat 1 · Character 2 · Teleports 0 · fresh Session / Combat 1, fresh Vendors 0 · **Vendors 3 · Storage 3 · Statehelm 3 · Files 3** (the margin's quiet "To refresh" line beside the primary footer's fix; was 3 / 3 / 4 / 4 at the integration check, 9 to 20 at phase 1) | no (4 views at 3) |
| Plaques rendered per page | ≤ 1 | 0 or 1 on every page (max DOM 2 on fresh Vendors 390, one hidden) | yes |
| Export plaques on Combat / Teleports | 0 | 0 / 0 in every state | yes |
| Red objects on a fresh install (`sev-bad`, "(!)", red favicon) | 0 | 0 / none / taupe on `?sim=fresh` Session, Combat, Vendors, both themes and widths | yes |
| Session fresh windows | 1 | 1 (`#w-s-setup`; the margin is the second counted box) | yes |
| Rail | 4 + 3 in two groups, Files at the foot | Play 4 · Reference 3 · foot Files + About (7 items at 1440) | yes |
| Phone bar cells | 5 | 5 on all 18 phone pages | yes |
| First-run Combat primary buttons | ≤ 1 | 0 `.btn.primary`; 0 plaques with the game closed (1440), 1 plaque with it open (390, Daylight) | yes |
| Combat screens to the party table (`?sim=party`, 1440) | first row above y = 900 | first member row at y = 594 (window top ≈ 350); 390: y = 1,146 | yes |
| Fights rows open | 10 | 10 + the Total row ("Total · 35 fights · 6 skirmishes folded") | yes |
| Breakdown caveat paragraphs open | 0 | 0 (`details.howcount` closed on every Combat page) | yes |
| Rust elements per screen | 1 (0 when all share) | ≤ 1 on all 54 pages (party: "Copy an invite line"; Storage / Files / stale Vendors: the one margin plaque when the game is open) | yes |
| Amber in Combat's main column, working meter | 0 | 0 (default, party, noexport); partial-logging 2 = the Setup row's triangle and status, by design | yes |
| Discord-named affordances on Combat | 2 + the folded window | party: "Post this run to Discord", "Post fight to Discord" + folded "Discord" = 2 + 1; solo: 1 + window (no run table) | yes |
| Retired words in dumped DOM (server.py, PG_ROOM, ntfy.sh, party room, json block, webhook, GorgonSettings.txt, python.exe, "V.I.P. → Save") | 0 (webhook ≤ 1) | 0 of each in all 54 dumps ("Manage Webhooks", Discord's permission name, sits in the folded Discord window's hint) | yes |
| Retired words in `static/` + `cloud/src/everyone.html` (SPEC §3.9.2 grep) | 0 | 0 in UI strings (4 code comments left: app.js 179, 1900, 1905, 2096); file names only in Files (the Session chat-log footer now says "Today's chat log") | yes |
| Session page, 1440, defaults open | ≤ 1,400 px | **1,522** (logged out; 1,616 logged in in Daylight). Accepted by the orchestrator: XP by skill and What happened stay open | accepted miss |
| Loading shot | nothing red or amber | `?sim=loading#combat`: 0 red, 0 amber but the preview notice; pill "Checking…"; no Setup window; Breakdown hidden | yes |
| App steps to party damage after the in-game settings | 0 | 0 (`?sim=party`: the table renders with no code; real feed not exercised on this harness) | yes (sim) |
| `domstats` windows · controls · words (1440 dark) vs phase 1 | fewer, ranked | Session fresh 1 · 0 · 149 (was nolog 9 · 4 · 156); Combat fresh 1 · 0 · 170 (was nolog 3 · 8 · 50 with a live Connect Discord); Vendors fresh 1 · 0 · 127 (was noexport 4 · 7 · 89); Combat default 6 · 22 · 646 (was 4 · 30 · 1,240); Session default 10 · 34 · 1,876 (folded windows counted; was 10 · 22 · 1,204); Statehelm 3 · 47 · 932 (was 3 · 78 · 1,447); Teleports 15 · 230 · 780 (was 15 · 244 · 1,106) | |

Page heights at 1440 dark (px): Session 1,522 · Combat 1,464 · Combat party 3,218 · Vendors 3,646 · Storage 2,672 · Character 1,226 · Teleports 987 · Statehelm 2,844 · Files 1,020 · every fresh page 900 (one screen). Phase 1 had 3,900 to 4,900 on the long views.

**The 13-dimension rubric, re-scored** (PROBLEM-MAP §3.1 calibration: 10 = Linear issue view / Apple Health, 8 = Stripe home, 6 = competent internal tool, 4 = working POC; scored by the package D agent from the 54 shots and the counts above, not by an independent judge):

| Dimension | 29 Oct | 30 Oct | Why |
|---|---|---|---|
| Visual hierarchy | 5 | 7.5 | At a glance + the primary window open, everything else a one-line folded bar; Combat's party table second |
| Information density | 4 | 6.5 | Session 1,522 px, Combat 1,464, fresh pages one screen; Vendors (3,646) and Storage (2,672) stay long because the panes are; the party view is 3,218 with ten fight blocks |
| Typography scale | 7 | 7 | five sizes plus the one named 30 px readout |
| Spacing rhythm | 7 | 7.5 | no ragged `grid2` pairs, footers only where they carry something |
| Colour (healthy is quiet?) | 5 | 7 | amber once per view, red 0 on a fresh install; margin notes still draw 8 to 9 warn shapes on the export views |
| Component consistency | 7 | 7.5 | one fold pattern everywhere, one Setup component, one rust element per screen |
| Affordance | 5 | 6.5 | real fold buttons with `aria-expanded`, sticky filter bars, labelled Leave the room / Disconnect Discord; many controls are still small text buttons |
| Empty states | 5 | 7.5 | the Setup window and one-sentence states replace placeholder windows |
| Copy length and tone | 7 | 7.5 | caveats folded, internals retired; four views still say a fix three times |
| Scannability | 6 | 7 | deck summaries scan; long panes still scroll |
| Answers its question in 3 s | 6 | 7 | Combat's finding is one figure; fresh pages say the one thing to do |
| First-run / onboarding | 2 | 7.5 | one calm window per view that ticks itself; the GUI path is still unseen in game |
| Brand brief | 8 | 8 | unchanged; the readout and the live dot are argued exceptions |

**Overall 7.2 / 10 newcomer** (was 5.6; target 7.5 **not met**), owner about 7.5. **Combat 7.0 newcomer** (hierarchy 7.5, density 6, affordance 6.5, empty state 7.5, copy 7, liveness 7.5; was 4; target 7 met). What would close the gap: the fix said twice instead of three times on Vendors, Storage, Statehelm and Files; shorter primary panes (Vendors and Storage open on their area summaries); a shorter party view (five fight blocks, not ten); the in-game look at Settings → GUI so the first-run copy stops hedging.


### Outstanding after 30 Oct

The three in-game looks (Settings → GUI for Save Chat Logs; Settings → V.I.P. → Combat Logging; one "Log when…" row set to the chat-window option with a hit), the first real party evening on the feed, the friends' restarts onto v0.11.0+, the Worker page copy deploy, and the "in your party? Yes / No" edit: `docs/ROADMAP.md` → Next up. The logged-out Setup variants are seen in the proof shots (`?sim=fresh`, game closed); a real phone and a forwarded Discord post remain unseen.

## Screenshots of the 23 to 24 Oct redesign (kept states)

The per-view table of the 23 to 24 Oct set was replaced by the 30 Oct set above. The Stacks to merge window scrolled into view [1440](../design/screenshots/storage-merge-1440-dark.png) / [390](../design/screenshots/storage-merge-390-dark.png). Files states (24 Oct, 1440 dark, the 422 and 409 ones through a local proxy because nothing may be written into Reports/): [invalid JSON](../design/screenshots/files-invalid-1440-dark.png), [file rewritten while open](../design/screenshots/files-changed-1440-dark.png) and [no exports](../design/screenshots/files-noexport-1440-dark.png); from the 12:50 final gate: the list [1440](../design/screenshots/files-list-1440-dark.png) / [390](../design/screenshots/files-list-390-dark.png), [capacity.json](../design/screenshots/files-capacity-1440-dark.png), [a file that is gone](../design/screenshots/files-gone-1440-dark.png) and [search](../design/screenshots/files-search-1440-dark.png). The health states of that time (`?sim=stale|broken|nolog|noexport|loading|down`, `?shift=72`) are in `design/shots/build/sim-*.png`, `design/shots/rev-fidelity/` and `design/shots/pass3/`.

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
