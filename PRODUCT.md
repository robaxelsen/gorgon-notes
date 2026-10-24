# Product

<!-- impeccable:product-schema 1 -->

<!-- Written 2026-10-23 by an autonomous agent run while the user was asleep. No interview was possible (no question tool; the user asked for autonomous work). Every fact below comes from the repository (README.md, CLAUDE.md, docs/*.md, design/research/*, design/concepts/DECISION.md) or the user's stated brief. Facts that are the agent's inference are marked "(inferred)". Re-run `/impeccable init` to confirm them. -->

## Platform

web

Local web app on macOS: a Python server on `http://127.0.0.1:8787` serving one HTML page, opened in a desktop browser beside the game, sometimes on a phone or tablet on the same network (inferred from the 390/768 px checks the project already runs). A native Mac shell (SwiftUI menu-bar app wrapping the same `static/` UI in a `WKWebView`) is planned in `docs/ROADMAP.md`; it does not change the platform value, because the design language stays the web page's.

## Users

- **Primary: one player, the owner.** Plays Project: Gorgon (Elder Game's sandbox MMO) on a Mac (Steam build). Main character Robchew on server Arisetsu; alts Faechew, Poejam, Raspby, Boomchew. Has VIP (needed for the JSON exports).
- **Situation:** the dashboard is open all evening on a second screen or beside the game window, glanced at between actions, and read properly before a trip to sell or store (inferred from the session/vendor/storage features and the "long session beside the game" notes in the research).
- **Jobs:** see what this session earned (XP, level-ups, loot, where they went); find where they can still sell and how many councils each vendor will still pay; find where there is free storage space; check skills, currencies, favor and quests; and, above all, know whether those numbers can be trusted and what to do in game to refresh them.
- Other audiences: none confirmed. Other players could run it later (it reads standard game folders), but nothing in the repo commits to that.

## Product Purpose

A personal companion that turns the files Project: Gorgon already writes (VIP exports, chat logs, the public CDN data) into answers the game itself does not show in one place: councils left per vendor with reset timers, free slots per vault including unlocked-but-empty NPC storage, and a live view of the current session.

Success: the player plans selling and storing runs from it, and is never misled by a stale or broken snapshot, because the app always says how old each number is and exactly what to do in game to refresh it.

## Positioning

It is built for the Mac client's reality. glogger, the main existing companion, depends on `LocalPlayer: Process…` lines in `Player.log` that the Mac client does not write (`docs/GLOGGER-COMPARISON.md`). This app works from manual VIP snapshots and the chat log instead, and makes the freshness of those snapshots, and the exact in-game fix, a first-class part of every screen. It also counts vendor resets since the export back into the totals, so a stale export still gives correct councils-left figures where the math allows.

## Operating Context

- **Data refresh is a game action, not an app action.** Exports come from the in-game VIP menu ("VIP menu → Export Character JSON" / "VIP menu → Export Storage JSON"; this is the one path the UI states. How the VIP menu is opened is not stated in UI copy until verified in game: README says Settings → VIP, which is unverified). Chat logging must be on (Settings → GUI → Log All Chat). The app cannot trigger either; it can only tell the player when and what to do, then confirm it worked (a `[Status] Saved report to …` line appears in the chat log).
- **Known glitch:** an export made right before logout (or by `AutoExportCharacterOnLogout`) can write a partial `Character__<Server>.json` with `Character: "???"`, `Race: "Error"`.
- **Time:** chat log timestamps are local; report and vendor reset timestamps are UTC. Chat logs split at midnight.
- **Data volume:** about 100 vendors, about 27 vaults, about 470 item stacks, 118 skills, 62 stats, 322 NPCs, 30 chat logs (65 MB).
- **Polling:** tail every 2 s, session every 30 s, exports and vendors/storage every 60 s.
- **Game UI and commands must be verified before the app states them.** Do not write game menu paths or slash commands from memory.

## Capabilities and Constraints

- `server.py`: Python standard library only. JSON API: `/api/session`, `/api/tail`, `/api/reports`, `/api/report`, `/api/vendors`, `/api/storage`, `POST /api/capacity`. Every existing endpoint must stay backward compatible. The redesign needs additive endpoints and fields, specified exactly in DESIGN.md → Server contract: `GET /api/health` (verdicts, game state, settings, CDN version, reminder moments), `GET /api/icons`, `GET /api/lookup`, new `/api/session` fields (`loggedIn`, `loggedOutAt`, `events[]`, `channels{}`), `cdnVersion` on vendors and storage, per-row vendor reset fields on `/api/vendors` (`exportResetAt`, `spentAtExport`, `resetSinceExport`, `restored`, plus `resetSummary`; today the server zeroes `spent` after a reset, so "reset since export" can't be told from "never spent"), and `400 {error}` validation on `POST /api/capacity`. The page degrades to a browser-only health check, and says so, when the server is older. A missing export (`{error: "no character export"}` / `{error: "no items export"}`) is a first-run state with its own fix, never shown as a load error.
- `static/index.html`: vanilla JS, inline CSS with light/dark tokens, no build step, no dependencies, until the Mac app rewrite. Web fonts may load from Google Fonts. Item and ability icons load from `cdn.projectgorgon.com` in `<img>` tags; server-side CDN requests need a User-Agent header.
- The only write action is setting a manual vault size (`POST /api/capacity`, `capacity.json`).
- Routes: `#session`, `#vendors`, `#storage`, `#character`.
- **Critical requirement (docs/DATA-AWARENESS.md):** every feature shows its data freshness and the exact fix. A feature is not done until it does. One data-health model drives every channel (in-page, tab title, favicon, browser notifications; later menu bar, native notifications, HUD overlay). Reminders fire at moments (login, arriving where vaults are, after selling, wrapping up, broken export, opt-in vendor resets and digest) and are configurable per topic with snooze, mute, quiet hours and an optional sound (DESIGN.md → Reminders, Reminders panel).
- Not possible today: live inventory, live vendor gold, live favor (no Player.log events on Mac). Auto-export by input automation is not built by default.
- Design review relies on browser-only preview modes (`?shift=N`, `?sim=stale|broken|nolog|noexport|loading|down`, `?theme=`), specified in DESIGN.md → Preview modes; they never reach the server and never write settings or send notifications.
- Undecided: menu-bar popover vs Dock app; which data matters most for an always-on readout; whether Player.log events can be enabled on Mac.

## Brand Commitments

- **Visual brief from the user (binding):** a completely new design whose only influence is that it should look like an app Project: Gorgon's developer, Elder Game, designed itself. Not a generic dashboard and not generic "fantasy".
- **Fan-made, unaffiliated.** Never use Elder Game's logo, name or branding in a way that suggests an official product. The app says it is fan-made and not affiliated with Elder Game. CDN item icons are the approved third-party art; client textures and the logo are reference only and are not shipped.
- **Voice:** the game's own register: dry, deadpan, literal, a little self-aware ("You Died! Congratulations!"). Humour never hides an instruction.
- **Vocabulary:** the game's nouns: Councils, Favor (and its tier names), vaults, Slots Free, VIP menu, Log All Chat, Session, Vendors, Storage, Character.
- Product name: "Gorgon Notes" (confirmed by the user 2026-10-23; clash check in `docs/NAMING.md`). It sits next to "fan-made, not affiliated with Elder Game" because it contains "Gorgon". The name and that line live in two constants (`APP_NAME`, `FAN_LINE`) in `static/app.js`.

## Evidence on Hand

- Live, real player data through the running server (one main character, several alts).
- Research: `design/research/pg-visual-identity.md` (colours, fonts and chrome sampled from the client and Steam screenshots), `design/research/app-inventory.md` (every current feature and API field), `design/research/taste-baseline.md` (audit of the old UI).
- Concepts and the decision: `design/concepts/concept-{a,b,c}.md`, `design/archive/concepts/concept-{a,b,c}.html` (archived, no longer served), `design/concepts/DECISION.md`.
- Reference images (not to ship): `design/research/game-ui/`. Approved icon samples: `design/research/icons/`.
- Absent, and not to be fabricated: other users, testimonials, usage metrics, item rarity colours (not found in the client), verified in-game labels for combat-logging settings and VIP renewal.

## Product Principles

1. **Never silently stale.** Every snapshot-backed number carries its age; the screen's most-read figure never looks trustworthy when it is not.
2. **Always actionable, right now.** Every warning names the exact in-game step, worded for the player's current state (logged in or out), and then confirms whether the step worked.
3. **Answer the question first.** Each view answers one question with its biggest block and one sentence; detail follows.
4. **One verdict per fact.** A single health model decides severity; every place that shows it agrees.
5. **Healthy is quiet.** Colour and interruption are reserved for things that need the player.

## Accessibility & Inclusion

No product-specific requirement was established. Working standard (inferred): WCAG 2.2 AA contrast in both themes, status never carried by colour alone, keyboard-operable controls, `prefers-reduced-motion` respected, 44 px touch targets on a phone.
