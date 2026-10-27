# glogger comparison (2026-10-23)

[glogger](https://github.com/danielout/glogger) is an existing Project Gorgon desktop companion (GPL-3.0). Stack: **Tauri 2** (Rust) + Vue 3 + Pinia + Tailwind + **SQLite**, ~10 MB, ships Windows/macOS/Linux. It tails `Player.log` + chat logs, imports VIP exports, and caches CDN data. No server.

Its feature docs live in `docs/features/screens/**` in that repo. To re-inspect: `git clone --depth 1 https://github.com/danielout/glogger.git`.

## Key finding: glogger's live features depend on Player.log events we don't have
glogger parses `LocalPlayer: ProcessAddItem / ProcessDeleteItem / ProcessUpdateItemCode / ProcessDeltaFavor / ProcessAddToStorageVault / ProcessRemoveFromStorageVault / ProcessVendorUpdateAvailableGold / ProcessBook / ProcessSetEquippedItems / ProcessLoadSkills / ProcessUpdateSkill …` from `Player.log`.
**Our Mac `Player.log` contains zero `LocalPlayer` lines.** Test: install glogger's macOS `.dmg` and see if Live Inventory updates while playing.

## Feasible with what we already have (chat logs + exports + CDN)

| glogger feature | What it shows | Our source |
|---|---|---|
| **Current zone panel** | NPCs in current zone: favor, storage used/total, vendor councils left, reset timer | Chat log area + existing vendor/storage data. **Top pick** |
| **Councils feed** | Councils in/out per session (corpse coins, received, muggings) | Chat `[Status]` lines (~1,600 since Oct 10) |
| **Personal DPS meter** (built 24 Oct, Combat view) | Fights, damage a second live, you vs pets, by ability, damage taken, Discord copy | Chat log `[Combat]` lines; glogger has no DPS meter (its README says so), the Windows tools PGCombatTracker / MultiTool read the same lines (`docs/DPS-FEASIBILITY.md`) |
| **Death tracker** | Recent deaths, killer, ability; who rezzed you / you rezzed | `[Combat] … (FATALITY!)` (48 own deaths) + rez messages |
| **Skill cards** | Session XP + XP/hr + current level + progress bar | Session XP merged with character export |
| **Storage consolidation** | Duplicate stacks across vaults, slots saved, zone-by-zone pickup plan | Storage export |
| **Recipe items** | Recipe scrolls owned: known (safe to sell) / learnable / missing skill levels | Storage export + `RecipeCompletions` + CDN items/recipes |
| **Critical resources** | Pinned items with owned totals | Storage export |
| **NPC detail** | Gift preferences, services, next favor tier | CDN `npcs.json` + export |
| **Quest eligibility** | Quests doable now, what blocks the rest | CDN `quests.json` + export (bigger) |
| **Snapshot history / diff** | Skills, currencies, items over time | 14 existing exports; needs persistence (SQLite) |
| **Chat search + watchwords** | Full-text search; keyword alerts (e.g. "WTB diamond" in Trade) | Chat logs |
| **Status card** | Game time, server time, moon phase | Computed |
| **Items incoming** | Loot feed | Already have (chat `added to inventory`) |

## Blocked without Player.log `LocalPlayer` events
- Live inventory; items outgoing (sold/stored/consumed)
- Live favor changes; **Statehelm weekly gift tracker** (uses `ProcessDeltaFavor` with gift flag; 5 gifts/NPC/week, resets Monday 00:00 UTC; the game's Give Gift dialog says Monday EDT, see DATA-SOURCES §5)
- Vendor's actual available gold while at the sell screen (we estimate from export: cap − CouncilsSpent)
- Live storage deposits/withdrawals
- Words of Power capture (`ProcessBook`), milking timers

## Out of scope (separate apps)
Build planner, crafting suite (projects, XP leveling optimizer, brewery, cook's helper, work orders, price helper), market prices, surveying & stall tracker analytics, trip planner, full CDN data browser, unified search.
