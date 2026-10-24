# Concept C: Companion

Mockup: `design/archive/concepts/concept-c.html` (archived 23 Oct; it used to be served at http://127.0.0.1:8787/concepts/concept-c.html). It reads the real API, so every number on screen is live player data.
Screenshots: `design/shots/concept-c-*.png|jpg`, plus iteration rounds in `design/shots/concept-c/`.

## 1. The argument

If Elder Game shipped an official companion app today, it would not be a 3D window floating over the world. It would be a quiet web app made by a small team that knows its own game. The skeuomorphism would be left out. The identity would come from three things the game already owns:

1. **Its window body and its type.** The ground is the game's warm brown-black (`#1E1818` is the in-game window colour) and the text is Calibri, loaded as Carlito, its metric clone. No ornament.
2. **Its painted icons.** The real 64 px CDN icons, baked frame and all, are the only "pictures". They mark what a vendor buys and what a stack is.
3. **Its voice.** The copy is dry and literal and sometimes funny ("None yet. The trainers will wait.", "Nothing looted yet. Your bags are grateful.", "The logout auto-export came out as "???" again. Harmless."). The joke never hides the instruction.

Each screen answers one question with its biggest block. Each screen also states one finding under its title:

| Screen | Question | Biggest block | Finding (live) |
|---|---|---|---|
| Session | Where did today's play go, and what did it earn? | "Where the time went": the zone timeline with the running XP total on one time axis | "No XP or loot yet. 26 min today, mostly in Casino." |
| Vendors & Space | Where can I still sell, and where is there room? | KPI strip led by councils left to sell (32 px), then the "Where to sell" / "Where there's room" zone lists | "Kodan in Sun Vale can still take 120,000 councils of armor and weapon. Otis, Qatik and Tavilak are full." |
| Character (sketch) | Which skill levels next? | Closest-to-next-level bar list | "X is N XP from level L." |
| Storage (sketch) | Where is the value? | Value by location | "474 stacks worth N councils to a vendor…" |

## 2. Direction (taste skill, app mode)

- Dealt: `draw.mjs --app --kind community --theme dark`, giving two styles. Chosen: **true-black-flat** (seed 1518350049; sheet in `.taste-skill/concept-c/direction.json`). It suits a companion: consumer-grade, elevation by lightness alone, and PG's own panels are flat code-tinted 9-slices. It also differs from the baseline's data-terminal, which the other concepts are more likely to take.
- **Move kept intact:** surfaces separated by a lightness step only (no borders on cards, no shadows); the active nav item is just brighter and bold; the one primary is an inverted pill ("I just exported").
- **Face chosen** (sheet option 2 plus option 1): the ground takes the product's temperature (PG warm brown-black), and the one data hue comes from the product's world: the game's hard-coded emphasis tan `#DFC9A0`.
- **Signature element:** the **Your data** rail (see §6).
- Redraws, with reasons:
  - Type Inter → **Carlito**. Brand constraint: the game UI is Calibri. Carlito's digits are tabular by default (verified in Chrome: `1111` and `0000` render at equal width). The inspector runs with `--allow font-not-dealt` for this reason only.
  - Card radius 20 → **8 px**, controls pill → **6 px**. PG's `Frame` sprite has small corners; the 20 px soft radius read as a consumer media app, not Gorgon.
  - Shell: no sidebar (as dealt), 52 px bar, centred 1160 px column. Grid: `784 + 16 + 360 = 1160`.

## 3. Palette

Dark (default when the OS is dark):

| Token | Hex | Source |
|---|---|---|
| ground | `#141010` | a step under the game's window body |
| surface | `#1E1818` | game window body (Steam screenshots) |
| raised | `#2A2220` | list/sunken well |
| text | `#E9E6E3` | off-white, desaturated after the inspector read `#F1EAE0` as cream |
| muted / faint | `#BDB0A2` / `#A39484` | two warm greys 4.5:1+ |
| data (the one hue) | `#DFC9A0` | game's `<color=#DFC9A0>` emphasis tan |
| ok / stale / broken / note | `#7EF132` / `#FFB300` / `#FF3333` / `#FFBA7C` | the game's own chat defaults: Tell green, "Alerts", Error, Status |
| chat channels | game defaults (`#B8B8FF` global, `#77C4FF` guild…) | only on the channel tag in the chat feed |

Light (supported; the style is dark-first, but a companion app opened in daylight beside a browser needs it): a neutral stone ground `#EBEAE8`, surface `#F8F8F7`, ink `#1E1818`, data `#765622` (tan darkened to 4.5:1), status colours darkened (`#2B7413`, `#8A5600`, `#C0262B`, `#94471A`), and chat colours darkened per channel. The cream and terracotta trap is avoided: the ground is under 12% saturation and the inspector passes it.

Theme follows `prefers-color-scheme`. A toggle in the bar overrides it (stored in `localStorage` key `c-theme`), and `?theme=dark|light` forces it for screenshots.

## 4. Type

Carlito 400/700 (plus 400 italic, loaded but unused). Sizes: 13 / 14 / 15 / 16 / 17 / 24 / 26 / 32. That is title 26/700, lead KPI 32/700, other KPIs 24/400, card titles 17/700, body 15, meta 13. Sentence case everywhere, no tracked capitals. PG's ALL-CAPS tabs were deliberately not copied: house rule, and the "official app" reading is calmer without them. Figures are tabular throughout.

## 5. Components

- **Bar:** a drawn mark (the game's rounded `Frame` outline in tan with the rust ▼ notch it draws under centred window titles; not the logo), "Companion", four text links, a **health chip**, the scope "Robchew · Arisetsu" and a theme toggle. On a phone it folds to the mark, the screen name and a full-screen menu sheet.
- **Title row:** noun h1, a finding sentence (NPC and zone names in tan, as the game emphasises them in its own strings), and the primary "I just exported". The primary re-polls `/api/reports`, `/api/vendors` and `/api/storage`, then confirms ("Storage updated, 637 free slots.") or says what to do ("Nothing new yet… In game: VIP menu → Export Storage JSON").
- **KPI strip:** one container split by 1 px dividers. On a phone it becomes a 2×2 grid.
- **Zone timeline** (Session): tan zone segments with 2 px seams on a real time axis, the cumulative XP line in ink above them, and a key ("Casino 12 min · Serbule 10 min…"). With 0 XP the plot collapses to a 30 px zero line and one sentence, instead of an empty 400-tall grid.
- **Bar lists:** 6 px tan tracks. On Vendors & Space the zone rows are clickable and filter the vendor table.
- **Tables:** 13 px grey sentence-case headers, sortable, no zebra, right-aligned tabular numbers, and 32 px CDN icons for each vendor's main buy type. Below 640 px every row becomes two lines (identity + key number, then the other fields in grey). Nothing is dropped. The manual vault-size input stays reachable on a phone.
- **Chat feed:** the game's channel colours on the channel tag only. "Saved report to /long/path" lines are shortened to the filename, because exports are the events that matter here. Channel chips are persisted; on a phone they scroll sideways.
- **States:** loading skeletons at their real size, a dashed one-sentence empty state per block, and errors inside the block that failed ("Couldn't load vendors. Last good at 08:51. Retry"). `?sim=stale|broken|nolog|down|loading` switches the mockup into each state for review.

## 6. Data-awareness treatment (DATA-AWARENESS.md)

**Your data** is a rail on every screen, computed client-side from the existing endpoints (no server change). Each row has a status dot, the source, its age in the game's colours, and **the exact fix in bold** (e.g. **VIP menu → Export Storage JSON**, **Settings → GUI → Log All Chat**).

| Check | Logic | Example copy |
|---|---|---|
| Chat log | `session.live`, log file date vs today, last tail line, `Logged Out` | "You logged out at 00:56. Logging is on; it picks up when you log back in." / stale if the newest log isn't today's |
| Character export age | newest non-`???` CharacterSheet; stale > 24 h, or if `You received N Councils` lines appear after it | "You have sold 3 times since it, so vendor room is lower than shown." |
| Broken export | newest CharacterSheet is `???`. If a complete one exists within 60 s, it is a *note* (the logout twin, harmless); otherwise *broken* (red, title gets `(!)`) | "Your newest export came out partial (name "???"). Export again while fully logged in, not right before logout: VIP menu → Export Character JSON." |
| Storage export age | newest Storage report; stale > 24 h or when the player has visited a zone with used vaults since then | "Since then you visited Casino and Serbule, where your vaults are." |
| Vault sizes | `capacity == null` gives stale; `capacitySource == manual` gives a reminder about the drifting safebox | "The Serbule Dynamic Safebox drifts between 1 and 150 slots." |
| Alts | other characters whose newest export is > 7 days old | "Log in as Faechew and export both, if you still play them." |
| Server down | all fetches fail | "Nothing is loading. Start it again: python3 server.py" |

Escalation and placement:
- **Rows are sorted by severity and filtered by screen** (Session shows chat, character, storage and the partial export; Vendors shows character, partial, storage and vault sizes). Anything stale or broken always shows. The rest folds into one "Also checked: …" line. This is the "right moment" rule applied to a page.
- **Header chip:** "Data fresh", "Storage export: 4 days old", or "2 to fix", with the worst dot. On a phone, the chip becomes a one-line summary row above the content that expands the full list.
- **Per block:** every snapshot-backed block repeats its source in its header ("From character export, 8 h ago"), with an amber dot when stale. The Vendors finding sentence adds "These are from a character export 4 days old." when stale.
- **Verify the fix:** a `Saved report to` line in the live tail reloads exports at once and posts the confirmation. "I just exported" does the same on demand.
- **Tab title** gets `(!)` when something is broken.

## 7. How PG identity is carried, without skeuomorphism

- Palette sampled from the game: the window body, its emphasis tan and its chat defaults. Status colours mean what they already mean in the player's chat window.
- Calibri metrics (Carlito), small dense type, and plain literal labels.
- Real painted CDN icons with their grey bevel frames. Icons load from `cdn.projectgorgon.com/v488/icons` directly in `<img>` (verified: 200 and `access-control-allow-origin: *`; no UA needed from a browser). The Storage sketch maps `TypeID` → `IconId` by fetching `items.json` (7 MB, CORS open) once, only on that screen.
- One flourish: the rust ▼ notch inside the mark, borrowed from the Recipes window title.
- Voice: deadpan, game-literate empty states and fixes.

## 8. Gate results

- `lint.mjs --app`: 0 FAIL, 0 WARN.
- `inspect.mjs --app --allow font-not-dealt` on #session and #vendors, dark and light: 0 FAIL. The one WARN left is on #session at 390 (`edge-text`): the chat channel chips scroll sideways, so the last visible chip is cut at the edge on purpose.
- Two look-and-fix rounds:
  1. Moved Loot, XP and Level-ups into the rail and Chat into the main column, so the columns end level. Dropped the redundant "Areas visited" list in favour of the zone key. Collapsed the 0-XP plot. Fixed `1fr` grid overflow. Shortened export paths.
  2. Made the health rail screen-relevant ("Also checked" line). Replaced shadow rules with borders. Fixed contrast of light-mode tan. Desaturated ink and surfaces out of the cream warning. Made the manual capacity input reachable on a phone. Added a stale suffix to the vendor finding.

## 9. Known weaknesses

- **Health is computed in the browser** from existing endpoints. `GorgonSettings.txt` checks (`LogChat`, combat logging, `AutoExportCharacterOnLogout`) need a server `/api/health`. "Logging is on" is inferred from today's log existing. Activity-since-export only sees the last ~200 tail lines and the day's area list.
- **Chat log status before login:** "quiet since 00:56" can't tell "game closed" from "logging off, still playing". Only the settings file can.
- **Session today is empty** (0 XP), so the XP line, XP-by-skill and loot icons are only proven in code. Item icons for loot need `items.json` (7 MB), which is lazy-loaded the first time loot exists.
- **Character and Storage are sketches.** They lack the full skills table, stats, favor, quests, the item location filter and paging.
- **Vendor-type icons are representative picks** from `items.json` (e.g. "Quality Leather Boots" for armor). They read as types, but a hand-picked set would be better. The CDN version (v488) is hard-coded; the API should expose it.
- **The chat channel colours add hues.** They are confined to tags and kept on purpose, because players already read the channels by them.
- **Naming:** "Companion" with an "official" feel must not use Elder Game's name or logo. The mark is original.
- Headless Chrome won't go below 500 px wide with `--window-size`. The true 390 px renders come from the inspector (`concept-c-*-390-*.jpg`).
