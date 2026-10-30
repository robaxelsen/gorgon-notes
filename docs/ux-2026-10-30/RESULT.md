# RESULT: the plug-and-play redesign, measured (30 Oct 2026)

The proof run of package D, the last step of phase 3 (`SPEC.md` §3.9.5). What was built is in `docs/DESIGN-PROCESS.md` → "30 Oct 2026" and `DESIGN.md` → Review decisions → 30 Oct; the problem it answers is `PROBLEM-MAP.md`; the targets are `SPEC.md` §3.0. Screenshots: `design/screenshots/<view>-<state>-<width>-<theme>.png` (54 files, listed in DESIGN-PROCESS).

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

## Still unverified (SPEC §5)

Save Chat Logs on the GUI tab (patch note and settings key, not seen in game); Combat Logging level 1 writing the file and `VIP_CombatLogging` being a collapsed flag (provisional); combat lines needing VIP (hedged in copy); the roster filter on a real five-player evening; the three-line invite pasted into the game's chat box; Worker load with every fighting copy ticking; the friends' copies updating on restart; a real 390 px phone; a forwarded Discord post. Each has its hedge in copy or a ROADMAP item.
