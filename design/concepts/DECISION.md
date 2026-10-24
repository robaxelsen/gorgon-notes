# Design decision: final direction

Date: 2026-10-23. Inputs: three concept pages (`static/concepts/concept-{a,b,c}.html`), their write-ups in this folder, three critiques per concept, the game UI references in `design/research/game-ui/` (mainly `steam-crop-recipes.png`), and fresh 1440 screenshots of each concept's Session view in `design/shots/decision/`.

## 1. Scores

The critics scored out of 50 (10 per dimension). The dimension columns are averages across the three critics.

| Concept | Critic 1 | Critic 2 | Critic 3 | **Avg** | PG authenticity | Craft | Usability | Data awareness | Feasibility |
|---|---|---|---|---|---|---|---|---|---|
| **B: Elder Game ledger** | 37 | 35.5 | 35.5 | **36.0** | 7.00 | 6.50 | 6.50 | **8.33** | 7.67 |
| A: In-game window | 35.5 | 36.5 | 35 | 35.67 | **7.17** | **6.83** | 6.33 | 7.50 | **7.83** |
| C: Companion | 35 | 32 | 36 | 34.33 | 5.00 | 6.67 | **6.83** | 8.17 | 7.67 |

## 2. Winner: B, Elder Game ledger, rebuilt inside A's window anatomy

B has the highest score and no fatal flaw. Every problem the critics found in it is either a bug or a calibration issue: the khaki is too light, the margin is unfiltered, and some names are wrong. None of these breaks the idea. The final system keeps B's composition and its data-awareness system, and replaces B's SaaS shell with A's game window anatomy.

Why B wins:
1. **It is the only concept built on the game's own composition.** The Recipes and Item Info windows put a flat khaki content pane inside warm charcoal chrome, with painted icons on the pane. I put B next to `steam-crop-recipes.png` and it is the one concept a player would place in the game at a glance. A has the chrome but no pane, and two critics said it reads as a recoloured dark admin theme. C is a SaaS layout in PG colours, and every critic gave it 5 for authenticity.
2. **It has the strongest data awareness (8.33).** Each source in the margin gets the same four parts: a status shape, its age, one line of evidence, and the exact fix. The fix becomes a rust button only when the player needs to act. In the stale state, resets since the export are counted back into the totals ("21 vendors reset since the export: 379,580 councils… already counted"). That is the only idea across all three concepts that turns stale data into correct data instead of only flagging it.
3. **It already supports light and dark** (CLAUDE.md: "CSS tokens for light/dark"). The light theme is the game's khaki pane promoted to the window, not an invented cream. A ships dark only, which drops a project convention. That breaks the near-tie between A and B (0.33 apart).
4. **Its structure carries the lore**: area sections, subtotals over a double rule and a grand total. It needs no texture or costume.

Why not A, given that it is 0.33 behind and slightly ahead on authenticity: A's authenticity points come from window chrome (title bars, footer strips, gold caps tabs, rust bevel, slot strips). All of that can be moved into B, and B's khaki pane and ledger structure cannot be moved into A without turning it into B. A also has the worst data-awareness behaviour of the three: on every tab the rust call to action warns about a harmless partial export, and the same file gets amber in one place and red in another. And A is dark only.

Why not C: it is the most usable (6.83), with the best per-screen filtered health rail, but the critics agreed on 5/10 authenticity. It fails the user's only design brief ("look like an app Elder Game designed"). Its Session view is also broken at 390 px. Its best ideas are taken as grafts below.

**One-line direction for the final system:** *Project Gorgon windows (A's anatomy) holding darker khaki ledger panes (B's composition), with a per-view "where these numbers come from" margin (B's grammar, filtered the way C filters its rail), in Carlito, dark by default with a khaki Daylight theme.*

## 3. What to keep from B (the base)

- Khaki ledger pane for the main table of each view: area sections, subtotals over a double rule, a grand total, and collapsed areas that still show their subtotal.
- Margin note grammar: status shape and colour > title · age > one line of evidence > fix. A quiet "To refresh: VIP menu: Export X" line when everything is fine. A rust two-line plaque ("Export Character JSON / In game: VIP menu, while fully logged in") only when the player needs to act.
- Attestation stamp ("Copied from exports of 23 Oct, 00:56 · 8 h ago", amber after 24 h) paired with **Check again**. Check again confirms ("Storage updated, 637 free slots") or says plainly "No new export yet" and names the menu item.
- Vendor resets since the export are counted into the totals and shown as a positive note, and per row as "reset / +11.5k back".
- A one-sentence finding under each title, with NPC names, areas and key figures in emphasis tan `#DFC9A0`.
- Index of goods: painted CDN item-type chips with their council totals, one tap to filter.
- A provenance column for vault sizes ("from favor", "from your stats", "fixed size", "typed in by you"), with an inline edit that confirms "saved, 75 slots".
- Partial `???` export detection: info when a good export sits within 2 min of it, red when it stands alone.
- Chat log in the game's channel colours, dark in both themes, with persisted channel toggles and report paths shortened to the file name.
- Daylight theme = the khaki pane promoted to the window. Lamplight (dark) is the default.
- Tab-title count `(2)` / `(!)`, a favicon drawn in the status colour, a toast when a new `Saved report to` line arrives, and the `?shift=N` preview flag with its visible notice.

## 4. Grafts from the runners-up

### From A (In-game window)
1. **Window anatomy for every block.** `#1E1818` body, a slightly lighter title bar, a 1 px `#3A2C2B` frame, about 6 px radius, a soft drop shadow, and a `#30241E` footer strip. The khaki pane sits *inset* inside a window, as in the Recipes window. It is never a bare slab on the page ground.
2. **Window titles in Carlito, tan `#DFC9A0`.** Primary windows (the ledger pane) get a centred title with the small rust notch under it (Recipes). Secondary windows get a left-aligned title (Inventory). No non-functional close or pop-out glyphs: fake affordances are worse than none.
3. **Footer strip on every window: source + age on the left, "when to act: exact fix" on the right**, in game wording ("Slots Free: 637", "After selling: VIP menu → Export Character JSON"). This replaces B's small per-card source line. Every window has one, with no exceptions (A's Storage broke this).
4. **ALL-CAPS gold tabs with a `#B8934F` underline** for sub-views (TODAY / THIS LOGIN, BY AREA / ONE LIST). Authenticity overrides the taste-skill caps rule here. Mark the rule as deliberately ignored in a comment.
5. **Health and verify messages as game system lines**: `[Status]` `#FFBA7C`, `[Alert]` `#FFB300`, `[Error]` `#FF4D4D`, `[Info]` grey. The Check again result is posted as a `[Status]` line.
6. **Vault slot strips**: one cell per slot up to 60, then a bar with a tick every 10 slots. The manual size input sits inline.
7. **Right-edge toolbar navigation** in the game's style: taupe silhouettes in dark square cells, active item gold with a 2 px gold edge, short labels kept for clarity. It replaces B's 240 px SaaS sidebar. On a phone it becomes a **sticky bottom tab bar**, which fixes A's unreachable top strip.
8. **Location line in the minimap's format**: "Casino (logged out 00:56)".

### From C (Companion)
1. **The margin is filtered per view.** Show only the sources that feed the current view, sorted by severity. Warn and bad items always show. Everything else folds into one "Also checked: …" line. This fixes B's identical 7–8-note rail.
2. **Stale reasons from the player's own activity**: "You have sold 3 times since it", "Since then you visited Casino and Serbule, where your vaults are". Either one turns an otherwise fresh export amber.
3. **A stale suffix on the finding sentence** ("These are from a character export 3 days old.") and an amber age mark on the lead figure when its source is stale. The most-read number must never look trustworthy when it is not.
4. **The zero state collapses.** On a 0-XP day the figures strip and the chart collapse to one sentence instead of five boxed zeros and an empty plot.
5. **Deadpan voice with small, game-literate humour** in empty states and notes ("None yet. The trainers will wait.", "Nothing looted yet. Your bags are grateful."). The instruction is never hidden behind the joke.
6. **Automatic reload when a `Saved report to` line appears in the tail**, posting the same confirmation as Check again.
7. **Errors stay inside the block that failed** ("Couldn't load vendors. Last good at 08:51. Retry"), and loading skeletons are drawn at their real size.
8. **`?sim=stale|broken|nolog|down|loading`** alongside `?shift=N`, so every health state can be reviewed on real data.
9. **Clickable area bars** ("Where to sell", "Where there's room") that filter the table, used on the Vendors and Storage views.

## 5. Must-solve list (critic problems the final system has to fix)

### Severity and health logic
1. **The headline goes to the most actionable item, never the oddest one.** A partial twin with a good export within 2 min is `[Info]` and grey, and it never takes the rust call to action. When nothing needs doing, show an all-clear line. (A, all three critics.)
2. **One verdict per fact, everywhere.** A single `computeHealth()` produces the severity, and every channel reads from it: margin, footers, stamp, top bar, tab title, favicon, phone strip. The same file can never be amber in one place and red in another. (A.)
3. **The header never contradicts its own items.** Write "All sources recent · 2 notes", not "Everything is recent. Nothing to do." above a list that has notes in it. (B, C.)
4. **No fix text for a working source.** A working chat log says "If it ever stops: Settings → GUI → Log All Chat". It never shows "Needs Log All Chat" while the log is clearly being written. (A.)
5. **Healthy is quiet.** OK sources get a taupe check, not neon `#7EF132`. Colour is for warn and bad only. This removes the neon clash and the cry-wolf effect. (B, C.)
6. **A full vault is information, not an error.** Show it with the word and a full strip in ink or gold, never in the broken-export red. Status colours must not collide with chat channel colours (Nearby amber vs stale amber): status always comes with a shape, never colour alone. (C.)
7. **Fixes that make sense right now.** No "Export before you log out" while the player is logged out. Use "Next time you're in game: VIP menu → Export Character JSON, while fully logged in". (A.)
8. **Add a server-side `/api/health`, additive and backward compatible.** It reads `GorgonSettings.txt` (`LogChat`, combat logging, `AutoExportCharacterOnLogout`) plus export ages, and the page prefers it over guessing. Until it answers, "Logging is on" must read as inferred ("the log is being written"), not as verified. (All three concepts; DATA-AWARENESS.md step 1.)
9. **Activity since export reads the whole of today's log, not the last ~200 tail lines.** Server side if needed. Otherwise an evening of selling can stay green. (A, C.)
10. **Browser notification channel, opt-in.** Ask for permission only from a button, not on load. Snooze per topic, and at most one active reminder per topic per N hours, per DATA-AWARENESS.md §4. (B critic 3, C critic 3.)

### Visual calibration
11. **Darken and shrink the khaki.** Bring it from `#a8925f` toward the game's `#7E6642`, landing around `#8f7650` so ink `#120c04` still reaches 4.5:1 (check by calculation). Inset it inside a window frame, and keep it to the main table only. It must not be the brightest thing on the screen. Status marks never sit on khaki alone: they carry a shape and a word. (B, every critic.)
12. **Noto Serif is no longer a heading face.** Carlito for all chrome and window titles, as the game does. Serif only for area section headings inside a ledger pane, or nowhere. (B.)
13. **Coin medallion next to every councils figure** (the inventory footer coin / CurrencySprites), at text size. (A, B.)
14. **Names in the game's voice, not bookish flavour.** Views are named in game nouns: Session, Vendors, Storage, Character. Drop "Day book / Council ledger / Vault manifest / Lamplight". Keep the hash routes `#session #vendors #character #storage`. (B.)
15. **Stable title row.** The stamp and Check again sit at a fixed position on every view, whatever the length of the finding. The stamp is at least as prominent as the button (freshness first). The margin heading fits on one line. (B, C.)
16. **No hero-metric template of boxed zeros.** The figures strip shows only figures that have values; zeros fold into the finding sentence. (B, A, C.)

### Information architecture
17. **Free space lives on Storage.** Storage opens with free slots per vault: full vaults first, a big "Slots Free: 637" figure, and the slot strips. Item stacks come after. Vendors keeps a "637 free" figure that links to `#storage`. No vault content buried under 102 vendor rows on the phone. (B critic 3, A critic 3.)
18. **Aggregate identical stacks.** One "Xogrite Chunk · Marna · 100 ×3" row, not three. (B.)
19. **The Vendors finding must not mix vendors and vaults.** "Otis, Qatik and Tavilak are full" belongs to the Storage finding, or is labelled "vaults". (C.)
20. **Character view at parity with the old UI** (`design/research/app-inventory.md`): all skills with sort and search, a progress % beside the XP-to-go figure (not under the bar), fixed-width numeric columns so "+1 bonus" can't make rows ragged, currencies prettified (no "Redwingtokens", "Liveeventcredits", "Anatomy_Fungoids"), stats, favor, export picker. (A, B, C.)

### Phone (390)
21. **Fix the label joins**: no "spent , 11,489 of 120k" and no trailing "qty 9 ·". Pluralise ("1 vendor"). Every right-hand number on a phone row has a label ("30 free"). (B.)
22. **Content above the fold.** The health strip is one line when everything is OK, and it auto-expands, with the fix shown inline, when anything is warn or bad. The first screen shows the view's answer. (A, B.)
23. **Phone rows keep the key figure and a small spent-of-cap bar.** A drained vendor must be distinguishable from an untouched one. (A, B.)
24. **Grids use `minmax(0,1fr)`, and chip rows scroll in one line**, so nothing widens the page. Check at a true 390 with the inspector, not with `--window-size`. (C, B.)

### Robustness
25. **The 60 s refresh never rebuilds a row that is being edited.** Keep focus and the half-typed vault size, and keep filters, sort and open areas. (B.)
26. **Chat log**: one compact line of channel chips, a top fade on the log, and no line cropped at the top edge. Tab overflow gets a visible scroll cue. (A, B.)
27. **Gates**: `lint.mjs --app` and `inspect.mjs --app` at 1440 / 768 / 390, on all four views, both themes, and in the `?shift=72` and `?sim=` states: 0 FAIL, and every WARN argued in writing.

## 6. Out of scope for this pass
Mac app channels (menu bar, HUD overlay, native notifications with actions) and auto-export automation (DATA-AWARENESS.md says don't build it by default).
