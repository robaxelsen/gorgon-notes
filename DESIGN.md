---
name: Gorgon Notes
description: A fan-made Project Gorgon companion that looks like one more window Elder Game shipped, and always says how old its numbers are and what to do in game to refresh them.
colors:
  # Dark theme (default). Chrome sampled from the game's windows.
  world: "#161111"
  window: "#1E1818"
  titlebar: "#241E1E"
  footer: "#30241E"
  well: "#2A241E"
  row-hover: "#332A27"
  frame: "#3A2C2B"
  rule: "#2D2423"
  control: "#8A7462"
  field: "#120E0E"
  text: "#E8E2DA"
  text-dim: "#A88E78"
  icon-taupe: "#99806C"
  emphasis-tan: "#DFC9A0"
  selection-gold: "#B8934F"
  data-gold: "#D8AD4D"
  coin-face: "#D8AD4D"
  coin-rim: "#8A6A12"
  track: "#3A302A"
  rust: "#782A18"
  rust-hover: "#8A3220"
  rust-hi: "#A2482A"
  rust-lo: "#4A160C"
  on-rust: "#F3DFE0"
  oxblood: "#421206"
  alert-amber: "#FFB300"
  error-red: "#FF5A5A"
  status-peach: "#FFBA7C"
  # Khaki content pane (ledger tables), dark theme.
  pane: "#937A53"
  pane-hover: "#9B8259"
  pane-head: "#A08A60"
  pane-ink: "#120C04"
  pane-rule: "#5C4628"
  pane-bar: "#2A1E0C"
  pane-flag: "#5C0808"
  pane-focus: "#120C04"
  # Selected row (oxblood) overrides, both themes and on the pane.
  sel-bg: "#421206"
  sel-text: "#F3DFE0"
  sel-bar: "#D8AD4D"
  sel-flag: "#F3DFE0"
  sel-free: "#B8934F"
  sel-focus: "#B8934F"
  # Chat channel defaults (the game's colour-preference table). Chat window only, dark in both themes.
  chat-global: "#B8B8FF"
  chat-nearby: "#FFB300"
  chat-npc: "#FFB300"
  chat-tell: "#7EF132"
  chat-party: "#00C4FF"
  chat-guild: "#77C4FF"
  chat-trade: "#00FFFF"
  chat-help: "#FFFF00"
  chat-emote: "#FFBA7C"
  chat-error: "#FF3333"
  chat-item-link: "#F883FF"
  chat-player: "#CABD00"
  chat-timestamp: "#CCCCCC"
  # Daylight: a non-game accessibility mode. Neutral warm grey chrome; khaki stays on the main pane only.
  day-world: "#D6D0C6"
  day-window: "#E9E6E1"
  day-titlebar: "#E1DBD1"
  day-footer: "#DDD6CB"
  day-well: "#DDD6CB"
  day-row-hover: "#E2DCD2"
  day-frame: "#C8C0B3"
  day-rule: "#D0C8BB"
  day-control: "#776A5A"
  day-field: "#F4F3F0"
  day-text: "#1C1610"
  day-text-dim: "#5E5244"
  day-icon: "#6E6252"
  day-title: "#5A3A14"
  day-selection: "#6B2A12"
  day-data: "#76590C"
  day-track: "#D0C8BB"
  day-alert: "#844500"
  day-error: "#AE111A"
  day-status: "#6A4410"
  day-pane: "#CDBB95"
  day-pane-hover: "#C4B18A"
  day-pane-head: "#C2AE86"
  day-pane-ink: "#1A1206"
  day-pane-dim: "#3A2C12"
  day-pane-rule: "#A08B64"
  day-pane-bar: "#3A2A10"
  day-pane-flag: "#7A0E0E"
  day-pane-focus: "#6B2A12"
typography:
  headline:
    fontFamily: "Carlito, Calibri, 'Segoe UI', sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  lead-figure:
    fontFamily: "Carlito, Calibri, 'Segoe UI', sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    fontFeature: "'tnum' 1, 'lnum' 1"
  figure:
    fontFamily: "Carlito, Calibri, 'Segoe UI', sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.2
    fontFeature: "'tnum' 1, 'lnum' 1"
  title:
    fontFamily: "Carlito, Calibri, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Carlito, Calibri, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "'tnum' 1, 'lnum' 1"
  small:
    fontFamily: "Carlito, Calibri, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.35
  tab-caps:
    fontFamily: "Carlito, Calibri, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.06em"
  pane-section:
    fontFamily: "Carlito, Calibri, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.25
rounded:
  slot: "2px"
  control: "4px"
  pane: "4px"
  window: "6px"
  pill: "999px"
spacing:
  2xs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  # Dark-theme values. Daylight swaps tokens by the table in Colors → Daylight; components never hard-code a theme.
  window:
    backgroundColor: "{colors.window}"
    textColor: "{colors.text}"
    rounded: "{rounded.window}"
    padding: "12px"
  window-titlebar:
    backgroundColor: "{colors.titlebar}"
    textColor: "{colors.emphasis-tan}"
    typography: "{typography.title}"
    height: "32px"
    padding: "0 12px"
  window-footer:
    backgroundColor: "{colors.footer}"
    textColor: "{colors.text-dim}"
    typography: "{typography.small}"
    height: "32px"
    padding: "0 12px"
  pane:
    backgroundColor: "{colors.pane}"
    textColor: "{colors.pane-ink}"
    rounded: "{rounded.pane}"
    padding: "0"
  button-primary:
    backgroundColor: "{colors.rust}"
    textColor: "{colors.on-rust}"
    rounded: "{rounded.control}"
    height: "32px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.rust-hover}"
    textColor: "{colors.on-rust}"
  button-ghost:
    backgroundColor: "{colors.window}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    height: "32px"
    padding: "0 16px"
  button-ghost-hover:
    backgroundColor: "{colors.row-hover}"
    textColor: "{colors.text}"
  fix-plaque:
    backgroundColor: "{colors.rust}"
    textColor: "{colors.on-rust}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  tab:
    backgroundColor: "{colors.well}"
    textColor: "{colors.text-dim}"
    typography: "{typography.tab-caps}"
    height: "32px"
    padding: "0 12px"
  tab-active:
    backgroundColor: "{colors.well}"
    textColor: "{colors.selection-gold}"
    typography: "{typography.tab-caps}"
  chip:
    backgroundColor: "{colors.well}"
    textColor: "{colors.text-dim}"
    rounded: "{rounded.pill}"
    height: "28px"
    padding: "0 12px"
  chip-on:
    # Goods chips only. Oxblood and sel-* do not swap in Daylight, so the text must be sel-text, never text.
    backgroundColor: "{colors.sel-bg}"
    textColor: "{colors.sel-text}"
    borderColor: "{colors.sel-focus}"
    rounded: "{rounded.pill}"
  chip-channel-on:
    backgroundColor: "{colors.well}"
    textColor: "{colors.text}"
    borderColor: "{colors.control}"
    rounded: "{rounded.pill}"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    height: "32px"
    padding: "0 12px"
  nav-item:
    backgroundColor: "{colors.window}"
    textColor: "{colors.text-dim}"
    typography: "{typography.small}"
    width: "64px"
    height: "60px"
  nav-item-active:
    backgroundColor: "{colors.well}"
    textColor: "{colors.selection-gold}"
  row-selected:
    backgroundColor: "{colors.sel-bg}"
    textColor: "{colors.sel-text}"
  health-note:
    backgroundColor: "{colors.window}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    padding: "12px"
  reminders-panel:
    backgroundColor: "{colors.window}"
    textColor: "{colors.text}"
    rounded: "{rounded.window}"
    width: "360px"
    padding: "12px"
  toast:
    backgroundColor: "{colors.titlebar}"
    textColor: "{colors.text}"
    rounded: "{rounded.window}"
    padding: "12px 16px"
---

# Design System: Gorgon Notes

> **Name.** "Gorgon Notes", confirmed by the user on 2026-10-23 (clash check in `docs/NAMING.md`). It follows the game's plain-noun window names ("Notepad", "Item Info") and always sits next to "fan-made, not affiliated with Elder Game", because it contains "Gorgon". **Implementation rule:** the name and the fan-made line live in two constants at the top of `static/app.js` (`APP_NAME`, `FAN_LINE`); the shell, the tab title, the About popover, notification titles and the favicon's `<title>` all read them at boot (elements marked `data-app-name`, `data-fan-line`, `data-fan-aria`). The static `<title>` and brand label in `static/index.html` are only the pre-boot fallback, so a rename is one edit to app.js plus, for the first paint, the same words in index.html and the fan-made line can never be left behind.

## Overview

**Creative North Star: "The Window the Game Forgot to Ship"**

Mode: **Operate.** The player comes to get a job done between two things in game: decide where to sell, decide where to store, check what the session earned, and make sure the numbers are true. The screen is first a working product of its category (navigation, filters, sortable tables, charts with states), and the game's world lends only four things: **type, palette, density, and one signature move**. The world never supplies the layout or the controls. Every control is a standard web control the player already knows.

**The design argument.** Project Gorgon's own interface is a flat, dense, warm-charcoal toolbox built by a tiny team: near-black brown windows, thin warm frame lines, small corners, tan titles, a flat khaki content pane in the Recipes and Item Info windows, rust-red list buttons, Calibri at 13 to 16 px, and all the colour coming from painted item icons and chat channel colours. If Elder Game built a companion, it would be more of those windows. So every block on this page is a game window. The main table of each view sits on the khaki content pane, inset in its window like the Recipes pane. The voice is the game's deadpan system-message voice. Nothing is parchment, filigree or "fantasy".

**The signature move: provenance as the game's own footer.** Every window ends in the game's footer strip, and that strip always says where its numbers came from, how old they are, and, when it matters, the exact in-game step to refresh them ("Character export, 8 h ago · After selling: VIP menu → Export Character JSON"). A per-view margin, "Where these numbers come from", collects those verdicts, and the export receipt the game writes ("Saved report to …") becomes the stamp in each title row. Data freshness is not a widget added to a dashboard; it is how the game's own chrome is used.

**Project Gorgon identity principles** (from `design/research/pg-visual-identity.md`):

1. **Flat, tinted, small.** The client ships no UI textures, only white 9-slice shapes tinted in code, with a soft drop shadow. So: flat fills, 1 px warm frames, 4 to 6 px corners, one shadow. No texture, no gradient, no ornament.
2. **Chrome is quiet, content is loud.** Colour lives in painted CDN icons, chat channels and status. Chrome is brown, tan and gold.
3. **The game's colours keep their meaning: exact hue, lightness adjusted only where WCAG AA needs it.** Tan `#DFC9A0` is the game's hard-coded emphasis for NPC names, areas and counts (used as is). Peach `#FFBA7C` is the `[Status]` channel (as is). Red is the `[Error]` channel (`#FF3333` in chat; lifted to `#FF5A5A` for UI text so it reads at 4.5:1 on footers and hovered rows). Amber `#FFB300` is the game's "Alerts" colour preference (as is). The khaki pane is the game's `#7E6642` lifted to `#937A53`, and its ink is near-black instead of the game's `#423218` brown, both for 4.5:1. Each drift is listed with its reason in Colors.
4. **Small, dense Calibri.** Carlito (Calibri's metric clone) at the game's sizes. No display faces, no hero headlines.
5. **Game nouns, literal labels, dry humour.** "Slots Free: 637", "Councils", favor tiers, VIP menu. The joke never hides the instruction.
6. **Fan-made, never official-looking.** No logo imitation, no Elder Game branding. The shell says "fan-made, not affiliated with Elder Game".

**Key Characteristics:**
- Every block is a window: title bar, body, footer strip with source, age and fix.
- The main table of each view sits on an inset khaki pane; everything else is on dark window body.
- Right-edge icon rail of taupe silhouettes (the game's toolbar), a bottom tab bar on a phone.
- Dark by default. Daylight is a non-game accessibility mode with neutral warm-grey chrome; the khaki stays on the main pane and the chat log stays dark.
- One data hue (council gold), status colours only for status, chat colours only in the chat log.
- Freshness on every surface: title stamp, window footers, the per-view margin, age marks in the At a glance window, tab title and favicon, all from one health verdict (see Data health and the Server contract).

## Colors

A warm brown-black chrome sampled from the game's windows, a flat khaki pane for the tables that matter, and the game's own chat defaults for status. All values below are in the frontmatter; contrast is measured with the WCAG 2.x formula.

### Primary
- **Emphasis Tan** (`emphasis-tan`): window titles, the view title, and emphasis inside sentences (NPC names, areas, key counts in a finding), exactly as the game's `<color=#DFC9A0>` does: **colour only**, regular weight. Only numbers inside a finding also take 700 (see Typography). Never a fill. Daylight: `day-title`.
- **Selection Gold** (`selection-gold`): the active tab label and its 2 px underline, the active rail item and its 2 px edge, and the outer focus ring on dark surfaces (Inputs → Focus). The game's active-tab gold. It swaps to `day-selection` in Daylight, so it is **never** used for anything drawn on or against oxblood: the 1 px border of a pressed goods chip or a selected area bar is `sel-focus` (same gold, does not swap).

### Secondary
- **Rust** (`rust`, hover `rust-hover`, with `rust-hi` top edge and `rust-lo` bottom edge, text `on-rust`): the one action colour. It fills the **fix plaque** (two lines, bevel, "do this in game") and the **primary button** (one line, flat, no bevel, "do this here"). The game's rust list button and dark-red Craft button are one family; this app uses one red for "act" and separates the two by form, never by a near-identical second red. The earlier `craft-red` token is retired. Taste-skill's terracotta detector (`rules.mjs`: hue 6 to 30, saturation 0.38 to 0.85, lightness 0.42 to 0.72) does **not** fire on this family: `rust` (l 0.28), `rust-hover` (l 0.33) and `rust-hi` (l 0.40) are all below its lightness floor, so no `taste-skill-ignore` comment is needed. Keep it that way; a rust lifted above l 0.42 would become the generic terracotta accent. The primary button's boundary against a dark `window` is 1.79:1 (7.87:1 against `day-window`). That is accepted: the button is identified by its label, not its edge, and the fix plaque adds the bevel. Do not "fix" it with a border.
- **Oxblood** (`oxblood` = `sel-bg`): selected table row, selected area bar, pressed goods chip. The game's selected-row colour. Never used for an action.

### Tertiary
- **Council Gold** (`data-gold`): the one data hue. Bar fills, the XP line, the coin medallion face. On the khaki pane the data hue is `pane-bar` ink; in Daylight it is `day-data` (ochre), and `day-pane-bar` on the Daylight pane.

### Neutral (dark theme)
- **Under-window Black** (`world`): page ground, below the windows, like the game's context menu.
- **Window Body** (`window`): every window body, the chat log body and the rail. The game's dominant `#1E1818`.
- **Title Bar** (`titlebar`): window title bars, toasts. A hair lighter than the body.
- **Footer Strip** (`footer`): window footers, the provenance strip.
- **Sunken Well** (`well`): tab strips, chips, rail active cell, inline code-like file names.
- **Row Hover** (`row-hover`): hover on rows in dark windows.
- **Frame Line** (`frame`) and **Row Rule** (`rule`): the 1 px window frame and row dividers. Decorative; boundaries are also carried by the tonal step and shadow.
- **Control Edge** (`control`): borders of inputs, selects, ghost buttons, checkboxes, channel chips and tag chips. `#8A7462` reaches 3:1 on every dark surface a control can sit on (window, titlebar, well, footer, row-hover); see Contrast. Never used on the pane (see `pane-focus` and the pane free cell).
- **Field** (`field`): input fills.
- **Body Text** (`text`), **Dim Text** (`text-dim`): body and secondary text. Dim is the game's toolbar taupe lifted to 4.5:1.
- **Toolbar Taupe** (`icon-taupe`): rail silhouettes, UI glyphs, and the ok status shape (4.72:1, non-text).
- **Track** (`track`): empty part of a bar. 1.36:1 on `window` (Daylight `day-track` 1.33:1), below WCAG 1.4.11's 3:1, so the track never carries meaning alone: on every share-of-cap bar the value label states the cap in text ("71,197 of 120,000"), see Components → Bars.

### The Khaki Pane
- **Content Pane** (`pane`, `pane-hover`, `pane-head`): the main ledger table of each view. The game's `#7E6642` pane, lifted only as far as ink needs (`#8F7650` gives 4.51:1, too thin, so the pane is `#937A53` at 4.77:1).
- **Pane Ink** (`pane-ink`): **all** text on the pane, including inline messages from the vault size input. Secondary text on the pane is the same ink at 13 px, never a lighter colour (nothing lighter reaches 4.5:1). No status colour (amber, peach, red, gold) is ever text on the pane.
- **Pane Rule** (`pane-rule`): row dividers and the double rule above subtotals.
- **Pane Bar** (`pane-bar`): bars, used slot cells and the coin rim on the pane (3.99:1, graphic).
- **Pane Flag** (`pane-flag`): a status shape on the pane (3.45:1, graphic only, always paired with an ink word).
- **Pane Focus** (`pane-focus`, = pane ink): the 2 px **inset** focus ring (`outline-offset: -2px`) for every control on the pane (sort headers, ▶/▼ foldouts, the vault size input, unselected rows). 4.77:1 on `pane`, 5.31:1 on `pane-hover`. Gold is never a focus ring on the pane (1.42:1); a selected pane row takes `sel-focus` inset, so the gold lands on oxblood, never on the neighbouring khaki rows.
- **Pane free cell**: a 1 px `pane-ink` outline (4.77:1). `control` is never used on the pane (1.08:1).

### Selected rows (`sel-*`)
A selected row is `sel-bg` (oxblood) with `sel-text` (on-rust) in both themes and on the pane. Every graphic inside it switches too, or it would vanish (pane-bar 1.02:1, pane-flag 1.13:1, ink slot cells 1.22:1 on oxblood):
- Bars and used slot cells: `sel-bar` (data gold, 7.57:1). Track inside a selected row: `rust-lo` (1.07:1, decorative; the value label carries "of cap").
- Free slot cells: 1 px `sel-free` outline (selection gold, 5.55:1).
- Status shapes and the coin rim: `sel-flag` (on-rust, 12.45:1).
- Focus ring on a selected row: `sel-focus`, inset (`outline-offset: -2px`), so it is drawn on oxblood (5.55:1), in both themes. Pressed chips are not rows: their ring is outside the chip and follows the outer surface (Inputs → Focus).
- The 1 px border of a pressed goods chip or a selected area bar: `sel-focus` (= `sel-free`, selection gold), unchanged in Daylight.
- Daylight's `day-selection` is never drawn on or against oxblood (1.49:1).

### Status (the game's chat defaults, plus shapes)
| Severity | Shape colour (dark / Daylight) | Text colour (dark / Daylight) | Shape | Game source |
|---|---|---|---|---|
| ok | `icon-taupe` / `day-icon` | `text-dim` / `day-text-dim` | ring with check | none (quiet: no colour) |
| info | `emphasis-tan` / `day-title` | `text` / `day-text` | ring with "i" | none; the game's emphasis tan marks it as a note |
| warn (stale, act) | `alert-amber` / `day-alert` | `alert-amber` / `day-alert` | triangle with "!" | the "Alerts" colour preference (`#important`). Plain amber text, **no bracket tag**: the game prints no `[Alert]` tag |
| bad (broken, missing) | `error-red` / `day-error` | `error-red` / `day-error` | square with "×" | the `[Error]` channel |
| confirmation | none | `status-peach` / `day-status` | none, `[Status]` prefix | the `[Status]` channel |

Verified bracket tags in the player's chat logs (last 8 logs): `[Combat]`, `[Status]`, `[NPC Chatter]`, `[Global]`, `[Error]`, `[Guild]`, `[Nearby]`, `[Action Emotes]`, `[Help]`, `[Party]`, `[Trade]`, `[Emotes]`, `[Tell]`, custom rooms. There are **no** `[Info]` or `[Alert]` lines. This app prints only `[Status]` and `[Error]` as tags. `#CCCCCC` is the chat timestamp colour (`chat-timestamp`) and is used only for timestamps in the chat log; the former `info-grey` token is retired.

**DECISION override (graft A5).** `design/concepts/DECISION.md` graft 5 specified `[Alert]` `#FFB300`, `[Info]` grey and `[Error]` `#FF4D4D`. This document overrides it on log evidence: the game prints no `[Alert]` or `[Info]` tag (list above), so printing them would put words in the game's mouth; and the error red is the game's chat `#FF3333` lifted to `#FF5A5A` for AA on footers and hovered rows, not `#FF4D4D` (which is neither the game's value nor needed). Amber keeps the "Alerts" preference colour, untagged.

### Chat channels
The game's colour-preference defaults (`chat-*` tokens), used **only** on the channel tag and special spans inside the chat log window. The whole chat window (title bar, body, footer, chips) uses the dark tokens in both themes. Custom rooms (EggRun, pudding, LFG…) use `text`.

### Daylight
The game has no light theme. Daylight is an **accessibility mode for bright rooms**, not a game look, and it is built to stay out of the parchment cliché: the ground and windows are a neutral pale warm grey, not tan; the khaki appears only on the main pane, exactly as in dark theme.

**DECISION override (§2, §3).** DECISION.md says "Daylight theme = the khaki pane promoted to the window" and "a khaki Daylight theme". This document overrides that: khaki promoted to every window fills well over half of a 1440 screenshot with one tan hue, which is the "old paper / parchment" look the brief and DECISION's own Don'ts reject, and it removes the one thing that makes the main table stand out (the pane as the only khaki surface). Neutral warm-grey chrome with khaki on the pane keeps the game's composition (khaki pane inside darker chrome) in light form.

**Lint allowance (DECISION #27 requires every WARN argued).** `day-window` `#E9E6E1` (HSL s 0.154) and `day-field` `#F4F3F0` (s 0.154) were desaturated to sit just under taste's `palette-cream` floor (s ≥ 0.16 at l ≥ 0.88), so that rule does not fire. `day-frame` was lightened to `#C8C0B3` (1.45:1 on `day-window`, inside the 1.1 to 1.5 band `heavy-borders` expects); the dark `frame` is 1.31:1 on `window`. If either rule still warns after a token tweak, the argument is: Daylight's warmth is the game's warm grey-brown chrome, not a yellow cream; the frame is a hairline, and control boundaries are carried by `day-control`, not the frame. Test: a 1440 screenshot of each view in Daylight must not read as "old paper" (more than 50% of the viewport in a tan hue fails; today the khaki pane is under 40%).

**Token swap table** (every component maps through it; nothing is dark-only except the chat window):
| Dark token | Daylight token | Dark token | Daylight token |
|---|---|---|---|
| world | day-world | text | day-text |
| window | day-window | text-dim | day-text-dim |
| titlebar | day-titlebar | icon-taupe | day-icon |
| footer | day-footer | emphasis-tan (titles and in-sentence emphasis) | day-title |
| well | day-well | selection-gold (tabs, rail, focus off the pane) | day-selection |
| row-hover | day-row-hover | data-gold | day-data |
| frame | day-frame | track | day-track |
| rule | day-rule | alert-amber | day-alert |
| control | day-control | error-red | day-error |
| field | day-field | status-peach | day-status |
| pane | day-pane | pane-ink | day-pane-ink |
| pane-hover | day-pane-hover | pane-rule | day-pane-rule |
| pane-head | day-pane-head | pane-bar | day-pane-bar |
| pane-flag | day-pane-flag | pane-focus | day-pane-focus |
| rust family, on-rust | unchanged | oxblood and `sel-*` | unchanged |

On the Daylight pane, `day-pane-dim` is allowed for secondary text (7.19:1). Daylight keeps four distinct hues for four meanings: data is ochre (`day-data`), selection is oxblood-brown (`day-selection`), error is a clear red (`day-error`), and alert is burnt orange (`day-alert`). Text and dim text sit 2.36:1 apart; the pane sits 1.51:1 below the window.

Text on the page ground: the title row, the system line, the preview notice and the server-down banner sit on `world` / `day-world`, not inside a window, and they carry the freshness stamp. Every status colour used there is measured on the ground too (rows marked "on world" below).

### Contrast (measured)
Recomputed after the Daylight token changes (`day-window`, `day-field`, `day-frame`, `day-alert`, `day-error`).
| Pair | Ratio | Pair | Ratio |
|---|---|---|---|
| text on window | 13.61 | day-text on day-window | 14.40 |
| text on footer | 11.69 | day-text on day-field | 16.15 |
| text-dim on window | 5.68 | day-text-dim on day-window | 6.10 |
| text-dim on footer | 4.87 | day-text-dim on day-footer | 5.26 |
| text-dim on row-hover | 4.53 | day-text-dim on day-world (on world) | 4.95 |
| emphasis-tan on titlebar | 10.16 | day-title on day-titlebar | 7.44 |
| emphasis-tan on window (in-sentence) | 10.84 | day-title on day-window (in-sentence) | 8.23 |
| selection-gold on window | 6.11 | day-selection on day-window | 8.59 |
| selection-gold on well | 5.35 | day-selection on day-well | 7.41 |
| alert-amber on footer | 8.38 | day-alert on day-footer | 5.14 |
| error-red on footer | 4.91 | day-error on day-footer | 5.03 |
| error-red on window | 5.72 | day-error on day-window | 5.83 |
| error-red on row-hover | 4.57 | day-error on day-row-hover | 5.32 |
| status-peach on window | 10.48 | day-status on day-footer | 5.95 |
| text on world (on world) | 14.54 | day-text on day-world (on world) | 11.69 |
| text-dim on world (on world) | 6.06 | day-alert on day-world (on world) | 4.84 |
| emphasis-tan on world (on world) | 11.58 | day-error on day-world (on world) | 4.73 |
| alert-amber on world (on world) | 10.42 | day-title on day-world (on world) | 6.68 |
| error-red on world (on world) | 6.11 | day-status on day-world (on world) | 5.60 |
| status-peach on world (on world) | 11.20 | day-alert on day-window | 5.96 |
| selection-gold on world (focus, title row) | 6.53 | day-selection on day-world (focus, title row) | 6.97 |
| pane-ink on pane | 4.77 | day-pane-ink on day-pane | 9.83 |
| pane-ink on pane-hover | 5.31 | day-pane-ink on day-pane-hover | 8.83 |
| pane-ink on pane-head | 5.83 | day-pane-ink on day-pane-head | 8.55 |
| on-rust on rust / rust-hover | 7.67 / 6.43 | day-pane-dim on day-pane | 7.19 |
| sel-text on sel-bg | 12.45 | text on field | 14.91 |
| control on window (3:1 rule) | 3.97 | day-control on day-window | 4.22 |
| control on well / footer | 3.47 / 3.40 | day-control on day-well / day-footer | 3.64 |
| control on row-hover | 3.17 | day-icon on day-well | 4.12 |
| control on world (title-row ghost button) | 4.24 | day-control on day-world (title-row ghost button) | 3.43 |
| icon-taupe on window (3:1 rule) | 4.72 | day-data on day-window / day-footer (graphic) | 5.26 / 4.54 |
| pane-flag on pane (graphic) | 3.45 | day-pane-flag on day-pane (graphic) | 5.87 |
| pane-bar on pane (graphic) | 3.99 | day-pane-bar on day-pane (graphic) | 7.33 |
| pane-focus on pane / pane-hover (inset focus) | 4.77 / 5.31 | day-pane-focus on day-pane (inset focus) | 5.67 |
| pane free cell (pane-ink) on pane | 4.77 | day free cell (day-pane-ink) on day-pane | 9.83 |
| sel-bar on sel-bg (graphic) | 7.57 | sel-focus / sel-free on sel-bg (inset focus, chip border) | 5.55 |
| sel-flag on sel-bg (graphic) | 12.45 | rust on window (button boundary, accepted) | 1.79 |
| track on window (decorative, see Track) | 1.36 | day-track on day-window (decorative) | 1.33 |
| rust-lo on sel-bg (decorative) | 1.07 | day-frame on day-window (hairline) | 1.45 |

**Chat window** (its body is `window`, not `world`): chat-error 4.81, chat-global 9.46, chat-guild 9.28, chat-party 8.62, chat-timestamp 10.91.

Gold as text is used only on window, well or footer. Status colours are never text on the pane (amber 2.27:1, peach 2.44:1, red 1.33:1 there).

### Named Rules
**The Healthy Is Quiet Rule.** An ok source gets a `icon-taupe` ring-check and `text-dim` text. Amber and red appear only when the player should do something. No green anywhere outside the chat log's Tell channel.

**The Shape-Plus-Word Rule.** No status is ever colour alone. Every status carries its shape and a word ("Full", "8 d old", "partial"). This is what keeps stale amber distinct from the Nearby chat amber, and what keeps status readable on the khaki pane. The triangle and the square are this app's additions, drawn in the same flat single-colour style as the `Shared_ui` ring, dot and ✓ (the game has no warning triangle).

**The Three Percent Rule.** Coloured pixels (data gold, status, icons aside) stay near 3% of a screen. The painted icons are the colour; chrome is brown.

**The Full Is Not Broken Rule.** A full vault is information: the word "Full" and a full strip in ink or gold. Error red is for broken or missing data only.

**The One Light Surface Rule** (measurable). In dark theme the pane is the only **surface** lighter than `row-hover` (pane relative luminance 0.21; every other dark surface is at most 0.025, `row-hover`). A surface is anything that holds content: windows, title bars, footers, wells, rows, panels, fields, chips. Therefore: at most one pane per view, never more than 40% of the viewport area at 1440 × 900, and no other surface fill may exceed `row-hover`'s luminance except buttons (rust) and selected rows (oxblood is darker anyway). **Exempt, because they are marks, not surfaces:** data marks (bar fills, used slot cells in `text-dim`, the XP line, the coin face in `data-gold`), glyphs (status shapes, chip dots, the checkbox tick, rail silhouettes) and painted icons. Each mark stays within its component's size spec, so the exemption cannot grow into a light panel.

## Typography

**Font:** Carlito (Google Fonts, 400 and 700), falling back to Calibri, "Segoe UI", sans-serif. The game's UI face is Calibri; Carlito is metric-compatible. It is the only face.

**Character:** one plain office sans at the game's small sizes, with tabular figures everywhere. The khaki pane's area headings are Carlito 700 in pane ink, as the game's Recipes and Item Info panes use Calibri with "a darker heading" (research §2). The earlier Noto Serif heading is dropped: the client ships Noto Serif for books and inscriptions, not panes, and a serif on khaki pulled the pane toward the "ledger / old paper" cliché.

### Hierarchy
- **Headline** (700, 22 px, 1.2, `emphasis-tan`): the one view title (h1): "Vendors". The game's large centred pane title is about 22 px. 20 px on a phone.
- **Lead figure** (700, 22 px, 1.2, tabular): the one answer figure per view ("1,589,320" councils left), in the At a glance window. Capped at the game's top size, the headline's 22 px. 20 px on a phone.
- **Figure** (400, 20 px, 1.2, tabular): sibling figures in the At a glance window. The lead is told apart by weight and position, not by size.
- **Title** (700, 16 px, 1.25, `emphasis-tan`): window titles.
- **Body** (400, 15 px, 1.45): findings, table cells, notes, the chat log and the "What happened" feed. 15 is the game's GUI default. Findings max 75ch. Emphasis in a finding is colour only; numbers in a finding are colour plus 700.
- **Small** (400, 13 px, 1.35): column headers (sentence case, `text-dim`), footers, stamps, rail labels, meta. 13 px is the floor; nothing smaller.
- **Tab caps** (700, 13 px, 0.06em, ALL CAPS): window tabs only.
- **Pane section** (Carlito 700, 16 px, `pane-ink`): area headings inside a ledger pane.
- **Fix plaque**: line 1 is body 15 at 700, line 2 small 13. No new size.

Five sizes: 13, 15, 16, 20, 22 (desktop and phone alike: on a phone the h1 and the lead figure drop to 20, which is already in the scale). The former 14 px chat size is merged into body so the bottom of the ladder carries hierarchy; 15 and 16 are kept apart by weight and colour (title is 700 tan, body 400 text). Well under taste's warn at more than 9 sizes.

### Named Rules
**The Tabular Rule.** `font-variant-numeric: tabular-nums lining-nums` on the body. Every number column is right-aligned with fixed decimals per metric and one abbreviation rule per column.

**The Caps Allowance Rule.** ALL CAPS appears only in window tabs, because the game's tabs are all caps. This deliberately overrides the taste-skill "one tracked label per screen" rule; mark it in the CSS with a `taste-skill-ignore: PG tabs are all caps in game` comment. Table headers, buttons and labels stay sentence case.

**The At-a-Glance Allowance.** Each view answers one numeric question ("how many councils can I still get?", "how many slots are free?") that the player reads at a glance from a second screen, so its figures get their own small window. What keeps it from being the "big KPI hero" pattern the game never uses (research §4 "No giant display headlines", §6 "big KPI hero cards"): the lead figure is capped at 22 px, the game's largest text (the centred pane title); there are no tiles or boxes, only label-over-value cells in one window; only nonzero figures show; every figure carries its source age when stale; the lead figure is also stated in the finding; and the window has a title bar and a provenance footer like every other block. The precedent is the game's **footer summary line**, small off-white text in the inventory footer strip ("🪙 47,702 · Slots Free: 0", research §2.4 and §5.2): literal "label: value" pairs, never a big count. The figures borrow its labels and its format ("Slots Free", the coin), at figure size. Files has no At a glance window: it answers no numeric question; its counts live in the finding and the pane's section rows (the one exception to "every view").

**The No Display Face Rule.** No Cinzel, Marcellus, Trajan, blackletter, or any "fantasy" face, and no serif anywhere in the UI.

## Layout

**Spatial model.** A dark world ground with windows on it, a right-edge rail, and per view: a title row, then the view's windows (the first is the small At a glance window) in a main column beside the margin window. Spacing comes from a 4 px base (`2xs` 4, `xs` 8, `sm` 12, `md` 16, `lg` 24, `xl` 32), and every component height and padding is a multiple of 4 (rows 32/36/44, chips 28, footers 32, buttons 32). Exempt (the 4 px micro-graphic exemption): 1 to 2 px hairlines and the parts of micro-graphics no larger than 4 px (slot strip cells and gaps, status marks, the rust notch, the coin rim, and the empty icon slot's notch ticks, which are 1 × 3 px). Nothing in the exemption may be drawn as a separate piece of chrome (no corner brackets, rulers or crop marks). One gap between windows: 16 px.

**Shell at 1180 px and wider.**
- **Shell header**, 44 px, on `world`, 1 px `frame` bottom: mark and product name at the left, then scope ("Robchew · Arisetsu"; a select when more than one character has exports), then the location line in the minimap's format, "Casino (logged out 00:56)". At the right: the health summary pill, the theme control (Auto / Dark / Daylight), and the "Reminders" button that opens the Reminders panel.
- **Rail**, 64 px wide, fixed to the right edge, full height, `window` background, 1 px `frame` left edge. Five items, 60 px tall: Session, Vendors, Storage, Character, Files. A small "fan-made, not affiliated with Elder Game" line sits at the rail's foot as a link to an About popover.
- **Canvas**: padding 24 px; grid `minmax(0,1fr) 320px` with a 16 px gap (336 px margin column at 1440 and wider); content max width 1600 px, centred in the space left of the rail.
- **Title row**: the same grid as the canvas, `minmax(0,1fr) 320px` (336 px at 1440 and wider) with a 16 px gap, so the stamp block lines up with the margin window under it. Min-height 64 px. Left: h1 and the finding. Right, fixed position on every view: the stamp (two lines, right-aligned) and Check again. The stamp never moves with the length of the finding. The title row is **not** a window: it borrows the game's one sanctioned on-world text, the quest tracker (research §5 item 11: a tan bold headline over a light sub-line), so the h1 is `emphasis-tan` 700 and the finding `text`, and it reads as HUD text rather than a web page header. The tracker's drop shadow is left out: this ground is flat, not 3D scenery, so the shadow has nothing to separate the text from.
- **At a glance window**: the first window of the main column, full main width (Components → At a glance).
- The margin column is sticky (`top: 16px`) and scrolls internally when taller than the viewport.

**Density.** Table rows 32 px in dark windows, 36 px on the pane (28 px icons), 44 px minimum touch height on a phone. Window body padding 12 px. Pane inset 8 px inside its window body.

### Responsive
| Width | Change |
|---|---|
| ≥ 1440 | Margin 336 px. Paired windows (Level-ups beside XP by skill, for example) sit side by side. |
| 1180 to 1439 | Margin 320 px. Same structure. |
| 768 to 1179 (tablet) | Rail stays (same 64 px, icon over label). The margin becomes a full-width **health window** directly under the title row (same title, notes and footer as the margin), notes in a `repeat(auto-fit, minmax(min(100%, 280px), 1fr))` grid. Windows stack in one column; small pairs stay paired above 960 px. Tablets never get the health strip. |
| < 768 | Rail becomes a **sticky bottom tab bar**, 56 px plus safe-area inset, five items (icon over 13 px label; 78 px cells at 390 px, 64 px at 320 px). Shell header becomes a sticky 48 px top bar: mark, character name, health summary pill, Reminders button (icon only, `aria-label="Reminders"`). Gutter 16 px. Title row stacks: h1 (20 px), finding, then stamp and Check again on one row. At a glance: 2-column grid, lead figure (20 px) spans both. The health window becomes the **health strip** (phones only): one line when everything is ok, auto-expanded with fixes inline when anything is warn or bad. |
| < 640 | Tables become two-line rows: line 1 is identity plus the key figure with its label ("71,197 left"); line 2 is the other fields in `small` dim, joined with " · " and no empty joins. Phone vendor and vault rows keep a small 48 px bar (spent of cap, slots used). The manual vault-size input stays reachable. The Reminders panel opens as a full-height sheet. |

Rules: every grid track is `minmax(0, 1fr)`; chip rows and tab strips scroll in one line with a 24 px fade cue at the overflowing edge; nothing widens the page at a true 390 px (check with the inspector's device emulation, not `--window-size`).

## Elevation & Depth

Hybrid, and minimal: depth comes from tonal steps (world, window, titlebar, footer, well) plus the single soft shadow the game bakes into its `Frame` sprite. Windows are the only resting elevation. Floating things (toast, popover, Reminders panel, menu, tooltip) get one slightly larger shadow. Nothing glows.

### Shadow Vocabulary
Values are set under the taste-skill `heavy-shadow` limits (`scripts/lib/probe.mjs`: on a dark ground a shadow counts as heavy at alpha ≥ 0.45; on a light ground at alpha ≥ 0.25, y-offset ≥ 8 px, or alpha ≥ 0.12 with blur ≥ 12 px), so the gate passes without any allowance.
- **Window**: dark `0 2px 6px rgba(0,0,0,.4)`; Daylight `0 1px 4px rgba(42,26,8,.2)`.
- **Float**: dark `0 6px 16px rgba(0,0,0,.4)`; Daylight `0 4px 10px rgba(42,26,8,.2)`. Toast, About popover, Reminders panel, select menus, chart tooltip.
- **Rust bevel** (no shadow): `border-top: 1px solid rust-hi; border-bottom: 2px solid rust-lo`. Fix plaque only. Pressed: `translateY(1px)` and a 1 px bottom border.

### Named Rules
**The One Shadow Rule.** Windows have one shadow, and nothing inside a window has any. The pane is inset by colour, not by shadow.

**The No Glow Rule.** No glow rings on live dots, no bloom, no blurred backdrops.

## Shapes

Small rounded rectangles from the game's 9-slice sprites: windows 6 px, panes and controls 4 px, slot cells 2 px, chips a capsule (the `Shared_ui` pill). Frames are 1 px warm lines. The only flourish is the **rust notch**: a small downward triangle (8 × 5 px, `rust` `#782A18`) centred under the title of a primary window, as under the game's "Recipes" title. The research samples that notch at `#6E2E13`; `rust` is the nearest existing token (1.67:1 on `titlebar` against the sample's 1.61:1, so it reads as quietly as the source), which saves a token used for one 8 px mark. It is not `rust-hi`, which was brighter and more decorative than the game's notch.

Glyphs taken from the `Shared_ui` vocabulary: rounded fill and outline, rules, dot, ring, ▼, ▶, ✕, ✓, pill. **Added by this app in the same flat, single-colour style:** the warning triangle and the error square (the game has neither), the "i" inside a ring, the coin medallion, and the rail silhouettes. **Also added, for usability, and listed here for honesty:** the 13 px labels under the rail icons (the game's right-edge toolbar is icon-only taupe silhouettes; labels make five unfamiliar views findable without hovering). No ornamental corners, no torn edges, no scroll ends.

## Components

### Window
The universal container. Body `window`, 1 px `frame`, radius 6, Window shadow.
- **Title bar** 32 px, `titlebar`, title in `emphasis-tan` 16/700. Secondary windows: title left-aligned (the game's Inventory). The primary window of a view (the one holding the khaki pane): title centred with the rust notch under it (the game's Recipes). Optional right side: one small control (a count, a tab strip, a filter toggle). **No fake close or pop-out glyphs.**
- **Body** padding 12 px.
- **Footer strip** 32 px, `footer`, `small` text, required on every window without exception. Left: source and age ("Character export · 23 Oct 00:56 · 8 h ago"). Right: when to act and the exact fix ("After selling: VIP menu → Export Character JSON"). When the source is warn, the age gets the amber triangle and amber text; bad gets the red square. Live sources say so ("Chat log · live · last line 21:14"). Footers wrap to two lines on a phone, never truncate the fix.
- **Collapsible areas** inside a window use the game's ▶/▼ foldout, and a collapsed area still shows its subtotal.

### Khaki ledger pane
The main table of each view, inset 8 px inside its window, `pane` fill, radius 4. It is a standard HTML `<table>` with sortable headers, not a picture of paper. "Ledger" is an internal name only; it never appears in UI copy.
- **Column header** row 32 px on `pane-head`, `small` ink, sentence case, sort arrow ▲/▼ after the active label, `aria-sort` on the `<th>`.
- **Area sections**: a section row with the area name in pane-section (Carlito 700, ink), its count and its subtotal right-aligned. Collapsed sections show the same row with ▶.
- **Rows** 36 px, 1 px `pane-rule` dividers, hover `pane-hover`, selected `sel-bg` with `sel-text` and the `sel-*` graphic overrides (see Colors → Selected rows).
- **Subtotals** sit over a single `pane-rule` line; the **grand total** sits over a double rule (two 1 px lines, 2 px apart), bold.
- All pane text is `pane-ink`. Status on the pane: `pane-flag` shape plus an ink word. Focus: 2 px `pane-focus` outline, **inset** (`outline-offset: -2px`); on a selected row `sel-focus`, inset (Inputs → Focus).
- **Row selection** (Vendors and Vaults panes only): clicking a row (or Space/Enter on a focused row; rows are `tabindex="0"` with `aria-selected`) selects it, and one row at most is selected per pane. What it does: on Vendors, the selected vendor's "buys" types are pressed in the What they buy chips (so its goods stand out) and its next reset shows in full under the pane ("Kib: resets 23 Oct 22:10 · Next: Close Friends, 15k, adds Jewelry"); on Vaults, the Items window filters to that vault (same as clicking its BY LOCATION bar, with a "Vault: Otis ✕" filter chip). Clicking the row again, Esc, or clearing the chip deselects. Selection is not remembered across reloads. No other table has row selection, and `sel-*` tokens are used only for these rows, area bars and goods chips. Opening a file on the Files pane is navigation, not selection: the row's link carries `aria-current="true"` on its `<tr>` (line 1 in 700 and an "open" tag chip), no `sel-*`, no `tabindex` rows.
- Daylight: the `day-pane-*` tokens from the swap table; `day-pane-dim` allowed for secondary text.
- Only the one main table per view sits on the pane (The One Light Surface Rule).

### Plain tables (in dark windows)
Same structure without the pane: 32 px rows, `rule` dividers, `small` dim headers, no zebra, right-aligned tabular figures, hover `row-hover`, sortable where the inventory says so. Long tables page with "Show 200 more" rather than an inner scroll; the Character skills and Storage items tables may scroll inside their window with a sticky header (max 70vh). The Files pane has no sort controls (23 files today, in three fixed groups).

### JSON tree
The Files view's Contents window (added 24 Oct): a lazy disclosure tree over one JSON file, built imperatively (`createElement`, event delegation on the `<ul>`), never through the diffing `.html` setter, so the 30 to 60 s polls rewrite the footers and the path bar around it without touching open rows. It sits in a **dark window in both themes** (`.darkzone`): a 10 MB tree on khaki would breach One Light Surface the moment it scrolls.
- **Markup**: `<ul role="tree" aria-label="Contents of <file>">`; each node `<li role="treeitem" aria-level="N" aria-setsize="<the server's count for its parent>" aria-posinset="<index+1>" [aria-expanded="true|false" on containers] tabindex="-1" data-path="<RFC 6901 pointer>" style="--lvl:N">` holding one `<div class="jrow">` and, once expanded, `<ul role="group">`. `data-path` is in `FOCUS_ATTRS`, so focus survives a block rewrite.
- **Row anatomy** (32 px min; 44 px under 768 px or `(pointer: coarse)`): indent `calc(8px + var(--indent) * (min(var(--lvl), 8) - 1))` (16 px, 12 px on phones; depth stops indenting past level 8, the path bar carries the depth), a 16 px caret column (▶/▼ in `icon-taupe`, blank for scalars), the key in `text` 700 (object keys) or `text-dim` 400 for array indices, a colon, then for containers a `small` dim summary ("119 keys", "92 entries", "1 key", "1 entry", "empty object", "empty array") and the first three keys as a preview ("Level, BonusLevels, XpTowardNextLevel…"), and for scalars the raw JSON literal in `text`: strings quoted and escaped via `JSON.stringify`, numbers as `String(v)` with tabular figures and no thousands separators, `true` / `false` / `null` in `text-dim`. No type colours: colour is for status only. Known UTC time keys (`Timestamp`, `VendorResetTime`, any `YYYY-MM-DD HH:MM:SSZ` string) get the `small` dim suffix "· 24 Oct 00:02 local". A string cut by the server (200 chars) shows the preview and a text button "… 313 chars, show all" that fetches the scalar node. A child with a server `link` shows a right-aligned text button with the server's label ("Open in quests.json") that navigates to `#files?f=<to>&p=<path>` and posts `[Status] Opened quest_1842 in quests.json.`; the `Skills` and `RecipeCompletions` keys carry `title="skills.json isn't cached yet"` / "recipes.json isn't cached yet". Long values wrap (`overflow-wrap: anywhere`); under 640 px a scalar over 40 characters drops to a second line under its key in `small`. Hover `row-hover`; 1 px `rule` dividers; focus ring 2 px `selection-gold` inset on the row (the window is dark in both themes, so the ring stays gold in Daylight like the chat log's).
- **Lazy rules**: children are fetched on first expand, `TREE_PAGE` = 200 per page, with the open file's `mtimeNs`; while loading the treeitem is `aria-busy="true"` and one placeholder row shows a flat `well` bar with the sr text "Loading 200 of 11,209 entries". When more remain the group ends with `<li role="none"><button class="btn" data-more>Show 200 more of 11,209</button></li>`; a page loaded out of order (a deep link or a search hit pages straight to its slice via the server's `pos`) leaves the same button in each gap. `aria-setsize` is the server's count, so a screen reader hears "of 11,209" with 200 loaded. Collapsing keeps the subtree for instant reopen. **Expand all** is one request for the root with `depth=99&maxNodes=2000` (`TREE_EXPAND_MAX`); children the server marked `more` render collapsed and lazy, and when anything was left out a plain "i" note and the status region read "Expanded 2,000 of 254,580 entries. Open the rest by hand or search." A rendered-row budget of `TREE_ROW_BUDGET` = 5,000 prunes the least recently opened groups (collapsed ones first, then open ones, which collapse; never the group being filled or the focused row's ancestors); pruned groups refetch on expand. Open state is per visit, never persisted.
- **Keyboard** (WAI-ARIA tree, roving `tabindex`, one tab stop): Tab enters at the last focused row and leaves to the footer; Down / Up move through visible rows; Right opens a closed container or moves to its first child; Left closes an open container or moves to the parent; Home / End first and last visible row; Enter or Space toggles a container; `*` opens every closed sibling of the focused row (six requests at a time, stopping at the row budget with the note "Showing 5,000 rows of 254,580 entries. Open the rest by hand or search."); a printable character jumps to the next sibling whose key starts with it; Esc moves focus to the search field. Clicking anywhere on a container row toggles it; the only nested controls are the explicit text buttons (show all, Show more, Open in …), and every one of them is `tabindex="-1"` so the tree stays one tab stop: Enter or Space on a scalar row follows its "Open in …" link, or fetches the whole value when the row shows "… show all"; the "Show 200 more" and "Couldn't load. Try again." Retry rows sit in the Down / Up / Home / End order as virtual rows (focused directly, the roving row unchanged), and Enter on one presses it.
- **Live regions**: none on the tree. One visually hidden `role="status"` (`#f-status`) announces search totals, the expand cap, "This file was rewritten…" and errors, once each.
- **Path bar** (`well` strip, `small`, one line, horizontal scroll with the 24 px fade cue; the strip scrolls itself to keep the current crumb in view by setting its own `scrollLeft`, never `scrollIntoView`, which would scroll the document to the Contents window wherever it sits below the fold): breadcrumbs for the focused row with the file name as the root crumb ("Character_Robchew_Arisetsu.json › Skills › Mycology › Abilities › 3"), each crumb a text button that moves focus to that ancestor; then the text buttons "Copy path" (dot/bracket notation, `Skills.Mycology.Abilities[3]`), "Copy value" (`GET /api/file/raw?id&path`; a `413` disables it with `title="Too big to copy: 1.2 MB. Open raw instead."`) and "Copy link" (`<origin>/#files?f=<id>&p=<pointer>`). Clipboard: `navigator.clipboard.writeText` in try/catch with a fallback to a hidden `<textarea>` + `execCommand('copy')`; success posts `[Status] Copied Skills.Mycology.Level.`, failure `[Error] Couldn't copy. Select the text and copy it instead.` and the path bar text becomes selectable. Phone: the three copies are 44 px icon-only buttons with `aria-label`s.

### Navigation rail and tab bar
A standard labelled navigation (`<nav aria-label="Views">`, links to `#session`, `#combat`, `#vendors`, `#storage`, `#character`, `#files`), placed where the game puts its toolbar. The Files silhouette is a flat page with a folded corner and two knocked-out text rules, drawn like the others; Combat (added 24 Oct) is two crossed blades with their guards and pommels.
- Cells 64 × 60 on `window`. A 24 px flat silhouette (inline SVG, `icon-taupe`) over a 13 px label (`text-dim`). Hover: label to `text`. Active: cell `well`, icon and label `selection-gold`, a 2 px gold edge on the rail's inner side, `aria-current="page"`.
- **Status mark on an item**: a 10 px amber triangle or red square at the icon's top-right when a source feeding that view is warn or bad. Same verdict as everywhere else.
- Phone: the same six items in a bottom bar (`flex: 1` cells that may shrink below their label, 65 px at 390 px, labels 12 px under 420 px and ellipsised rather than overflowing), gold 2 px edge on top of the active item, the status mark centred above the label. Hash routing: clicking updates the hash; a `hashchange` listener switches views; the hash wins over the remembered tab on load.

### Title row and stamp
- **h1** (headline) plus a **finding**: one sentence answering the view's question, with names and areas in `emphasis-tan` (colour only) and key numbers in `emphasis-tan` 700. When the view's source is stale, a suffix sentence is added: "These are from a character export 3 days old."
- **Stamp** (`small`, right-aligned, two lines): line 1 "Copied from exports of 23 Oct, 00:56", line 2 "8 h ago" in `text`. The stamp follows **its own source's thresholds** from the severity table (character export amber at 24 h, storage export amber at 48 h, chat log amber after 15 silent minutes while logged in), amber with triangle when warn, red with square when bad. On Session: "Live from today's chat log" / "last line 21:14". The stamp is at least as prominent as the button beside it.
- **Check again** (ghost button). Re-reads health, reports, vendors, storage and session. While running the label reads "Checking…" and the button is disabled. Result posts as a system line; `[Status]` lines stay literal, like the game's own (`[Status] Saved report to …`), with no praise.
  | View | Something new arrived | Nothing new |
  |---|---|---|
  | Vendors, Character | `[Status] Character export of 21:30 loaded. Vendors can pay 1,612,400 councils.` | amber, triangle: "Nothing new since 00:56. In game: VIP menu → Export Character JSON, then check again." |
  | Storage | `[Status] Storage export of 21:30 loaded. 637 slots free.` | amber, triangle: "Nothing new since 00:49. In game: VIP menu → Export Storage JSON, then check again." |
  | Session | `[Status] Chat log read to 21:14. 12 new lines.` | chat log live and nothing new: plain `text` line with the "i" ring, "No new lines since 21:14. The chat log only grows while you're in game." Chat log warn or bad: amber or red line, "No new lines since 21:14. Check Settings → GUI → Log All Chat is on, then check again." |
  On Vendors, Storage and Character the export named is that view's worst export source; when every export is ok the nothing-new line is the plain "i" note "Nothing new since 00:56. Your exports are recent."

### At a glance window
A real secondary window (title left: "At a glance"), not a strip and not tiles. Body: one row of label-over-value cells divided by 1 px `rule` lines; label `small` dim in the game's literal style ("Councils left", "Drained", "Slots Free"), value below it. The first cell is the **lead figure** (22/700), the rest are figures (20/400). Councils figures carry the coin medallion. Only figures with a value show; zeros fold into the finding ("No level-ups yet" lives in the sentence, not as a 0). When a figure's source is stale, its label gets the amber triangle and the age ("8 d old"). Each figure may carry one sub-line in `small` dim that names its window ("since login", "in 24 vaults"). A figure that links somewhere ("Slots Free 637" on Vendors → `#storage`) is a real link with an underline on hover. **Footer** (required, like every window): left, the source and age of the lead figure and of any other source used ("Character export · 8 h ago · Slots Free from storage export · 8 h ago"); right, the fix for the worst of them ("After selling: VIP menu → Export Character JSON"), per Views → Window footers. Phone: 2-column grid, lead figure (20 px) spans both. (Argument: Typography → The At-a-Glance Allowance.)

### Bars
- **Horizontal value bar**: 8 px tall, radius 2, `track` behind, `data-gold` fill (on pane: `pane-bar` on a 25% ink track; selected row: `sel-bar` on `rust-lo`; Daylight: `day-data`, on the Daylight pane `day-pane-bar`). Value label right-aligned outside the bar, tabular. Bars are relative to the largest row unless they show a share of a cap. Tracks are decorative (1.07 to 1.36:1); whenever the empty part carries meaning, the value label says it in text.
- **Share-of-cap bar** (vendors): fill = councils still payable / cap. The text equivalent is mandatory: the bar's label reads "71,197 of 120,000" (phone: the Left figure plus "of 120,000" on line 2), so the cap is never carried by the track alone (WCAG 1.4.11). A vendor is **drained** when councils left < 2% of its cap; it shows an empty track and the word "drained", counts in the Drained figure, and is hidden by "Hide drained". The same 2% rule is used everywhere. A vendor that reset since the export (`resetSinceExport` true, Server contract) shows a full bar, a "reset" tag chip and "+11,489 back" (from `restored`, full figure).
- **Progress bar** (skills): fill = XP toward next level; the percentage sits beside the XP-to-go figure, never under the bar.
- **Area bar list** ("Where to sell", "Where there's room"): one row per area, clickable (`<button>`), filters the main table; selected row `sel-bg` / `sel-text` with a 1 px `sel-focus` border (unchanged in Daylight), and a "Clear filter" chip appears.

### Vault slot strip
One cell per slot up to 60 slots (cells 8 × 12 px, 2 px gap, radius 2).
| Surface | Used cell | Free cell |
|---|---|---|
| Dark window | `text-dim` fill | 1 px `control` outline |
| Pane (dark) | `pane-bar` fill | 1 px `pane-ink` outline |
| Selected row | `sel-bar` fill | 1 px `sel-free` outline |
| Daylight window | `day-text-dim` fill | 1 px `day-control` outline |
| Daylight pane | `day-pane-bar` fill | 1 px `day-pane-ink` outline |
Above 60 slots: a continuous bar with a tick every 10 slots (free part is the track with a 1 px outline in the free-cell colour). Full: every cell filled and the word "Full". Unknown size: used cells, then a dashed "?" tail in the free-cell colour and the inline size input.

### Chips
Capsules, 28 px tall (44 px hit area on a phone), `well` fill, `text-dim` label.
- **Channel chips** (chat log): built from the channels seen in today's whole log (counts from `/api/session` `channels`, see Server contract), each with a count. On (`chip-channel-on`): a 6 px dot in the channel colour, label in `text`, 1 px `control` border (3.47:1 on well). Channel chips never use oxblood. Persisted in `pgdash.chans`. One line, horizontal scroll with fade cue. Channel rules under Feed: chat log.
- **Goods chips** ("What they buy"): 24 px CDN item icon, item type, councils total in `small`. `aria-pressed`; on (`chip-on`): `sel-bg` fill, `sel-text` label, 1 px `sel-focus` border, identical in Daylight (oxblood and `sel-*` never swap). One tap filters the vendor table.
- **Filter chips**: active filters ("Area: Serbule ✕"), clearable.
- **Tag chips** (non-interactive, `small`, no fill, 1 px `control` border, 3.40:1 on footer): "reset", "from favor", "typed in by you", "partial", "export". On the pane: 1 px `pane-ink` border, ink text.

### Tabs
ALL CAPS 13/700, 0.06em, in a `well` strip, 32 px tall. Inactive `text-dim` (the game's `#554C43` is too dark to read and is not used). Active `selection-gold` with a 2 px gold underline exactly the label's width. `role="tablist"`, arrow keys move. Used for TODAY / THIS LOGIN, BY AREA / ONE LIST, ITEMS / BY LOCATION on a phone, and the Character phone tabs. At most one tab strip per window.

### Inputs
- **Search**: 32 px, `field` fill, 1 px `control` border, radius 4, placeholder `text-dim` that says what it matches ("Vendor or what they buy, e.g. Gem"). `/` focuses the view's main search. Esc clears.
- **Select** (area filter, export pickers): native `<select>` styled the same. Export pickers label each option "Robchew · 23 Oct 00:56", newest good export first, partial exports labelled "(partial)".
- **Checkbox**: 16 px dark square, 1 px `control` border, gold check. Label sentence case ("Hide drained").
- **Vault size input**: `type=number`, `min=1 max=999 step=1`, 64 px wide, inline in the Slots cell on the pane, placeholder "size", `pane-focus` ring. Saves on Enter or blur via `POST /api/capacity`; empty clears it. Feedback is set **inside the cell in `pane-ink` 13 px**, never in a status colour, and is repeated in the system line above the pane:
  - Saving: "Saving…".
  - Saved: "`[Status]` Saved, 75 slots" in ink (the `[Status]` word carries the meaning), fades after 4 s. System line: `[Status] Otis set to 75 slots.`
  - Cleared: "Cleared, size unknown again" in ink.
  - Error: `pane-flag` square + "`[Error]` Couldn't save" in ink, staying until the next edit; the input gets `aria-invalid="true"` and `aria-describedby` to the message. System line: `[Error] Couldn't save Otis: enter a whole number from 1 to 999.` Client-side validation (whole number 1 to 999) runs first. A server `400 {error}` shows the same copy; any other failure (network, 5xx) reads "`[Error]` Couldn't save. The server didn't answer; try again." The server gets matching validation (see Server contract).
  - The 60 s refresh never rebuilds a row whose input has focus or a pending value.
- **Time input** (quiet hours): native `<input type="time">`, styled like search, 96 px wide.
- **Theme control** (shell header): a three-option segmented control built as a radio group (`role="radiogroup"`, `aria-label="Theme"`), options "Auto", "Dark", "Daylight", each 28 px tall, `small` text, in a `well` capsule; the checked option has a `window` fill and `text` label, the others `text-dim`; arrow keys move. Phone: it moves into the About popover as the same control. Stored in `pgdash.theme` as `"auto" | "dark" | "daylight"`, default `"auto"` (Auto follows `prefers-color-scheme`). Applied as `data-theme` on `<html>` before first paint (inline script in `<head>`). `?theme=dark|daylight|auto` overrides it for that page load only and is not saved (Preview modes).
- **Focus** (one rule: the ring's colour is set by the surface it is **painted on**, not by the element). Every interactive element, `:focus-visible`, 2 px.
  | Element | Offset | Ring is painted on | Ring colour (dark / Daylight) | Ratio |
  |---|---|---|---|---|
  | Table rows, pane cells, sort headers, foldouts, the vault size input, other pane controls | inset, `outline-offset: -2px` | the element itself | unselected on pane: `pane-focus` / `day-pane-focus`; unselected row in a dark window: `selection-gold` / `day-selection`; selected row: `sel-focus` (both themes) | 4.77 / 5.67; 6.11 / 8.59; 5.55 |
  | Rust buttons (fix plaque, "Remind Me!"), pressed chips, area bars, ghost buttons, inputs, tabs, rail items, links in windows | outer, `outline-offset: 2px` | the window, well or titlebar around it | `selection-gold` / `day-selection` | 5.35 to 6.11 / 7.41 to 8.59 |
  | Controls on the page ground (Check again, title-row links, health pill) | outer, 2 px | `world` / `day-world` | `selection-gold` / `day-selection` | 6.53 / 6.97 |
  There is no `on-rust` ring and no gold ring on khaki. An outer ring is never used on the pane; pane controls are always inset. Inside the chat log window (dark in both themes) rings stay `selection-gold` in Daylight too.

### Buttons
- **Ghost** (default): `window` fill, 1 px `control` border, `text`, 32 px, radius 4, padding 0 16 px. Hover `row-hover`. Check again, Retry, Show more.
- **Primary** (rust, one line, flat, no bevel): at most one per screen, for a deliberate commitment in the app. The only one today is in the Reminders panel: "Remind Me!" (the game's "Craft It!" register: a verb, a little eager). Never "Submit".
- **Fix plaque** (rust, two lines, bevel): line 1 the action in `on-rust` 15/700 ("Export Storage JSON"), line 2 where and when in 13 px ("In game: VIP menu, while fully logged in"). Pressing it means "I did it": it runs Check again for that source and posts the result. `aria-label` spells out both lines plus "then check again". Appears only for warn or bad notes that need a game action. Distinct from the primary button by its two lines, its bevel and its "In game:" line; the two never appear in the same window.
- **Text button** (`small`, underline on hover): "Not now", "Don't remind me about this", "Show all 7 sources", "Clear filter", "Undo".

### Feed: chat log
A window titled "Chat log" with the file name in the footer. **Dark in both themes** (every part of the window uses the dark tokens). Lines: `HH:MM:SS` in `chat-timestamp`, the channel tag in its channel colour, then the message in `text`. Item links `chat-item-link`, player names `chat-player`, level-up lines bold `emphasis-tan`, Error channel `chat-error`. "Saved report to /long/path/…" is shortened to the file name and marked with an "export" tag chip. 380 px tall on desktop, 320 on a phone, a 24 px top fade (mask, not a coloured gradient) so no line looks cropped. Autoscroll when within 40 px of the bottom; otherwise a "12 new lines ↓" pill appears. Max 500 lines rendered, 2,000 buffered. `role="log"`, not live-announced.

**Channel rules** (carried over from the inventory, with its bug fixed; the server uses the same rule for `channels` counts):
- A line's channel is the bracket tag at the very start of the message, `^\[([^\]:]+)\] ` (letters, spaces, digits, no colon). Bracketed text later in the line is not a channel, and a tag containing a colon is never a channel, so `[Item: Amethyst]` item links no longer create fake channels.
- A line with no leading tag (area changes, "Logged In As", "Saved report to" without a tag, system notices) is the **System** pseudo-channel.
- First run (no saved `pgdash.chans`): Status, Guild, Nearby, Error, System are on; everything else off.
- A newly seen channel (not in the saved set) appears as an off chip with its count, except Tell and Party, which start on because they are addressed to the player. The saved set is updated when the player toggles a chip, not on discovery.

### Feed: What happened
Session's record of the day (window title "What happened"): login, each area entered, level-ups, exports, deaths, logout, in time order, `body` size, time in `chat-timestamp` on the dark window. Exports show a check and the file name; partial exports the "partial" tag. Source: `/api/session` `events[]` (see Server contract). This replaces the old "Areas visited" list and keeps its content.

### Data health
One health model yields one verdict per source. The server computes it at `GET /api/health` (Server contract). The page merges it with a few browser-only checks; when `/api/health` is missing (404) or fails, the page computes what it can from the older endpoints and says plainly what it could not check. Every surface below reads the merged verdict list; none computes its own.

**Verdict shape** (exact JSON in Server contract): `{id, source, severity: ok|info|warn|bad, at, ageSec, title, evidence, fixKey, fixArgs, topic, views[], serverOnly}`. "act-now" is not a stored severity: it is a warn or bad verdict whose reminder moment has just fired (see Reminders).

**Severity rules.** "Server only" rows need `/api/health`; the browser fallback shows them as not checked.

| Source (`source`) | ok | info | warn | bad | Margin on views | fixKey | Server only |
|---|---|---|---|---|---|---|---|
| Game state (`game`) | logged in and the log was written in the last 15 min | logged out ("Logged out 00:56") or game not running | n/a | n/a | all, folded into "Also checked" (feeds the location line) | none | process check yes; logged-in/out from login lines can fall back to `/api/session` |
| Chat log (`chat-log`) | logged in and written in the last 15 min; **or** logged out or closed, `LogChat 1`, and the last session ended with a Logged Out line | game closed and the last session did **not** end with a Logged Out line (quit or crash; that session may be cut short) | logged in but nothing written for 15 min; newest log isn't today's while the game runs | no chat log at all; `LogChat 0` | Session (listed); others folded | `chat-logging` (warn, bad), `chat-logging-ok` (ok) | `LogChat` and "game runs" yes |
| Character export (`character-export`) | under 24 h and no activity since | n/a | 24 h or older; or since the export: 1+ non-zero `You received N Councils` lines not next to Gaming XP, or 1+ `You gained N favor with X` lines | none for this character | Vendors, Character (listed); Storage (listed, favor drives sizes); Files (listed) | `export-character` | the activity evidence yes; age no |
| Storage export (`storage-export`) | under 48 h and no activity since: "No vault visits or storage searches since it, and under 50 stacks of loot." | n/a | 48 h or older ("It's 2 d old."); or since the export, counting only lines written while the selected character was logged in: entered an area that holds one of your vaults ("Since then you visited Casino and Serbule, where your vaults are."), 1+ storage searches ("You've searched your storage 2 times since it, so vault contents have likely moved."), 50+ stacks of loot, i.e. `added to inventory` lines, since a stack is what fills a slot ("You've picked up 296 stacks of loot since it, so Slots Free is lower than shown."); sentences in that order, joined by a space; thresholds served as `activityThresholds` | none for this character | Storage, Files (listed); Vendors (folded) | `export-storage` | the activity evidence yes; age no |
| Partial export (`partial-export`) | no partial file | a good export within 2 min either side of it (the logout twin): ignored | n/a | the newest character export is partial and has no good twin | Character, Vendors, Storage, Files (listed when present) | `export-again` (bad) | no |
| Auto-export on logout (`auto-export`) | `AutoExportCharacterOnLogout 0` | `AutoExportCharacterOnLogout 1`: predicts the partial twin; evidence "Your logout export may write a partial twin. It's ignored." | n/a | n/a | Character (listed only when a partial file exists, else folded) | `auto-export` | yes |
| Vault sizes (`vault-sizes`) | all known | some typed in by you (safebox drifts 1 to 150) | some unknown | n/a (not listed at all without a storage export: nothing to size) | Storage, Files | `vault-size` | no |
| Alt exports stale (`alt-stale`, one per alt) | n/a | an alt's newest export is over 7 days old | n/a | n/a | Character, Files (listed); others folded | `alt-export` with `{alt}` | no (from `/api/reports`) |
| Alt missing (`alt-missing`, one per alt) | n/a | a character seen in "Logged In As" lines in the last 30 days has no export at all (today: Boomchew, Raspby) | n/a | n/a | Character, Files (listed); others folded | `alt-export` with `{alt}` | yes (scans all logs) |
| Combat logging (`combat-logging`) | `VIP_CombatLogging 1`, every `combatLog_*` at 2 (the only level verified to write damage numbers; 24 Oct) and `LogNonAttacks 1` | any of them off: `VIP_CombatLogging` 0 → "Combat logging is off (VIP_CombatLogging 0), so kills and killers aren't in the log. Deaths still count from the game's Dying XP line, without a killer."; some `combatLog_*` 0 → "Some fights aren't logged: combatLog_EnemyAttackMe is 0 in GorgonSettings.txt. Deaths need EnemyAttackMe, kills MeAttackEnemy, pet kills PetAttackEnemy."; some `combatLog_*` 1 → "combatLog_X is 1 in GorgonSettings.txt. Only 2 is verified to write damage numbers, so the DPS meter may miss hits. Deaths and kills don't need it." (views `combat` only); only `LogNonAttacks` 0 → "LogNonAttacks is 0. Deaths, kills and damage don't need it." (`evidenceData.off`, `evidenceData.reduced`, `evidenceData.vipCombatLogging`) | n/a | n/a | listed on Session and Combat when info (the reduced case on Combat only; the LogNonAttacks-only case folded); the Session Combat window and the Combat view footers carry the fix | `combat-logging` | yes |
| Live game events (`player-log`) | `LocalPlayer: Process` lines present in `Player.log` | none present (the Mac client today): "The Mac client doesn't write live inventory events, so vendor and storage numbers come from exports. Nothing to do." | n/a | n/a | Vendors and Storage, folded; About popover | `player-log` | yes |
| VIP (`vip`) | an export of any kind in the last 14 days, or fewer than 3 logins since the newest export | no export for 14 days across 3+ logins: "No exports in 14 days across 6 logins. If the VIP menu is missing, VIP may have lapsed." | no export for 30 days across 3+ logins | n/a | all, listed when info or warn | `vip` | yes (needs logins) |
| Server (`server`) | answering | n/a | n/a | fetch failed or `{error}` | all | `server` | browser only |
| Game data (`cdn`) | current version cached | updated since last load ("Game data updated to v489: caps refreshed"); or CDN unreachable and a cached version is in use | n/a | CDN unreachable and nothing cached (caps and areas unknown) | Vendors, Storage (folded unless info/bad); Files (listed) | none (automatic) | yes |
| Selected export (`selected-export`) | newest | an older export is selected on purpose | n/a | n/a | Character, Storage | none ("Show newest") | browser only |

**When `game.running` is null** (the process check can't run): the game-state verdict falls back to the chat log. "Running" is taken as `loggedIn` true **and** a line written in the last 15 min; otherwise the game counts as not running. `game` is then info with the evidence "Couldn't check whether the game is running; going by the chat log." Every rule keyed on "game runs" uses that fallback: the chat-log row's "newest log isn't today's while the game runs" check is skipped (it would fire on every closed evening); "no notification while the game is not running" uses the fallback; the login checklist still fires on a new "Logged In As" line (it needs no process check); the positive lane is unaffected (it may fire while the game is closed anyway).

Thresholds use the export's own `Timestamp` (UTC, converted). "Activity since" counts chat lines after the export time from **every** chat log since then, not just today's, so it is server-only.

**The headline goes to the most actionable item, never the oddest.** Order: bad, then warn, then info; within a level, the item with a game action first.

**Merging server and browser.**
1. On load and every 30 s (with session), and 1.5 s after a "Saved report to" line, the page calls `GET /api/health?character=<selected>`.
2. `200` with `version: 1`: the server's `items` are the base list. The page adds its browser-only items (`server`, `selected-export`) and recomputes ages from each item's `at` against the browser clock every 30 s, so ages tick between polls. It never re-derives a severity the server gave, except: an item whose `ageSec` crosses its threshold between polls is promoted locally (thresholds come from `thresholds` in the response). Preview modes (`?shift`, `?sim`) are applied after this step, in the browser only (System lines → Preview modes).
3. `404` or any failure: the page computes `game` (logged in or out from `/api/session` `character` and, when present, `loggedIn`), `chat-log` (from `/api/session` `live`, last line time; no `LogChat`), `character-export` and `storage-export` by **age only**, `partial-export`, `alt-stale`, `vault-sizes`, `server` and `selected-export` from `/api/reports`, `/api/vendors` and `/api/storage`. All server-only checks become one info line in the margin: "Not checked here: activity since your exports, game settings, alts that never exported, VIP, game version. They need a newer server.py." Exports are then never warned for activity, only for age, and the evidence line reads "Activity since export: not checked."
4. The margin footer says which happened: "Checked 21:14 · by the server" or "Checked 21:14 · in the browser (some checks skipped)".

**Margin window** ("Where these numbers come from", secondary window, title left).
- Header line, one line, never contradicting the items: "All sources recent", "All sources recent · 2 notes", "1 to do", "1 broken · 1 to do".
- **Filtered per view** by each verdict's `views`: only the sources that feed this view, sorted by severity. Any warn or bad item from any source always shows. Everything else folds into one line: "Also checked: chat log (live), storage export (8 h)".
- **Note** (12 px padding, rule between notes): status shape (16 px) and title with age ("Character export · 8 h ago", age in the severity colour when warn or bad, else dim) / one evidence line in `body` ("You've sold 3 times since it, so vendor room is lower than shown.") / the fix: a quiet `small` dim line when ok or info ("To refresh: VIP menu → Export Character JSON"), the rust fix plaque when the player needs to act. Warn and bad notes have a "Not now" text button: it collapses the plaque to its one-line fix for 4 h on this browser and snoozes that topic's reminders for 4 h. A verdict's topic is its source, which no moment uses, so the snooze fans out to the moment topics that export covers (`NOTE_TOPICS`: `storage-export` → export-stale, zone-storage, before-logout; `character-export` → after-selling; `partial-export` → broken-export); those rows then show "Snoozed until … · Undo" in the Reminders panel. The note itself, its shape and every other surface stay; in-page truth is never muted. "Don't remind me about this" is offered on reminders (system line, toast, notification click-through) and in the Reminders panel, not on margin notes.
- **Positive notes** (no shape colour, peach title, no bracket tag): "21 vendors reset since the export: 379,580 councils already counted." Built from `/api/vendors` `resetSummary` (`count`, `restored`); shown only when `count` > 0.
- Footer: "Checked 21:14 · by the server" (or "· in the browser (some checks skipped)") and the "Reminders" text button that opens the Reminders panel.

**Health strip** (phones, < 768 only; tablets get the full-width health window, Layout → Responsive): one line, `window`, 44 px: worst shape, the header line, "Show". Auto-expands to the full filtered notes, fix plaques inline, when anything is warn or bad.

**Health summary pill** (shell header, phone top bar): worst shape plus the header line, `small`, `well` capsule; a link that moves focus to the margin or opens the strip.

**Other channels, same verdict**: window footers; title stamp; At a glance age marks; finding suffix; rail item marks; tab title (one format everywhere: `<badge> <View> · <APP_NAME>`): "Vendors · Gorgon Notes" when nothing is warn or bad, "(2) Vendors · Gorgon Notes" with the warn count, "(!) Vendors · Gorgon Notes" when anything is bad; the favicon; reminders and browser notifications by the ladder in Reminders.

**Favicon** (a data-awareness surface, so fully specified): three inline SVG variants built in JS as `data:image/svg+xml` URLs, no canvas and no image files. The 32 × 32 viewBox draws the mark: a rounded square outline (radius 6, 2.5 px stroke, `#DFC9A0` tan) with the rust notch (an 8 × 5 triangle in `#782A18`) under its top edge. The status dot is a 12 px circle at the bottom-right with a 2 px `#161111` ring so it separates from the mark: ok `#99806C` (taupe), warn `#FFB300`, bad `#FF5A5A`. The dark-theme colours are used in both themes (the browser tab strip is not the page). The three URLs are built once; the `<link rel="icon">` `href` is swapped only when the worst severity changes. The same SVG is the notification `icon`.

### Reminders
DATA-AWARENESS §3 and §6, made concrete. A reminder is an interruption fired at a **moment**; the verdicts above are the state. Moments are detected by the server (they need log lines) and listed in `/api/health` `moments[]` with a stable `id`; the browser decides delivery (channel, snooze, mute, quiet hours, cooldown) because those settings live in the browser.

**Severity-to-channel ladder.**
| Level | Meaning | Channels |
|---|---|---|
| info | worth knowing | in-page only: margin note, footer, pill count ("2 notes"). Never a toast, notification or sound. |
| warn | stale, should act soon | everything in info, plus amber footers, stamp, rail mark, tab title count, amber favicon, health strip auto-expands. No interruption by itself. |
| act-now | a warn or bad verdict **and** a moment from the trigger table just fired while the game runs | a system line with the reminder and its two text buttons ("Not now", "Don't remind me about this"); a toast when the player is on another view; a browser notification when reminders are on and the page is hidden or unfocused. |
| broken | bad severity (partial export alone, chat logging off while logged in, no chat log, server down) | everything above, `(!)` tab title, red favicon; the notification fires even if the page is focused; plus the sound cue if the player turned it on. |

Positive moments (vendor reset, digest) are their own lane: off by default, opt-in per topic, delivered as a toast and (if reminders are on) a notification, and they may fire while the game is not running.

**Trigger table.** Cooldowns are per topic (and per area or file where named), stored in the browser, shared across open tabs (`localStorage`), and also enforced by the notification `tag` so the OS replaces rather than stacks. Copy uses the player's state ("Next time you're in game" variants never appear here, because these fire only in game, except positive and digest).
| Moment (`topic`) | Detection signal (server) | Channel | Notification title / body | Cooldown |
|---|---|---|---|---|
| Login checklist (`login-checklist`) | a new "Logged In As" line (`game.loggedInAt` changed) | act-now if any export is warn or bad, else a `[Status]` system line only | "Logged in as Robchew" / "Storage export 3 d old · Character export OK · Chat logging on" | once per login |
| Arrived where your vaults are (`zone-storage`) | "Entering Area: X" where X holds one of your vaults, after the newest storage export | act-now | "Your vaults are in Casino" / "Export Storage after you're done here. VIP menu → Export Storage JSON" | 2 h per area |
| Left after selling (`after-selling`) | "Entering Area" (leaving Y) after 1+ non-zero `You received N Councils` lines not next to Gaming XP in Y since the newest character export | act-now | "Received councils 3 times in Serbule" / "Export Character JSON to update vendor caps. VIP menu → Export Character JSON" | 1 h |
| Storage export is stale (`export-stale`) | only when the storage verdict is warn by activity (never by age or a vault-area visit alone), ids `export-stale:search:<file>:<at>` and `export-stale:loot:<file>:<at>` (one moment per anchor, the anchor's time in the id, so a later search or pause is a new moment and the per-file cooldown below does the rate limiting; an anchor depends only on earlier log lines, so none appears late): **search**, a `Searching your storage` line after the newest storage export that is not within 15 min after an `Entering Area` into a vault area (that search is the `zone-storage` reminder's follow-through: deferred to the next search, never cancelled) and comes 2 h or more after the previous search anchor; **loot**, an `Entering Area` (a pause, never mid-fight) that is not into a vault area and not within 15 min after one (the `zone-storage` reminder carries it), after 50 more loot stacks than the previous loot anchor (or the export) and 2 h or more after it. Both are computed from the log (`evidenceData.searchReminders` / `lootReminders`), not from the served moment list, and only while the selected character was logged in; `args` `{report: "Storage", file, signal, count}` | act-now | "Storage export is stale" / search: "You've searched your storage 2 times since the export of 00:56. VIP menu → Export Storage JSON"; loot: "You've picked up 296 stacks of loot since the export of 00:56, so Slots Free is lower than shown. VIP menu → Export Storage JSON" ("23 Oct 00:56" when the export is not from today; `count` is the count at serve time) | 2 h per export file (both signals share it; a new export changes the file and resets both) |
| Wrapping up (`before-logout`) | logged in 60+ min **and** either 10+ min with no `[Combat]`, XP or loot lines in an area that holds your vaults, or a storage search after the first 60 min; and any export is warn | act-now | "Wrapping up?" / "Before you log out: export Character and Storage JSON from the VIP menu. Exports right at logout can come out partial." | once per login |
| Broken export (`broken-export`) | a `Saved report to Character__…json` line, or a new partial file, with no good twin within 2 min | broken | "That export came out partial" / "Export again while fully logged in: VIP menu → Export Character JSON" | once per file |
| Export confirmed (`export-confirmed`) | a good `Saved report to` line | `[Status]` system line and toast only (never a notification) | toast copy: see Toasts | per file |
| Storage nearly full (`storage-full`) | a storage export under 1 h old with a vault at 0 to 2 free | info toast when the export arrives; no notification | toast: "Otis full, Marna 2 free." | once per export |
| Vendor reset (`vendor-reset`, positive) | computed by the server from the `/api/vendors` per-row fields (Server contract): a row with `resetSinceExport` true whose `exportResetAt` passed in the last 6 h, and that was drained at export (`cap - spentAtExport` < 2% of `cap`) or had 10%+ of its cap spent (`spentAtExport` ≥ 0.1 × `cap`); amount = `restored`; resets whose `exportResetAt` fall within 5 min of each other are one batched moment | toast + notification if opted in | "Kib reset" / "60,000 councils available again." Batched: "3 vendors reset" / "140,000 councils available again." | batch per 5 min |
| Daily digest (`digest`, positive) | first chat log line or first page load of a new calendar day, if any export is 1+ day old; "reset overnight" counts rows with `resetSinceExport` whose `exportResetAt` is between 18:00 the previous day and the digest time (omitted when 0) | toast + notification if opted in | "Your exports this morning" / "Character export 3 d old · Storage export 3 d old · 2 vendors reset overnight" | once per day |

Rules: no notification while the game is not running (or, when `game.running` is null, by the chat-log fallback in Data health) or the player is logged out, except positive topics; none during quiet hours (in-page still updates); never on page load (the page shows the margin); at most one notification per topic per cooldown; a snoozed or muted topic still shows in the page.

**Notification format** (browser `Notification` API, no service worker in the POC): `title` and `body` from the table; `tag` = topic (plus area or file); `icon` = the favicon mark with its status dot; `silent: true` (the app plays its own sound only for broken). The plain API has no action buttons, so clicking a notification focuses the dashboard, switches to the relevant view and posts the reminder as a system line with "Not now" (snooze 4 h) and "Don't remind me about this" (mute topic). **Sound cue** (off by default): a short two-note tone made with WebAudio (no audio files), only for broken, never in quiet hours.

**Mac app (deferred, same verdicts and moments).** Menu-bar state: the worst severity as a dot (taupe, amber, red) plus the shortest stale age as text, "Exp 3d" (oldest warn export), "Log off" (chat logging bad), nothing when all ok. Native notifications (`UNUserNotificationCenter`) carry real action buttons: "I exported" (runs Check again), "Snooze 1 h", "Open dashboard", "Don't remind me about this". The HUD overlay shows the current act-now reminder and fades out. Focus-aware delivery holds non-broken reminders while the game is fullscreen and in combat (no `[Combat]` line for 30 s = safe) and releases them on the next zone change. The POC `osascript` notification from DATA-AWARENESS §4 is not built; the browser notification covers the POC, and the Mac app replaces both. The other optional channels in DATA-AWARENESS §4, phone push (ntfy / Pushover) and Shortcuts / a `pgdash://` URL scheme, are deferred to the Mac app too and are not designed here; they would read the same `moments[]`.

### Reminders panel
Opened from the shell's "Reminders" button (and the margin footer's text button, and a notification click). A popover anchored under the button on desktop (360 px, `window`, Float shadow, radius 6, title bar "Reminders"), a full-height sheet on a phone. Esc or a click outside closes it; focus returns to the button. Settings live in this browser only; the panel says so in its footer.

1. **Permission line** (one line plus at most one control):
   | State | Copy | Control |
   |---|---|---|
   | not asked (`default`) | "Reminders are off. They only fire while you're in game, and never more than once per topic per cooldown." | primary "Remind Me!" (requests permission; on grant, turns reminders on) |
   | granted, on | "`[Status]` Reminders are on in this browser." | text button "Turn them off" |
   | granted, off | "Reminders are off in this browser." | primary "Remind Me!" |
   | denied | "This browser blocked reminders for this page. Allow notifications for 127.0.0.1 in the browser's site settings, then reload. The page still shows every note." | none |
   | denied, Mac app (`window.GORGON_NATIVE`; the shim bakes the permission in at launch) | "Notifications are off for Gorgon Notes. Turn them on in System Settings → Notifications → Gorgon Notes, then quit and reopen Gorgon Notes. The page still shows every note." | none |
   | unsupported or insecure (for example the page opened by LAN address on a phone) | "This browser can't show reminders here. They need the page at 127.0.0.1 or localhost. The page still shows every note." | none |
   The header button reads "Reminders" in every state; when on, it carries a small gold dot.
2. **Topics** (one row per topic from the trigger table, grouped "To do", "Broken", "Good news"): name ("Arrived where your vaults are"; `export-stale` is listed as "Storage changed since the export" under To do), a checkbox "Notify" (default on for To do and Broken, off for Good news), and a state on the right: "On", "Snoozed until 23:10 · Undo", or "Muted · Undo". "Export confirmed" and "Storage nearly full" are in-page only and listed with "In page only" instead of a checkbox. Per-alt reminders from `alt-missing` can be muted per alt ("Raspby").
3. **Good news** opt-ins are the Good news rows: "Vendor reset" and "Daily digest", each with the note "Can fire while the game is closed."
4. **Quiet hours**: checkbox "Quiet hours" with "from" and "to" time inputs (default 23:00 to 08:00 when first turned on). During quiet hours: no notifications, no sound; the page still updates.
5. **Sound**: checkbox "Play a sound when data breaks" (off by default).
6. **Muted** (only when something is muted): a list of muted topics with "Undo" each, so nothing muted is ever unreachable.
7. Footer: "Settings live in this browser only." ("in this app" in the Mac app, like the on and off lines).

**Storage** (`localStorage`, try/catch, defaults when unreadable): key `pgdash.reminders.v1` =
`{ "enabled": false, "topics": { "<topic>": { "notify": true, "snoozedUntil": null, "muted": false } }, "quiet": { "on": false, "from": "23:00", "to": "08:00" }, "sound": false, "lastFired": { "<topic>[:area|file]": "<ISO time>" }, "deliveredMoments": { "<moment id>": "<ISO time delivered>" }, "mutedAlts": [] }`. Positive topics are simply topics whose `notify` defaults to false. The margin's "Not now" writes `snoozedUntil`. **Delivery dedupe:** a moment is delivered (system line, toast or notification) only if its `id` is not in `deliveredMoments`; its id is written there on delivery or when it is suppressed by snooze, mute, quiet hours or cooldown, so it never fires late. Entries older than 6 h are pruned on every write (the server only returns 6 h of moments). On page load every moment already in the response is written to `deliveredMoments` without being delivered ("never on page load"). `lastFired` enforces the per-topic cooldown on top of that. Because it is `localStorage`, all open tabs share it; a tab re-reads it just before delivering.

### System lines and banners
- **System line**: a one-line message directly under the title row, `aria-live="polite"`. Only the game's verified tags are printed: `[Status]` in `status-peach` for confirmations and `[Error]` in `error-red` for failures. Warnings are plain `alert-amber` text led by the triangle shape, with no bracket tag. Notes are plain `text` led by the "i" ring. Reminder lines end with the text buttons "Not now" and "Don't remind me about this". Stays until the next one or 30 s (reminders stay until dismissed or the view changes).
- **Toast**: `titlebar` fill, Float shadow, radius 6, bottom-right (above the tab bar on a phone), for events on another view. 6 s (broken: until dismissed), pauses on hover, closes with Esc. **Stacking:** at most 3 toasts visible, stacked upward with an 8 px gap, newest at the bottom; a broken toast always takes the bottom slot. Further toasts queue (FIFO) and appear as slots free; queued toasts of the same topic merge (a second vendor-reset batch updates the queued one's count and total). When 3 or more arrive within one second (an export confirmation plus a vendor-reset batch plus the storage-full note, say), the non-broken ones after the first collapse into one toast "3 updates" with a "Show" text button that posts each as a system line. Esc closes the bottom toast; each toast has `role="status"`. Export toasts:
  - Good export for the character shown: "`[Status]` Storage export loaded. 637 slots free across your vaults." / "`[Status]` Character export loaded. Vendors can pay 1,589,320 councils."
  - Partial export: red square, "That export came out partial. Export again while fully logged in." with a "Show" text button to Character. If a good twin lands within 2 min, the toast is replaced by "`[Status]` Good export arrived too. The partial one is ignored."
  - Export for another character (an alt, or not the one selected): "`[Status]` Saved Faechew's storage export." with a text button "Switch to Faechew". Totals on screen do not change.
- **Server-down banner**: full-width line under the shell header, red square: "Nothing is loading. The dashboard server isn't answering. Start it again: python3 server.py". Last good data stays on screen. **Nothing is dimmed**: opacity on a window pushed its footers below AA (text-dim on footer 3.08:1, pane ink 2.92:1 at 70%), and the footers are exactly where freshness lives. Staleness is marked instead by the banner and by red "as of" ages at full contrast. Figures, bars and pane values keep their normal colours; window footers, the title stamp, margin notes, the banner and the system line keep full contrast. Each footer's left side changes to "as of 21:14 · server not answering" with the red square and red text (`error-red` 4.91:1 on `footer`, `day-error` 5.03:1 on `day-footer`); the stamp's line 2 reads "as of 21:14" in red. No text is ever set at reduced opacity.
- **Preview notice**: an amber line with the triangle under the title row (above the system line) whenever any preview parameter is set; copy per mode in Preview modes below. It sits on `world` (`alert-amber` 10.42:1, `day-alert` 4.84:1 on `day-world`).

### Preview modes
URL query parameters for design review and the gates. **Handled entirely in the browser**: the page never forwards `shift`, `sim` or `theme` to any endpoint, and the server knows nothing about them. They are read once on load; changing them needs a reload. `shift` combines with one `sim` value and with `theme` (`?shift=72&sim=nolog&theme=daylight`). In any preview the page **never** sends a browser notification, plays a sound, posts a reminder line or writes any `pgdash.*` key (UI changes such as a picked tab work for the visit but are not saved), so a preview cannot leak into real settings or cooldowns. An unknown value is ignored and the notice says so ("Preview: unknown sim value 'x', ignored.").

| Parameter | Mechanics | Verdict overrides | Fetch overrides | Notice copy |
|---|---|---|---|---|
| `?shift=N` (hours, 1 to 720) | The page's clock runs N hours ahead: `now` = real now + N h for every age, countdown and "since" text. Server verdicts are kept, then each item with an `at` gets `ageSec` = server `ageSec` + N × 3600, and the `thresholds` from `/api/health` are re-applied: an item whose shifted age passes its threshold is promoted to warn (never demoted; activity-based warns stay). Browser-fallback items are computed against the shifted clock. Vendor rows whose `exportResetAt` is before the shifted now are treated as reset since export in the client (full bar, "reset", `restored` back), and `resetSummary` is recomputed to match. `moments` are ignored. | as described | none; real data | "Preview: pretending N hours have passed. Real data is unchanged." |
| `?sim=stale` | Exports look stale for a reason the player can act on. | `character-export` and `storage-export` become warn with `ageSec` set to 3 d (259,200) and `at` moved back to match; evidence "Preview: pretending this export is 3 days old." Every surface that reads them follows (footers, stamp, finding suffix, age marks, rail marks, tab title, favicon). | none | "Preview: pretending your exports are 3 days old. Real data is unchanged." |
| `?sim=broken` | The newest character export came out partial. | `partial-export` becomes bad (no good twin), evidence as the real partial-alone copy; the export picker gains a "(partial)" entry at the top, not selected. The broken-export toast shows once (in page only). | none | "Preview: pretending your last character export came out partial. Real data is unchanged." |
| `?sim=nolog` | No chat log exists. | `chat-log` becomes bad ("No chat log found"); `game` becomes info "Not known without a chat log". The real server says more (24 Oct, after a friend's Windows run): the chat-log evidence names the folder it looked in ("Looked in <path>" / ", which doesn't exist"), the settings file's save time and its chat-logging value ("says chat logging is off" / "on. No log file has appeared yet: log out and back in, then check again" / "couldn't be read"); the game line adds whether the game process is running when that is known. With no exports and no character the export lines read "No character export yet." (never "for None"). Check again with no log at all writes "Still no chat log file. [The game's settings file still says chat logging is off.] Check Settings → GUI → Log All Chat is on, log out and back in, then check again." instead of "No new lines since ?". | `/api/session` resolves to `{}` (what the server returns with no log) and `/api/tail` to `{ "lines": [] }`. | "Preview: pretending there's no chat log. Real data is unchanged." |
| `?sim=noexport` | No exports for the selected character. | `character-export` and `storage-export` become bad ("none for this character"); `partial-export` ok; `vault-sizes` dropped (the server lists none without vaults). | `/api/vendors` resolves to `{ "error": "no character export" }`, `/api/storage` to `{ "error": "no items export" }`, `/api/reports` to the real list minus the selected character's files, `/api/files` to the real listing minus the selected character's export rows (alts, capacity.json and game data stay). | "Preview: pretending this character has no exports. Real data is unchanged." |
| `?sim=loading` | Every view stays in its Loading state. | none (the margin shows its Loading state) | every data fetch returns a promise that never settles; nothing times out; polling is paused. The notice itself is not data and renders. | "Preview: holding every request so the loading state stays up." |
| `?sim=down` | The server stops answering after the first load. | `server` becomes bad from the second poll on. | The first round of fetches is real, so last good data exists; every later fetch rejects at once as a network error. The banner, red "as of" footers and stamp follow (System lines → Server-down banner). | "Preview: pretending the server stopped answering after 21:14. Real data is unchanged." |
| `?theme=dark\|daylight\|auto` | Overrides `pgdash.theme` for this load; not saved. | none | none | shown only when combined with another mode; alone it shows no notice |

### States
- **Loading**: the final layout at its real size, labels shown at once, values as flat `well` bars (no shimmer, no 26 px dash). Footers say "Loading the character export…".
- **Empty**: the window, title and footer stay; the body is one sentence spanning it, in `body` dim, stating the literal fact and, where it helps, a straight-faced quirk of the mechanic and any instruction ("Nothing looted yet. Loot shows up here as soon as it lands in your bags."). An empty chart collapses (see Data visualisation).
- **Error in a block**: a load **failure** (fetch rejected, 5xx, unparseable JSON), never a missing source. Stays inside the window that failed, red square: "Couldn't load vendors. Last good at 08:51." plus Retry. Other windows keep working.
- **No export**: a missing **source**, not a failure. A `200` response with `{ "error": "no character export" }` or `{ "error": "no items export" }`, or an empty export list for the selected character in `/api/reports`, maps to this state and never to Error. Per view: Vendors, Storage and Character → No export (below), modelled on Session → No chat log. Any other `{error}` string is Error.
- **Stale**: numbers stay, never hidden; the lead figure gets its age mark, the finding its suffix, footers turn amber, the margin shows the fix. Vendor resets since the export are counted into totals and shown per row ("reset · +11,489 back", from `restored`).
- **Broken export**: the picker labels it "(partial)", it is never the default selection, and the Character view says so above the data with the fix plaque.
- **No chat log** (`?sim=nolog`, or `chat-log` bad): see Session.
- **No export** (`?sim=noexport`, or `character-export` / `storage-export` bad "none for this character"): see Vendors, Storage and Character.

### Iconography
- **Item and ability art comes only from the public CDN**: `https://cdn.projectgorgon.com/v{version}/icons/icon_{IconId}.png`. The version is `cdnVersion` from `/api/health` (also on `/api/vendors`, `/api/storage`, `/api/icons`), read from `fileversion.txt` by the server, never hard-coded long-term; `488` is the fallback when no endpoint gives one. Item icons use `items.json` `IconId`; abilities use `abilities.json` `IconID`; `skills.json` has no icon, so a skill uses a representative ability icon.
- **Icon IDs come from `GET /api/icons`** (Server contract): loot by item name, storage items by `TypeID`, vendor "buys" types by type name. The browser loads the images straight from the CDN; the server only maps names to IDs.
- **Item-type icons** (vendor "buys", goods chips) use `item-type-icons.json`, a hand-checked file in the repo mapping each vendor item type to one representative item `InternalName` (for example `"Gem": "Amethyst"`). Each entry is checked by eye against the CDN icon before it is added; a type with no entry gets the empty slot, never a guess.
- **The frame is baked into the art.** Show icons as they are: no extra border, no rounded mask, no filter, no recolour, no background tile. Size 28 px on the pane, 24 px in chips, 32 px in a feature row; never above 64 px (legacy 32 px icons stay at 32 or below).
- `<img width height loading="lazy" decoding="async">`; `alt` is the item name unless a text label sits beside it (then `alt=""`). On error or a null ID, a neutral empty slot (a `well` square with a 1 px `control` border and four mid-edge notch ticks, each 1 × 3 px in `control`, inside the 4 px micro-graphic exemption; on the pane a 1 px `pane-ink` border, no fill).
- Browser `<img>` loads need no User-Agent; any server-side CDN fetch must send one.
- **UI glyphs** (rail silhouettes, status shapes, ▶/▼ foldouts, sort arrows, ✕) are inline SVG drawn for this app (see Shapes): flat, single-colour, `icon-taupe` or the status colour. No icon library, no icon font, **no emoji**.
- **Coin medallion**: a small round embossed coin drawn as inline SVG for this app, 1em, beside every councils figure, `aria-hidden` (the word "councils" or the column header carries the meaning). Dark window: `data-gold` face, darker rim. **On the pane: `data-gold` face with a 1 px `pane-ink` rim** (4.77:1), so it never turns into a smudge (the face alone is 1.94:1). Selected row: `sel-flag` rim. Daylight: `day-data` face, `day-text` rim. Client textures (CurrencySprites) are reference only and never shipped.
- **Mark**: an original drawing, the game's rounded `Frame` outline in tan with the rust notch. Never the Project Gorgon logo or its gold wordmark.

### Data visualisation
- **One hue**: `data-gold` (pane: `pane-bar`; selected row: `sel-bar`; Daylight: `day-data`). Status colours only for status. Colour says good or bad, never up or down.
- **Cumulative XP** (Session, "Experience" window): SVG line, 2 px, round joins, no area fill; 200 px tall (140 px phone); gridlines at 0, half and max in `rule`, labels `small` dim; start and end times on the x axis; the zero line always drawn. While live, the line extends flat to now as a 1 px dashed segment (inferred, not recorded). Hover or keyboard focus: 1 px `text-dim` crosshair, 6 px dot, Float tooltip "1,460 XP · 21:14". Scope from the TODAY / THIS LOGIN tabs.
- **Zero collapse**: with fewer than 2 points or 0 XP, the chart collapses to one sentence and a 24 px zero line ("No XP today yet. 26 min across 7 zone changes."). The At a glance window drops its zero figures at the same time.
- **Damage a second over a fight** (Combat, Breakdown window; added 24 Oct): the same form as the XP chart, 120 px tall (100 px phone), one `data-gold` 2 px line that steps per bucket (the server buckets a fight to at most 240 points, `timelineStep` seconds each; most fights are 1 s buckets), gridlines at 0, half and max in `rule` with `small` dim labels, "0:00" and the fight's length ("2:01") on the x axis, no area fill. Hover or arrow keys: crosshair, 6 px dot, Float tooltip "1,563 at 0:00 · you 882 · pets 681" (the split only when both hit; "(5 s)" after the time when buckets are wider than a second). A visually hidden table mirrors it. Drawn only when the fight dealt damage and has two or more buckets; redrawn only when the fight's id, length or damage changed (an open fight grows every 2 s). One series, so no legend (the title names it) and no palette to validate.
- **Bar lists** over pies, always. No sparklines in figures, no gauges, no 3D, no gradients.
- **Numbers**: `1,589,320` in tables and figures; `short()` (`12.3k`, `1.2M`) only where a column says so in its header and only for values ≥ 10,000; never mix in one column.

### Motion
Feedback only; nothing makes an entrance.
- `duration-fast` 120 ms (hover, press, focus), `duration-base` 180 ms (toast in and out, strip expand, panel open), `duration-flash` 600 ms (an updated row's background flashes `well` then fades back after Check again or an export).
- Easing `cubic-bezier(0.2, 0.7, 0.2, 1)`.
- No count-up numbers, no skeleton shimmer, no parallax, no animated charts.
- `prefers-reduced-motion: reduce`: transitions become instant except opacity on the toast.

## Server contract

Everything the design reads that `server.py` does not serve today. **All of it is additive**: no existing endpoint changes a field's name, type or meaning; old clients ignore the new fields; the new page works against the old server through the browser fallback (Data health → Merging). Times: every new time field is an ISO 8601 string with the local offset (`"2026-10-23T00:56:12+02:00"`); the chat log's own `"26-10-23 00:56:12"` strings stay where they already are. Python stdlib only.

### `GET /api/health` (new)
Query: `character` (optional; default the character of the last login line). Response `200`:
```json
{
  "version": 1,
  "checkedAt": "2026-10-23T21:14:05+02:00",
  "character": "Robchew",
  "server": "Arisetsu",
  "cdnVersion": "488",
  "game": {
    "running": true,
    "loggedIn": true,
    "character": "Robchew",
    "loggedInAt": "2026-10-23T19:04:10+02:00",
    "loggedOutAt": null,
    "area": "Casino",
    "areaSince": "2026-10-23T20:51:00+02:00",
    "lastLineAt": "2026-10-23T21:13:58+02:00",
    "log": "Chat-26-10-23.log"
  },
  "settings": {
    "readable": true,
    "LogChat": 1, "GUI_ChatLogs": 1, "AutoExportCharacterOnLogout": 1,
    "VIP_CombatLogging": 1, "LogNonAttacks": 1,
    "combatLog": { "MeAttackEnemy": 2, "EnemyAttackMe": 2 }
  },
  "cdn": { "version": "488", "cached": ["488"], "reachable": true, "changedAt": null },
  "thresholds": { "character-export": 86400, "storage-export": 172800, "chat-silence": 900, "alt-stale": 604800 },
  "activityThresholds": { "storageSearches": 1, "lootStacks": 50 },
  "summary": { "worst": "warn", "counts": { "ok": 6, "info": 3, "warn": 1, "bad": 0 }, "header": "1 to do · 3 notes" },
  "items": [
    {
      "id": "storage-export:Robchew",
      "source": "storage-export",
      "severity": "warn",
      "at": "2026-10-23T00:49:57+02:00",
      "ageSec": 73800,
      "title": "Storage export",
      "evidence": "Since then you visited Casino and Serbule, where your vaults are.",
      "evidenceData": { "vaultAreas": ["Casino", "Serbule"], "storageSearches": 2, "firstSearchAt": "2026-10-23T20:42:04+02:00", "itemsLooted": 419, "lootStacks": 323, "lootCrossedAt": "2026-10-23T20:01:33+02:00", "lootPauseAt": "2026-10-23T20:28:37+02:00", "sales": 0, "favorGains": 0, "activityBy": "Robchew" },
      "fixKey": "export-storage",
      "fixArgs": {},
      "topic": "storage-export",
      "views": ["storage", "vendors"],
      "serverOnly": false,
      "file": "Robchew_Arisetsu_items_2026-10-22-22-49-57Z.json"
    }
  ],
  "moments": [
    { "id": "zone-storage:Casino:2026-10-23T20:51:00+02:00", "topic": "zone-storage", "at": "2026-10-23T20:51:00+02:00", "level": "act-now", "title": "Your vaults are in Casino", "body": "Export Storage after you're done here. VIP menu → Export Storage JSON", "fixKey": "export-storage", "args": { "area": "Casino" } }
  ],
  "characters": [
    { "name": "Robchew", "logins30d": 41, "lastLoginAt": "2026-10-23T19:04:10+02:00", "characterExportAt": "2026-10-23T00:56:01+02:00", "storageExportAt": "2026-10-23T00:56:14+02:00" },
    { "name": "Boomchew", "logins30d": 5, "lastLoginAt": "2026-10-12T18:20:00+02:00", "characterExportAt": null, "storageExportAt": null }
  ]
}
```
- `items[].source` is one of the severity table's source keys; `id` is `source` or `source:<character|alt|file>`; `severity` is `ok|info|warn|bad`; `ageSec` and `at` are null for sources without a time; `evidence` is the ready sentence and `evidenceData` the numbers behind it; `serverOnly` is true when the browser fallback cannot produce this item. Every source in the table is present for the selected character (ok ones included), plus one `alt-stale` or `alt-missing` item per affected alt.
- `game.running` comes from a process check (`pgrep -x "Project Gorgon"`, verified 2026-10-23 while the game runs) and is `null` when the check can't run. `loggedIn` and `loggedOutAt` come from the last "Logged In As" and "Logged Out" lines in the newest log (falling back to older logs after midnight).
- `settings` parses `GorgonSettings.txt` (tab-separated `type, key, flag, value`; the value is the last column). `readable: false` and no other keys when it can't be read; the dependent items are then `info` "Couldn't read GorgonSettings.txt".
- Activity since export (`evidenceData`) is counted over every chat log from the export time to now with the regexes already listed in `design/research/app-inventory.md` §9 (`You received N Councils` with thousands commas, `You gained N favor with X`, `Searching your storage for`, `added to inventory`, `Entering Area` matched against the areas of the character's vaults from `/api/storage`). Only lines written while the selected character was logged in count (`activityBy`; the owner of a line is the last "Logged In As" at or before it, carried across logs), so an alt's export is never judged by the main's play. `itemsLooted` keeps the summed quantity; `lootStacks` counts loot lines; `firstSearchAt`, `lootCrossedAt` (the line on which `lootStacks` reached `activityThresholds.lootStacks`) and `lootPauseAt` (the first `Entering Area` after it) are ISO local times or null; `searchReminders` and `lootReminders` are lists of ISO local times, the `export-stale` moment anchors by the Reminders trigger-table rule (follow-through of a vault-area entry deferred, 2 h apart, loot every 50 more stacks).
- `moments` holds those of the last 6 hours, newest first; the browser dedupes by `id` in `pgdash.reminders.v1` `deliveredMoments` (Reminders panel → Storage). `vendor-reset` moments are computed from the `/api/vendors` per-row fields below (`resetSinceExport`, `exportResetAt`, `spentAtExport`, `cap`, `restored`) for the requested character, with id `vendor-reset:<first exportResetAt in the batch>`; `args` carries `{ "npcs": [...], "restored": 140000 }`.
- Cost: the server caches per-log parse results keyed by file size and mtime, so a 30 s poll re-reads only the growing log.

### `/api/session` (additive fields)
Existing fields unchanged, including `live` (still "log written in the last 15 min"). New:
```json
{
  "loggedIn": false,
  "loggedInAt": "2026-10-23T19:04:10+02:00",
  "loggedOutAt": "2026-10-23T00:56:20+02:00",
  "lastLineAt": "2026-10-23T00:56:20+02:00",
  "playing": false,
  "events": [
    { "ts": "26-10-23 19:04:10", "at": "2026-10-23T19:04:10+02:00", "kind": "login", "character": "Robchew", "server": "Arisetsu" },
    { "ts": "26-10-23 19:05:02", "at": "…", "kind": "area", "area": "Casino" },
    { "ts": "26-10-23 19:40:11", "at": "…", "kind": "level", "skill": "Mycology", "level": 61 },
    { "ts": "26-10-23 00:56:01", "at": "…", "kind": "export", "report": "Character", "file": "Character_Robchew_Arisetsu.json", "character": "Robchew", "partial": false },
    { "ts": "26-10-23 00:56:20", "at": "…", "kind": "logout" }
  ],
  "channels": { "Status": 1234, "Combat": 8800, "Guild": 40, "Party": 12, "System": 310 }
}
```
- `playing` = `live && loggedIn` (the fixed meaning of the old header dot). The location line uses `loggedIn`, `currentArea` and `loggedOutAt`: "Casino (logged in)", "Casino (logged out 00:56)", "No area yet today".
- `events[].kind` is `login | logout | area | level | export | death`. Export events come from `Saved report to` lines; `report` is `Character` or `Storage` from the file name; `partial` is true for `Character__<Server>.json`; `character` is null for a partial file (the page attributes it to the character logged in at that time). Events follow `scope`.
- `channels` counts every line of the log in `scope` with the chat-log channel rule (Feed: chat log), so the chips have whole-log counts although `/api/tail` returns only the last 20 KB.
- Death tracker (24 Oct, additive): `events[]` gains `{ "ts": "26-10-23 22:21:00", "at": "2026-10-23T22:21:00+02:00", "kind": "death", "character": "Robchew", "killer": "Dread Pixie", "ability": "PixieSlash", "area": "Statehelm", "hits": 1 }`; `killer` null = indirect damage (no FATALITY line, only the Dying XP line); `ability` null when the killer is null or the game printed an empty ability; `area` null when no Entering Area line precedes it in this log; `hits` counts the FATALITY lines folded into this death (the corpse kept getting hit; the Dying XP line never adds one, and an indirect death with no FATALITY line still reports 1). A Dying line within 10 s of "You evaded death!" is the evade's own XP and opens no death; the character's own attack within 1 s of a death does not end it (the game writes a queued attack between the Dying line and its FATALITY line). Plus `"combat": { "deaths": 2, "kills": 27, "petKills": 123, "petDeaths": 11, "closeCalls": 1, "pets": ["Cardi Bee", "Doomstorm"], "lastDeath": { …the event minus `kind`… } | null }`, which follows `scope` exactly like `xp` and `loot` (the day scope starts at the day's first login, so it can miss a death before it at midnight), and `"combat31d": { "days": 15, "since": "2026-10-10", "deaths": 56, "kills": 449, "petKills": 1006, "petDeaths": 313, "closeCalls": 22 }` summed over whole chat logs written in the last 31 days (`since` is a plain `YYYY-MM-DD`, the name-derived date of the oldest log in the window; null with no logs). Counts cover every character in scope; `character` on the event says whose death it was. Rules and verified line shapes in `docs/DATA-SOURCES.md`; no chat log → `{}` as before, so neither field exists.
- Councils feed (24 Oct, additive): `"councils": { "received": 38851, "receivedLines": 240, "zeroLines": 138, "gamingLines": 226, "gamingReceived": 38773, "stolen": 689, "stolenLines": 2, "thieves": ["Ratkin Mugger"], "recovered": 0, "recoveredLines": 0, "net": 38162, "overburdened": 302, "overburdenedLines": 1, "events": [ { "ts": "26-10-12 00:01:41", "at": "2026-10-12T00:01:41+02:00", "kind": "received", "amount": 832, "gaming": true, "character": "Robchew" }, { "ts": "…", "at": "…", "kind": "stolen", "amount": 218, "who": "Ratkin Mugger", "character": "Robchew" }, { "kind": "recovered", "amount": 218, "who": "Ratkin Mugger", … }, { "kind": "overburdened", "amount": 290, "who": "Konekonyan", … } ], "spendingLogged": false, "onHand": { "amount": 45789, "at": "2026-10-24T00:02:36+02:00", "file": "Character_Robchew_Arisetsu.json", "character": "Robchew" } | null }`. Follows `scope` like `xp`. `councils.events` is its own chronological, uncapped container; the top-level `events[]` stays the What happened feed. `gaming` (receipts only) = every 0 receipt (all 278 across the logs are Casino slot pulls, and losing streaks run past any window from the last win, so no "Received 0" row is ever shown bare), a Gaming XP line within 3 s, or a receipt within 120 s after one that sits in the run of slot pulls (within 15 s of the previous gaming receipt or the next 0 receipt). `net = received − stolen + recovered`; overburdened `[Error]` lines are reported, never counted. `thieves` in first-seen order; names verbatim ("1 victim" is one). `spendingLogged` is always false (no chat line records councils spent). `onHand` is `Currencies.GOLD` from the newest good character export of the events' owner (`councils_owner`: the one character every event in scope belongs to, else the chat log's `character`, so a day that ends on an alt still pairs the main's thefts with the main's export and a fresh export of that character is what changes the figure; never a partial `Character__<Server>.json`); null without one. Its `character` names the owner. The same regexes feed `/api/health`: the character-export activity evidence and the `after-selling` moment now count only non-zero receipts that are not Gaming wins ("You received councils 3 times since it, not counting Gaming wins, so vendor room is lower than shown." / "Received councils 3 times in Serbule").

### `GET /api/icons` (new)
Query: any of `names` (item display names, comma-separated, URL-encoded), `typeIds` (storage `TypeID`s), `types` (vendor item types). Response:
```json
{ "cdnVersion": "488", "base": "https://cdn.projectgorgon.com/v488/icons/",
  "byName": { "Amethyst": 5012, "Unknown Thing": null },
  "byTypeId": { "54701": 4410 },
  "byType": { "Gem": 5012, "Jewelry": null } }
```
`byName` and `byTypeId` come from the cached `items.json` (`item_<TypeID>` → `IconId`; names by `Name`); `byType` from `item-type-icons.json`. Null means "show the empty slot".

### `GET /api/lookup` (new; `item=` added 25 Oct)
Readable names for raw keys. Query: `quests` (export quest `InternalName`s), `powers` (`Power` names from items, each optionally `:tier`), `item` (a name fragment, 3+ characters; the Vendors search). `item` answers `"item": { "query": "figurine", "items": 42, "examples": ["Brass Figurine", "Lead Figurine of an Ogre", "Lead Figurine of a Goblin"], "types": [{ "type": "Artwork", "items": 34 }, { "type": "Antique", "items": 7 }] }`: the items of `items.json` whose `Name` contains the query (case-insensitive), and the vendor type words (any word a vendor's `CapIncreases` names) their `Keywords` carry, kept when at least two matching items carry the word and at least a tenth of them do, most common first, at most six. Under 3 characters: `"item": null`. Response:
```json
{ "cdnVersion": "488",
  "quests": { "SirHughes1B": "Sir Hughes' Errand", "NoSuchQuest": null },
  "powers": { "HealthBoostVeryWeak:3": { "text": "+18 Max Health", "tier": 3 } } }
```
Quests from `quests.json` (matched on `InternalName`, returning `Name`); powers from `tsysclientinfo.json` (matched on `InternalName`, the tier's effect descriptions joined with "; "). (Example strings are illustrative; real text comes from the files.) Null means "prettify the raw key", which is the current behaviour.

### `cdnVersion` on existing endpoints (additive)
`/api/vendors` and `/api/storage` gain a top-level `cdnVersion` string, used by footers ("caps from game data v488").

### `/api/vendors` (additive per-row and summary fields)
Why: today `server.py` (`vendors()`) sets `spent` to 0 and `resetsAt` to null as soon as a vendor's `VendorResetTime` has passed, so the client cannot tell "reset since the export" from "never spent". Existing fields keep their exact meaning (`spent` 0 and `resetsAt` null after a reset, `remaining` = `cap` − `spent`). New fields on every row:
```json
{ "npc": "NPC_Kib", "cap": 60000, "spent": 0, "remaining": 60000, "resetsAt": null,
  "exportResetAt": "2026-10-23T14:10:00+02:00",
  "spentAtExport": 58200,
  "resetSinceExport": true,
  "restored": 58200 }
```
- `exportResetAt`: the raw `VendorResetTime` from the export, converted from UTC to an ISO string with the local offset; null when the export has none.
- `spentAtExport`: the raw `CouncilsSpent` from the export (0 when absent), whatever the reset time.
- `resetSinceExport`: true when `exportResetAt` is not null, is before now, and `spentAtExport` > 0.
- `restored`: councils that came back through that reset, `min(spentAtExport, cap)` when `resetSinceExport`, else 0. Already included in `remaining`.

New top-level field: `"resetSummary": { "count": 21, "restored": 379580 }` (count of rows with `resetSinceExport`, sum of their `restored`). Used by the Vendors "Reset since export" figure, the margin's positive note, the per-row "reset" chip and "+11,489 back", and (server-side) the `vendor-reset` and `digest` moments. An old server lacks these fields: the page then shows no reset figure, chip or positive note, and the Vendors footer adds "Resets since the export need a newer server.py".

### `GET /api/zone?area=&character=` (new, 23 Oct; `matched` / `guessed` added 24 Oct)
The Here window. `area` defaults to the current area of the newest chat log (`{ "error": "no area" }` at 200 when the log names none today). Shape:
```json
{ "area": "Casino", "friendly": "Red Wing Casino", "keys": ["AreaCasino"], "matched": true, "guessed": false,
  "npcs": [ { "npc": "NPC_Kib", "name": "Kib the Unkillable", "favor": "SoulMates", "services": ["Consignment", "Augments"],
              "vendor": { "…the /api/vendors row…" }, "vault": { "…the /api/storage row…" }, "loves": ["Trophy Animal Hides", "Swords", "Shields"], "notes": "" } ],
  "unmet": 3, "summary": { "councils": 59929, "vendors": 7, "free": 80, "vaults": 7 },
  "adjacent": [ { "keys": ["AreaEltibule"], "name": "Eltibule", "councils": 222692, "vendors": 9, "free": 40, "vaults": 1 } ],
  "sources": { "character": { "…latest_report head…" }, "storage": { "…items export head…" } }, "cdnVersion": "488" }
```
- `keys`: the `areas.json` keys the chat name maps to (key, `Area` + name, `FriendlyName` or `ShortFriendlyName`; "Underneath Serbule" and "Povus Caves" map to two). When none match, the NPCs' own `AreaFriendlyName` is tried; `matched` is false when that finds nothing too (real case: "Khyrulek's Crypt", 3 visits in the April logs) and the other lists come back empty with no `error`.
- `guessed`: true when the chat name is one of the shared short names "Caves", "Dungeon" or "Home" (the log alone cannot say which cave); `friendly` then carries the full name of the one picked.
- `unmet`: NPCs in the area the character has not met that offer a service other than Storage (altars and chests are not NPCs to meet).
- `npcs` holds met NPCs and every vault of the character's in the area (non-NPC chests too), sorted by councils left, then free slots, then name. Rows reuse the `/api/vendors` and `/api/storage` row shapes unchanged. `adjacent` lists neighbours with vendors or vaults, grouped by display name.
- Failures are HTTP 500 `{ "error": "<repr>" }`; the window shows the error block (`blockError`: red square, "Couldn't load this zone. Last good at 08:51." plus Retry, the repr only in the console) and keeps its footer.

### `GET /api/combat?scope=day|login` (new, 24 Oct)
The DPS meter. The newest chat log, read incrementally by byte offset into one `DpsTracker` (a shrink restarts it), so a 2 s poll re-reads only new lines. No chat log → `{}`.
```json
{ "log": "Chat-26-10-24.log", "scope": "day", "character": "Robchew", "live": true,
  "lastLineAt": "2026-10-24T18:42:57+02:00", "lastCombatAt": "2026-10-24T18:42:54+02:00", "combatLines": 2975,
  "gapSec": 15, "nowSec": 10, "minor": { "sec": 5, "dmg": 500 }, "pets": ["Cardi Bee", "Doomstorm"], "unclassified": [],
  "now": { "inFight": true, "dps": 229.4, "me": 159.7, "pet": 69.7, "recent": 160.6, "sec": 7, "fight": "26-10-24 18:42:53" },
  "totals": { "fights": 39, "dmg": 256014, "me": 99902, "pet": 156112, "health": 188140, "armor": 67874, "hits": 620, "crit": 66,
    "taken": 17870, "takenMe": 14786, "indirectMe": 3084, "takenPet": 16675, "kills": 104, "petKills": 107, "deaths": 6, "instakills": 2,
    "activeSec": 1388, "dps": 184.4, "indirectUnattributed": 25693, "minor": 2,
    "best": { "id": "26-10-24 17:56:12", "start": "26-10-24 17:56:12", "dps": 615.1, "dmg": 12917, "dur": 21 },
    "abilities": [ { "name": "Bee Stab", "who": "Cardi Bee", "hits": 279, "dmg": 129318, "health": 96668, "armor": 32650, "crit": 58, "evaded": 1, "none": 87, "max": 3011, "fatal": 94 } ] },
  "fights": [ { "id": "26-10-24 18:35:55", "start": "…", "at": "2026-10-24T18:35:55+02:00", "end": "…", "endAt": "…", "dur": 121, "open": false, "minor": false,
    "area": "Underneath Serbule", "dmg": 30707, "me": 9508, "pet": 21199, "health": 0, "armor": 0, "dps": 253.8, "dpsMe": 78.6, "dpsPet": 175.2,
    "hits": 0, "crit": 0, "evaded": 0, "hitsMe": 27, "critMe": 0, "maxHit": 0, "taken": 666, "takenMe": 666, "takenHits": 7, "indirectMe": 0, "takenPet": 0,
    "kills": 9, "petKills": 21, "deaths": 0, "instakills": 0, "targets": [ { "name": "Skeleton Assassin", "dmg": 0 } ], "targetCount": 6, "mobs": 30, "top": "Skeleton Assassin",
    "abilities": [ { "…same row as totals, plus": "levels: [\"Dampen 8\"]" } ], "takenBy": [ { "name": "Fire Sheep", "ability": "Sheep Bomb", "hits": 5, "dmg": 364, "instakill": 0 } ],
    "indirectUnattributed": 1366, "shared": false, "others": [], "timeline": [[0, 882, 681], [1, 0, 0], [2, 499, 564]], "timelineStep": 1 } ] }
```
Rules (verified on the 24 Oct log, `docs/DATA-SOURCES.md`): a fight opens on any attack line with a real `Dmg:` and closes after `gapSec` 15 s without one (`Dmg:  none`, evades, buff lines and indirect lines never open one; they count into an open one); duration is last − first + 1 s (an open fight runs to now). Damage = health + armor. **you** = the login-line character (no `#id`); **pets** = `#id` attackers that hit what you hit, or were hit by a known enemy, or are named in `KNOWN_PETS` / with a "(Pet)" ability, and never traded real damage with you; **enemies** = what you or a pet hit and what hit you or a pet. `unclassified` lists `#id` attackers that fit neither (their damage is in no figure). Ability names are grouped with the trailing level stripped (`levels` keeps the raw forms). A hit of 100,000 or more is a kill mechanic (`instakill`): a death, listed under `takenBy`, never summed. `deaths` counts one per FATALITY on you until you act again more than 1 s later (approximate; the Session death tracker is the precise one). `indirectUnattributed` sums "Suffered indirect dmg" on everything but you and your pets during the fight (the game names no source); `shared` is true when a `[Party]` line fell inside the fight or an unknown `#id` entity (`others`, likely another player) had a Recovered / indirect line in it. `minor` fights are under 5 s and 500 damage. `timeline` is dense from 0 to the fight's length, `[[second offset, you, pets]]` per bucket of `timelineStep` seconds (1 until a fight passes 240 s, then the smallest step that keeps it under 240 points); it sums to `dmg`. `now.recent` is you + pets' damage over the last `nowSec` 10 s ÷ 10. Scope: `day` from the day's first login line, `login` from the last. `best` needs 15 s and a closed fight. Settings are not here; `/api/health` `combat-logging` says when a `combatLog_*` key is below 2.

### `GET /api/party`, `POST /api/party` (new, 25 Oct; `docs/SHARING.md`)
Fight sharing over ntfy.sh (`PG_NTFY` overrides the base, default `https://ntfy.sh`). State in `party.json` beside `capacity.json` (code, join time, the fight ids already posted, kept 24 h so a leave and undo never post a fight twice), never shipped. `POST` body `{ "action": "new" }` makes and joins a code, `{ "code": "gn-abc123def456" }` joins one (`400` unless it matches `^gn-[a-z0-9]{12}$`), `{ "code": null }` leaves; it answers like `GET`. Joining sets the clock (`since`) to the start of the **third most recent closed fight** with damage (`PARTY_BACKFILL`), else now: those fights and every one that closes after the join (closed, not minor, damage dealt > 0, day scope of the live tracker) are posted, one message each (`POST https://ntfy.sh/<code>`, JSON under 4 KB: `v, who, start, end, dur, dmg, me, pets{}, dps, taken, kills, deaths, top[[name,dmg]×5], targets[3], enemies[≤40 #ids], area, app`), by a daemon thread every 10 s; a failed post stays pending and is retried. The thread also reads the topic (`GET /<code>/json?poll=1&since=<last id>`, `all` the first time) while `/api/party` was requested in the last 90 s; `GET` itself polls once right after a join. Messages that are not version-1 summaries are ignored; remote summaries are keyed by player and fight start (a fight posted twice is one row) and kept 14 h in memory. Response:
```json
{ "version": 1, "code": "gn-d62de7sh87gc", "since": "2026-10-25T21:32:10+01:00", "character": "Robchew", "base": "https://ntfy.sh",
  "ntfy": { "reachable": true, "lastOkAt": "…", "lastErrorAt": null, "lastError": null, "lastPostAt": "…", "lastMessageAt": "…", "posted": 12, "pending": 0, "received": 25 },
  "members": ["Icebrg", "Robchew"],
  "fights": [ { "id": "2026-10-25T19:57:57+02:00", "start": "…", "end": "…", "dur": 192, "area": "Gazluk Keep", "total": 73000, "byIds": false, "solo": false,
                "members": [ { "who": "Robchew", "mine": true, "dmg": 46310, "me": 14148, "pets": { "Cardi Bee": 32162 }, "dps": 241.2, "share": 0.634, "kills": 46, "deaths": 0, "taken": 154, "top": [["Bee Stab", 28709]], "targets": ["…"], "enemies": ["…"], "area": "…", "start": "…", "end": "…", "dur": 192 } ] } ] }
```
Merge (`party_merge`): own fights since the join plus remote ones (not from the same character, damage > 0, ended after the join), sorted by start; a summary joins the first group whose window it overlaps and that has no summary from the same player yet, else opens a group. `byIds` is true when the players' enemy id sets intersect (unverified whether two clients log the same `#id`; nothing depends on it yet). `reachable` = the last success is newer than the last error. Nothing in `/api/health` yet.

### `POST /api/capacity` (validation added)
Body unchanged: `{ "vault": "NPC_Otis", "slots": 75 }`, `slots` null or `""` clears. New: `vault` must be a non-empty string and `slots` a whole number 1 to 999 (or null/empty); otherwise `400 { "error": "slots must be a whole number from 1 to 999" }` instead of today's 500 traceback. Success stays `200 { "ok": true }`; it adds `"slots": 75` (or null) as an echo.

### `GET /api/plan?character=` (new, 26 Oct)
The sell-and-store trip for the inventory of the newest storage export, priced with the newest character export. No export → `200 { "error": "no items export" }`. Response:
```json
{ "character": "Robchew", "source": { "file": "…_items_….json", "timestamp": "…", "at": "…" }, "sheet": { "file": "Character_Robchew_Arisetsu.json", "…": "…" }, "cdnVersion": "488", "multiplier": 1.23,
  "summary": { "stacks": 107, "inventoryFree": 30, "sell": { "stacks": 19, "councils": 9321, "vendors": 1 }, "store": { "stacks": 62, "vaults": 7 }, "gear": { "stacks": 26, "councils": 46653 }, "stays": 0, "unsellable": 22, "stops": 3 },
  "stops": [ { "area": "Serbule", "stacks": 26, "councils": 9321,
               "sell": [ { "id": "NPC_SirCoth", "name": "Sir Coth", "stacks": 19, "councils": 9321, "left": 10000, "after": 679, "items": [ { "typeId": 1, "name": "Greater Fulgurite", "qty": 15, "councils": 4620 } ] } ],
               "store": [ { "id": "NPC_Joeh", "name": "Joeh", "stacks": 4, "free": 15, "after": 11, "items": [ { "typeId": 2, "name": "Bacon", "qty": 65, "councils": 0 } ] } ] } ],
  "items": [ { "typeId": 1, "name": "Greater Fulgurite", "qty": 15, "value": 250, "unit": 308, "price": 4620, "kind": "sell", "action": "sell",
               "sellTo": { "npc": "NPC_SirCoth", "name": "Sir Coth", "area": "Serbule", "qty": 15, "councils": 4620, "left": 10000, "whole": true }, "storeAt": null, "note": null } ] }
```
`action` is `sell`, `store`, `gear` (shown with `sellTo` and `storeAt` as options, counted in `summary.gear` only) or `stays` (no vault with room, `note`); `kind` is the classification before room and councils were checked. `why` on a stored row: "no vendor buys it" / "worth nothing to a vendor". `stops[]` sorted by stacks; the browser promotes the current area. Decisions and the allocation order are under Views → Storage → Sell and store.

### `GET /api/consolidation?character=` (new, 24 Oct)
Split stacks from the newest storage export (same file as `/api/storage`; no `file` parameter). Export-only: nothing from the chat log. `MaxStackSize` comes from CDN `items.json` (`item_<TypeID>`); free slots from the `/api/storage` vault rows. No export → `200 { "error": "no items export" }` (the only missing-source string; everything else is the Error state). Response `200`:
```json
{ "character": "Robchew", "source": { "file": "Robchew_Arisetsu_items_2026-10-22-22-56-14Z.json", "timestamp": "2026-10-22 22:56:14Z", "at": "2026-10-23T00:56:14+02:00" }, "cdnVersion": "488",
  "summary": { "slotsBack": 33, "vaultSlotsBack": 32, "bagSlotsBack": 1, "itemsToMerge": 27, "moves": 35, "stops": 3, "splitNames": 45, "splitTypes": 50,
               "skipped": { "unstackable": 16, "noGain": 7, "perItem": 0, "carryLimit": 0, "unknownType": 0, "unknownLocation": 0 } },
  "items": [ { "typeId": 1, "name": "Empty Bottle", "names": ["Empty Bottle"], "maxStack": 10, "total": 87, "stacksNow": 12, "stacksAfter": 9, "slotsBack": 3,
               "to": { "vault": "NPC_Marna", "name": "Marna", "area": "Serbule", "free": 2, "extraSlots": 1, "needsRoom": 0, "roomUnknown": false },
               "moves": [ { "from": "Saddlebag", "name": "Saddlebag", "area": "Anywhere", "qty": 6, "stacks": 1, "carried": true, "stop": "Serbule" } ] } ],
  "vaults": [ { "vault": "NPC_Ragabir", "name": "Ragabir", "area": "Casino", "free": 3, "back": 7, "after": 10 } ],
  "stops": [ { "area": "Casino", "moves": 20, "vaults": [ { "vault": "NPC_Ragabir", "name": "Ragabir", "free": 3, "after": 10, "lines": [
               { "typeId": 1, "name": "Empty Bottle", "qty": 5, "from": "NPC_Ragabir", "fromName": "Ragabir", "carried": false, "to": "NPC_Marna", "toName": "Marna", "toArea": "Serbule", "sameArea": false } ] },
               { "vault": "carried", "name": "Carried", "free": null, "after": null, "lines": [] } ] } ] }
```
Rules: stacks group by `TypeID`; only groups in two or more locations count (`splitTypes`; `splitNames` counts names, inventory included). Skipped, in this order: no CDN entry; a location the export doesn't name; `MaxStackSize` ≤ 1 (all gear); any per-item field (`TSysPowers`, `AttunedTo`, `Durability`, `Crafter`, `TSysImbuePower`, `UsesRemaining`, `CraftPoints`, `IsAugmented`, `TransmuteCount`, `Slot`, `Level`, `Rarity`, `IsCrafted`); `stacksNow − ceil(total / MaxStackSize)` ≤ 0; a move over `MaxCarryable`. Destination: never Inventory; the candidate that fits (`free` unknown counts as fitting) first, then the largest holder, then the most room. Room is cumulative over the plan, in `items[]` processing order: each vault's room starts at the export's `free`, gains the stacks taken out of it and loses the `extraSlots` put into it, so two items never both "fit" the same last slot; `to.free` is the room left when the item's turn comes (never below 0) and `needsRoom` = `extraSlots` beyond it when nothing fits, so a later item's `needsRoom` includes earlier shortfalls in that vault. `vaults[].after` (and the copy on `stops[].vaults[]`) never goes below 0; the slots that found no room are `short`. `carried` sources are inventory and the saddlebag only; they have `stop` = the destination's area. Every other source stops in its own area, including vaults whose CDN Area is `*` (Council Storage Machine, Home Storage, Boxes of Space, player-made crates: not verified to travel with the player), which stop in `Anywhere`. `items[]` sorted by `slotsBack` desc then name; `vaults[]` by net slots back; `stops[]` by move count (the browser promotes the current area). Invariants: `sum(items.slotsBack) == summary.slotsBack == vaultSlotsBack + bagSlotsBack`; `summary.moves == sum(len(moves))`; every `to.vault != "Inventory"`.

### Files: `GET /api/files`, `/api/file/node`, `/api/file/search`, `/api/file/raw` (new, 24 Oct)
The JSON inspector behind the Files view. Read-only on disk: nothing here writes, and no new POST. A file id is `<group>/<name>` and only four locations exist: `reports/<name>` (the game's Reports/), `app/capacity.json` (an allow-list of exactly that one name under the project dir), `cdn/v<digits>/<name>.json` (the CDN cache) and, since 25 Oct, `logs/Chat-YY-MM-DD.log` (the game's ChatLogs/, the files the DPS meter, Session and the health checks read; served as text lines, never as JSON nodes). The grammar `^(reports|app|cdn/v\d{1,6})/([A-Za-z0-9_.\-]+\.json)$|^(logs)/(Chat-\d\d-\d\d-\d\d\.log)$` is checked before the disk is touched (no `/`, `\`, NUL or `..` can appear in the name), then the resolved path's parent must be the group's root and the path must be a regular file, the `load_report` idiom: a symlink planted in Reports/ that points elsewhere is refused and never listed. A malformed id is `400 { "error": "bad file id" }`; anything else outside the three roots, a missing file, a `.csv` or an unknown CDN version is `404 { "error": "not found: <id>" }`. `.csv` twins are never listed or served. Every file answer repeats `bytes`, `mtime` (ISO local) and `mtimeNs` (the file's `st_mtime_ns`, the client's change token).

**`GET /api/files`** → `200`:
```json
{ "version": 1, "listedAt": "2026-10-24T11:04:43+02:00", "cdnVersion": "488", "csvSkipped": 2,
  "files": [
    { "id": "reports/Character_Robchew_Arisetsu.json", "group": "reports", "name": "Character_Robchew_Arisetsu.json", "dir": "Reports/",
      "bytes": 91689, "mtime": "2026-10-24T00:02:36+02:00", "mtimeNs": 1792792956187861941, "exists": true,
      "report": "CharacterSheet", "character": "Robchew", "server": "Arisetsu", "timestamp": "2026-10-23 22:02:36Z", "at": "2026-10-24T00:02:36+02:00",
      "partial": false, "newest": true, "source": "character-export", "valid": true, "error": null, "nodes": 3766 },
    { "id": "reports/Character__Arisetsu.json", "character": "???", "partial": true, "newest": false, "source": "partial-export", "...": "..." },
    { "id": "app/capacity.json", "group": "app", "name": "capacity.json", "dir": "./", "bytes": 157, "mtime": "...", "mtimeNs": 0, "exists": true,
      "source": "vault-sizes", "valid": true, "error": null, "nodes": 7, "vaults": 6 },
    { "id": "cdn/v488/items.json", "group": "cdn", "version": "488", "name": "items.json", "dir": "cache/v488/", "bytes": 7167155, "mtime": "...", "mtimeNs": 0,
      "exists": true, "source": "cdn", "label": "Items", "valid": null, "error": null, "nodes": null },
    { "id": "logs/Chat-26-10-25.log", "group": "logs", "name": "Chat-26-10-25.log", "dir": "ChatLogs/", "bytes": 637530, "mtime": "2026-10-25T13:56:32+01:00", "mtimeNs": 0,
      "exists": true, "source": "chat-log", "date": "2026-10-25", "newest": true, "character": "Robchew", "combatLines": 6480,
      "lastLineAt": "2026-10-25T13:56:32+01:00", "lastCombatAt": "2026-10-25T13:53:34+01:00", "lines": null, "valid": null, "error": null, "nodes": null } ] }
```
Chat log rows (25 Oct) come after the CDN rows, newest written first; `date` is the day in the file name; `newest` marks the one `latest_chatlog()` returns, i.e. the file Combat, Session and the live health checks read, and only that row carries `character`, `combatLines`, `lastLineAt` and `lastCombatAt` from the cached `DpsTracker` (never a second parse; `null` on the others and if the tracker fails). `lines` is always null in the listing (counting every log's lines would read 70 MB a minute); the line count comes with `/api/file/lines`. `source` is `chat-log`, which is in `FILES_SOURCES`, so the chat-log health item lists `files` in `views`.
Rules: exports come from the server's own walk of `Reports/*.json` (not `list_reports()`, which drops files that fail to parse); the head is parsed once per (path, size, mtime_ns) and cached, so the 60 s poll never re-parses an unchanged export, and `list_reports()` shares that cache with its contract unchanged. A file that will not parse is still listed with `valid: false`, `error: "line 734 col 97: Unterminated string starting at"` and its head fields null, except `report`, `character` and `server`, which then fall back to the file-name segments (`Character_<Name>_<Server>.json`, `<Name>_<Server>_items_<ts>.json`) so the row can still say whose export it is. `report` is `CharacterSheet` or `Storage`; `partial` is Character `???` or Race `Error` or the `Character__` name; `newest` marks the newest valid non-partial file per (report, character) by its `Timestamp`; `source` is `partial-export` when partial, else `character-export` / `storage-export`; `server` reads the head's `ServerName`; `at` is `timestamp` as ISO local. `app/capacity.json` is listed even when absent (`exists: false`, bytes 0, mtime null) so its row can say how it gets created; present, `vaults` is its key count. CDN rows are every `cache/v*/*.json` on disk, stat only (`valid: null` until opened), older versions with their own `version`; `label` is the plain name the pane shows (Items, Quests, NPCs, Stats, Areas, Storage vaults, Item powers; an unknown file gets its file name). `nodes` is the whole-file node count once the file has been opened through `/api/file/node`, null before; the listing never computes it. Order: exports by mtime desc, then app, then CDN by version desc then name. `csvSkipped` counts `Reports/*.csv`. `health()` adds `files` to `views` on every item whose source is character-export, storage-export, partial-export, vault-sizes, cdn, alt-stale or alt-missing (one additive line in `add()`); `browserVerdicts()` mirrors the same list.

**`GET /api/file/node?id=&path=&offset=0&limit=200&depth=1&maxNodes=2000&mtime=<ns>&locate=0`** → `200`:
```json
{ "id": "reports/Character_Robchew_Arisetsu.json", "path": "/Skills", "type": "object", "count": 119, "offset": 0, "limit": 200, "more": false,
  "children": [
    { "key": "Mycology", "type": "object", "count": 4, "preview": "Level, BonusLevels, XpTowardNextLevel" },
    { "key": "Level", "type": "number", "value": 60 },
    { "key": "Desc", "type": "string", "value": "first 200 chars", "len": 313, "cut": true },
    { "key": "X", "type": "null", "value": null },
    { "key": "ActiveQuests", "type": "array", "count": 12, "preview": null, "children": [ ], "more": true },
    { "key": "TypeID", "type": "number", "value": 4206, "link": { "to": "cdn/v488/items.json", "path": "/item_4206", "label": "Open in items.json" } } ],
  "value": null, "bytes": 91689, "mtime": "2026-10-24T00:02:36+02:00", "mtimeNs": 1792792956187861941, "total": 3766, "pos": null, "ms": 2 }
```
`path` is an RFC 6901 pointer (root `""`, `~0` / `~1` unescaped, array indices numeric); `type` is object, array, string, number, boolean or null; `key` is a string under an object and an integer under an array. A scalar `path` answers with the full `value` and `children: []`. Child-row strings are cut at 200 characters (`cut: true`, `len`); numbers travel as JSON numbers; `preview` is the first three keys of an object joined by `", "` (`""` for an empty object), null for arrays. `limit` is clamped to 1,000, `offset` pages the children, `more` says more siblings follow the page. `depth` 1..99 fills children breadth-first, 200 per container, until `maxNodes` (default 2,000, cap 5,000) is spent; a container whose children were not (all) included carries `more: true` and the client keeps it collapsed and lazy. `total` (whole-file node count, one full walk per cached parse: 0.03 s for the 10 MB file) is on the root response only. `locate=1` adds `pos`, the index of each `path` segment among its siblings in document order (`[1047, 1]`), so the client can page every ancestor to the right 200-slice for deep links and search hits. `mtime=<ns>` that differs from the file's current `st_mtime_ns` → `409 { "error": "file changed", "bytes", "mtime", "mtimeNs" }`. Errors: unknown id 404; `path` that leads nowhere `404 { "error": "no such path" }`; a file that is not JSON `422 { "error": "invalid JSON", "line": 734, "col": 97, "msg": "Unterminated string starting at", "bytes", "mtime", "mtimeNs" }` (from `JSONDecodeError`). The client maps 409 and 422 to their own states, never to the Error block.

Cross-file links: a child row carries `link { to, path, label }` only when the target file is cached on disk for the file's CDN version (an export's links use the current version) and the target key exists; links never fetch. Rule table `file_link()` in `server.py`, direct keys first: CharacterSheet `/NPCs/<key>` → `npcs.json` `/<key>`, `/CurrentStats/<key>` → `attributes.json` `/<key>`, `/MostRecentArea` value → `areas.json`; Storage (and CharacterSheet) `/Items/<i>/TypeID` → `items.json` `/item_<TypeID>`, `/Items/<i>/StorageVault` value → `storagevaults.json`; `capacity.json` `/<key>` → `storagevaults.json`; `storagevaults.json` `/<key>/Area` and `npcs.json` `/<key>/AreaName` values → `areas.json`. By InternalName (an index `{InternalName: key}` built once per cached CDN file; `/api/lookup`'s indexes map to names, not keys, so they are not reused): `/ActiveQuests/<i>` and `/CompletedQuests/<i>` values → `quests.json`; `/Items/<i>/TSysPowers/<j>/Power` → `tsysclientinfo.json`. Skills and RecipeCompletions get no link (`skills.json` / `recipes.json` are not cached; the client says so in a tooltip).

**`GET /api/file/search?id=&q=&limit=200&mtime=<ns>`** → `200 { "id", "q", "hits": [ { "path": "/item_14091/Description", "key": "Description", "where": "key" | "value", "type": "string", "snippet": "…amethyst…", "pos": [1047, 1] } ], "total": 23, "capped": false, "partial": false, "bytes", "mtime", "mtimeNs", "ms": 2 }`. Case-insensitive substring over object keys and scalar values (strings as text, numbers and booleans by their JSON literal, nulls never); `q` under 2 characters → `400 { "error": "type at least 2 characters" }`. Hits come in document order, at most one key hit and one value hit per node, capped at `limit` (max 500); `total` keeps counting past the cap up to 10,000 (`capped: true` when it stopped). The scan stops at a 2 s budget (`partial: true`). `snippet` is up to 120 characters of the original text around the match. The index is built on the first search of a cached parse and kept with it: per node its parent, key and sibling position, plus two NUL-joined lowercase blobs (keys, values) with piece offsets, so a search is a C-speed `str.find` and a hit maps back to its node by bisect (`amethyst` on `items.json`: 0.2 s cold with the index build, 4 ms warm; `archery` on `tsysclientinfo.json`: 477 hits, 0.3 s cold).

**`GET /api/file/lines?id=&offset=&limit=500&q=&mtime=<ns>`** (25 Oct, `logs/` ids only; a `reports/`, `app/` or `cdn/` id is `400 { "error": "not a chat log" }`, and `/api/file/node` or `/api/file/search` on a log is `400 { "error": "a chat log has lines, not JSON nodes; use /api/file/lines" }`) → `200 { "id", "lines": [ { "n": 8104, "ts": "26-10-25 13:56:32", "msg": "[Global] …" } ], "offset": 7604, "limit": 500, "total": 8104, "more": false, "bytes", "mtime", "mtimeNs" }`. `n` is the 1-based line number; a continuation line (no timestamp) has `ts: null`. Without `offset` the page is the tail (the newest `limit` lines, `limit` clamped to 2,000, `LINES_PAGE` 500 / `LINES_PAGE_MAX`); `more` says lines follow the page. With `q` (case-insensitive substring over the whole line, 2+ characters or `400 { "error": "type at least 2 characters" }`) the answer is `{ "id", "q", "lines": [the matching lines in file order, up to limit], "matches": 178, "capped": false, "total", … }`, `matches` counting on past the page up to `LINES_TOTAL_MAX` 10,000 (`capped: true` when it stopped). The whole file is read on every call (today's 650 KB log: 6 ms for the tail, 14 ms for a search; nothing is cached, the live log changes every few seconds anyway). The same 409 rule as the node endpoint applies when `mtime` is sent; the client never sends it for a log.

**`GET /api/file/raw?id=&path=&mtime=<ns>`**: without `path`, the whole file streamed from disk with `shutil.copyfileobj`, never `json.load`-ed (`Content-Type: application/json; charset=utf-8`, `text/plain; charset=utf-8` for a `.log`, `Content-Length`, `Content-Disposition: inline; filename="<name>"`, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`; the 10 MB file answers in 9 ms). With `path`, the subtree as `json.dumps(obj, indent=2, ensure_ascii=False)`; over 1,048,576 bytes → `413 { "error": "too big to copy", "bytes", "mtime", "mtimeNs" }`. The same 409 rule as the node endpoint.

Caching and memory: parsed trees live in `_files`, an `OrderedDict` keyed by (resolved path, size, mtime_ns) behind `FILES_LOCK`; a current-version CDN file reuses `cdn_data()`'s object (already parsed for Vendors and Storage, pinned, a cache file is immutable per version); exports and older CDN versions are an LRU of 8 (`FILES_LRU`), and a rewritten file is a new key that evicts the old parse. Each entry holds the object, `total`, the search index (lazy) and the InternalName index (lazy). Measured 24 Oct: opening `items.json` and `tsysclientinfo.json` roots takes 85 ms cold, 2 ms warm, answers under 22 KB, and leaves the server at +81 MB RSS over the fresh-start baseline (+116 MB after searching both). Constants: `NODE_PAGE` 200, `NODE_PAGE_MAX` 1,000, `EXPAND_MAX_NODES` 2,000, `EXPAND_MAX_CAP` 5,000, `STRING_CUT` 200, `SEARCH_LIMIT` 200 / `SEARCH_LIMIT_MAX` 500 / `SEARCH_TOTAL_MAX` 10,000, `SEARCH_BUDGET_S` 2, `RAW_MAX_BYTES` 1 MB, `FILES_LRU` 8. A `BadRequest` raised on any GET now answers `400 { "error" }` (before, only POST used it); 409, 413 and 422 travel as `FileError`. `mtimeNs` is a 19-digit integer, past 2^53: the server compares the `mtime=` query value as text, and the client keeps it a string (Review decisions → `mtimeNs` is a string in the browser), so the round trip is exact.

### Which rules need the server
Server only: activity since export (character and storage warn by activity), `LogChat`, combat logging, auto-export setting, game process, `alt-missing`, `vip`, `player-log`, `cdn`, all `moments`, vendor resets since the export (`/api/vendors` new fields). Never on the server: preview modes. Browser can do: export ages, partial twin, vault sizes, `alt-stale`, chat log liveness (approximate), logged in or out (from `/api/session` fields when present, else from the tail), server reachability, selected export.

## Do's and Don'ts

### Do:
- **Do** make every block a window with a title bar and a footer strip that names its source, its age and the exact fix.
- **Do** put each view's main table on the inset khaki pane (`pane`, `pane-ink`), and only that table.
- **Do** emphasise NPC names and areas in `emphasis-tan` (colour only) and key numbers in `emphasis-tan` 700, as the game colours its own strings.
- **Do** give every status a shape and a word; keep healthy sources taupe and quiet.
- **Do** keep the stamp and Check again in the same place on every view.
- **Do** show CDN icons exactly as delivered, with their baked frames.
- **Do** write fixes for the player's current state ("Next time you're in game: …" while logged out).
- **Do** keep the chat log dark in both themes and its channel colours exact.
- **Do** switch every graphic in a selected row to the `sel-*` tokens, and every focus ring on the pane to `pane-focus`.

### Don't:
- **Don't** use parchment, wood, leather, stone or paper textures, torn edges, wax seals, scrolls, filigree, gem frames or ornate corners. The game ships none.
- **Don't** use Cinzel, Marcellus, Trajan, blackletter or ye-olde copy ("Thy coffers", "Hark!").
- **Don't** imitate the Project Gorgon logo or use Elder Game's name or branding as if official.
- **Don't** build a hero-metric row of boxed figures, and never show boxed zeros.
- **Don't** use colour alone for status, green for "ok", or error red for a full vault.
- **Don't** print `[Info]` or `[Alert]` tags; the game has none. Only `[Status]` and `[Error]`.
- **Don't** set status colours as text on the khaki pane, or `control` and gold lines on it.
- **Don't** add fake window controls (close, pop-out) that do nothing.
- **Don't** use gradients, glows, glass, emoji, or neon.
- **Don't** spread the khaki pane beyond the main table (The One Light Surface Rule).
- **Don't** let two places disagree about the same source's severity.
- **Don't** let a mute or snooze hide a status from the page; it only silences interruptions.

## Voice and Microcopy

**Register.** The game's system-message voice: one literal line that says what is so and what to do, plain modern English, dry and a little self-aware. Humour lives in empty states, positive notes and toasts, and the one primary button ("Remind Me!"), is short, and never replaces the instruction. It is PG's deadpan: a literal statement, often a quirk of a mechanic, said with a straight face ("Curses don't wear off on their own."), not whimsical app copy ("Your bags are grateful."). Lines tagged `[Status]` or `[Error]` stay purely literal, because those tags are the game's own system voice and the game never praises or jokes in them. Fix text stays exact and plain.

**Words.** Councils (with the coin), favor and its tier names spelled as the game shows them, vaults, Slots Free, VIP menu, Log All Chat, export, reset. Views: Session, Vendors, Storage, Character, Files. Window names are literal, like the game's "Item Info" and "Stuff to Do": "What they buy", "What happened", "Where to sell", "Where there's room". Not "Day book", "Ledger", "Manifest", "Index", "Entries", "Lamplight", "realm", "coffers".

**Favor tiers** (source of truth for the prettifier; export key → display, in rank order): Despised → "Despised", Hated → "Hated", Disliked → "Disliked", Tolerated → "Tolerated", Neutral → "Neutral", Comfortable → "Comfortable", Friends → "Friends", CloseFriends → "Close Friends", BestFriends → "Best Friends", LikeFamily → "Like Family", SoulMates → "Soul Mates". The live export uses nine of them (Hated through SoulMates); Despised and Disliked come from the server's `FAVOR_ORDER`. An unknown key is shown with spaces inserted before capitals.

**Format rules.**
- Sentence case everywhere except window tabs.
- Menu paths with " → ": "VIP menu → Export Storage JSON". Settings paths: "Settings → GUI → Log All Chat". The way into the VIP menu itself is not stated in UI copy until verified in game (README says "Settings → VIP"; unverified).
- Ages: "just now", "4 min ago", "8 h ago", "3 d ago". Times local 24 h "00:56". Dates "23 Oct". Durations "1 d 15 h", "26 min". UTC values are converted before display.
- Numbers are full figures with separators everywhere, as the game writes counts ("47,702"): findings, toasts, notifications, margin notes. `short()` (`12.3k`) appears only in a column whose header says so.
- Plurals always agree ("1 vendor", "2 vendors"). No dangling joins ("spent , 11,489", "qty 9 ·"). Every right-hand figure on a phone row has its label ("30 free").
- No em dashes in UI copy; use a full stop, a colon or " · ".
- Prettified names: no raw keys ("Red Wing Tokens", not "Redwingtokens"; "Anatomy: Fungoids", not "Anatomy_Fungoids"; "Account: Casino" for account storage; stats as readable labels with the raw key in a tooltip).
- File sizes read in B / KB / MB (decimal) with one decimal ("7.2 MB", "91.7 KB", "157 B"); the exact byte count sits in the tooltip and the Open raw label carries the rounded size.
- Inside the JSON tree, keys and values are the file's own text: no separators, no prettified keys, no status colour (the inspector quotes the file). The chrome around the tree (counts, footers, section rows, the finding) keeps every voice rule.

**Exact fix wording** (one source of truth; `fixKey` → text, `{alt}` filled from `fixArgs`). Paths marked "verify" must be checked in game before shipping.

| fixKey | While logged in | While logged out or game closed |
|---|---|---|
| export-character | "VIP menu → Export Character JSON" | "Next time you're in game: VIP menu → Export Character JSON, while fully logged in" |
| export-storage | "VIP menu → Export Storage JSON" | "Next time you're in game: VIP menu → Export Storage JSON" |
| export-again | "Export again while fully logged in, not right before logout: VIP menu → Export Character JSON" | "Next time you're in game: VIP menu → Export Character JSON, while fully logged in" |
| chat-logging | "Settings → GUI → Log All Chat" | same |
| chat-logging-ok | "If it ever stops: Settings → GUI → Log All Chat" | same |
| vault-size | "Check the size in game, then type it in the Slots column on Storage" ("on Storage" dropped on the Storage view). With no storage export there is no Slots column yet, so the same text starts "After a storage export: check the size in game, …" (plaque: "After a storage export: check it in game, then enter it in the Slots column"). | same |
| alt-export | "Next time you play {alt}: VIP menu → Export Character JSON and Export Storage JSON" | same |
| auto-export | "Nothing to do. [verify in game: the setting behind `AutoExportCharacterOnLogout`] if you'd rather not get the twin." | same |
| combat-logging | "Combat logging settings in game (names not verified yet). Deaths still count; kills and killers need it."; on the Combat view: "Combat logging settings in game (names not verified yet). The meter needs every combat log category fully on." ([verify in game] rule: no menu path, no raw keys; the server evidence may name the keys) | same |
| player-log | "Nothing to do. Exports cover it." | same |
| vip | "[verify in game: renew VIP] Exports need VIP" | same |
| server | "Start it again: python3 server.py" | same |

Timing words for the right moment: "After selling:", "After storing:", "Before you log out:", "Next time you're in game:".

**Examples.**
- Findings: "Vendors can still pay you **1,589,320** councils. Biggest refill next: Helena Veilmoor gets **71,197** back in 1 d 15 h." / "**637** slots free. Otis, Qatik and Tavilak are full." / "Mycology is **1,240 XP** from level 61." (names in tan, numbers in tan bold)
- Stale suffix: "These are from a character export 3 days old." (singular at one unit: "1 day old", "1 hour old"; `ageLong()` in `app.js`).
- Evidence: "You received councils 3 times since it, not counting Gaming wins, so vendor room is lower than shown." (never "sold": the source of a receipt is not in the log) / "Since then you visited Casino and Serbule, where your vaults are." / Fallback: "Activity since export: not checked."
- Partial twin (info): "Your logout export wrote a partial twin 1 s after the good one. It's ignored; the good one is in use."
- Partial alone (bad): "That export came out a bit… partial (name "???"). Export again while fully logged in."
- Alt missing (info): "Boomchew logged in 5 times since 12 Oct and has no exports yet."
- Confirmation: "[Status] Storage export of 21:30 loaded. 637 slots free." / warn line (amber, triangle, no tag): "Nothing new since 00:56. In game: VIP menu → Export Storage JSON, then check again."
- Positive: "Kib reset: 60,000 councils available again."
- Empty: "No level-ups yet today. Trainers don't keep office hours, so neither does this list." / "Nothing looted yet. Loot shows up here as soon as it lands in your bags." / "No councils in or out today. What comes in is written to the chat log; what you spend never is." / "No vendors match "gem". Try the item type, like Gem or Crystal." / "A quiet one: no experience since 00:30."
- Error: "Couldn't load storage. Last good at 08:51. Retry"

## Accessibility

- WCAG 2.2 AA contrast in both themes (see Colors). Non-text boundaries (inputs, focus ring, status shapes, bars, slot cells) at 3:1 or more on the surface they actually sit on, including the pane and selected rows.
- Status never by colour alone (shape plus word); chart values available as text (tooltip content mirrored in a visually hidden table for the XP chart).
- Landmarks: `header`, `nav aria-label="Views"`, `main`, `aside aria-label="Where these numbers come from"`. One h1 per view; window titles are h2. The Reminders panel is a non-modal `dialog` with `aria-labelledby` its title.
- Keyboard: every control reachable in order; visible focus ring by surface (Inputs → Focus); tabs with arrow keys; sortable headers are buttons inside `<th>` with `aria-sort`; area bars and goods chips are buttons with `aria-pressed`; `/` focuses search, Esc clears or closes; the JSON tree is a WAI-ARIA tree with one roving tab stop and the full arrow / Home / End / Enter / Space / `*` / type-ahead map (Components → JSON tree).
- Live regions: system line `aria-live="polite"`; toasts polite; the chat log `role="log"` without live announcement; bad-severity changes announced once.
- Touch targets 44 px on a phone (chips get a 28 px visual with a 44 px hit area).
- 13 px minimum text; layouts survive 200% zoom and 400% reflow at 320 px.
- `prefers-reduced-motion` honoured; `prefers-color-scheme` drives Auto.
- Icons decorative when labelled; coin `aria-hidden`; status shapes have `role="img"` with an `aria-label` ("Stale").
- `lang="en"`; `<title>` reflects the view and the badge, one format: "(2) Vendors · Gorgon Notes" (Data health → Other channels).

## Views

Every view: title row (h1, finding, stamp, Check again), preview notice and system line slots, the At a glance window, the view's windows, and the margin filtered for that view.

**Gates for each view:** from the project root, `node ~/.claude/skills/taste-skill/scripts/lint.mjs --app static/index.html` and `node ~/.claude/skills/taste-skill/scripts/inspect.mjs http://127.0.0.1:8787/#<view> --app --out design/shots/gate/<view>` at 1440, 768 and 390, in both themes, in `?shift=72` and in each `?sim=` state (`stale`, `broken`, `nolog`, `noexport`, `loading`, `down`; Preview modes): 0 FAIL, every WARN argued in writing. The out directory must stay outside `.taste-skill/app/`: inspect reads `<out>/../direction.json`, and the app direction there deals Public Sans. That direction now has `input.keep: ["type"]`, so even if it is read, Carlito does not raise `font-not-dealt`.

### Window footers
Every window's footer, written out. Left = source and age; right = when to act and the fix. `{age}` follows the source's severity (amber triangle and amber text when warn, red square when bad, plain `text-dim` when ok); `{fix}` is the `fixKey` text for the player's state (Voice → Exact fix wording), shown on the right when the source is warn or bad, and as the quiet "To refresh: …" form when ok. "Live" wording for the chat log: logged in and written in the last 15 min → "Chat log · live · last line 21:14"; logged in and silent → "Chat log · silent since 20:58" (amber); logged out → "Chat log · last line 00:56 · logged out"; missing → "Chat log · missing" (red). A server-down state replaces every left side with "as of 21:14 · server not answering" (red). An old server adds the right-side note given in the table.

| View | Window | Left | Right |
|---|---|---|---|
| Session | At a glance | chat log (live wording) · "today" or "this login" | chat log `{fix}` when warn/bad, else nothing |
| Session | Here | "Character export · {age} · Storage export · {age}" (no chat log: chat log live wording) | the missing export's `{fix}` first, bare like Vendors and Storage ("VIP menu → Export Character JSON": nothing was sold, so no timing word), else the stale one, storage first ("After storing: VIP menu → Export Storage JSON", "After selling: VIP menu → Export Character JSON"); logged out drops "After storing:" for the "Next time you're in game:" form; no chat log: chat log `{fix}` |
| Session | Experience | chat log (live wording) | "Logging: Settings → GUI → Log All Chat" |
| Session | XP by skill | chat log (live wording) · "today" or "this login" | chat log `{fix}` when warn/bad |
| Session | Level-ups | chat log (live wording) · "today" | chat log `{fix}` when warn/bad |
| Session | Loot | chat log (live wording) · "38 distinct items" | chat log `{fix}` when warn/bad |
| Session | Chat log | the log file name ("Chat-26-10-23.log") · live wording | "Showing 6 of 14 channels" |
| Session | What happened | chat log (live wording) · "today" | old server: "Logins, logouts, exports and deaths need a newer server.py" |
| Session | Councils | chat log (live wording) · "today" or "this login" | chat log `{fix}` when warn/bad; old server: "Councils need a newer server.py" (the export balance's age and fix are in the body note, so the footer never carries two sources) |
| Session | Combat | chat log (live wording) · "today" or "this login" | chat log `{fix}` when warn/bad, else the `combat-logging` fix when that verdict is info **and** its `views` lists `session` (the server's listing decision; the LogNonAttacks-only case is folded, so it shows no fix); old server: "Combat needs a newer server.py" |
| Combat | At a glance | chat log (live wording) · "today" or "this login" | chat log `{fix}` when warn/bad, else the `combat-logging` fix (Combat wording) when that verdict is info and its `views` lists `combat`; old server: "The DPS meter needs a newer server.py" |
| Combat | Fights | chat log (live wording) · "last combat line 18:43" · "today" or "this login" | same as At a glance |
| Combat | Breakdown | chat log (live wording) | the standing limit: "Party members' hits aren't in your log; the Party window below puts their copies' numbers beside yours."; no chat log: chat log `{fix}` |
| Vendors | At a glance | "Character export · {age}" plus " · Slots Free from storage export · {age}" when shown | worst of the two `{fix}`s ("After selling: VIP menu → Export Character JSON") |
| Vendors | Where to sell | "Character export · {age}" | "After selling: VIP menu → Export Character JSON" |
| Vendors | What they buy | "Character export · {age} · types from game data v488" | "After selling: VIP menu → Export Character JSON" |
| Vendors | Vendors | "Character export · {age} · caps from game data v488" | "After selling: VIP menu → Export Character JSON"; old server adds "Resets since the export need a newer server.py" |
| Storage | At a glance | "Storage export · {age}" | "After storing: VIP menu → Export Storage JSON" |
| Storage | Where there's room | "Storage export · {age}" | "After storing: VIP menu → Export Storage JSON" |
| Storage | Vaults | "Storage export · {age} · sizes from your favor in the character export of 23 Oct" | "After storing: VIP menu → Export Storage JSON" |
| Storage | Stacks to merge | "Storage export · {age} · stack sizes from game data v488" | "After moving things: VIP menu → Export Storage JSON"; old server: "Stacks to merge need a newer server.py" |
| Storage | Items | "Storage export of 23 Oct 00:49 · {age}" (the picked file; "(older, picked)" when not newest) | "After storing: VIP menu → Export Storage JSON"; older picked: "Show newest" text button |
| Character | At a glance | "Character export · {age}" | "VIP menu → Export Character JSON" (`{fix}` form) |
| Character | Skills | "Character export of 23 Oct 00:56 · {age}" | "VIP menu → Export Character JSON" (`{fix}` form) |
| Character | Currencies | "Character export · {age}" | "VIP menu → Export Character JSON" (`{fix}` form) |
| Character | Stats | "Character export · {age} · 62 stats" | "VIP menu → Export Character JSON" (`{fix}` form) |
| Character | NPC favor | "Character export · {age} · 322 NPCs" | "Favor changes as you play; export to update" |
| Character | Active quests | "Character export · {age} · names from game data v488" | "VIP menu → Export Character JSON" (`{fix}` form) |
| Files | Files | "Reports/, capacity.json, cache/v488 · listed 09:12" (`listedAt`) | the worst listed export source's `{fix}` with its timing word ("After selling: VIP menu → Export Character JSON", bare when missing), else "To refresh: VIP menu → Export Character JSON or Export Storage JSON"; old server: "Files need a newer server.py" |
| Files | Contents | per the open file (Views → Files → Contents footer): "Character export of 24 Oct 00:02 · {age} · 91.7 KB", "Storage export of 22 Apr 19:48 · 6 months ago · superseded by the one of 23 Oct 00:56", red "Character export of 24 Oct 00:02 · partial · ignored by the other views", "Character export of Faechew · 22 Apr 19:56 · 184 d ago", "Vault sizes · capacity.json · saved 23 Oct 11:33 · 6 vaults · typed in by you", "Game data v488 · items.json · fetched 23 Oct 09:52 · 7.2 MB"; nothing open "No file open"; loading "Reading Character_Robchew_Arisetsu.json · 91.7 KB…"; invalid "Not valid JSON · saved … · 91.7 KB" (red) | in-use export: its `{fix}` ("After selling:" / "After storing:"); superseded: "Show newest" text button; partial: `export-again` in `txt-bad`; alt: `alt-export` with `{alt}`; capacity.json: "To change a size: Storage → Slots column" (link); game data: "Refreshes itself when the game patches", cdn info: the verdict's evidence, cdn bad: red "CDN unreachable, showing the cached v488"; invalid: the export fix or "Nothing in the app reads it."; old server: "Files need a newer server.py" |
| all | Margin | "Checked 21:14 · by the server" or "· in the browser (some checks skipped)" | "Reminders" text button |
| all | Reminders panel | "Settings live in this browser only." ("in this app" in the Mac app) | nothing |

No export, No chat log and Loading states use the footers given in those states.

### Shell (all views)
- Identity: mark, "Gorgon Notes" with the fan-made line, character and server from the last "Logged In As" line (falls back to the newest older log after midnight).
- **Character select** (shown when exports exist for more than one character). What it drives:
  | Surface | Effect of the selected character |
  |---|---|
  | Vendors, Storage | `?character=` on `/api/vendors` and `/api/storage` |
  | `/api/health` | `?character=`; exports and activity are judged for that character; alts listed regardless |
  | Character export picker | lists only the selected character's exports; partial files (no name) are listed under the character who was logged in when they were saved (from `events`), else under every character |
  | Storage → Items export picker | lists only the selected character's storage exports |
  | Session | **not filtered**: the chat log follows whoever is logged in. When that is not the selected character, an info line under the Session title row says "The chat log follows Robchew, who is logged in. Other views show Faechew." |
  Default: the logged-in character. Remembered in `pgdash.character` (never in `pgdash.xpScope`, which is the Session XP scope).
- Location line: "Casino (logged in)" / "Casino (logged out 00:56)" / "No area yet today", from `/api/session` `loggedIn`, `currentArea`, `loggedOutAt` (fixes the old "live after logout" bug). Old server: falls back to `live` and shows "Casino" with no state.
- Health summary pill, theme control (Inputs → Theme control, `pgdash.theme`), "Reminders" button.
- Rail / bottom tab bar with status marks; hash routes `#session #combat #vendors #storage #character #files`, hash updated on click, `hashchange` honoured, remembered tab when no hash. A view may carry sub-state after `?` (`#files?f=<id>&p=<pointer>`): the router (`route()`) splits on `?` and views compare on the part before it; `go(view)` and the boot path use the same split.
- Polling: tail 2 s (a "Saved report to" line triggers a re-read 1.5 s later, a health check and a confirmation), session and health 30 s, reports, vendors and storage 60 s. Refresh preserves selected export, filters, sort, open areas, scroll and any focused input.
- **localStorage** (every read and write in try/catch; an unreadable or malformed value falls back to its default; nothing here is required for the page to render). The complete list:
  | Key | Value shape | Default |
  |---|---|---|
  | `pgdash.tab` | `"session" \| "vendors" \| "storage" \| "character" \| "files"` | `"session"` |
  | `pgdash.file` | the last opened file id string, e.g. `"reports/Character_Robchew_Arisetsu.json"` | absent → the newest valid character export of the selected character; a saved id no longer listed falls back the same way |
  | `pgdash.character` | character name string, e.g. `"Robchew"` | absent → the logged-in character |
  | `pgdash.xpScope` | `"day" \| "login"` (Session TODAY / THIS LOGIN) | `"day"` |
  | `pgdash.chans` | JSON array of enabled channel names | `["Status","Guild","Nearby","Error","System"]` |
  | `pgdash.theme` | `"auto" \| "dark" \| "daylight"` | `"auto"` |
  | `pgdash.open` | JSON object, table id → array of open area names, e.g. `{"vendors":["Serbule","Casino"],"vaults":["Serbule"]}` | absent → the defaults per view (Vendors: four richest open; Vaults: all open) |
  | `pgdash.sort` | JSON object, table id → `{ "key": "<column>", "dir": "asc" \| "desc" }`; table ids `vendors`, `vaults`, `items`, `loot`, `skills`, `favor` | absent → each table's stated default |
  | `pgdash.reminders.v1` | Reminders panel → Storage | as there |
  | `pgdash.migrated` | `1` once the migration below has run | absent |
  **Migration** (runs once on first load, when `pgdash.migrated` is absent): the old unprefixed keys from the POC (app-inventory §1) are copied, never discarded silently: `tab` → `pgdash.tab`, `scope` → `pgdash.xpScope` (`day`/`login`; the old key never held a character), `chans` → `pgdash.chans` (the player's channel picks survive; `[Item: …]`-style names created by the old channel bug are dropped). The old keys are then removed and `pgdash.migrated` is set to 1. A value that fails validation is skipped, and its default is used.
- Tab title badge and favicon.
- **About popover** (from the rail foot): the fan-made line, then "Where the data comes from", a static list: "VIP exports in Reports/ (Character and Storage JSON)", "Chat logs in ChatLogs/ (Settings → GUI → Log All Chat)", "Game data from cdn.projectgorgon.com, version 488", "GorgonSettings.txt for logging settings", "Player.log: no live inventory events on Mac" (the version and the last line come from `/api/health`; when it is missing those two lines read "unknown"). The list keeps its five lines; the exports line links to Files ("Inspect the files" → `#files`, closing the popover). No other content.

### Session (`#session`)
**Question:** what did this session earn, and where did I go?
- **Finding:** "**1,460 XP** in 2 h 10 min, mostly Mycology. **2** level-ups, latest Mycology **61**." Zero day: "A quiet one: no experience since 00:30. 26 min across 7 zone changes, mostly in Casino." When the character died in scope, both forms end with one more sentence: "Died once, killed by Dread Pixie in Statehelm." / "Died once, to indirect damage in Statehelm." / "Died twice, last killed by Fae Worg in Kur Caves." / "Died 5 times, last …" (" in …" omitted when the area is unknown; no bold, the lead figure stays XP).
- **Stamp:** "Live from today's chat log" / "last line 21:14" (amber if logged in and silent for 15 min).
- **At a glance** (nonzero only): XP (lead, sub-line "540 XP/hr"), Time ("2 h 10 min", "since 19:04"), Level-ups ("latest: Mycology 61"), Items looted ("38 distinct").
- **Windows:**
  0. **Here: <zone>** (added 2026-10-23; "Last zone: X" when logged out, "Next door: X" while peeking): from `GET /api/zone`. At a glance row: Councils left here (lead, coin), Slots Free here, Next refill here (soonest vendor reset, "Tavilak, +759"). Plain table NPC / Favor / Councils left / Storage: name with "Buys …" and other services, "Loves …" (top 3 gift loves) and the player's note as dim sub-lines; councils "of 50,000 · refills 1 d 3 h"; storage "18 free / 30 of 48 used". Vendors and vaults lead (most councils, then most free); trainers, barter and others fold behind "Show N more NPCs (trainers, barter and others)". Non-NPC chests in the zone (transfer chests) are rows too. Then "N more NPCs here you haven't met yet." and "Next door:" links (adjacent areas with councils/slots; click to peek, "Back to <zone>" in the title bar). Empty: "Nobody here you've met, and none of your storage. Quiet place." Footer: both export ages; fix from whichever export is stale ("After storing:" / "After selling:"). Phone: name + councils (or slots for vault-only rows), dim line "Best Friends · 29,623 councils left · 18 slots free".
     Browser check 24 Oct (additive rules): "here" in the At a glance labels, the empty line and the unmet line becomes "there" while peeking or logged out ("Councils left there"); labels are sentence case ("Slots free here"). The footer fix names the missing export first (`character-export` bad with no age → the bare "VIP menu → Export Character JSON", matching the body's "Needs the character export…" and the Vendors and Storage missing states), else whichever is stale, storage first, with its timing word ("After storing:" / "After selling:"). The "Councils left here" and "Slots free here" labels carry the age mark of their export when it is warn or bad (amber triangle + "3 d old", red square + "missing"), the same `ageMarkOf` as Vendors At a glance. States, in this order: no chat log → title "Here", `Needs the chat log.`, footer `chatLive()` + chat-log fix (like XP by skill; the window hides only when the log is read but names no area today); `/api/zone` failed → the error block like Vendors and Storage (red square, "Couldn't load this zone. Last good at HH:MM." plus Retry; the repr goes to the console, never into copy) with the footer; loading → "Reading where you are…" ("Reading <area>…" while peeking); `matched: false` → "Don't know <em>Khyrulek's Crypt</em> yet: it isn't in game data v488."; `guessed` → dim line under the figures "The chat log only says <em>Caves</em>, so this is a guess: <em>Caves Under Serbule</em>." Vendors with no buy list in game data show "Buys: see in game"; a chest row's phone line skips the slots (the figure cell has them); counts use `plural` ("1 council left"). "Next door:" neighbours are no-wrap units (`.zadj`: separator, link, figures) so a phone never splits a name from its figures. Phone folds vendor rows past the top 8 into the same "Show N more NPCs" control ("Show fewer" to collapse); desktop folds only non-vendor rows. Focus: a "Next door" or "Back to …" click moves focus to the window title (`tabindex="-1"`) at once and to "Back to <zone>" when the peek has loaded, never to `<body>`. Leftovers pass 24 Oct: "Next door" figures are full ("🪙222,692 · 40 slots", never `short()`); the phone row's key figure carries its label ("🪙 24,125 left", `m-only`, as in Vendors); a zone whose met NPCs all fold (no vendor, no vault) shows no table, only "No vendors or storage of yours here. Orrrilund is here but buys and stores nothing." (names up to 3, else "4 NPCs you've met are here but buy and store nothing") and the "Show N more NPCs" link, which then opens the table.
  1. **Experience** (primary window, centred title, notch): TODAY / THIS LOGIN tabs (persisted in `pgdash.xpScope`), cumulative XP chart with hover; zero collapse. Footer: "Chat log · live" / "Logging: Settings → GUI → Log All Chat".
  2. **XP by skill**: bar list, skill name, bar, XP and XP/hr right-aligned; exact XP in the tooltip. Empty: "No XP yet."
  3. **Level-ups**: newest first, "Mycology **61**" and time. Empty: "No level-ups yet today. Trainers don't keep office hours, so neither does this list."
  4. **Loot**: plain table Item / Count with 24 px icons (from `/api/icons?names=`), search, sortable by both columns, aggregated by item. Empty: "Nothing looted yet. Loot shows up here as soon as it lands in your bags."
  5. **Chat log**: channel chips (all channels seen today, with whole-log counts, persisted), feed and channel rules above.
  6. **What happened**: login, areas with times (the old "Areas visited"), level-ups, exports, deaths, logout, from `events`. Death rows (24 Oct): "Killed by <em>Dread Pixie</em> (Pixie Slash) in <em>Statehelm</em>" (ability through `pretty()`, omitted when the game printed none), "Died to indirect damage in <em>Statehelm</em>" (the game logs no source for DoTs, weather or falls, so none is guessed), another character's death at midnight rollover is prefixed with its name ("<em>Faechew</em> killed by …"), and corpse hits add the dim suffix "hit 3 more times while down" when `hits > 1`. Names and areas in `em.t` only; no shape, no red. Old server: areas and level-ups only, footer "Logins, logouts, exports and deaths need a newer server.py".
  7. **Councils** (added 24 Oct; secondary window in one `grid2` with Combat, Councils left, after the XP by skill / Level-ups pair and before Loot / What happened): a `.glance nolead` block of exactly four figures laid out 2×2 at every width (the window is half a `grid2` column, where four nowrap cells never fit one row; no rule lines, sub-lines wrap), each with the coin: Received (lead; sub-line "received 240 times · 226 with Gaming XP", or "none yet"), Stolen ("11 thefts · Ratkin Mugger and Dung Rat Gang Thief" / "none yet"), Recovered ("4 thefts undone" / "none yet" / "nothing to recover" when nothing was stolen), Net (`received − stolen + recovered`, a minus sign when negative; sub-line "received, less stolen, plus recovered"). Then the spending note, always: "Spending isn't written to the chat log, so this is what came in, not what's left. On hand at the character export of 24 Oct 00:02: 🪙 45,789." The balance is `onHand`, the export of the character who owns the events in scope; the sentence names the owner whenever that is not simply the selected character with every event theirs: "Robchew's balance at the character export of 24 Oct 00:02: 🪙 45,789." (the main's thefts on a day that ended on an alt, rows "as Robchew"), and without an export "A character export of Robchew would show what's on hand: {fix}". The balance is a second source, so its freshness lives in this sentence, never in the footer: when its owner is the selected character, the `character-export` verdict decides (warn → amber triangle, "2 d old · {fix}" with `export-character` wording for the player's state; bad with no age → "A character export would show what's on hand: {fix}"); for an alt the age is compared with the `character-export` threshold. Then, only when the game wrote them, "The game also wrote 5 errors: a corpse overburdened with 1,334 councils taken from Woltlump and 1 victim. Not counted above." (literal; what the error means is unverified). Then a newest-first `.list.feed-what`, 10 rows then "Show all 19" / "Show the first 10" (not persisted): "<em>Ratkin Mugger</em> stole <em>291</em>", "Recovered <em>346</em> from <em>Ratkin Mugger</em>", "Received <em>19</em>" (dim "with Gaming XP" when next to a Gaming XP line), "Corpse overburdened with <em>205</em> taken from <em>1 victim</em> [not counted] ×2" (identical same-second repeats fold), and 3+ consecutive Gaming receipts fold into "With Gaming XP: <em>4,215</em>, 34 times from 14:05 to 14:17" timed at the last one; a row by another character gets the dim suffix "as Faechew". No receipt is ever called a sale (the source of the 33,250 receipts is unverified). Quiet state (`.quiet`, no footer) with no councils event in scope: "No councils in or out today. What comes in is written to the chat log; what you spend never is." Loading "Reading the chat log…"; no chat log "Needs the chat log."; old server (no `councils`) "Needs a newer server.py." with footer right "Councils need a newer server.py". Follows the TODAY / THIS LOGIN scope. Phone: the same 2×2 (`nolead` cancels the lead span).
  8. **Combat** (added 24 Oct; secondary window beside Councils, Councils left): a `.glance` row with exactly two figures, Deaths (lead; sub-line "latest: Dread Pixie 22:21", or "latest: indirect damage 22:10", or with no deaths "1 close call, no deaths" / "none yet") and Kills (sub-line "123 by your pets" or "none yet"), then one dim line "Last 31 days: 56 deaths · 449 kills · 1,006 by your pets · 15 days of logs" (`#s-combat-31`, hidden when `combat31d` is missing or has 0 days). Quiet state (`.quiet`, no footer, like XP by skill) when deaths, kills, pet kills and close calls are all 0 in scope: "No deaths or kills today. Last 31 days: 56 deaths · 449 kills." (second sentence omitted without `combat31d`). Loading "Reading the chat log…"; no chat log "Needs the chat log."; old server (no `combat`) "Needs a newer server.py." with footer right "Combat needs a newer server.py". Footer per Window footers. Follows the TODAY / THIS LOGIN scope. "You evaded death!" is a close call, never a death, even though the game prints a Dying XP line 0 to 5 s after about half of them (16 of 35 in the logs); a FATALITY line right after an evade is still a death.
- Layout ≥ 1180: At a glance, then Here, then Experience full main width; XP by skill beside Level-ups; Councils beside Combat; Loot beside What happened; Chat log full width. Phone order: At a glance, Here, Experience, XP by skill, Level-ups, Councils, Combat, Loot, Chat log, What happened.
- **No chat log** (`chat-log` bad, or `?sim=nolog`): h1 "Session"; finding "No chat log to read, so there's no session to show. Turn on chat logging and this fills in as you play."; stamp line 1 "No chat log found", line 2 the red square and "missing"; the At a glance window is hidden; the Experience window shows the empty sentence and, in its body, the fix plaque "Log All Chat" / "In game: Settings → GUI → Log All Chat"; every other Session window shows its title, the line "Needs the chat log." and its footer "Chat log · missing". When `LogChat 0` is known, the finding reads "Chat logging is off in the game, so there's no session to show." The margin lists `chat-log` as bad; its plaque collapses to the one-line fix there, because the Experience window already shows it (one plaque per view).
- **Margin sources:** chat log; game state; partial export if present; character and storage exports fold into "Also checked" unless warn/bad.
- **Out of scope for this design** (data exists, not built): councils spent (not in the chat log; the "Purchased … Total cost" and "coins" lines name no currency, see DATA-SOURCES), Combat Wisdom, corpse actions, work orders picked up, joined chat rooms, recipe cooldown errors, `Books/` (quest notices, guild MOTD, raffle wins and other in-game letters). No placeholder windows are drawn for them.

### Combat (`#combat`)
**Question:** how hard am I hitting, fight by fight? Added 24 Oct (docs/DPS-FEASIBILITY.md). Personal only: the game logs your hits and your pets', never a party member's, and every surface says so.
- **Source:** `GET /api/combat?scope=day|login`, polled every 2 s while the view is open (the meter follows the live log; `combatRound()`), once on opening the view, and in the first round when the page opens on it. The TODAY / THIS LOGIN tabs share `S.scope` / `pgdash.xpScope` with Session. The Fights window's footer ends with "Open the log" (`#files?f=logs%2F<c.log>`, 25 Oct), the file the meter is reading, in Files.
- **Finding:** in a fight (`now.inFight`, live log and direct damage within the last 15 s): "Fighting now: **229** damage a second over 7 s against *Skeleton Assassin* and 5 others. *Cardi Bee* is doing 70% of it." (the pet sentence only when pets out-damage you). Otherwise: "**256,014** damage in 39 fights today, **185** a second while fighting. Best: **615** a second at 17:56, over 21 s. Your pets did 61% of it. Died 6 times." (best = the highest per-second closed fight of 15 s or more; the pet and death sentences only when nonzero). Zero: "No fights today. The meter starts with your first hit."
- **Stamp:** the chat-log stamp (`chatStamp()`), as on Session.
- **At a glance:** lead "Per second now" (`fmt(now.dps)` + `/s` in the `unit` style, sub "this fight · 42 s · last 10 s: 160/s") or "Per second, last fight" (sub "18:42 · 2 s", or "none yet"); Damage (sub "you 39% · pets 61%"); Fights (sub "23 min 3 s fighting · 185/s over it"); then only when nonzero: Kills (sub "107 by your pets" / "all yours"), Damage taken (sub "6 deaths, 2 to a kill mechanic" / "no deaths"). Loading: three loading bars.
- **Fights** (primary window, centred title, count, TODAY / THIS LOGIN tabs): khaki pane, columns Time (the "now" tag chip on the live fight) / Length ("42 s", "3 min 12 s", `secs()`) / Damage / Per second (bold) / You / Pets / Kills / Fought (top target by damage, "+4 more"; a fight with no damage dealt reads "Swamp Viper · took 1,080"). Sortable (`pgdash.sort.fights`, default Time newest first); rows selectable (click, Enter, Space; `data-fight`); grand row "Total · 37 fights" with damage, per second over the shown fights, you, pets, kills. Skirmishes (under 5 s **and** 500 damage, `minor`) fold behind the pane-under link "Show 2 skirmishes under 5 s and 500 damage" (`data-dminor`); a live fight never folds. Quiet (`.quiet`) with "No fights today. The first hit you land or take opens one; 15 s without damage closes it." Phone: time + top target, bold per second with "/s", dim line "42 s · 12,345 damage · 3 kills · 1 death"; the total row shows its label and "255,815 damage · 23 min fighting".
- **Breakdown** (secondary window; title count "18:42, now · 2 s · Underneath Serbule"; tools: "Copy for Discord", "Copy" on a phone): the picked fight, else the live one, else the newest (picking the newest resumes following it; `dUI.pinned`). A `.glance` row: You (lead; "559/s · 1 hit · 12% crit"), Pets ("244/s · 30% of the fight"), Taken ("your pets took 1,234" / "312 of it indirect" / "5 hits"), Kills, Deaths ("to a kill mechanic"), zeros omitted. Then the **damage a second** chart (Data visualisation), then a `grid2` (stacked under 768): **By ability** bar list, "Cardi Bee · " dim prefix for a pet's ability, bar relative to the top row, "1,118 1 hit" right, the tooltip "Bee Stab: 25 hits · 1 crit (4%) · biggest 3,011 · 19,036 health + 6,210 armor · 2 for nothing · 14 killing blows · seen as Bee Stab"; **What hit you** list, enemy + dim ability, damage and hits, a "kill mechanic" tag chip for a one-hit kill (Face of Death's FaceOfDeathKill, 999,451 health: counted as a death, never as damage taken), and an "Indirect (DoTs, falls, weather)" row; empty "Nothing hit you." / "Nothing landed.". Then the dim note "Indirect damage on what you fought, source not logged: 1,366. Nobody else was logged nearby, so it's your DoTs or your pets'. It isn't counted above." (or "Icebrg was nearby, so some of it may be theirs." / "There was party chat during the fight, so some of it may be your party's.").
- **Copy for Discord** (`discordText()`): plain text, full figures: "Robchew · 24 Oct 18:35 · Underneath Serbule · 2 min 1 s / Damage 30,707 (254/s) · you 9,508 (79/s) · Cardi Bee 21,199 (175/s) / Kills 30 (21 by pets) · taken 666 · deaths 0 · fought Skeleton Assassin +5 / Top: Cardi Bee Bee Stab 19,036 · Dampen 6,857 · … / Indirect on targets, source not logged: 1,366 / From Robchew's chat log via Gorgon Notes. Party members' hits aren't in it." Confirmation `[Status] Copied the fight for Discord.`
- **Follow note** as on Session when the chat log's character is not the selected one: "… This meter is Robchew's."
- **No chat log:** finding "No chat log to read, so there's nothing to measure. Turn on chat logging and the meter starts with your first hit." (LogChat 0 known: "Chat logging is off in the game, so there's nothing to measure."), stamp "No chat log found" / "missing", At a glance hidden, Fights and Breakdown "Needs the chat log." with the chat-log fix in the footers, tabs disabled. **Old server** (no `/api/combat`, 404): finding "The DPS meter needs a newer server.py.", both windows "Needs a newer server.py.".
- **Margin sources:** chat log (its verdicts list `combat`); combat logging when info for the meter; the rest fold.
- **Party** (secondary window under Breakdown, added 25 Oct, polished after the critique the same night; `docs/SHARING.md`; `GET/POST /api/party`, polled every 10 s while the view is open, `loadParty()` in every fifth `combatRound`): fights shared with the party over an ntfy.sh topic named by a **party code** (`gn-` + 12 letters or digits, no 0/o/1/l/i). Title tools: ghost button "New code" (makes a code, joins it, copies it). Toolbar: the code field (`#pcode`, monospace, 20ch, placeholder "gn-…", no length limit, full width on a phone), "Join" (submit), and once joined "Copy code", "Leave" and the **state line** (`#d-pstate`, `small` dim, `aria-live`, its own row on a phone). **Feedback stays in the window:** the state line carries the game's tags, `[Status]` in `status-peach` for confirmations ("Joined gn-… and copied it. Paste it into party chat.", "Copied. Paste it into party chat.", "Left gn-…. Undo", "Back in gn-…") and `[Error]` in `error-red` for failures ("A code looks like gn- and 12 letters or digits.", "Couldn't reach the clipboard. The code is gn-…", "The server didn't answer; try again."), the field getting `aria-invalid` + `aria-describedby`; plain "joined 21:32" otherwise; an error clears on the next keystroke. **Paste joins:** the code is pulled out of whatever is typed or pasted (`/gn-[a-z0-9]{12}/i`, so the whole "[Party] Robchew: gn-…" chat line works) and a pasted code joins without pressing Join. **Leave** is undoable: "[Status] Left gn-…" with an "Undo" text button for 30 s (the server keeps the record of what was posted, so an undo posts nothing twice). **Not joined:** `empty` copy "Share fights with your party. One of you presses New code and pastes it into party chat; the others paste the code here (the whole chat line is fine) and press Join. Your last three fights and every one that closes from then on are shared, and everyone's shows up here side by side." Footer "ntfy.sh · not joined" / "Press New code, or paste a code from party chat. Fight numbers and character names go to ntfy.sh; anyone with the code can read them" (the privacy fact before the act). **Joined, nothing yet:** "Joined at 21:32. Fights that close from now on are sent; the others' arrive within 10 s. Here so far: Icebrg." **Fights** (newest first): one `.party-fight` block per merged fight: a head line (time bold, length, area, "**46,310** damage · 2 players", tag chips "only you so far" / "without you" when one player, "same enemies" when the enemy ids matched across logs) and a `barlist` of players by damage (name in 12em, "you" tag, share bar against the top player, "14,148 · 73/s · 31%"; each row `role="group"` with the full "who: you / pets / kills / deaths / took / top" text as `aria-label` and tooltip). **Shared fights lead:** fights with two or more players are the list, the last 10 of them, then a `pane-under` row with "Show all 23 fights" / "Show the last 10" and "Show 7 fights nobody else was in" / "Hide …" (the solo fights fold behind it); when nothing is shared yet the solo fights are the list. Title count "4 of 23" (shared of all) or the plain count. Footer left "ntfy.sh · gn-… · last message 20:14 · 12 fights sent" (or "nothing received yet"); right: "Fight numbers and character names go to ntfy.sh; anyone with the code can read them", or "3 fights waiting to be sent", or, in the footer's bad treatment (red square, `error-red` text), "ntfy.sh not answering since 20:14; 3 fights waiting, sent when it answers again". **Old server** (404): "Needs a newer Gorgon Notes: this page knows the Party window, the server it talks to does not." (never "server.py": the Windows exe has no such file in sight). No entry in `/api/health` yet: the window's footer is the only data-health surface for the link (ROADMAP).
- **Not built (recorded in ROADMAP):** a Mac HUD overlay, DoT attribution, a `party-sharing` health source, Discord post of a party fight.

### Vendors (`#vendors`)
**Question:** where can I still sell, and how much will each vendor pay?
- **Finding:** "Vendors can still pay you **1,589,320** councils. Biggest refill next: Helena Veilmoor gets **71,197** back in 1 d 15 h." Vaults are never mentioned here. Stale suffix when the character export is warn.
- **Stamp:** "Copied from the character export of 23 Oct, 00:56" / "8 h ago".
- **At a glance:** Councils left (lead, coin, sub-line "across 102 vendors", stale age mark), Drained ("4", "next reset in 3 h" from the soonest `resetsAt` among drained rows; drained = left < 2% of cap), Reset since export ("21", "379,580 back, already counted", from `resetSummary`; hidden when 0 or on an old server), Slots Free ("637" → link to `#storage`, from `/api/storage`, with its own age mark when the storage export is stale).
- **Windows:**
  1. **Where to sell** (area bar list): councils left per area, clickable filter. Footer: character export age and fix.
  2. **What they buy**: goods chips for the 12 item types with the most councils left, with totals; tap filters. Icons from `/api/icons?types=`. **More types** (25 Oct): the row ends in a "73 more types" ghost chip (`chip more`, `aria-expanded`); pressed, a second chip row (`#v-buy-rest`, rule above) lists every other type A to Z with the same look, and the chip reads "Fewer types". Not persisted. A pressed type below the twelve is appended to the first row so the filter stays visible when the rest is folded. The hint under the chips says which rule ordered them ("the first twelve by councils are shown, 73 more behind the button" / "then the rest A to Z").
  3. **Vendors** (primary window, khaki pane): BY AREA / ONE LIST tabs. Toolbar above the pane: search (name, what they buy, **or an item name**), area select, "Hide drained" checkbox, active filter chips. **Search by item** (25 Oct): 3+ characters that name no type word (so "gem" and "skin" filter by the Gem / Skin types alone) are sent, 250 ms after typing stops, to `/api/lookup?item=`; the vendors whose Buys include any returned type join the matches, and a `small` dim note under the toolbar (`#vq-note`) says what the word resolved to: "“figurine” is sold as Artwork (34 items), Antique (7 items) and Vendor Trash (7 items), from game data v488." / "“coin”: 23 items in the game data v488, none with a type vendors buy (Ancient Bronze Coin, …)." when the items carry no vendor word / "No item named “xyzzy” in the game data v488; matching vendor names and types only." A stale answer never filters (the note and the match apply only while the text still equals the looked-up query). Placeholder: "Vendor, what they buy, or an item, e.g. figurine". Columns: Vendor (28 px item-type icon + name; Area appears as its own column in ONE LIST), Favor (tier, plus "Next: Close Friends, 15k, adds Jewelry" from `next.level`, `next.cap`, `next.types`), Buys, Left (coin, bold), Share of cap bar, Cap, Resets ("1 d 15 h" from `resetsAt`, exact local time in the tooltip; when `resetSinceExport`, a "reset" tag chip and "+11,489 back" from `restored`, tooltip "Reset 23 Oct 14:10, after the export"). Left also shows "of 120,000" (Bars → Share-of-cap). All sortable (favor by rank); default Left descending. BY AREA: area sections with Carlito 700 ink headings and subtotals, the four richest open, the rest collapsed with subtotals; grand total over a double rule. **Locked vendors** (cap 0) in a final collapsed section: "Gasu'um · Neutral · opens at Close Friends: 15k, Jewelry". Footer: "Character export · 8 h ago · caps from game data v488" / "After selling: VIP menu → Export Character JSON".
- Phone: rows "Helena Veilmoor · **71,197 left**" with a 48 px share bar, line 2 "of 120,000 · Serbule · Friends · Gem, Jewelry · resets 1 d 15 h".
- **Margin sources:** character export (with sales and favor gained since), partial export, positive reset note, game data; storage export and live game events folded.
- **No export** (`/api/vendors` returns `{ "error": "no character export" }`, `character-export` bad "none for this character", or `?sim=noexport`). Never shown as Error.
  - Finding: "No character export for Robchew yet, so there are no vendor caps to show. Export once and this fills in."
  - Stamp: line 1 "No character export found", line 2 the red square and "missing".
  - At a glance: hidden, except Slots Free when a storage export exists (it links to Storage as usual).
  - Primary window (Vendors): title, notch and toolbar stay (toolbar disabled); the pane is replaced by one sentence in the window body, "Vendor caps come from your favor in the character export.", and the fix plaque "Export Character JSON" / "In game: VIP menu, while fully logged in" (logged out: "Next time you're in game: VIP menu → Export Character JSON, while fully logged in"). Pressing it runs Check again for that source.
  - Where to sell and What they buy show their title, the line "Needs a character export." and their footer.
  - Footer on every Vendors window: "Character export · missing" (red square) / "VIP menu → Export Character JSON".
  - Margin: `character-export` listed as bad with the same plaque (the plaque appears once per view: in the margin it collapses to its one-line fix while the primary window shows it).
- **Out of scope for this design:** routing to adjacent areas (`areas.json` `AdjacentAreas`), `spent` shown as an absolute figure (it is implied by Left and Cap; `spentAtExport` is used only for resets), the raw `npc` key. No placeholder windows.

### Storage (`#storage`)
**Question:** where is there room, and what am I holding?
- **Finding:** "**637** slots free. Otis, Qatik and Tavilak are full. **2** vaults have no known size. Merging split stacks would free **33** more." The merge sentence appears only when a merge frees something and always before the stale suffix. Stale suffix when the storage export is warn.
- **Stamp:** "Copied from the storage export of 23 Oct, 00:49" / "8 h ago".
- **At a glance:** Slots Free (lead, "in 24 vaults"), Full ("3", first names in sub-line), Unknown sizes ("2", "set them below"), By merging ("33", "slots back · 27 items"; same source as Slots Free so it carries the same age mark; only when a merge frees something, never a boxed zero), Vendor value held (coin, "474 stacks").
- **Windows:**
  1. **Where there's room** (area bar list): free slots per area, clickable filter.
  2. **Vaults** (primary window, khaki pane): full vaults first, then by free ascending. Toolbar: search (name and area), "Hide empty, unused vaults". Columns: Vault (name, area in ONE LIST or phone line 2), Favor (tier, "Next: Like Family, 80 slots"), Accepts, Used, Slot strip, Slots (number plus provenance tag: "from favor", "from your stats", "fixed size", "typed in by you"; inline size input when unknown or typed), Free (bold, "Full" word when 0, "?" when unknown), Value held (coin). All sortable. Area sections with free-slot subtotals. Footer: "Storage export · 8 h ago · sizes from your favor in the character export of 23 Oct" / "After storing: VIP menu → Export Storage JSON".
  2b. **Sell and store** (secondary window between Vaults and Stacks to merge, added 26 Oct; `GET /api/plan`): the trip that empties the bags. Title count " · 3 stops". Tab strip BY STOP / BY ITEM in the title bar (not persisted, `sUI.pmode`, default BY STOP). Both panels open with the lead: "Empty your bags in **3** stops: sell **19** stacks to Sir Coth for about **9,321** councils, store **62** stacks in 7 vaults. **26** pieces of gear are your call (about 46,653 at vendors)." (" · N stacks stay: no vault has room." when so), then a `small` dim line of the caveats that apply: "22 of the stored stacks no vendor buys. worn gear can't be told from carried in the export. 30 free slots in your bags now." (plus "no character export, so vendors and the sale price are unknown" when the sheet is missing). **BY STOP**: one `.stop` section per area, the area you are in first with the "you're here" tag, head "Serbule · 26 stacks · about 9,321 councils"; inside, per vendor "Sell to *Sir Coth* · 19 stacks · about **9,321** councils (can still pay 10,000, 679 after)" with a `feed-what` list of "**15** Greater Fulgurite … 4,620", then per vault "Store at *Joeh* · 4 stacks (15 free, 11 after)" with its list. CDN Area `*` vaults (saddlebag, Council Storage Machine) form the stop "Anywhere (carried, or area unknown)". **BY ITEM**: a `resp-plain` table Item / Qty / Do / About, sells first then stores, gear, stays, each by price: "Sell to *Sir Coth* · Serbule", "Store at *Joeh* · Serbule" with tag chips "has some already" (the vault holds the type), "no vendor buys it" / "worth nothing to a vendor", and the dim alternative "or Kib pays about 2,100"; gear rows read "Your call · Kib pays about 699 · or store at Joeh". **Rules (server `plan()`):** inventory stacks only (`IsInInventory`); `kind` sell = the `VendorTrash` keyword, gear = `Slot` or `TSysPowers`, store = the rest; a stack is sellable when its `items.json` keywords meet a vendor's `buys` words and its `Value` is above 0; price = `Value` × `NPC_MOD_MAXSALESVALUE` (the character export's sale multiplier, shown as "×1.23 … not checked in game"); the vendor is the one with the most councils left who can take the whole stack (a vendor in an area the route already visits wins ties), else the richest with "can take N of M; the rest stays"; vendor councils and vault room are spent down as stacks are assigned, trash and gear first so their vendor stops anchor the route; the vault is the one with room that already holds the type, then one in a route area, then the most room; gear is never counted in the totals (worn and carried gear look alike in the export; `AttunedTo` is not used). Footer: "Storage export · 2 h ago · Character export · 9 min ago · prices ×1.23 from your stats, not checked in game" / "After selling or storing: VIP menu → Export Storage JSON". **Needs a storage export** like the other windows; no character export: the plan still stores everything and says why. **Old server** (404): "Needs a newer Gorgon Notes." Empty bags: "Your bags are empty in this export. Nothing to sell or store."
  3. **Stacks to merge** (secondary window, added 24 Oct; `GET /api/consolidation`): one item (same `TypeID`) held in more than one place and what a merge would give back. Title count " · 33 slots" (hidden under 640 px; the lead sentence states the number). Tab strip BY ITEM / BY STOP in the title bar (not persisted). **BY ITEM**: lead "Merge these 27 items and 33 slots come back: 32 in vaults, 1 in your inventory." (the colon part only when both are non-zero), then a `small` dim "Not counted: 16 split items that don't stack (gear and the like), 7 already in full stacks." listing only non-zero kinds (unstackable, already in full stacks, per-item powers or wear, over their carry limit, unknown to game data), then a plain dark table (the Vaults pane stays the only khaki surface): Item (24 px icon + name), Take ("6 from Saddlebag, 3 from Kib the Unkillable, 5 from Ragabir, 1 from Serbule Dynamic Safebox"; "1 from your inventory"), Put in (vault and area in tan, "Marna · Serbule"; tag chip "needs 1 slot" when no candidate has room, counted after the items above it in the plan, "size unknown" when the destination's size is unknown), Slots back (bold). Rows in server order (slots back desc), no sort controls; tooltip "87 in 12 stacks, max 10 a stack, 9 stacks after". Phone: stacked blocks, "3 slots" bold right, line 2 "6 from Saddlebag, 3 from Kib the Unkillable · to Marna (Serbule)" followed by the same "needs 1 slot" / "size unknown" chips as the Put in cell. **BY STOP** (pickup plan): one section per area to stand in, the current area first with the chip "you're here" (logged in only), head "Casino · 20 moves" (15/700 title colour), then one group per source vault, "Ragabir · 28 to take · 3 free now, 10 after" ("size unknown" when unsized; tag chip "2 slots short" after it when deposits planned into that vault found no room), and 32 px lines: "Take 200 Strange Dirt from Qatik, put in Ragabir"; other area: "…put in Marna (Serbule)" + chip "carry to Serbule"; destination saddlebag: "…put in your saddlebag" (no chip); destination with area `Anywhere` other than the saddlebag: "…put in Council Storage Machine" + chip "area unknown" (and such a vault as a source heads the stop "Anywhere (area unknown)"); the carried group last: "Put 6 Empty Bottle from your saddlebag into Marna", "Put 1 Heart from your inventory into Ragabir". Vault names and areas in tan, quantities in `em.n`. Rules: inventory is only ever a source; the destination is the holder that fits first, then the largest holder, then the most room; account transfer chests count as ordinary destinations; gear and anything with per-item fields never merges. **States**: Empty "Nothing to merge. Every stackable item is already in one place. 16 items are split across vaults but don't stack. Also split: 7 already in full stacks." (counts from `summary.skipped` by reason, never `splitNames`; the "Also split" sentence lists the other non-zero kinds in the Not counted wording; tabs and count hidden); No export "Needs a storage export." with the missing footer, never Error; Error `blockError` with Retry; old server "Needs a newer server.py." / footer right "Stacks to merge need a newer server.py"; Loading a 120 px loading bar, footer "Loading the storage export…". Freshness is the `storage-export` verdict in the footer only (no in-body age note: one source, one surface per window). Follows the character select; an older export picked in Items has no effect here.
  4. **Items**: export picker (selected character's storage exports, newest first; when an older one is selected, an info note under it: "Showing the storage export of 12 Oct 18:02 in this window only. Vaults, Stacks to merge and At a glance always use the newest. Show newest"). The picker changes **only** the Items window (its table, BY LOCATION list, summary line and footer), fetched via `/api/report?file=`; `/api/storage` has no file parameter, so Vaults, Where there's room, Stacks to merge and At a glance always show the newest export. "474 stacks · 1.2M councils vendor value · exported 23 Oct 00:49". BY LOCATION bar list of vendor value per vault (click filters). Item table: 24 px icon (`/api/icons?typeIds=`), Name, Rarity, Lvl, Location, Qty, Value (Value × stack). **Aggregation:** stacks are merged only when they have the same `TypeID`, the same location (vault) and no per-item fields that differ (powers, `Durability`, `AttunedTo`, crafter); "100 ×3" means three stacks of 100 in that one vault. Stacks in different vaults stay separate rows (the Location column tells them apart); cross-vault duplicates are the Stacks to merge window (window 3). Search matches name or power; location select; all sortable, default Value descending; 200 rows then "Show 200 more" (old cap 800 kept as page size limit). **Detail:** a row with powers or merged stacks has a ▶ foldout in its Name cell (a `<button aria-expanded>`; click, Enter or Space toggles; rows without either have no foldout). Expanded, a second line under the row lists: each power as readable text from `/api/lookup?powers=` ("+18 Max Health"; when it returns null or is missing, "Health Boost Very Weak, tier 3" from the raw key), and for merged rows the individual stack sizes ("Stacks: 100, 100, 100"). The row tooltip shows the same powers. Nothing else is shown (the other item fields are out of scope).
- Phone: Vaults first (above the fold after the figures), Items after; vault rows "Otis · **Full**" with a 48 px strip.
- **Margin sources:** storage export (with vault areas visited, storage searches, loot since), character export (favor drives sizes), vault sizes, partial export, selected export; live game events folded.
- **No export** (`/api/storage` returns `{ "error": "no items export" }`, `storage-export` bad "none for this character", or `?sim=noexport`). Never shown as Error.
- **Stale by activity** (`storage-export` warn with searches or loot since it): nothing new is drawn; the stamp, finding suffix, At a glance age mark, every footer and the margin note carry the verdict and its evidence sentences (Data health), and the `export-stale` moment (Reminders) arrives as a sticky warn system line under the title row here, a note toast with "Show" elsewhere, and a notification when the page is hidden. While loading with no verdict yet the stamp reads "Copied from the storage export" / "…", never "missing".
  - Finding: "No storage export for Robchew yet, so there's nothing to count. Export once and this fills in."
  - Stamp: line 1 "No storage export found", line 2 the red square and "missing".
  - At a glance: hidden.
  - Primary window (Vaults): title, notch and toolbar stay (toolbar disabled); the pane is replaced by one sentence, "Vault contents come from the storage export.", and the fix plaque "Export Storage JSON" / "In game: VIP menu" (logged out: "Next time you're in game: VIP menu → Export Storage JSON").
  - Where there's room, Stacks to merge and Items show their title, the line "Needs a storage export." and their footer.
  - Footer on every Storage window: "Storage export · missing" (red square) / "VIP menu → Export Storage JSON".
  - Margin: `storage-export` bad, plaque collapsed to its one-line fix (one plaque per view).
  - Margin, vault sizes: not listed. The server adds no `vault-sizes` item when it has no vaults to size, and `?sim=noexport` drops the real one so the preview matches; the pill counts no note for it. Should `vault-size` fix text be produced anyway in this state, it reads "After a storage export: check the size in game, then type it in the Slots column" (Voice and Microcopy), never a bare "type it in the Slots column" while the pane is replaced.
  - The pane-under hint "Sizes the game doesn't publish can be typed into the Slots column." belongs to the rendered vault table only (it is not in the No export pane), and even there it shows only while a row carries a size box (unknown or typed-in size).
  - **Storage export present, character export missing**: not this state. The view renders normally, but vault sizes that come from favor are unknown: their Slots cell shows "?" with the inline size input, the provenance tag reads "needs character export", the Vaults footer left side reads "Storage export · 8 h ago · sizes from favor unknown (no character export)", and the margin lists `character-export` bad with its plaque, evidence "Vault sizes from favor need a character export."
- **Out of scope for this design:** what changed since the last export, vaults not yet unlocked and the favor tier that unlocks NPC storage (`storagevaults.json`, `npcs.json` Storage service `Favor`), equipment item fields (`Slot`, `Durability`, `AttunedTo`, `TransmuteCount`, imbue power, crafter, `UsesRemaining`, `CraftPoints`, `IsAugmented`, `PetHusbandryState`), `.csv` export twins. No placeholder windows.

### Character (`#character`)
**Question:** where does my character stand, and which skills are close?
- **Finding:** "Mycology is **1,240 XP** from level 61. **9** currencies, **284** quests done." Partial export selected: the finding is replaced by the bad note.
- **Stamp:** "Copied from the character export of 23 Oct, 00:56" / "8 h ago".
- **Export picker** in the title row's second line: the selected character's exports (see Shell), newest good first, partial ones labelled; the 60 s refresh never resets a manual pick. Info line under it: "Human · last area Eltibule · exported 23 Oct 00:56".
- **Broken export**: red note above the windows with the fix plaque ("Export again while fully logged in").
- **At a glance:** Councils (lead, coin), Skills ("118", "highest: Mycology 61"), Active quests, Completed quests.
- **Windows:**
  1. **Skills** (primary window, khaki pane): search, columns Skill, Level (bold), Bonus ("+1", fixed-width column), Progress bar, % (beside), XP to go (or "max"). The export's `Unknown` skill key is excluded (as today). All five sortable (text ascending first, numbers descending first); default Level descending. 118 rows, sticky header, inner scroll at 70vh.
  2. **Currencies**: a definition grid of nonzero currencies, prettified names, Councils (`GOLD`) first with coin; "5 at zero" text button reveals the rest. Column count from the item count (3 columns for 9).
  3. **Stats**: grouped readable labels, raw key in the tooltip, search. The groups below show by default; "Show all 62 stats" reveals the rest under "Other", labelled by the generic rule.
  4. **NPC favor**: search; columns NPC, Favor tier, **Favor in tier** (the raw `Favor` number from the export, right-aligned, tabular, one decimal when not whole; header tooltip "Favor earned within the current tier. The game doesn't publish tier thresholds, so there's no bar."). No progress bar: no tier-threshold source exists in the export or the CDN files on hand, so a bar would be invented. Sort by tier rank then Favor in tier (default, descending); both sortable. First 60 then "Show all". Empty: "No favor data in this export."
  5. **Active quests**: count in the title, names from `/api/lookup?quests=` (else prettified keys), search. Empty: "None in this export."
- **Stats map** (key → label, format; groups in this order):
  | Group | Key | Label | Format |
  |---|---|---|---|
  | Selling | `NPC_MOD_MAXSALESVALUE` | Sale price bonus | ×, 2 decimals ("1.22×") |
  | Selling | `NPC_MOD_TRAININGCOST` | Training cost | × ("0.84×") |
  | Favor | `NPC_MOD_FAVORFROMGIFTS` | Favor from gifts | × |
  | Favor | `NPC_MOD_FAVORFROMHANGOUTS` | Favor from hangouts | × |
  | Inventory | `MAX_INVENTORY_SIZE` | Inventory size | whole number |
  | Inventory | `AUTOLOOT_RADIUS` | Autoloot radius | 1 decimal, "m" |
  | Work orders | `MAX_ACTIVE_WORKORDERS` | Active work orders allowed | whole number |
  | Work orders | `WORKORDER_COIN_REWARD_MOD` | Work order councils | × |
  | Vitals | `MAX_HEALTH`, `MAX_POWER`, `MAX_ARMOR`, `MAX_BREATH` | Max health, Max power, Max armor, Max breath | whole number |
  | Movement | `MOVEMENT_SPEED`, `SPRINT_BOOST` | Movement speed, Sprint boost | number |
  | Identity | `IS_DRUID`, `IS_LYCANTHROPE`, `IS_UNDEAD`, `IS_BEAST` | Druid, Lycanthrope, Undead, Beast | "Yes" only when 1; rows with 0 are hidden |
  **Generic rule for every other key** ("Other", behind "Show all"): prefixes become words (`MOD_` → "Damage mod:", `MITIGATION_` → "Mitigation:", `VULN_` → "Vulnerability:", `BOOST_` → "Boost:", `COMBAT_REGEN_` → "Combat regen:", `NONCOMBAT_REGEN_` → "Out-of-combat regen:", `CUR_` → "Current:", `MAX_` → "Max"), the rest lowercased with spaces and `_DIRECT`/`_INDIRECT` as "(direct)"/"(indirect)"; values under 3 with decimals show as "×", whole numbers plain. `IS_MALE`, `IS_MOUNTED`, `IS_STUNNED`, `PVP` are hidden.
- Phone: SKILLS / CURRENCIES / FAVOR / QUESTS / STATS tabs over one window to keep Skills above the fold; the strip scrolls in one line with the fade cue.
- **Margin sources:** character export, partial export, auto-export setting (when a partial exists), selected export not newest, alts (stale and missing).
- **No export** (`/api/reports` lists no `CharacterSheet` file for the selected character, `character-export` bad "none for this character", or `?sim=noexport`). A partial file alone is not this state: it is Broken export. Never shown as Error.
  - Finding: "No character export for Robchew yet, so there are no skills, currencies or favor to show. Export once and this fills in."
  - Stamp: line 1 "No character export found", line 2 the red square and "missing". The export picker is hidden; the info line under it reads "No exports for Robchew".
  - At a glance: hidden.
  - Primary window (Skills): title and notch stay, search disabled; the pane is replaced by one sentence, "Skills, currencies, stats, favor and quests all come from the character export.", and the fix plaque "Export Character JSON" / "In game: VIP menu, while fully logged in" (logged out: the "Next time you're in game" form).
  - Currencies, Stats, NPC favor and Active quests show their title, the line "Needs a character export." and their footer.
  - Footer on every Character window: "Character export · missing" (red square) / "VIP menu → Export Character JSON".
  - Margin: `character-export` bad, plaque collapsed to its one-line fix; alt notes still show (an alt with no exports is still listed as `alt-missing`).
- **Out of scope for this design:** recipe completions (348), completed quests list, work orders, abilities per skill, NPC gift preferences cross-referenced with stored items (`npcs.json` `Preferences`, `ItemGifts`), non-store NPC services (training, barter, consignment, augments, stables), `PlayerNotes`, `CouncilsSpent` for non-vendor NPCs, `ReportVersion`. No placeholder windows.

### Files (`#files`)
**Question:** what exactly is in the files this app reads, and are they current? (Added 24 Oct: the JSON inspector. Read-only on disk; every surface shows freshness and the exact fix. 25 Oct: the chat logs joined the list, so the file the DPS meter reads is visible here too.)
- **Finding:** "**55** files: **15** exports, your vault sizes, **7** game data files (v488, 22.5 MB) and **32** chat logs (71.9 MB). The newest export is **8 h** old. The chat log was written **just now**." (The chat log sentence reads the newest log's `lastLineAt`; when the chat-log verdict is warn or bad it becomes the amber suffix "The chat log was last written 2 hours ago. <the verdict's evidence>"; with no log at all: "No chat log yet.") The age is the selected character's newest valid, non-partial export, the same source as the stamp, so the two never disagree ("your vault sizes" is dropped when capacity.json does not exist yet; with no export for the selected character the last sentence reads "No exports for Robchew yet." followed, when an alt has one, by "Faechew's newest is **184 d** old."). Stale suffix as elsewhere, from the worst warn export of the selected character: "The newest storage export is 1 day old." No files at all: "No files yet. Exports land in Reports/ once you use the VIP menu, the chat log appears with Log All Chat on, and game data is fetched the first time Vendors or Storage loads."
- **Stamp:** line 1 "Newest export of 24 Oct, 00:02" (the selected character's newest valid export), line 2 its age; severity the worst of the selected character's `character-export` / `storage-export` verdicts; no export → "No exports found" / red square "missing"; server down → "as of 21:14" in red.
- **Check again:** re-reads `/api/files` with the rest. Something new (any file added or rewritten): `[Status] 23 files listed. Newest export: Character_Robchew_Arisetsu.json, 00:02.` Nothing new and an export warn or bad: amber triangle "Nothing new since 00:02. In game: VIP menu → Export Character JSON, then check again." (logged out, the fix's own "Next time you're in game: …" form replaces "In game: …", one source of truth, never both; the same rule for the other views' Check again lines); all ok: "i" note "Nothing new since 00:02. Your exports are recent."
- **No At a glance window** (Typography → The At-a-Glance Allowance).
- **Layout** ≥ 1180: the main column is a grid `minmax(280px, 340px) minmax(0, 1fr)`, 16 px gap, the Files window left and sticky (`top: 60px`, under the shell bar, scrolling inside its body), Contents right. 768 to 1179 and phones: stacked, Files first.
- **Windows:**
  1. **Files** (primary window, centred title with the rust notch, count in the title; the view's one khaki pane). Two columns File / Size, no sort controls. Section rows per group (pane-section 16/700 ink, ▶/▼ foldout with `data-fold`, the count after the name, the subtotal right-aligned and kept when collapsed; open state per visit): "Exports · 15 files · 1.6 MB", "Chat logs · 32 files · 71.9 MB" (25 Oct), "Typed in by you · 1 file · 157 B", "Game data v488 · 7 files · 22.5 MB", and "Game data v487 (older) · N files" collapsed when older versions exist. **Chat log rows** (newest first): "Chat log · today" / "Chat log · 24 Oct", chips "in use" on the newest (the one Combat, Session and the live checks read; it also gets the chat-log verdict's pane flag, "off" for bad and "silent" for warn), line 2 `Chat-26-10-25.log · written 25 Oct 14:04 · just now · 6,586 combat lines` (the count on the newest only); the last 7 are listed, the rest behind "Show 25 older logs" (`data-lmoreold`). The pane footer's right side keeps the export fix first, then the chat-log fix when only that one is warn or bad. Rows 36 px min, two lines, `pane-rule` dividers, hover `pane-hover`; line 1 (`text`, ink) the kind, line 2 (`small`) the file name in a `well` inline span then " · "-joined meta. The row's one tab stop is the line-1 link `<a class="fopen" href="#files?f=<id>">`; a click anywhere on the row follows it; the open row has `aria-current="true"`, line 1 in 700 and an "open" tag chip. Export rows: "Character · Robchew" / "Storage · Robchew" with chips "in use" (the newest valid export of the selected character for that kind), "superseded", "alt" (another character's; its older files also "superseded"), "partial", "won't parse" (`valid: false`, line 2 then ends with the server's error line); line 2 "Character_Robchew_Arisetsu.json · saved 24 Oct 00:02 · 8 h ago", and on an in-use row whose source verdict is warn or bad the `pane-flag` shape plus the ink word "stale" / "broken" (status colours never on the pane; superseded rows get no shape). The partial twin: "Character · partial twin", "Character__Arisetsu.json · saved 24 Oct 00:02 · ignored" (+ square and "broken" only when `partial-export` is bad). An alt's newest row follows `alt-stale` (shape only when warn or bad). Default: only the newest file per character and kind plus partial and unparsable files; a final Exports row holds the text button "Show 10 older exports" / "Show fewer" (not persisted). No exports for the selected character (also `?sim=noexport`, alts may still be listed): the group starts with the line "No exports for Robchew yet. Exports land in Reports/ once you use the VIP menu." and the "Export Character JSON" plaque (one plaque per view: the margin collapses to its line). "Typed in by you": "Vault sizes" / "capacity.json · saved 23 Oct 11:33 · 6 vaults" / "157 B"; absent: "Vault sizes · not created yet" / "capacity.json appears when you type a size in the Slots column on Storage", no link, no size. Game data rows: the plain label from the server (`label`: Items, Quests, NPCs, Stats, Areas, Storage vaults, Item powers; an unknown file shows its name) / "items.json · 254,581 entries · fetched 23 Oct 09:52" ("entries" = the node count, only once the file has been opened) with the cdn verdict's shape and word ("updated" / "unreachable") when info or bad. Size cells `fmtBytes` with the byte count in the tooltip. Under the pane: "Also in Reports/: 2 CSV exports, not shown." when `csvSkipped` > 0. Footer per Window footers. States: Loading (section rows and `well` bars at real widths, footer "Reading Reports/, capacity.json and cache/…"); Empty (no files at all: the finding's sentence plus the Export Character JSON plaque); Error (`blockError('the file list', lastGood)` with Retry); Old server (`/api/files` 404: "Needs a newer server.py." / footer "Files need a newer server.py"; the finding says the same and the stamp reads "File list / not available"); Server down (the global red "as of" footer). Phone: the same rows at 44 px min via `.resp`; the Size cell keeps its unit; a tap opens the file and moves focus to the Contents title.
  2. **Contents** (secondary, title left, **dark in both themes**; count "3,766 entries" = the whole-file node count). Toolbar: search `#fileq` ("Key or value in this file, e.g. Mycology"; `/` focuses it on this view, Esc clears and returns to the tree), ghost "Expand all", "Collapse all", and the link `Open raw · 91.7 KB` (`/api/file/raw?id=`, new tab; hidden under 640 px); all disabled while nothing is open or after a File changed note. Then the path bar, the note line, the search results, the tree in `.scrollbox.treebox` (70vh, 60vh on phones) and the hint "Arrow keys move and open, * opens every sibling, type a letter to jump." Component rules in Components → JSON tree. Opening a file moves focus to the h2 (`tabindex="-1"`, the Here window rule) at every width, except the automatic open on entering the view. **Search**: debounced 300 ms, under 2 characters shows "Type at least 2 characters." under the input, else `GET /api/file/search` with the file's `mtime`; results above the tree as a plain table Path / Value ("item_14091 › Description · value · …Amethyst…", matched text 700) under "23 matches for "amethyst"" with a "Clear" text button; capped: "Showing the first 200 of 1,312 matches. Narrow the search."; partial: "Took too long; here are the first 140."; none: "No "xyz" in this file. Keys and text values are searched; numbers by their digits." Enter, Space or a click on a hit pages every ancestor to its `pos`, focuses the row, flashes it `well` 600 ms and clears the results; the count is announced through `#f-status`. **Footer** per Window footers (freshness and fix for the open file, always). **States**: nothing open "Pick a file on the left." ("Pick a file above." under 1180) / "No file open"; Loading (toolbar disabled, one 32 px `well` bar, footer "Reading Character_Robchew_Arisetsu.json · 91.7 KB…"); empty root "This file is an empty object." / "…empty list."; a scalar root shows its literal; **Invalid JSON** (422, never the Error block): red square "Couldn't read this file as JSON. Line 1,204, column 7: Expecting ',' delimiter." then for an export "An export written right before logout can be cut short." and the "Export Character JSON again" plaque (one plaque per view), for a cache file "Delete cache/v488/items.json and the server fetches it again the next time Vendors loads.", for capacity.json "Nothing in the app reads it until it parses again.", a ghost "Retry" beside the red line, Open raw still offered; **File changed** (409, or the listing poll sees a newer `mtimeNs` for the open file): with a tree open, the amber note "This file was rewritten at 00:58 while you were reading it. Reload to read the new export." with a "Reload" text button; expands, searches and copies are refused until Reload (a container that was opening closes again), loaded rows stay; in any other settled state (invalid, empty, scalar, gone, error) there are no rows to keep, so the file is simply read again without moving focus (the invalid state's own fix is "export again", and the view confirms it the moment the new export lands). A click on the pane row that is already open re-reads the file too (its hash does not change, so the row is never a dead end); **File gone** (404 on a node): red "This file is gone. Character_Faechew_Arisetsu.json isn't in Reports/ any more; the list has been refreshed." + Retry, tree cleared, list re-read; **Load error** (network while up, 5xx, bad JSON): `blockError('this file', lastGood)`; a failed expand writes one child row "Couldn't load. Try again." with Retry; Server down: the global banner and red footers, rows stay, nothing dimmed; Old server: footer right "Files need a newer server.py".
- **Deep links:** `#files?f=<encodeURIComponent(id)>&p=<encodeURIComponent(pointer)>` opens that file with the pointer's ancestors expanded, paged to the right slice, scrolled into view and focused (a pointer that does not exist posts a warn line and shows the top of the file). Picking a file sets the hash (Back returns to the previous file); expanding never touches it; "Copy link" builds the `p` form. Entering the view with no `f` opens `pgdash.file` if it is still listed, else the selected character's newest valid character export, else nothing. From elsewhere: the Character title-row info line and the Storage → Items summary line carry "Open the file"; the About popover's exports line "Inspect the files". `?sim=noexport` hides the selected character's exports from the listing too.
- **Polling:** the listing is re-read with the 60 s exports round (only once the view has been opened), 1.5 s after a "Saved report to" line, and at once on entering the view; a new or rewritten row flashes `well` 600 ms; the tree is never rebuilt by a poll and keyboard focus survives one (`data-path`).
- **Chat log contents** (25 Oct): opening a `logs/` row puts the Contents window in the `log` state instead of the tree: the count reads "8,298 lines", the search field's placeholder "Any text, e.g. Bee Stab", Expand all / Collapse all stay disabled, Open raw serves the file as text. The body is `#f-logbox` (`role="log"`, `aria-live="off"`, one tab stop, 70vh / 60vh on phones): the last 500 lines, newest at the bottom, each line `<div class="lline">` with a dim line number (hidden on phones), the time in `chat-timestamp`, the channel tag in its channel colour and the message (level-ups bold, Error red, as the Session feed), and above them the button "Show 500 earlier of 8,298 lines" (`data-lmore`; prepends a page and keeps the lines on screen where they were, until 5,000 lines are shown, then "Showing the last 5,000 of 8,298 lines. Open raw for the whole file."). The hint reads "Newest lines at the bottom. A search lists every matching line in the file, oldest first." **Search** (debounced 300 ms, 2+ characters) replaces the tail with "179 matching lines for "bee stab"" + Clear and the matching lines in file order with the match in bold (`title` colour); capped: "Showing the first 500 of 1,234 matching lines. Narrow the search."; none: "No "x" in this log. Every line is searched as plain text."; Esc or Clear returns to the tail. **Live log:** no `mtime` token travels with these requests (the file grows every few seconds); when the 60 s listing poll sees a new `mtimeNs` the tail is re-read in place (`refreshLog()`, the scroll stays at the bottom if it was there, an open search re-runs), never the amber "rewritten" note. **Footer:** "Chat log of 25 Oct · last line 25 Oct 14:04 · just now · 648.3 KB" (the age in the chat-log verdict's severity on the newest log), right side for the newest log the chat-log fix when warn or bad, else "Being written as you play; this view re-reads it every minute." / "Combat and Session read this one." followed by the chat-logging-ok fix; for an older log "Only the 31-day combat totals read this one." or, past 31 days, "Nothing in the app reads this one any more." Invalid / gone states name ChatLogs/.
- **Margin sources:** character export, storage export, partial export, vault sizes, game data, alts (stale and missing), and since 25 Oct the chat log; the rest folded. The rail mark, pill and tab title follow the same verdicts.
- **Out of scope for this design:** the CSV twins (counted under the pane, never shown), editing capacity.json here (Storage → Slots column), fetching `skills.json` / `recipes.json` for links (the tooltip says so), a diff between two exports, and a view of what the app derives from a file. No placeholder windows.

### Feature coverage (from `design/research/app-inventory.md`)
| Inventory item | Where now |
|---|---|
| Header identity, area, live state | Shell header (location line, logged in/out from `/api/session` additions) |
| 4 tabs, hash links, remembered tab, theme tokens | Rail / tab bar, hash routing, theme control |
| Session tiles (XP, time span, level-ups, loot) | Session At a glance window (all four always shown; a zero reads "none yet" rather than the tile vanishing) |
| Cumulative XP chart, scope toggle, hover | Session → Experience |
| Level-ups, XP by skill, loot + filter, areas visited | Session windows (areas in What happened) |
| Live chat feed, channel filters, autoscroll | Session → Chat log (all seen channels, System pseudo-channel, `[Item: X]` fixed) |
| Character export picker, broken warning | Character title row, broken note |
| Currencies, skills table (sort, search, progress, bonus, XP left) | Character → Currencies, Skills |
| Stats, NPC favor, active quests | Character → Stats (grouped map), NPC favor, Active quests |
| Vendor tiles (councils left, drained, free slots, full) | Vendors At a glance (Slots Free → link); full vaults on Storage |
| Vendor table (9 cols, search incl. item type, area filter, hide drained, sort) | Vendors → Vendors pane (+ locked vendors, next-tier types) |
| Storage-space table, search, hide unused, sort, manual size input | Storage → Vaults pane (+ provenance, slot strip, confirmations, server validation) |
| Items export picker, value by location (click filter), item table (search name + power, location filter, sort, power tooltip) | Storage → Items |
| Staleness text and VIP fixes | Footers, stamp, margin, strip, tab title, favicon, reminders |
| Light/dark tokens, collapse under 900 px | Dark + Daylight; breakpoints in Layout |
| Empty, error, loading states (previously silent) | States section, per window; No export and No chat log per view |

### Out of scope (exhaustive against app-inventory §9)
Every item in `design/research/app-inventory.md` §9 is either built above or declared out of scope here or in a view's out-of-scope line. Built: next-tier types, locked vendors, exact reset time (tooltip), per-vault value, `capacitySource` (provenance tag), `sheet` age (Vaults footer), stats map, zero currencies ("5 at zero"), powers as readable text, chat-log signals used for health (sales, favor gains, storage searches, exports, Logged Out, logins per character), `GorgonSettings.txt` logging keys. Out of scope, beyond the per-view lists: `VIP_ChatLogs`, `QUEST_LOG_TRACKED_*`, `SKILL_TREE_TOGGLES_*`, `LastSuccessfulLoginTime`, `Screenshots/`, snapshot history diffing, NPC map positions (`Pos`) and descriptions, storage vault `Requirements` and `EventLevels`, CDN files not yet fetched beyond those the Server contract names (`recipes.json`, `skills.json` XP tables, `sources_*.json`).


## Review decisions (polish pass, 23 Oct)

Rulings from the second review, recorded so later passes don't reopen them.

- **Health pill is per view.** The shell pill shows the header line of the view's own margin (what this view's numbers depend on), not `/api/health` `summary.header`. Warn and bad items are listed on every view, so the pill can never hide something to act on; it only differs in how many quiet notes it counts.
- **One Light Surface Rule, scrolled.** The 40% limit is measured on the first screen at 1440 x 900. Once the player scrolls into the main table on Vendors or Storage, the pane may fill the viewport: that is the table they scrolled to read, and it is still the only light surface.
- **Session tiles.** The four tiles (Time, XP, Level-ups, Items looted) always show once the chat log is read. Zeros say "none yet". XP leads once there is some; before that Time leads.
- **Tables fit their column.** No main table relies on a sideways scroll (macOS hides the scrollbar). Storage Items puts By location above the table below 1600 px and moves Rarity and Lvl under the name when the table column is under 700 px. The Vaults table drops Accepts and moves Favor under the vault name when its pane is under 900 px, and drops the slot strip under 720 px. Sort buttons fill their header cell (32 px tall).
- **Sorting.** Blank values sort last in both directions. Rarity sorts by rank (Common to Legendary), not alphabetically. Column presence is judged on the whole filtered list, so sorting never removes the sorted column.
- **Bar lists.** The value column has one fixed width per list (`--bar-v`, 10ch; 15ch for XP by skill) so tracks end at the same x.
- **Coin face** is its own token (`--coin-face`), gold in both themes. A Daylight coin in `--data` read as a hole.
- **Vault areas follow the row sort.** An area section sits where its first vault would under the active sort (Free ascending: the area holding the fullest vault comes first). The subtotal is the area's total free; the order is by its tightest vault.
- **Detector WARNs argued.** `palette-cream` fires on the text colour `#E8E2DA`, not a surface. `ragged-row` on two-column window rows is accepted: windows keep their own height (no stretched voids); Character pairs two independent columns so short windows stack under each other. `unused-canvas` on Storage at 1440 is the margin column ending above a long table; the margin is sticky and the space is the table's. The `#000` in app.css is a mask-image gradient stop, not a colour. The 4 px radius is the documented control radius.
- **Repeated exports** in What happened fold into one line when the same report for the same character repeats within 15 minutes of the first (zone changes in between allowed; a login or logout ends the run): "Character export saved ×4, last 00:56".
- **Parent skills** (Anatomy) have no XP of their own; the export gives them a level made of bonus levels and a 1-XP next level. The Skills table shows the level with "from sub-skills" instead of a bonus and "1 XP to go".
- **Day data is `#76590C`, not `#8A6A12`.** `#8A6A12` measured 3.05:1 against `day-track`, right at the 3:1 graphic floor, so bar fills faded into their tracks in Daylight. `#76590C` is 5.26:1 on `day-window`, 4.54:1 on `day-footer` and 3.95:1 on `day-track`. `#8A6A12` survives only as `coin-rim`, the darker rim of the dark-theme coin (a graphic edge, not a data mark).
- **Rail floats.** The rail is drawn as a window (6 px radius, 1 px `frame`, `shadow-window`) inset 16 px from the right edge, under the shell bar, instead of flush and full height. In the game every piece of chrome on the world ground is a window with a frame, including the right-edge toolbar, which sits inset from the screen edge; a flush strip read as browser chrome. The phone tab bar stays flush along the bottom.
- **Margin counts "missing".** A source that does not exist yet (bad, no age) is counted as "missing" in the margin header and pill ("1 missing · 1 broken"), matching the word on the note; "broken" is kept for sources that exist but are wrong.
- **Quiet windows on a zero day.** When the chat log is read but XP by skill, Level-ups or Loot have nothing yet, the window shows its title and one empty sentence with no footer. The provenance is already in At a glance and the margin, and six identical footers were noise.
- **Block writes are diffed.** Polling re-renders every 30 to 60 s. Each block is rewritten only when its markup changed, and when it is rewritten, keyboard focus returns to the same control (by id or its data attributes) instead of falling to `<body>`.

Files view (24 Oct):
- **Files pane rows are links with `aria-current`, not selected rows.** Opening a file is navigation (the hash changes, Back works), so the pane uses no `sel-*` tokens and no `tabindex` rows; the open row is marked by `aria-current="true"`, weight and an "open" chip.
- **Raw text inside the JSON tree.** Keys and values are shown exactly as the file holds them (no separators, no prettified keys, no status colours): the inspector quotes the file, and every voice rule applies to the chrome around it instead.
- **Contents is a dark window** (`.darkzone`, both themes): a 10 MB tree on khaki would breach One Light Surface the moment it scrolls, and the dark window keeps the pane the view's one light surface (18% of the first screen at 1440 × 1000). Consequence: its focus ring stays `selection-gold` in Daylight, like the chat log's.
- **Budgets are named constants.** Page size 200, the Expand-all budget 2,000 and the rendered-row budget 5,000 are `TREE_PAGE`, `TREE_EXPAND_MAX`, `TREE_ROW_BUDGET` in `app.js` and `NODE_PAGE`, `EXPAND_MAX_NODES`, `SEARCH_BUDGET_S` in `server.py`. `*` opens siblings six requests at a time and stops at the row budget.
- **`mtimeNs` is a string in the browser.** A 19-digit `st_mtime_ns` is past 2^53, so `api()` quotes every `"mtimeNs": <digits>` before `JSON.parse`; the server compares the change token as text, so the round trip is exact (a lossy number produced a spurious 409 on every expand).
- **The Files pane shows no sort controls**: 23 files in three fixed groups, newest exports first, then capacity.json, then game data by version and name.
- **Detector WARNs argued (Files).** `ragged-row` at 1440: the Files window and the Contents window share a row but not a bottom edge by design; the Files window is sticky and scrolls inside itself while the tree beside it grows with what the player opens, so equalising their heights would stretch the list over empty khaki. `palette-cream` is the text colour, as before.
