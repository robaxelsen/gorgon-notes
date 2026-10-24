# Concept B: Elder Game ledger

Mockup: `design/archive/concepts/concept-b.html` (archived 23 Oct; it used to be served at http://127.0.0.1:8787/concepts/concept-b.html). It fetches the live API (`/api/session`, `/api/tail`, `/api/reports`, `/api/report`, `/api/vendors`, `/api/storage`, `POST /api/capacity`) and has no build step and no dependencies. Fonts come from Google Fonts. Item art loads straight from `cdn.projectgorgon.com` in `<img>` tags. That works without a server-side User-Agent; it was checked with curl and in headless Chrome.

Views: `#session` (Day book), `#vendors` (Councils & vaults), `#character` (Skill book, sketched) and `#storage` (Storage manifest, sketched).

Review aids:
- `?theme=light` or `?theme=dark` forces a theme.
- `?shift=72` pretends 72 hours have passed, so you can see the stale treatment. A visible notice says it's a preview.

Screenshots are in `design/shots/concept-b-*.png|jpg` (1440 and 390). Earlier rounds are in `concept-b-r1..r3-*`.

## 1. The argument

The idea in one sentence: **the game's own export receipts ("Saved report to …") become the ledger's attestations.** Every page is a ledger leaf whose figures are copied from a dated entry. A margin beside each page tells you which entry that is and what to re-export.

Claims, one per block:

| Block | Claim | Proof on screen |
|---|---|---|
| Shell: "Gorgon Ledger", Robchew of Arisetsu, Books | This is your book, scoped to your character | A drawn mark (a ledger closed by a council coin). Character, server, logged-out time and area come from the chat log |
| Title row | Each page answers one question in one sentence | h1 noun + finding ("Vendors can still pay you 1.59M councils. Biggest refill next: Helena Veilmoor gets 71,197 back in 1 d 15 h. 3 vaults are full.") |
| Attestation stamp + Check again | The figures are as old as their export, and you can re-check right now | "Copied from exports of 23 Oct, 00:56 · 8 h ago" (amber after 24 h). Check again re-reads and confirms "Storage updated, 637 free slots" or "No new export yet…" |
| Figures strip | The answer figure leads | 32px "Vendors can still pay you 1,589,320". Siblings at 20px: drained, next reset, free vault slots, full vaults |
| Council ledger (khaki leaf) | Where you can still sell, grouped like a ledger | Areas are ledger sections with a serif heading and a subtotal over a double rule. Rows give vendor, favor (+ next tier), buys, councils left, spent of cap, reset timer. The grand total sits over a double rule |
| Index of goods | "Who buys my gems?" is one tap | Painted CDN item icons for the 12 item types with the most councils left, each with its total. Tap one to filter |
| Vault manifest (khaki leaf) | Where the space is, and which sizes are guesses | Grouped by area with free-slot subtotals. The size column says where each size came from: "from favor", "from your stats", "fixed size" or "typed in by you". Unknown and manual sizes are inputs that save through `POST /api/capacity` and confirm inline ("saved, 75 slots") |
| Day book: Entries (khaki leaf) | What happened today, as a journal | Login, each area entered, level-ups, every export (green dot) and logout, merged from session and tail, in time order |
| Day book: XP by skill, Loot, Chat log | Detail behind the figures | The chat keeps the game's own channel colours, with persisted channel toggles. Report paths are shortened to `Reports/<file>` |
| The margin: "Where these numbers come from" | Never silently stale, always actionable | One health model drives every channel (see section 5) |

## 2. Direction (taste skill)

- **App style dealt:** `achromatic-ledger` (seed 1659281851, kind `report`). It was dealt with `--keep palette,type`, so the colours and faces come from Project Gorgon's own UI. Sheet: `.taste-skill/concept-b/direction.json`.
  - The style's move is kept: no brand colour in the chrome, figures in ink, one data hue, and status colour only where something changed.
- **Shell:** an open plane. A labelled 240px sidebar ("Books") sits on the page ground with one rule. There is no top bar on desktop. On tablet and phone it folds to a 48px top bar with the view name, a health mark and a menu.
- **Face chosen (app-screens §2.3):** a ground from the product's world. Two choices carry it:
  - Lamplight takes the game's window body browns.
  - Every ledger table sits on the game's khaki content-pane colour (the Recipes / Item Info pane).
- **Signature element:** the margin ("Where these numbers come from"), plus the attestation stamp in the title row.
- **Grid at 1440:** sidebar 240 plus canvas 1200 (32 + 1136 + 32). The 1136 splits as leaf 792 + gap 24 + margin 320. One gap value, 24, is used everywhere.

## 3. Palette

All values are sampled from the game ([GAME] / [STEAM] in `design/research/pg-visual-identity.md`). Where needed they are lifted to reach 4.5:1.

**Lamplight (dark, default when the OS is dark)**

| Role | Hex | Source |
|---|---|---|
| ground | `#161111` | below the window body, like the context menu |
| surface (chrome cards, margin) | `#1e1818` | window body |
| border / rule | `#3a2c2b` / `#2d2423` | window frame line |
| text / muted | `#e8e5e1` / `#b5a08c` | context-menu text / toolbar taupe, lifted |
| titles, names | `#dfc9a0` | the game's hard-coded `<color=#DFC9A0>` emphasis |
| selection line | `#b8934f` | active tab gold |
| data hue | `#d8ad4d` | logo gold, used only on bars and the XP line |
| primary action | `#6b2414` with `#fff4f0` | the "Craft It!" button |
| fix plaque | `#782a18`, top edge `#a2482a`, bottom `#4a180c` | the rust list button (bevel made with borders, no gradient) |
| status | ok `#7ef132`, warn `#ffb300`, bad `#ff3333` | Tell green, Alerts amber, Error red, the chat defaults players already read this way |

**Ledger leaf** (khaki, inside both themes): surface `#a8925f` (dark theme) or `#d2c29e` (light theme), ink `#120c04`, muted `#2a1e0c`, rules `#8c7650`, data `#3a2a10` (ink bars, keeping the achromatic style), full / bad `#5c0808`.

**Daylight (light):** the whole window becomes the khaki pane (ground `#b09c76`, cards `#bfac86`), the leaves are one step lighter (`#d2c29e`), and the primary is near-black brown. **Dark and light are both supported.** The direction allows it because the game itself has both a dark window and a light pane. Light is the pane promoted to the window, not an invented cream.

The chat log stays dark in both themes: it is the game's chat window, and its channel colours are data.

## 4. Type

- **Carlito** (metric clone of Calibri, the game's UI face) for everything worked in: tables, figures, labels, chat. Tabular figures throughout.
- **Noto Serif** (the client ships it for books and inscriptions) for exactly one job: the book's voice. That means page titles, card titles, area section headings, and the character name in the shell.
- Sizes: 13 / 14 / 15 / 16 / 18 / 20 / 26 / 32 (title 26, answer figure 32, siblings 20, body 15). On the phone the title drops to 22.
- No caps-tracked labels. The game's tabs are ALL CAPS, but the taste rules allow one tracked label per screen, so the tabs are sentence case with the gold line instead.

## 5. Data-awareness treatment (docs/DATA-AWARENESS.md)

One client-side health model (`computeHealth()`) feeds:

1. **The margin** on every view. Each note has a status mark (shape and colour: ring-check, amber triangle, red square-cross, grey info), a title with its age, one line of evidence, and the exact fix.
   - When the player should act, the fix is the game's **rust list button**: "Export Storage JSON / In game: VIP menu, while fully logged in".
   - When everything is fine, the fix is a quiet line: "To refresh: VIP menu: Export Character JSON".
2. **The attestation stamp** in every title row, which turns amber after 24 h, and a per-card source line ("From the character export of 23 Oct, 00:56, 8 h ago…").
3. **The tab title** ("(2) Gorgon Ledger", "(!) Gorgon Ledger"), a **favicon** drawn with the status colour, and the **phone top bar** ("All recent" / "2 to do").
4. **Verify the fix:** the tail is polled every 2 s. A "Saved report to" line triggers a re-read 1.5 s later and a toast: "Storage updated. 637 free slots across your vaults." Check again says plainly when nothing new arrived and names the menu item to use.
5. On tablet and phone the margin collapses to a one-line strip of the three core sources. Problems always show; "Show all 7 sources and notes" opens the rest.

Checks implemented today, with no server change:

| Check | Signal | Fix shown |
|---|---|---|
| Chat log | `/api/session` (missing, error, live, logged out at HH:MM) | Settings, GUI tab: Log All Chat |
| Character export age | newest good CharacterSheet in `/api/reports` | VIP menu: Export Character JSON |
| Storage export age | newest Storage report | VIP menu: Export Storage JSON |
| Broken export | `???` CharacterSheet. If it is within 2 min of a good one it shows as "ignored" (info); if it stands alone it is red | Export again while fully logged in |
| Activity since export | tail lines after the export: `You received N Councils`, `You gained … favor with X`, loot count | Export Storage and Character JSON before you log out |
| Vendor resets since export | `resetsAt` passed. Those rows are counted with their full cap back, and the positive note says "N vendors reset since the export: X councils to sell for again" | none needed |
| Vault sizes | `capacity == null` (warn) / `capacitySource == manual` (info) | Check in game, type it in the Vault manifest |
| Alts | other characters in `/api/reports` older than 7 days | Next time you play X: export both |
| API down / endpoint error | fetch failure or an `{error}` field | inline in the failed block, with Try again / check again |

The wording follows the game's system-message voice: one literal line that says what is wrong and what to do, with dry humour kept small ("A quiet one: no experience since 00:30").

## 6. How Project Gorgon's identity is carried

- The composition is the game's Recipes and Item Info windows: dark warm-brown chrome holding a flat khaki content pane, with painted 64px icons in their own grey bevel frames on that pane. That is the "Index of goods" and the Storage manifest rows.
- Exact game colours: emphasis tan `#DFC9A0` on names and areas (as `<color=#DFC9A0>` does in game strings), the active-tab gold line, the dark-red "Craft It!" primary, rust list buttons for fixes, and chat-default status and channel colours.
- Calibri metrics (Carlito) and the client's own Noto Serif.
- The game's own words: Councils, favor tiers (Soul mates, Like family…), vaults, Transfer Chest, "Slots", "Saved report to", VIP menu, Log All Chat.
- The ledger is lore-flavoured through structure, not costume: Books, Day book, Council ledger, Vault manifest, Skill book, area subtotals over double rules, and attestation stamps.
- There is no parchment texture, no ye-olde copy, no fantasy display face, and no logo imitation. The sidebar says it is fan-made and not affiliated with Elder Game.

## 7. Gate results (final)

- `lint.mjs --app`: 0 FAIL, 0 WARN. The toast shadow carries `taste-skill-ignore` because it floats.
- `inspect.mjs --app` at 1440 / 768 / 390, on all four views: **0 FAIL**.
- WARN `ragged-row` (desktop, every view): this is the sticky right rail against the long leaf. It is a stable secondary stream that the app-screens rules allow (§3.4). It is sticky, so it never leaves a visible hole.
- WARN `numeric-align` (Skill book, 390): on the phone, tables become two-line rows by design (§12), so secondary figures sit inline in the subline. The key figure stays right-aligned.
- Iterations:
  1. Round 1: dark-only chrome, too much like a generic dark dashboard. The phone tables stacked every cell on its own line, and the health margin filled the whole phone screen.
  2. Round 2: two-line phone rows, a collapsible margin strip, and a grid min-content overflow fix.
  3. Round 3: khaki ledger leaves added (the identity jump), Next favor merged into Favor so the Buys column could breathe, reset rounding fixed ("16 h 60 min"), the stale stamp turns amber, resets since export counted, report paths shortened in chat, and the chat card fills the Day book column to balance the row.

## 8. Known weaknesses

- **Big khaki blocks on a dark screen are bright.** This is faithful to the game, but in a long evening session the leaves may glare. The game's own khaki (`#7E6642`) is darker; it was lifted to `#a8925f` for 4.5:1 ink contrast. Option: a "dim leaf" setting.
- **Contrast on the leaf limits colour.** Status colours on khaki are dark (deep red, deep green) and read as near-ink. The red "full" state is carried mostly by the word and the full bar.
- **The Day book is thin on a quiet day.** Today's real log has 0 XP, so the XP line chart (drawn only when it has 2 or more points) was never seen with data. The empty states are honest but plain.
- **The Council ledger is long (102 vendors).** Only the four richest areas open by default; the rest are collapsed rows that still show their subtotal. A player who wants everything must click or use "One list".
- **The health model lives in the browser.** DATA-AWARENESS.md asks for `/api/health` server-side, plus GorgonSettings checks (`LogChat`, `AutoExportCharacterOnLogout`, combat logging) that the browser can't read. "Logging is on" is inferred from today's log being written. Alts seen only in chat logins (Boomchew, Raspby) are invisible to the current API.
- **Item icon data is baked in.** The TypeID to IconId map (801 items, v488) is embedded, and the item-type icons are hand-picked representatives. The real app should serve both from the server's CDN cache, keyed to `fileversion.txt`.
- **The Skill book and Storage manifest are sketches.** They lack stats, NPC favor, quests, sorting and power text.
- **The 60 s refresh rebuilds the vendor table.** It keeps filters, sort and open areas, but a half-typed vault size could be lost if the refresh lands mid-edit.
- **Headless Chrome can't take a true 390px window screenshot.** The 390 images are the inspector's device-emulated captures (`concept-b-*-390*.jpg`).
