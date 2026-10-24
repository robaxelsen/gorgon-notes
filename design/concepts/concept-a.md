# Concept A: In-game window

Page: `design/archive/concepts/concept-a.html` (archived 23 Oct; it used to be served at http://127.0.0.1:8787/concepts/concept-a.html) (hash routes `#session`, `#vendors`, `#character`, `#storage`). It is one self-contained file that reads the real API (`/api/session`, `/api/tail`, `/api/reports`, `/api/report`, `/api/vendors`, `/api/storage`, `POST /api/capacity`). `server.py` is unchanged.
Screenshots: `design/shots/concept-a-{session,vendors,character,storage}-1440.png` and `concept-a-{session,vendors}-390.jpg`. Inspector runs are in `design/shots/inspect-a-*/`.

## The argument
The player spends the evening looking at Project Gorgon's own windows, so the companion should look like one more stack of them: a dark warm frame, a tan title on the left, a footer strip, ALL-CAPS gold tabs and rust list buttons. None of this is "fantasy" styling. All of it is the game's real chrome, translated to the web. The game puts colour in its content (painted icons, chat channel colours) and not in its chrome. This concept does the same.

Each screen answers one question:
- **Session:** what did I get this session, and where did I go?
- **Vendors & Space:** where can I still sell, and where is there room?
- **Data health (every screen):** can I trust these numbers, and what exactly do I do if I can't?

## How the game's identity carries over
| Game element | In the dashboard |
|---|---|
| Window: `#1E1818` body, `#241E1E` title bar, 1px `#3A2C2B` frame, about 6px radius | Every block is a window (`.win`). The titles are h2s in tan `#DFC9A0`, left-aligned, at 15px. |
| Footer strip `#30241E` ("47,702 · Slots Free: 0") | Every window's footer carries its source and freshness, plus the fix ("After storing: Export Storage JSON"). Storage keeps the game's own wording: **Slots Free: 637**. |
| Right-edge vertical toolbar of taupe silhouettes | The navigation is a right-edge rail with taupe icons. The active item is gold with a 2px gold edge. On a phone it becomes a static four-tab strip at the top. |
| ALL-CAPS tabs, gold label with gold underline | TODAY / THIS LOGIN in the Experience window. This is the screen's one tracked-caps allowance. |
| Rust bevelled list button (`#782A18`, light top edge, dark bottom edge) | The data-health fix button has two lines: the action, then where to find it in game. The bevel uses borders, not a gradient. |
| Oxblood selected row `#421206` | Reserved as the table's selected-row state. |
| Chat colour defaults (the colour-preferences constructor) | The chat window colours each channel with the game's defaults, and player names use `#CABD00`. Health notices use the game's message classes: `[Status]` `#FFBA7C`, `[Alert]` `#FFB300`, `[Error]` (lifted to `#FF4D4D` to reach 4.5:1), `[Info]` grey. |
| Painted 64px CDN icons with the frame baked in | Each vendor row shows the icon for the item type it buys (`cdn.projectgorgon.com/v488/icons`). Browser `<img>` loads were verified with no UA header needed. |
| Inventory grid of slots | Each vault gets a slot strip: one cell per slot for up to 60 slots, and a continuous bar with a tick every 10 slots above that. |
| "Serbule (8 AM)" minimap title | The top line reads "Casino (logged out 00:56)". |
| Deadpan, literal copy | Examples: "No XP today: 26 min across 7 zone changes…" and "Your logout export wrote a partial twin 1 s after the good one. It is ignored; the good export is in use." |

## Palette
The page ground ("world") is `#161111`. Windows use `#1E1818`, `#241E1E` and `#30241E`, with the well at `#2A241E` and the frame at `#3A2C2B`. Text is `#E8E2DA`, dim text is `#A88E78` (the game's taupe `#99806C`, lifted to 4.5:1 on the footer), and emphasis is tan `#DFC9A0`. Gold `#B8934F` is the one data and selection hue. Rust is `#782A18`, with `#A2482A` and `#4A160C` for the bevel edges. Status colours are OK `#7EF132`, stale `#FFB300` and broken `#FF4D4D`.
**Dark only.** The game ships no light UI. A light theme would have to promote the khaki content pane to a ground, which the research rules out, and it would land on the banned cream-and-rust palette.

## Type
One face: **Carlito**, from Google Fonts, the metric clone of Calibri, which is the game's UI face. Sizes are 12 (13 on a phone), 14, 15, 18, 24 and 30, with tabular figures throughout. The chat log is set in Carlito, as in the game, not in a monospace.

## Components
Window (header, optional tabs, body, footer), health pills, rust two-line button, ghost button, divided figure strip (label over value, lead figure in tan at 30px), sortable vendor table (sticky header, two-line rows on a phone), vault slot strip with an inline manual-size input, chat channel tabs (built from the channels actually seen in the log, with counts), and a cumulative XP chart in SVG (2px gold line, round ticks, honest zero line).

## Data-awareness treatment
- **Data health window** at the top of every screen. Each source is a pill (dot, name, age):
  - **Chat log:** live, logged out, or missing. Missing gives the fix "Settings → GUI → Log All Chat".
  - **Character export** and **storage export:** age, plus activity since the export, read from chat lines after the export time (loot, "You received N Councils", favor gains). The status turns amber after 24 h (character) or 48 h (storage), or as soon as anything changes after an export.
  - **Partial / broken export:** a `???` export with a good twin within 120 s is amber and explained. A `???` export with no good twin is red: "Export Character JSON again, VIP menu, while fully logged in".
  - **Alts:** an alt's export older than 7 days.
  - **Vault sizes:** a size that is unknown is amber; a size typed in by hand is shown as info.
- The worst item appears as a game-style system line (`[Alert] …`), with the reason underneath and the **fix as a rust button**. Clicking any pill shows that pill's message.
- **Verify the fix:** "Check again", the fix button, and any new `Saved report to` line in the live tail all re-poll and compare export timestamps. The result is posted as a `[Status]` line: "Storage updated at 08:52: 637 slots free." or "No new export since 00:56. Export from the VIP menu, then check again." Saving a manual vault size is confirmed the same way.
- Every window footer repeats the age of its own source and its fix. The tab title gets a `(!)` or `(n)` prefix.
- Every API failure is shown inside the block that failed, never silently left as a dash.

## Gate results
- `lint.mjs --app`: 0 FAIL. 1 WARN, for `padStart` building the date tag of today's chat log (a date, not index numbering).
- `inspect.mjs --app`:
  - **#session:** 0 FAIL, 0 WARN.
  - **#vendors:** 0 FAIL. 1 WARN, `palette-cream`, triggered by the text colour `#E8E2DA` and the footer ink `#FFFDEA`. Both are the game's own ink on a dark ground; there is no cream ground.
  - **#character** (sketch): 0 FAIL, plus WARNs for tiny text and a ragged row.

## Known weaknesses
- **Health is computed in the browser** from existing endpoints. The `GorgonSettings.txt` checks (`LogChat`, combat logging, `AutoExportCharacterOnLogout`), the CDN version and Player.log are not visible to it, so they need a server-side `/api/health`. "Chat logging is on" is inferred from today's log existing.
- **Activity since export only covers the last ~200 tail lines plus lines seen while the page is open**, not the full log.
- **Vendor icons map each vendor's item-type list to one of 13 known CDN icons.** They are indicative, not exact (18 general vendors get the spell-pouch icon).
- **The cumulative XP chart is a large empty strip on a zero-XP day** (it shrinks to 96px, but still takes the slot).
- **The right-edge rail is faithful to the game but unusual on the web.** On a phone it moves to a static top strip, which is not reachable once the player scrolls.
- **The game's own low-contrast colours were lifted** (inactive tab `#554C43` becomes taupe, error red becomes `#FF4D4D`), so the page is slightly less faithful than a pixel copy.
- **Character and Storage are sketches:** the skills closest to a level, currencies, top stacks and value by vault, with none of the full tables.
- **Browser notifications and a favicon badge are not built yet.**
