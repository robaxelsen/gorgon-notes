# DPS / damage reports: feasibility

Research date 2026-10-23. Question: friends want "DPS reports like glogger". Can Gorgon Notes do it on this Mac?

## TL;DR

- **glogger has no DPS meter.** Its README says: "turning on combat logging doesn't do a ton, but does allow you to see death reports on what killed you. (I have no plans to try to make DPS meters or anything.)" (glogger `README.md`, commit `232a1f7`, 2026-10-23). From `[Combat]` lines it only takes deaths, kills and damage on the player (`src-tauri/src/chat_combat_parser.rs`), and it uses those for the Death tracker. The DPS tools people probably mean are **PGCombatTracker** (TheJebForge, Go, Windows/Linux) and **Project Gorgon MultiTool** (Moicanox, C#/WinForms, Windows-only, has a DPS overlay).
- **All of these read the chat log `[Combat]` channel.** None of them needs Player.log `LocalPlayer: Process…` events, so the Mac's missing LocalPlayer events **do not block DPS**. Our chat logs already have everything needed: 719,537 `[Combat]` lines over 30 log files.
- **Personal DPS, broken down by ability and pet, is easy.** A prototype run on real logs works (numbers below).
- **The hard limit is party DPS.** The log has no lines for party members' attacks on enemies. Each friend has to run a tool on their own machine.

## Verdicts

| Feature | Verdict | Why |
|---|---|---|
| Personal DPS per fight | **Easy** | Your own hits carry ability, target and `N health, N armor` numbers. Fights can be split on idle gaps. Caveat: timestamps are 1 s. |
| Per-ability breakdown | **Easy** | The ability name and level are on every line (`Dampen 8`). Strip the trailing level to group them. |
| Damage taken | **Easy** | `<Enemy #id>: <ability> on Robchew! Dmg: …`, plus crit/evade/"none". Your own `Suffered indirect dmg` covers DoTs on you. |
| Pet damage | **Easy (heuristic)** | Pets have `#id` lines with full damage. You identify them by what they hit (see design). |
| Kills / deaths | **Easy** | `(FATALITY!)` suffix. A kill counts only when you or your pet landed the last hit, so kills from party members are missed. |
| DoT / indirect damage you dealt | **Moderate / approximate** | `Enemy #id: Suffered indirect dmg: -N health` names **no source**. In a solo fight it is all yours (or your pet's). In a group it can't be split between players. |
| Party / group DPS | **Blocked from one log** | 0 attack lines from party members on enemies in 30 days. Workable only if each friend runs the tool and they share results. |
| Live overlay | **Moderate** | Tailing the chat log works (it is flushed live, which `/api/tail` already relies on). Needs a Mac app HUD window. 1 s resolution is fine for a rolling 15 s DPS number. |

## Evidence from our logs

Source: `~/Library/Application Support/unity.Elder Game.Project Gorgon/ChatLogs/Chat-YY-MM-DD.log`, line format `YY-MM-DD HH:MM:SS\t[Combat] <actor>: <rest>`, local time, **1 second resolution**. Shapes counted over Chat-26-10-19 … 26-10-23 (`me` = Robchew; `#` = entity with id: NPC, pet or other player):

| Count | Shape | Real example |
|---|---|---|
| 12,583 | Indirect damage on others (no source) | `Elite Troll Trooper #16546619: Suffered indirect dmg: -156 health` |
| 5,088 | Others recovered | `True Barghest #16548568: Recovered: 89 health` |
| 610 / 149 | **My hit, health+armor / health only** | `Robchew: Mark Weakness 7 on Elite Troll Trooper #16546619! Dmg: 234 health, 431 armor` · `Robchew: Tsunami 5 on Elite Troll Trooper #16546619! Dmg: 1544 health` |
| 203 / 70 | **My killing blow** | `Robchew: Lightning Bolt 8 on Troll Trooper #16482346! Dmg: 832 health. (FATALITY!)` |
| 52 | My crit / evaded (other punctuation) | `Robchew: Tsunami 5 on Multipurpose Utility Elemental #16511136 (EVADED!)` |
| 352 | My non-damage ability (buff, pet command) | `Robchew: Sic 'Em 9 on Cardi Bee #16549764!` |
| 256 | Self-cast | `Robchew: Lope on Robchew!` |
| 772+210 | **Pet hits enemy** | `Cardi Bee #16549764: Bee Poison Vuln 5 on Elite Troll Trooper #16546619! Dmg: 1269 health, 1269 armor` |
| 161+74 | Pet / enemy killing blow | `Cardi Bee #16597645: Bee Stab on Ice Runner #16428435! Dmg: 924 health, 108 armor. (FATALITY!)` |
| 322+27+7 | **Enemy hits me** | `Shocking Droach #16460064: Terrible Shocking Breath on Robchew! Dmg: 60 health, 59 armor` · armor only: `… Acid Opener on Robchew! Dmg: 119 armor` |
| 945 | Enemy hits me, `Dmg:  none` (two spaces) | `Dalvos's Astral Projection #16478309: Dalvos Blast Wall on Robchew! Dmg:  none` (likely fully absorbed or mitigated, **unverified**) |
| 3 | My death | `Fae Worg #16569184: Claw on Robchew! Dmg: 23 health, 22 armor. (FATALITY!)` |
| 817 | Indirect damage on me | `Robchew: Suffered indirect dmg: -2 health` |
| 719 | My recovery | `Robchew: Recovered: 115 power` |

Tags in the full 30-day log: `(CRIT!)` 6,611 · `(EVADED!)` 3,424 · `(FATALITY!)` 5,783. Rare forms: `(Pet)` in an ability name (`Stinky #7965484: Rat Heal (Pet) 2 on Robchew!`) and `(Enhanced)` in an actor name (`Maronesa (Enhanced) #16034989: …`). Crit/evade replace the `!` after the target: `… on Cardi Bee #16549764 (CRIT!) Dmg: …`. Damage only ever shows `health` and/or `armor` (PGCombatTracker also handles `power`). No other unparsed shapes turned up.

**Your own lines are easy to tell apart:** your character appears with no `#id` (`Robchew:`). Alts too (`Faechew:` 366 lines, `Boomchew:` 12). The active character comes from the login line we already parse.

**Party members are mostly invisible.** Other players do appear with an `#id` (`Vaam #`, `Pamol #`, `StormDancer #`, `Akriex #`), but only for (a) abilities they cast **on you or your pet** (`Pamol #16549843: Relentless Hope 5 on Cardi Bee #16549764!`) and (b) their own `Recovered` / `Suffered indirect dmg` lines. Across all 30 days there are **zero** damage lines from Vaam, Pamol, StormDancer or Akriex against enemies. Enemy attacks on party members don't show either (0 `on Pamol #` / `on StormDancer #`). The log is scoped to you and your pets.

**Unattributed indirect damage is large.** Total `Suffered indirect dmg` on enemies you hit: 26-10-20 (group, with Pamol) **1,332,726** against 230,378 of your own direct damage. 26-10-23 (mostly solo) 93,715 against 62,935. It mixes your DoTs, your pet's poison stacks (`-65 health` ticks on Basilisk Controller #255955 while only Cardi Bee was fighting it) and party members' DoTs. We have to show it as a separate "indirect on your targets (unattributed)" figure and never fold it into personal DPS without a label.

### Prototype result (real data, idle gap 15 s, damage = health + armor)

26-10-23: 56 fights, auto-detected pets Cardi Bee and Doomstorm. Biggest fight at 19:57:57: 192 s, you 14,148 (73/s), pet 32,162 (167/s), taken 154, 46 kills, crits 8/90. Top abilities: Cardi Bee Bee Stab 28,709, Dampen 8,429, Bee Inject 3,125, Mark Weakness 2,262.
26-10-20: 86 fights, pets Cardi Bee, Doomstorm and Tornado. At 19:17:12: 90 s, you 19,735 (219/s), pet 50,848 (564/s).
(Script: scratchpad `proto.py`, about 70 lines of stdlib Python.)

## Game settings (from `GorgonSettings.txt`, same folder)

Current values on this Mac:

```
combatLog_MeAttackEnemy 2      combatLog_EnemyAttackMe 2
combatLog_PetAttackEnemy 2     combatLog_EnemyAttackPet 2
combatLog_MeIndirectlyDamaged 2  combatLog_PetIndirectlyDamaged 2
combatLog_EnemyIndirectlyDamaged 2
LogNonAttacks 1   VIP_CombatLogging 1   (plus LogChat 1 for the chat log itself)
```

- The key names suggest one toggle per line category. `LogNonAttacks` probably controls the non-damage ability lines (buffs, `Sic 'Em`, `Lope`). What the levels 0/1/2 mean is **unverified**: our only data point is "2 = full lines with damage numbers". The guess is 0 off, 1 reduced, 2 full. Confirm in game before telling friends a level.
- Official patch notes, Update Notes April 14, 2026 (Steam news, app 342940): "Move Chat Log settings from VIP to GUI". So the chat log controls now live under Settings → GUI. Our README already says GUI → "Log All Chat" for the chat log. **Unverified:** where the combat-log levels now sit in the UI, and whether VIP is still needed for `[Combat]` lines. PGCombatTracker's README (written before April) says "VIP subscription … is required for ChatLogs to contain Combat lines", and MultiTool and PG-Alerts also say VIP. The key is still named `VIP_CombatLogging`. Friends without VIP should test this.
- No separate combat log file exists. The game folder holds only `Books/ ChatLogs/ GorgonSettings.txt Reports/ Screenshots/ Unity/`. `~/Library/Logs/Elder Game/Project Gorgon/Player.log` has `entity_N: OnAttackHitMe(<ability>). Evaded = False` (13,086 lines today) with **no damage numbers and no attacker**, plus sound/particle noise. It is useless for DPS.

## Community tools

| Tool | Source | DPS method |
|---|---|---|
| **PGCombatTracker** (TheJebForge, Go/GioUI, last push 2026-05-19) | Chat log `[Combat]` + `[Status]` (XP, loot) | Per subject (you + pets) and per skill (levels stripped by default). DPS = total damage ÷ seconds since the first hit, reset after **15 s** of no damage (`SecondsUntilDPSReset`, ticks every 2 s). Damage = health + armor + power. Pets: name in a configurable list (Summoned Golem Minion, Tornado, Doomstorm, Fire Wall, sigils, traps…) or `(Pet)` in the ability. **All indirect damage on non-pets goes to the user**, which overstates it in groups. Has user-placed time markers for segments (dungeon start/end), image export for Discord, and a realtime file-follow mode. No party DPS. |
| **Project Gorgon MultiTool** (Moicanox, C#/.NET 8 WinForms, Windows-only, 0.1.0 beta; the repo has only a README) | Chat log (needs VIP + chat log per its README) | DPS overlay: current DPS, total, player vs pet, current target, optional damage taken. Fight history (duration, total, player/pet share, last target, avg DPS) and fight details (sources, skills, recent hits). How it splits fights isn't public. |
| **PG-Alerts** (Xcel77, Python/Tk, Windows exe) | Chat log | No DPS. Only XP gain toasts (`[Status] You earned N XP in …`), loot and chat alerts. |
| **glogger** | Chat log for deaths; Player.log for most else | No DPS (see TL;DR). Its Death tracker keeps the last 10 `DamageOnPlayer` events before a `(FATALITY!)`. |

Windows vs Mac: every tool parses the same `[Combat]` text, and the line format here matches the examples in glogger's and PGCombatTracker's parsers (Windows-built). So the format is shared. Only the folder path differs per OS. A friend on Windows could already use PGCombatTracker or MultiTool today. Ours would be the Mac option, or cross-platform if the web UI is pointed at their log folder.

## Proposed design for Gorgon Notes

**Parser (server.py, stdlib):**
1. Match only `\t[Combat] ` lines: `^(?P<ts>\d\d-\d\d-\d\d \d\d:\d\d:\d\d)\t\[Combat\] (?P<actor>.+?): (?P<rest>.*)$`.
2. In `rest`:
   - `Recovered: …` → heal.
   - `Suffered indirect dmg: -N health[, -N armor[, -N power]]` → indirect.
   - Otherwise an attack: `^(?P<ab>.+?) on (?P<tgt>.+?)(?: \((?P<tag>CRIT|EVADED)!\)|!)(?: Dmg: (?P<d>.*))?$`. `d` is `none`, or `N health`/`N armor` in any combination, then an optional `. (FATALITY!)`.
   - Strip ` #\d+` for display names and ` \d+$` for ability grouping (keep the raw text for levels).
3. Sides:
   - **me** = the active character (no `#`).
   - **pets** = `#` entities that deal damage to a target **you** also damaged that day, plus PGCombatTracker's known-summon list and the `(Pet)` tag. This found Cardi Bee, Doomstorm and Tornado with no config.
   - **enemies** = anything that hit me or a pet, or that me or a pet hit.
4. **Fights.** A fight opens on the first damage event involving me or a pet (dealt or taken) and closes after **15 s** with none (the same default as PGCT; make it configurable). Duration = last − first + 1 s, so 1 s fights don't divide by zero. Hide fights under about 5 s or 500 damage by default.
5. Per fight, keep:
   - me/pet damage (health and armor separately, plus the total)
   - per-ability rows (count, total, max, crit %, evade %)
   - damage taken by ability and enemy
   - kills (FATALITY from me or pet), deaths
   - **indirect on fight targets (unattributed)**: shown in full when solo, flagged "may include party DoTs" when `[Party]` chat or party buffs on you occurred in the window
   - top targets
6. Cache by log file mtime, as the session parser already does. Today's log has 3.5k combat lines; the biggest day, 26-05-03, is 8 MB. A full parse is well under a second.

**API:** `GET /api/combat?day=YY-MM-DD&scope=day|login` → `{ fights:[{start,end,dur,me:{dmg,dps,health,armor},pet:{…},taken,kills,deaths,crit,abilities[],targets[],indirectUnattributed}], totals, pets[], health:{…} }`. `GET /api/combat/live` → a rolling 15 s window for the HUD (or reuse `/api/tail`).

**UI:**
- A **Combat** section inside the existing **Session** view, or a new `#combat` tab.
  - Fight list (time, duration, DPS, total, kills).
  - Click a fight to open its breakdown table: ability bars, a me/pet split, damage taken by enemy.
  - "Copy for Discord" text export, since sharing is what the friends want.
- Data-awareness footer (required by `DATA-AWARENESS.md`):
  - freshness = last `[Combat]` line time
  - fixes: "Combat logging off or reduced: turn the combat log categories to full (2)" when any `combatLog_*` < 2, and "No combat lines today: chat log on?"
  - a standing note: "Party members' damage isn't in your log; each friend needs their own copy."
  - The `/api/health` `combat-logging` check already exists. Tighten it to "all categories = 2".

**Mac app HUD (later):** a small borderless, always-on-top, click-through `NSPanel` in `main.swift` that polls `/api/combat/live` every 1 s. It shows current DPS (me / pet), the fight timer and the target. Toggle it from the menu bar. Note: a macOS overlay above a full-screen game needs the game windowed or borderless. **Unverified** how PG's Mac client behaves full screen.

**Group DPS path (optional, later):**
- Each friend runs the tool and exports a fight summary (JSON or Discord text) that we merge by matching fight time windows and shared enemy `#id`s. Entity ids are per server, so the same mob should carry the same `#id` in every log. That is **unverified** and worth checking with one friend's log.
- A shared web endpoint would be a later, networked feature, outside the stdlib-local scope.

## Effort (rough)

| Piece | Effort |
|---|---|
| Parser + fight segmentation + `/api/combat` + tests on real logs | 0.5–1 day |
| Combat view in Session (list + breakdown + Discord copy) + health footer | 1 day |
| Live endpoint + Mac HUD panel | 1–1.5 days |
| Multi-log merge for group reports | 1–2 days, after verifying entity ids match across clients |

## Open questions

1. What do `combatLog_*` levels 0/1/2 mean, and where are they in the UI since the April 14 2026 GUI move? Is VIP still needed for `[Combat]` lines? (Ask a non-VIP friend to check their log.)
2. Does `Dmg:  none` mean fully absorbed (count as a hit for 0) or immune?
3. Do party members' attacks really never log, even at higher levels or with `LogNonAttacks`? Our settings are already at 2/1, so it looks like a game rule.
4. ~~Are enemy `#id`s identical across two players' logs for the same mob (needed for a group merge)?~~ **Yes (26 Oct 2026, a friend's log).** Akriex's `Chat-26-10-25.log` (Windows, timezone -05:00) against Robchew's for the shared session 14:13 to 16:03 (+01:00): the same entities carry the same ids in both logs (`FaeJord #1419401`, `Icebrg #1421694`, `Ratkin Fishtender #1406158`), 11 enemy ids are in both logs' fights, and 5 of the 22 time-overlapping fight pairs share at least one. The small overlap is expected: a log only names the mobs its owner hit or was hit by, and a party of five spread through Rahu Sewers fights different mobs. So ids confirm a match when they appear, and the merge stays time + roster based (`party_merge`, `byIds` as the chip). Also confirmed there: **a party member's hits never appear in your log**: Akriex's log shows Robchew only as `Robchew #1419644: Recovered …` / `Suffered indirect dmg` and emotes, never a damage line (the design's premise). Clocks agreed within 2 s ("Robchew joined" 08:13:25 there, 14:13:23 here). Tool: `tools/compare-logs.py`.
5. Total DPS: health + armor (what PGCT does), or health only? Show both, default to health + armor.
6. Can a DoT be credited to an ability? Indirect lines carry no source. A heuristic could tie ticks to the last DoT ability you or your pet put on that target (e.g. Bee Poison Vuln), but treat that as approximate.

## Addendum 2026-10-23: autopsy reports (party damage)

The user pointed out that glogger (or a fork) may get per-player damage from **autopsy** data. Findings:

- **The game does provide party damage this way.** A successful autopsy (Pathology skill, Autopsy Kit) shows who killed the monster and how much damage each player did; higher Pathology also shows armor damage per player (wiki: "Elder Game: Field Autopsies" dev post, Pathology page). Anyone can view the corpse's autopsy report afterwards.
- **It isn't in the chat log.** 30+ days of logs have 447 `[Status] You botch the autopsy!` lines and zero report lines, so a successful autopsy writes nothing to chat. The report appears in the corpse's talk window.
- **glogger reads that window from Player.log.** Its HANDOFF.md: killer/damage data "would come from the `ProcessTalkScreen` corpse body (see the Python reference's `damage_log`)". Current glogger (both `danielout/glogger` and `Glogger-Team/glogger`, the active repo, checked 2026-10-23) doesn't implement it yet; its kill table leaves `killing_ability`/`health_damage`/`armor_damage` empty. Forks checked (`crisp-oddio/glogger-oddio`, `lazyassadmin/glogger`, `Aestiel42/glogger-fork`) show no autopsy/DPS commits. A "Python reference" with `damage_log` exists somewhere (not found yet).
- **Blocked on this Mac, same as the other LocalPlayer features:** our `Player.log` (47 MB today) has 0 `TalkScreen` / `Process…` lines and 0 `LocalPlayer` lines.
- Player: Pathology 51, Anatomy 54 (export 2026-10-23). Every autopsy in the logs is a botch.

**Verdict update:** party/group damage is *possible in the game* via autopsy reports, but only for clients that write `ProcessTalkScreen` to Player.log (Windows, per glogger). For us it joins the "Does the Mac client ever write `LocalPlayer: Process…` lines?" open question (ROADMAP). Personal DPS from `[Combat]` lines stays the buildable path on Mac.

**Status 2026-10-23:** on hold until the user's friend shares their glogger fork (which may already read autopsy damage). Next step then: inspect that fork's source for `TalkScreen`/autopsy parsing and its data source.

## Addendum 2026-10-24: "glogger's DPS stopped working after the update"; is the data still in files?

User report: people say glogger (or a fork) no longer gets damage/DPS data since the last game update. Checked on 2026-10-24:

- **Likely cause found in the official notes.** The 2026-10-21 "Halloween Update" patch notes (Steam news, appid 342940) list: *"Remove excessive client logging to Player.log"*, and in the surveying section warn that log-reading add-ons *"may need revising due to changes in player logging"*. glogger's Death Tracker, live inventory, drop-rate DB etc. all read `Player.log` (its README), so a Player.log cut-down is the obvious break. glogger itself (now `Glogger-Team/glogger`, v1.3.8–v1.4.0 on 23 Oct) shipped no autopsy/DPS feature and its releases/issues mention no Player.log breakage; its HANDOFF.md no longer mentions `ProcessTalkScreen` at all. The DPS people talk about is therefore a fork or another tool (PGCombatTracker / MultiTool read the chat log, which the update did not change).
- **Mac Player.log, re-checked:** `Player-prev.log` (13 MB, 24 Oct) has `ProcessFavorUpScreen` / `ProcessSetHate` / `GenerateLocalPlayerJson` only inside exception stack traces (`at AreaCmdProcessor_NewGui.ProcessFavorUpScreen (...)`), never as event lines. So the 23 Oct statement "0 Process… lines" stands in substance: the Mac client writes no `LocalPlayer: Process…` events, before or after the update.
- **New lead: the Books folder.** `GorgonSettings.txt` has `BookSaveToFile = 1` and `VIP_BookMode = 1`, and the game writes text windows to `~/Library/Application Support/unity.Elder Game.Project Gorgon/Books/<Kind>_<yymmdd>_<hhmmss>.txt`: seen kinds `NewQuest…`, `CompletedQuest…`, `GuildMotd`, `LoreBook_<id>`, `DruidRewards`, `PovusNightlyNotice`, `YouWonARaffle` (23 files, Apr–Oct 2026, HTML-ish text with `<i>` tags). Whether a successful autopsy report is saved there is **unknown**: all 461 autopsies in 30+ days of chat logs are `You botch the autopsy!` (Pathology 51), so no success has ever been observed on this Mac.
- **Test in progress:** `tools/autopsy-probe.sh before` snapshot taken 2026-10-24 18:02; the user kills low-level mobs and autopsies them; `tools/autopsy-probe.sh after` diffs Books/, Player.log and the chat log. Outcomes: (a) a `Books/` file with per-player damage → party DPS is buildable on Mac from files, no Player.log needed; (b) only chat lines → personal only; (c) nothing on disk → autopsy data is UI-only now, for everyone.

## Status 2026-10-24 (evening): personal DPS meter built

User decision: build personal DPS now; party DPS stays out until a per-player source exists on Mac. Built: `server.py` `DpsTracker` + `GET /api/combat` (incremental read of the live log, 15 s gap, you vs pets by the behaviour heuristic above, per-ability rows, damage taken, kills, deaths, kill mechanics, unattributed indirect), the **Combat** view (`#combat`: At a glance with the live per-second figure, Fights pane, Breakdown by ability / what hit you, Copy for Discord), the sixth rail item and the Mac menu item (⌘2). Spec in `DESIGN.md` → Views → Combat and Server contract. Not built from the design above: the per-second timeline, the Mac HUD panel, DoT attribution, the multi-log group merge. Open questions 1 to 6 stand; 5 is answered by showing health + armor as the figure with health and armor kept separately in the API.

## Ground truth: an in-game autopsy against the app (26 Oct 2026, 18:08)

The user opened the corpse of Timothy Elerimon (Kur Caves, killed 18:08:42, "Organs liquified by poison", killer Robchew) and sent the Detailed Analysis: Akriex 7,224 health / 2,908 armor; Robchew 1,516 / 391; Cardi Bee 7,630 / 2,991. The chat log and the app for the same kill:

| Attacker | Autopsy health / armor | Log, direct hits on Timothy (health / armor) | Gap |
|---|---|---|---|
| Robchew | 1,516 / 391 | 391 / 391 (Grappling Web 7; Gripjaw, Terrifying Bite, Spider Bite logged "Dmg: none") | 1,125 health |
| Cardi Bee | 7,630 / 2,991 | 5,605 / 2,991 (Bee Stab ×2 crit, Bee Inject 7) | 2,025 health |
| Akriex | 7,224 / 2,908 | nothing (a party member's hits never appear in your log) | all |

- **Armor matches to the unit** for both of ours, so direct hits are logged completely and the app's per-ability figures are right.
- **The health gap is damage over time.** The log has 32 `Timothy Elerimon #2147529: Suffered indirect dmg` ticks on him, 4,421 health + 312 armor, with no source. The autopsy assigns 1,125 of it to Robchew and 2,025 to Cardi Bee (poison from Spider Bite and Bee Inject); the remaining 1,271 health + 312 armor must be Akriex's. The app shows the whole fight's unsourced ticks as "Indirect on targets, source not logged: 6,059 (others nearby)" under the Breakdown, which is the honest line, but it cannot put them on a name.
- **Units differ:** the app's "damage" is health + armor in one figure (Timothy's row in the fight: 9,378 = Robchew 782 + Cardi Bee 8,596 direct); the autopsy lists health and armor apart.
- **The fight is wider than the corpse:** the app's fight (18:08:02, 40 s) spans Insatiable Werewolf, Timothy, Crazed Alpha and Bloodthirsty Werewolf, 24,689 in all; the party room merged it with Akriex's 19,802 from their copy. There is no per-target × per-attacker table yet, so the Timothy-only comparison above was done from the log by hand.

What this makes possible later (ROADMAP): a per-target split in the Breakdown (attacker × target, with the unsourced ticks per target), and DoT attribution: each copy knows which of its own DoTs it applied to a target (abilities.json carries the DoT amounts), so the room could split a target's indirect ticks between members by their applied DoTs. This autopsy is the calibration case: 3,150 of 4,421 health ticks belong to this log's owner.

