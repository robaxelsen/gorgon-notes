# UX pattern research: onboarding, progressive disclosure, and effortless group damage meters

Researcher brief (phase 1, 30 Oct 2026). Sources were read with WebSearch/WebFetch on 30 Oct 2026; where a primary page refused the fetch (Archon/FFLogs/Warcraft Logs help pages, Jackbox support, Discord support return 403 to the fetcher) the claim rests on the search-result excerpt and is marked **(excerpt)**. Vendor marketing (Candu, Chameleon, 925studios, Supademo, Appcues) is marked **(vendor)** and used only for descriptions of what a product does, never as evidence that a pattern works.

The app under review: Gorgon Notes, `static/index.html` (8 rail views, `index.html:53-88`), `static/app.js` (5,803 lines), `static/app.css`, `server.py`, `cloud/src/worker.js` + `cloud/src/everyone.html`. Screenshots read: `design/screenshots/combat-1440-dark.jpg`, `combat-nolog-1440-dark.png`, `session-1440-dark.png`.

---

## 0. Summary of what the research says, mapped to the two problems

**Problem 1 (overwhelming; a newcomer can't tell what is worth using or how to start).** The literature is unanimous on three points and the app currently violates all three in its default state:

1. *The first screen is a statement of what matters.* "The very fact that something appears on the initial display tells users that it's important" (Nielsen, NN/g 2006). Gorgon Notes opens on Session with six windows plus the health margin plus an 8-item rail, every one at equal weight (`session-1440-dark.png`). Nothing says "start here".
2. *Teach in context, not up front.* Apple HIG: "Consider providing a collection of context-specific tips instead of a single onboarding flow"; NN/g 2023: "Tutorials interrupt users, don't necessarily improve task performance, and are quickly forgotten"; NN/g 2014 on coach marks: users "dismiss them quickly and do not read thoroughly". So: no welcome tour, no modal. Instead, make each empty state do the teaching (NN/g 2021: status + learning cue + direct pathway), which the app already half-does (every window has a footer with the fix) but at the wrong altitude (the fix sits in the margin and the footer, the view's lead sentence doesn't point at it).
3. *Dense pro tools get calm by being opinionated, not by being configurable.* Stripe's home has five fixed headline numbers and no widget grid; "an opinionated home screen is more useful than a configurable one" (925studios, vendor, but consistent with Stripe's own docs: the homepage "gives users a quick overview… and routes them to core workflows"). Grafana's own guidance: "A dashboard should tell a story or answer a question", "Dashboards should reduce cognitive load, not add to it", hierarchical drill-down, "general to specific". Linear's 2024 redesign goal, in their words: "reduce visual noise, maintain visual alignment, and increase the hierarchy and density of navigation elements". The app's own PRODUCT.md principle 3 ("Answer the question first… one sentence; detail follows") is the same rule; the gap is execution: the Session view has one finding sentence and then 6 equal windows, the rail lists 8 equal views, and the health margin repeats the same storage-export warning on every view (`combat-1440-dark.jpg`, `session-1440-dark.png`).

**Problem 2 (Combat / group damage).** Every effortless group meter in other games gets there one of two ways, and Gorgon Notes can only use the second:

- *The client already has everyone's data* (WoW combat log is raid-wide within range; Lost Ark meters read packets; Blizzard now ships a built-in meter). Not available: a Project: Gorgon log holds only its owner's hits (`docs/DPS-FEASIBILITY.md:104`, verified 26 Oct against Akriex's log).
- *Each player's tool broadcasts its own numbers and the tools find each other by the game's own group* (ESO: LibGroupCombatStats over the ZoS Broadcast API; "Join a group using HodorReflexes or a similar addon… to start viewing shared data"; no code, no room, no signup; the group *is* the room). This is the model to copy. The app already has 80% of the plumbing: the chat log names the hunting party (`DESIGN.md` → Combat → "Party per the chat log"), every copy already posts every closed fight to the `everyone` feed without a code (`server.py` `everyone_publish`, `cloud/src/worker.js:13-17`), and the feed already merges by time + roster. What is missing is the *last mile*: the Combat view itself should show "your party, side by side" automatically from the roster the log saw, with no "New code / Join" step, no second website, and the party code demoted to an "advanced: private room" option. Codes (Jackbox) and links (Discord, Excalidraw) are the fallback for when the game gives you no group identity; here the game does.

What a "grandmother" flow needs, from the sources: one screen, one sentence that says what is happening now, one primary button at most, status for every prerequisite with the exact in-game click, and nothing to type. Section 5 gives the concrete flow.

---

## 1. Onboarding and progressive disclosure: what the leaders and the research say

### 1.1 Progressive disclosure (NN/g, Jakob Nielsen, 3 Dec 2006)
Source: https://www.nngroup.com/articles/progressive-disclosure/

- "Initially, show users only a few of the most important options." Secondary options go behind one clearly labelled control ("Advanced").
- "the very fact that something appears on the initial display tells users that it's important" — the initial display is a prioritisation statement.
- Two levels is the practical maximum; three or more "typically have low usability because users often get lost". If you need three, simplify first.
- *Staged disclosure* (wizards) "is useful when you can divide a task into distinct steps that have little interaction".
- Warning both ways: the first screen must still hold everything frequently needed, or "users get bogged down by excess navigation".
- How to pick primary vs secondary: frequency-of-use data plus task analysis, not opinion.

**Map to the app.** The rail shows 8 peers (`index.html:53-88`): Session, Combat, Vendors, Storage, Character, Files, Teleports, Statehelm. By the app's own PRODUCT.md, the owner's jobs are: what did this session earn, where can I sell, where is storage room, how am I hitting. Files (a JSON tree), Teleports (a wiki table) and Statehelm (a weekly gift counter) are reference/utility, not daily. The rail should carry two tiers: the four daily answers, then a dimmer "More" group (Files, Teleports, Statehelm, Settings). That is one level of disclosure, within Nielsen's limit. Inside views the same rule: Combat's primary window is Fights, but the Party window below it carries five controls (`index.html:213-236`: New code, code field, Join, Copy code, Leave, Connect Discord, Cancel, Remove, paste box), all visible at once in the not-joined state.

### 1.2 Empty states (NN/g, Kate Kaplan, 19 Sep 2021)
Source: https://www.nngroup.com/articles/empty-state-interface-design/

Three guidelines, each with a quotable line:
1. Communicate system status: "Totally empty states cause confusion about how and whether the system is working." Distinguish loading / finished-with-nothing / error.
2. Provide learning cues in context ("pull revelations", DataDog's "Star your favorites to list them here"), not forced tutorials.
3. Provide *direct pathways* to the key task: a button or link to the actual step, not just a sentence that describes the step. The anti-example: "Send a request to view details" with no link.
- "Do not default to totally empty states." "Don't let empty-state design be an afterthought."

**Map to the app.** The app's empty states are good on (1) and (2) and weak on (3), for a structural reason: the fix is a game action, not an app action, so there is nothing to click. The leaders' answer in that situation is still a pathway: a *verifiable* step with a live confirmation ("we'll see it the moment the game writes it", then a check mark when it does). `combat-nolog-1440-dark.png` shows the finding "No chat log to read… Turn on chat logging and the meter starts with your first hit" **and** the margin's red "Log All Chat / In game: Settings → GUI → Log All Chat" **and** two window footers saying the same thing: four copies of one instruction, none of them a step list, and the primary button on the screen is "Check again" (an app action that does nothing until the game acts). Recommendation in §4.2.

### 1.3 Onboarding tutorials vs contextual help (NN/g, Page Laubheimer, 12 Feb 2023)
Source: https://www.nngroup.com/articles/onboarding-tutorials/

- "Tutorials interrupt users, don't necessarily improve task performance, and are quickly forgotten." Walkthroughs are "dramatically overused"; justified only for genuinely novel interaction paradigms (AR), not for a dashboard.
- Why they fail: the paradox of the active user ("Users want to start using the product right away"), out-of-context information must be memorised, dismissing is cheaper than reading.
- Prefer *pull revelations* triggered when a signal shows the user would benefit now. Guidelines: "Make it easy to dismiss (and recall) the help content", use progressive disclosure for help itself ("Learn how" → detail), "No memorization!", "Skip the obvious stuff".

### 1.4 Instructional overlays and coach marks (NN/g, Aurora Harley, 16 Feb 2014)
Source: https://www.nngroup.com/articles/mobile-instructional-overlay/

- Users "tend to dismiss them quickly and do not read thoroughly"; "Users cannot be expected to read a manual before using your app."
- Chains of tips make the app "seem complicated enough that new users look for an alternative".
- If a hint is needed: one action per hint, at the moment it is relevant, short, visually distinct from real controls.

### 1.5 Wizards (NN/g, Raluca Budiu, 25 Jun 2017)
Source: https://www.nngroup.com/articles/wizards/

- "wizards work well for processes that are performed only occasionally", e.g. setup/configuration, and for users without domain knowledge. Not for repeated use.
- Guidelines: show all steps with the current one highlighted; pre-fill sensible defaults; "Wizard steps should be self-sufficient"; label buttons with the next step's name ("Generic labels such as Next and Previous have weak information scent"); "Allow users to exit the wizard midway and save state."

**Map to the app.** A one-time *setup check* (chat log on, combat logging full, VIP, exports present) is exactly the occasional, domain-knowledge-heavy case Budiu says a wizard is for. But because the steps are game actions, it should be a *live checklist* (each row flips to a check mark when the server sees the file/setting), not a modal wizard with Next buttons. See §4.2.

### 1.6 Apple HIG: Onboarding (updated 10 Jun 2024)
Source: https://developer.apple.com/design/human-interface-guidelines/onboarding (fetched as the `.md` variant)

Verbatim guidance:
- "Ideally, people can understand your app or game simply by experiencing it, but if onboarding is necessary, design a flow that's fast, fun, and optional."
- "Teach through interactivity."
- "Consider providing a collection of context-specific tips instead of a single onboarding flow… When you have instructional content that refers to a specific area of the interface, display these instructions near that area."
- "If it makes sense to offer a separate tutorial, consider making it optional… don't present it again on subsequent launches, but make sure it's easy for people to find if they want to view it later."
- "Postpone nonessential setup flows or customization steps. Provide reasonable default settings so most people can immediately start interacting."
- "If your app or game needs access to private data or resources before it can function, consider integrating the permission request into your onboarding flow… [show] why your app or game needs their permission and the benefits of granting it."

**Map to the app.** The one thing Gorgon Notes genuinely needs before it can function is the chat log (its "permission"). Apple's rule says that is the one request allowed up front, with the benefit stated. Everything else (exports, Discord, party room, theme, reminders) must be postponed to the moment it is relevant. Today the Reminders button, the theme switch and the character select sit in the top bar on first launch (`index.html` top bar; `session-1440-dark.png`), before the app has anything to remind about.

### 1.7 Linear
Sources: Candu teardown (vendor) https://www.candu.ai/blog/linear-onboarding-teardown ; Linear's own "How we redesigned the Linear UI" (Part II, 28 Mar 2024) https://linear.app/blog/how-we-redesigned-the-linear-ui ; changelog 12 Mar 2026 https://linear.app/changelog/2026-03-12-ui-refresh (excerpt).

- Onboarding (vendor description): 7 screens, about a minute, ends in a *ready-to-type first issue*; "No tours, no tooltips"; the workspace is pre-populated with demo projects so people learn from an ideal setup; "Each empty state teaches one concept" with a short line and a single button.
- Redesign goal in Linear's words: "to reduce visual noise, maintain visual alignment, and increase the hierarchy and density of navigation elements"; "It's always better to do a redesign quickly."
- 2026 refresh (excerpt): "navigation sidebars are slightly dimmer, allowing the main content area to stand out."

**Map to the app.** Two transferable rules: (a) *land on something real, immediately*: a newcomer with a chat log should land on a screen already showing their fights or XP, never on a welcome; (b) *one concept per empty state, one button*: the Party empty copy today is a 60-word paragraph describing a 4-step procedure for two different people (`app.js:1666`). Linear would make it one line and one button.

### 1.8 Stripe dashboard
Sources: 925studios breakdown (vendor) https://www.925studios.co/blog/stripe-dashboard-design-breakdown ; Stripe docs https://docs.stripe.com/stripe-apps/design ; Katie Dill on the 2026 homepage (excerpt).

- Home = five fixed headline metrics with sparklines and the previous period in small text; "no chart grid, no adjustable widget layout, and no 'add metric' button"; "Stripe's dashboard optimizes for decision speed."
- Colour reserved for status (green/red/yellow) so red keeps meaning "attention required". "The fact that it does not feel anxious is the product."
- Stripe's docs: the dashboard homepage "gives users a quick overview of their business and routes them to core workflows".
- Dill on the 2026 homepage (excerpt): a bento grid with hover reveals used as progressive disclosure "so the diverse product suite doesn't overwhelm visitors".

**Map to the app.** The app already has an "At a glance" strip per view (`DESIGN.md` → Components → At a glance). What it lacks is a *home*: one screen with 4-5 headline figures across the whole app (XP this session, damage this session, councils you can still sell for, slots free, data health) that routes to the views. Session is currently playing home by default (`app.js:5780`, `pgdash.tab` default `session`) but it is a full view, not an overview. Also note Stripe's colour rule against the current state: the health margin paints a red block (`Export Storage JSON`) on every view including Combat (`combat-1440-dark.jpg`), for a 1-day-old storage export that has nothing to do with the damage meter. Red stops meaning "attention required".

### 1.9 Grafana: dashboard best practices (official docs)
Source: https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/

- "Dashboards should reduce cognitive load, not add to it." Self-check: "How long would a newcomer need to understand it?"
- "A dashboard should tell a story or answer a question." Frame it around the question; a "Which servers are in trouble?" dashboard may only need the servers in trouble.
- Hierarchy: overview → drill-down; "logical progression… large to small or general to specific"; "Keep your graphs simple and focused on answering the question that you are asking."
- Directed navigation beats browsing: "Browsing for dashboards is the exception, not the rule."
- Use colour with intent: "blue means it's good, red means it's bad" only with thresholds.
- Avoid sprawl; review and delete dashboards nobody needs.

**Map to the app.** Each view already has a question in DESIGN.md ("Combat: how hard am I hitting, fight by fight?"). Apply the "only the servers in trouble" rule to the health margin: on Combat, show only the sources Combat depends on (chat log, combat logging, VIP); fold the storage export into the app-wide pill. DESIGN.md → Combat → "Margin sources" already says "the rest fold", but the screenshot shows the storage export expanded and red on Combat, so either the rule is not implemented or the "to do" severity overrides the fold.

### 1.10 UI density (Matthew Ström, "UI Density", 2024)
Source: https://mattstromawn.com/writing/ui-density/

- "UI density is the value a user gets from the interface divided by the time and space the interface occupies." Visual density is a poor proxy; what matters is information density (Tufte's data-ink ratio), design density (gestalt decisions that carry meaning), temporal density (speed), and value density.
- "There's an upper limit to information density, which means you can subtract too much ink, or add too much information."

**Map to the app.** The khaki ledger pane and the dense Fights table (`combat-1440-dark.jpg`) are high information density and fine for the owner. The *overwhelm* comes from design density: 3-4 copies of the same status line per screen (finding sentence, margin, every window footer, the pill) are redundant ink, not data. Cutting the repeats raises density in Ström's sense while lowering the feeling of clutter.

### 1.11 Luke Wroblewski, "Obvious Always Wins" (2015)
Source: https://lukew.com/ff/entry.asp?1945

- Hiding critical features behind drawers/toggles reduced engagement in every cited case (Polar, Zeebox, Facebook iOS, Redbooth); visible tabs raised it. "Out of sight, out of mind." The question to answer is "what's important enough to be visible?"

**Map to the app.** This is the counterweight to §1.1: do not hide the four daily views behind a "More" menu; hide only the utilities. On a phone the bottom tab bar should carry the four, not eight.

### 1.12 Checklists, "aha moment", activation
Sources: IBM Carbon "Onboard" https://carbondesignsystem.com/building-experiences/onboard/ ; Appcues docs (vendor) https://appcues.helpjuice.com/en_US/user-experiences-use-cases/different-types-of-product-tours-for-new-users ; Chameleon (vendor) https://www.chameleon.io/blog/contextual-in-app-guidance-vs-product-tours-guide ; Supademo on Notion (vendor) https://supademo.com/user-flow-examples/notion ; Appcues on Notion (vendor) https://goodux.appcues.com/blog/notions-lightweight-onboarding ; Raycast manual https://manual.raycast.com/windows/getting-started (excerpt).

- Carbon: "Give users a clear next step at every point"; "reach first value as quickly as possible"; targets like "Trial registration to trial aha moment <10 minutes", "Setup completion rate >90%". It maps contextual guidance to the "reach aha" moment and a product tour only to first login.
- Checklist guidance converges on 3-6 items, persistent, ordered by value, following "the critical path to activation" (Appcues, vendor).
- Chameleon's 72% figure for contextual three-step tours has no stated methodology (vendor); its more defensible point is that static tours "fire too early (at signup)" and that if the UI needs a tour, "fix the design instead".
- Notion (vendor descriptions): one intent question, then a workspace with a persistent checklist and demo-data templates; the Getting Started page is learn-by-doing with hover tips; ~3-6 minutes to first usable page.
- Raycast (official): a few quick onboarding steps that "introduce our core features and let you select your global hotkey"; the design commentary notes early Raycast had no onboarding at all and added a light one later.
- Superhuman: First Round Review (G. Vohra) describes one-on-one onboarding that was later folded into the product so it could go self-serve; the lesson is the *content* of those calls (what people got stuck on) became the in-product guidance, not that a human is needed. (Excerpt; the article body was not fetched.)
- Arc: multi-step colourful "unboxing"; criticised by Deceptive Patterns for a mandatory account and an unskippable password-import step. A caution, not a model.

**Activation definition for Gorgon Notes (derived).** The aha moment is *the first live number the player did not have before*: a fight's per-second figure appearing within seconds of a hit, or a vendor's councils-left. Everything on first run should drive to one of those within one in-game action. The app's own data already tells it which is closest: chat log present → Combat/Session aha is one hit away; character export present → Vendors aha is zero actions away.

---

## 2. How the best game meters make group data effortless

### 2.1 What they auto-detect vs ask (comparison)

| Tool | Where group data comes from | Auto-detected | User must do | Sharing to the group |
|---|---|---|---|---|
| **WoW Details!/Recount/Skada** (warcraft.wiki.gg "Damage meter") | The client's own combat log, which carries every raid member's events within range; meters "parse the combat log"; "non-authoritative, principally limited to the combat log range"; the 2005 "DamageMeters" "synchronized combat logs in a raid"; newer meters sync through hidden addon messages "only if several players run compatible AddOns". Blizzard now ships a built-in meter (Midnight), and addons like Ka0s read its session data rather than the log (CurseForge, excerpt). | Everything: group membership, encounter start/end, names. | Install the addon. | Nothing to do; everyone in range sees the same fight. Details! "sinks" reports from party/raid members to fill out-of-range gaps (Blizzard forum, anecdotal). |
| **FFXIV ACT / IINACT + FFLogs uploader** (fflogs.com/help/start, archon.gg uploader help, IINACT README; excerpts) | The client's network data via the ACT plugin (full party). | Encounters, zone, party. | Install ACT (or the IINACT Dalamud plugin), the FFLogs uploader, create an FFLogs account, point the uploader at the **log folder** ("we are only looking at the folder"), press Live Log. "Make sure you select the correct folder". | Live logging "upload[s] any changes after combat ends" to a report URL; the group opens the report. |
| **Warcraft Logs Companion** (warcraftlogs.com/companion, archon.gg help; excerpts) | Client combat log (/combatlog), raid-wide. | Game folder, encounter boundaries. | Account; "Advanced Combat Logging… Game Menu -> System -> Network"; press Live Log; "If running in In-game mode, you can safely close this window, and live-logging will continue." | Report URL; guild attach. |
| **Lost Ark LOA Logs** (github.com/snoww/loa-logs) | Packet capture (WinDivert); the client receives the whole raid's data. | Party, encounter, class; item level "is doing its best by guessing" if opened late. | Install; "you need to launch the meter before you select a server"; antivirus exception; no VPN. | Nothing: the live meter shows the raid. Optional upload token. |
| **ESO Hodor Reflexes / Reckon / Combat Metrics** (HodorReflexes README; LibGroupCombatStats on esoui; forum excerpts) | "ESO does not provide your client with detailed combat events for other players. Individual numbers therefore require shared combat data." Each player's addon measures itself and broadcasts via LibGroupCombatStats → LibGroupBroadcast over "the ZoS Broadcast API, which replaces older hacky methods like MapPings". | The group (the game's own group is the channel). | Install the addon + libraries (Minion does it); "Join a group using HodorReflexes or a similar addon built upon LibGroupCombatStats to start viewing shared data." | Automatic for every member with a compatible addon; "If you use a different addon that also uses this library, you'll be able to see each other's data." Non-sharers: Reckon "estimates the remainder from the target's health" (excerpt); Hodor has a "Hide Me" opt-out module. |
| **PGCombatTracker** (TheJebForge README) | Own chat log only. | Nothing automatic: "Optionally find Project Gorgon's ChatLogs folder if prompted". | VIP ("VIP subscription… is required for ChatLogs to contain Combat lines"), "Enable Save Chat Logs", "Set your Combat Logging as shown" (screenshots), then pick a log file and a marker. | Copy a tab to the clipboard; "Export File With Markers" to share the file. No party merge. |
| **Overwolf apps** (dev.overwolf.com, support.overwolf.com) | Game Events API per supported game. | Game launch (manifest `launch_events`), in-game overlay, events. | Leave the overlay toggle and the app's "Auto Launch" permission on; "Without enabled Overlay there's no auto launch." Detection sometimes needs one game launch first. | n/a |
| **Steam overlay / Rich Presence** (partner.steamgames.com ISteamFriends; Heathen KB) | Steam friends list. | Who is online, what they play. | Set the Rich Presence "connect" field → "Join Game" button on the friends list; one click; or "Invite to Game" sends a chat message. Blocked by a friend's private status. | One click, no code. |
| **Jackbox** (support.jackboxgames.com; excerpts) | Host's screen shows a 4-letter room code; players go to jackbox.tv, type the code and a name; "players don't need to create an account". Case-insensitive per guides. | n/a | Type 4 letters + name. | Everyone with the code is in. |
| **Discord invites** (support.discord.com community posts; excerpts) | `discord.gg/<code>` link opens a preview (server name, member count, Join). | n/a | Click; a new user hits username + email/phone verification (a complaint thread); a request asks for a visible "Join a server" paste box because "I don't know where to insert it in the Discord App". | Link. |
| **Excalidraw live collaboration** (plus.excalidraw.com/blog/end-to-end-encryption; one-year post) | One click makes a room id + key in the URL fragment ("Anything that's added after the # doesn't get sent to the server"); "No account creation required". | n/a | Share the link. | Link. Needs HTTPS/localhost (crypto.subtle). |
| **AirDrop / Nearby Share** (news coverage; excerpts) | Proximity discovery; recipient gets an accept/decline prompt; visibility set to contacts/everyone/hidden. | Nearby devices. | Tap a device; accept. | Proximity *is* the group. Security research shows the cost: devices answer before any prompt in "Everyone" mode. |

### 2.2 The lessons

1. **The best meters never ask "who is your group".** WoW/FFXIV/Lost Ark get it from the client; ESO gets it from the game's group via a broadcast API. A code or a link is what you use when the platform has no group concept (Jackbox, Excalidraw, Discord). Project: Gorgon's chat log *does* name the hunting party (the app already parses it: "In a party with Icebrg and Papersky, per the chat log", `DESIGN.md` → Combat → Party per the chat log). So the game's party is the room, and the current "New code → paste into party chat → Join" flow (`index.html:213-236`, `app.js:1645-1700`, README "Playing with friends") is a Jackbox pattern applied where an ESO pattern fits.

2. **Where a code is unavoidable, it is short, case-insensitive, typed, never a URL** (Jackbox: 4 letters; the app's `gn-` + 12 chars is a password, which is right for privacy but wrong for reading aloud in voice chat). Keep the long code for the private room; it should not be the default path.

3. **Auto-upload is on by default and keeps going when the window is closed** (Warcraft Logs Companion: "you can safely close this window, and live-logging will continue"; the app already does this: fights fought while closed go up at next start, `README.md:14`). This is a strength to *surface*, not hide in a `small dim` line in the Party window (`app.js:1589-1596`).

4. **The one unavoidable step is the game's own logging switch, and every tool makes it the first thing on screen with the exact click path** (Warcraft Logs: "Game Menu -> System -> Network"; PGCombatTracker: "Enable Save Chat Logs… as shown on the screenshot"). The app has the sentence (`combat-nolog-1440-dark.png`) but not the picture, and the path shown (Settings → GUI → Log All Chat) conflicts with the 27 Oct verified path for combat logging (Settings → V.I.P. → Save Chat Logs, `docs/DPS-FEASIBILITY.md:127`). PGCombatTracker ships the settings *screenshot*; a grandmother needs the picture.

5. **Non-sharers are handled, not hidden** (Reckon estimates them; Hodor shows who is sharing). The app can show the party roster from the log with a status per name ("Icebrg: sharing · Papersky: not running Gorgon Notes, invite"), which also gives the viral step every group tool relies on (Steam "Invite to Game", Discord invite): a one-click "Copy an invite line for party chat" that carries the download link.

6. **The live view is the product; the website is the archive** (FFLogs/Warcraft Logs reports are for after; Details!/Hodor are live in the client). The 29 Oct everyone page (`cloud/src/everyone.html`) is the archive; the Combat view must become the live party meter.

7. **Privacy is set once, at the moment it matters, with a default that most people want** (AirDrop contacts-only; Hodor "Hide Me"; Excalidraw keys in the fragment). The app's `shareEveryone` default-on with a "Stop sending" text link is the AirDrop "Everyone" setting. That is acceptable for fight numbers (SHARING.md says so) but it should be *stated once on first use*, Apple-HIG style ("why… and the benefits"), not discovered in a dim line.

---

## 3. How dense pro dashboards handle "overwhelming" (synthesis)

| Technique | Source | Current state in Gorgon Notes | Recommendation |
|---|---|---|---|
| **Fixed, opinionated home with 4-5 numbers; routes to workflows** | Stripe (docs + 925studios) | No home; Session is the default tab (`app.js:5780`) and is a full view | Add `#home` (or make Session's top the home): 4 tiles (Session XP, Combat damage/s, Councils to sell, Slots free) + the health pill, each tile a link. Nothing else above the fold. |
| **One question per dashboard; general → specific; only "the servers in trouble"** | Grafana | Each view has a question (DESIGN.md) but shows 5-7 windows at equal weight; the health margin lists every source on every view | Per view: finding sentence → primary window → one secondary → fold the rest behind "More on this". Margin: only the sources this view reads; the rest in the pill. |
| **Reduce visual noise; hierarchy and density of navigation; dimmer sidebar so content stands out** | Linear 2024/2026 | 8 equal rail items, each with a status mark; rail is as bright as content | Two-tier rail (4 daily + "More"), lower-contrast rail, status marks only for real problems (Stripe's "red means attention"). |
| **Show the most important options first; "Advanced" for the rest; ≤2 levels** | NN/g progressive disclosure | Party window shows code field, Join, New code, Connect Discord, paste box, Start/Stop sending all at once | Default Party = automatic (roster from the log). "Private room (code)" and "Discord" behind one "Sharing options" disclosure. |
| **Empty state = status + cue + direct pathway, one concept, one button** | NN/g empty states; Linear | Multi-sentence paragraphs; no button because the fix is in-game | Status line + the in-game click path *with the settings screenshot* + "I did it" is not needed: the row flips to a check mark automatically when the file appears (temporal feedback is the pathway). |
| **No tours; context-specific tips; postpone nonessential setup; defaults** | Apple HIG; NN/g 2023/2014 | No tour today (good); but Reminders, theme, character select, Discord, party code are all first-screen | Keep no tour. Move Reminders/theme into "More"/settings until there is something to remind about. |
| **Status colour reserved; healthy is quiet** | Stripe; PRODUCT.md principle 5 | Red "Export Storage JSON" block on Combat for a day-old storage export | Severity by *relevance to this view*: on Combat a stale storage export is grey text in the pill, never a red block. |
| **"Obvious always wins": keep the critical few visible** | LukeW | Bottom tab bar on phone has 8 items | 4 + More. |
| **Information density ≠ visual clutter; cut redundant ink** | Ström | Same status in finding + margin + 2-6 footers + pill per screen | One place per fact: the window footer keeps the stamp; the margin keeps the fix; the finding sentence stops repeating the fix. |

---

## 4. Concrete, cited recommendations for Problem 1 (overwhelm; newcomer orientation)

### 4.1 First launch: land on real data, no welcome (Apple HIG; Linear; NN/g 2023)
- Boot logic (`app.js:5780`): choose the landing view by *what the server can already answer*, not a remembered tab. Chat log present → Combat if there was a fight in the last 15 min, else Session. No chat log, but an export → Vendors. Nothing → the setup checklist (§4.2) *as the view*, not a modal.
- The first sentence on screen is the finding sentence the views already have (`#finding`, `app.js:755`, `app.js:1813`): keep it, make it the only paragraph above the primary window.

### 4.2 The setup checklist: a live, 3-4 row checklist, never a wizard with Next buttons (NN/g wizards; NN/g empty states; Apple "permission in onboarding with the benefit"; Carbon "clear next step at every point"; Warcraft Logs / PGCombatTracker making the logging switch step one)
Rows, in order of value, each with a status mark that flips by itself when the server sees the result (the Reminders/health model already computes these: `GET /api/health` verdicts `chat log`, `combat logging`, `character export`, `storage export`, `VIP`):
1. **Save chat logs** (gives Session + Combat): in-game path, *with the verified settings screenshot* (`docs/DPS-FEASIBILITY.md:127` says the user's screenshot exists; only verified paths, per CLAUDE.md), "we'll see it the moment the game writes the first line" → check mark + "Seen at 18:44".
2. **Combat logging at full** (gives per-ability numbers): same treatment; the server already reads `combatLog_*` levels.
3. **Export Character JSON** (gives Vendors, Character): VIP menu path; check mark on arrival (the server already detects `[Status] Saved report to …`).
4. **Export Storage JSON** (gives Storage, Sell plan).
Rules: 3-6 rows (checklist guidance), persistent until complete, then collapses to one line in the health pill; "easy to find again" (Apple) via the About/More menu; each row self-sufficient (Budiu); one row = one concept (Linear). This replaces the four-way repetition in `combat-nolog-1440-dark.png`.

### 4.3 Information architecture (NN/g progressive disclosure; LukeW; Linear)
- Rail (`index.html:53-88`): tier 1 Session, Combat, Vendors, Storage (the four PRODUCT.md jobs); tier 2 under a dimmer "More": Character, Files, Teleports, Statehelm, Settings (theme, reminders, sharing). Two levels, within Nielsen's limit; the four stay visible (LukeW).
- Status marks on rail items only for *missing/broken* (red), never for "stale but fine" (the current ▲ on Vendors/Storage/Files on a healthy day, `session-1440-dark.png`).
- Phone bottom bar: the same four + More.

### 4.4 Per-view hierarchy (Grafana; Stripe; PRODUCT.md principle 3)
- Order inside every view: finding sentence → At a glance (≤5 tiles, Stripe) → one primary window → fold secondary windows under their own title bars (collapsed by default on first run, remembered after). Session today stacks Experience, XP by skill, Level-ups, Councils, Combat, Loot, What happened, Chat log, Here: nine windows. Keep Experience + What happened open; collapse the rest with their count in the title ("Loot · 2").
- Health margin per view shows only that view's sources (DESIGN.md → Combat → "Margin sources… the rest fold" is the rule; `combat-1440-dark.jpg` shows it not holding when a folded source is "to do"). Everything else lives in the pill, which already exists.

### 4.5 Copy altitude (NN/g: "Skip the obvious stuff", "No memorization"; Linear one-concept)
- Cut every sentence that explains the app's mechanics on a healthy screen ("The meter starts with your first hit", "Trainers don't keep office hours") into the window's hover/`title` or the empty state only. Keep the game's dry voice (DESIGN.md Voice) for empty states, where it earns its place.

### 4.6 What *not* to do (sources)
- No product tour or coach-mark chain (NN/g 2014/2023; Apple).
- No mandatory account/sign-in step and no unskippable import (Deceptive Patterns on Arc).
- No configurable widget grid (Stripe): decide the home.
- Do not hide the four daily views behind a hamburger (LukeW).

---

## 5. Concrete, cited recommendations for Problem 2 (Combat: the grandmother flow)

### 5.1 Model: ESO's broadcast, not Jackbox's code (HodorReflexes; LibGroupCombatStats; warcraft.wiki.gg)
Make the game's own party the room:
- The server already knows the roster from the log (`DESIGN.md` → Combat → "Party per the chat log": `inParty`, `party`) and already posts every closed fight to the `everyone` feed with no code (`server.py` `everyone_publish`; `cloud/src/worker.js:13-17`; `cloud/src/everyone.html` merges by `party_merge` + roster).
- New last mile: the Combat view polls the everyone feed *filtered to the roster the log named for the current run* (the feed already supports `after=`; add a `players=` filter or filter client-side) and renders the party table inside the Combat view with no join step. The Party window's own code-room stays as "Private room" under a disclosure (NN/g: "Advanced"), for the case two parties share a cave or someone wants privacy from the public feed.
- Match by roster + time, as `party_merge` already does; show "same enemies" when ids match (`docs/DPS-FEASIBILITY.md:197`).

### 5.2 The screen a grandmother sees (Apple "teach through interactivity"; NN/g empty states; Linear one-button; Stripe one primary number)
State machine, one sentence + at most one button each:
1. **No chat log** → the §4.2 checklist row 1 *is* the Combat view, with the settings picture. No "Check again" button (it is a no-op until the game acts; the row flips by itself).
2. **Chat log, no fight yet** → "Hit something. The meter starts with your first hit." (already the copy, `DESIGN.md` → Combat "Quiet"). Nothing else visible.
3. **Solo fight** → the live per-second figure, big (Stripe headline), fights table under it. No Party window at all when the log names no party (NN/g: don't show what isn't relevant).
4. **In a party per the log** → a "Your party" window appears *by itself*, listing every name the log saw, with a status per name: "sharing · 46,310" / "not running Gorgon Notes" + one button: **Copy an invite line** (Steam "Invite to Game"; Discord invite) that puts "I'm using Gorgon Notes to see our damage together: <download link>" on the clipboard for party chat. That is the only typing anyone does, and the newcomer does none.
5. **First time fights go to the public feed** → one dismissable line, once, Apple-style with the benefit: "Your fight numbers and character names go to the shared fights page so your party can see them without setting anything up. Stop sending" (today's `everyoneLine`, `app.js:1589-1596`, says this in `small dim` on every render; say it once, larger, then fold).
6. **After the run** → "Post this run to Discord" only if Discord is connected; else the button reads "Connect Discord" and does the picker (already built, `app.js:1611-1623`). Disclosed only after a shared run exists, not on first launch.

### 5.3 What to auto-detect (from the comparison table)
- Game folder (already), log presence (already), combat-logging level (already via `/api/health`), VIP (already), **party roster** (already parsed; promote it to the driver of the party table), run boundaries (already: same area, ≤15 min gap), friends' copies (new: the feed tells you which roster names posted in the last N minutes → "sharing"/"not sharing").
- Nothing to ask except the one Apple-sanctioned prerequisite: turn on logging.

### 5.4 What to keep as advanced (NN/g progressive disclosure, two levels max)
- Private room code (rename from "Party code" to "Private room", keep `gn-…`, keep paste-to-join, keep undoable Leave: all good craft from the 25 Oct critique).
- Discord connect/post.
- Paste-a-Discord-post-to-merge (`#d-pastebox`, `index.html:233`).
- Stop/Start sending.
One "Sharing options" disclosure in the party window's title bar holds all four.

### 5.5 Copy and naming (DESIGN.md voice; NN/g "skip the obvious")
- "Your party" (what the log calls it), not "Party room"/"ntfy.sh"/"everyone's fights page". The transport name never appears on the primary surface; it stays in the footer stamp per DATA-AWARENESS.
- Status per fact, once: the window footer keeps "chat log · live · last line 18:44".

### 5.6 Prerequisite verification the sources insist on
- PGCombatTracker and Warcraft Logs put the in-game logging switch first *with the exact menu path*; the app's two paths disagree (Settings → GUI → Log All Chat in the UI vs Settings → V.I.P. → Save Chat Logs verified 27 Oct, `docs/DPS-FEASIBILITY.md:127`). CLAUDE.md forbids stating game UI from memory; resolve with the user's screenshot before shipping the checklist.

---

## 6. Scoring note (target ≥ 7.5/10 against the leaders)

Using the leaders' own stated rules as the rubric (one opinionated home; ≤2 disclosure levels; teach in context, no tour; empty state = status + cue + pathway; colour only for attention; one question per screen; group data with zero typing), the current app meets: no tour (yes), status everywhere (yes), fix stated (yes), voice (yes), density of the ledger (yes). It misses: a home, tiering of the rail, relevance-scoped health, one-fact-one-place, and a code-free party. Those five changes are what move it from the "nice but lacking / overwhelming" the user describes to the 7.5 band; none needs a new dependency, and the party change is mostly a client-side filter over a feed that already exists.

---

## Sources

Primary / official
- Nielsen, J. "Progressive Disclosure", NN/g, 2006. https://www.nngroup.com/articles/progressive-disclosure/
- Kaplan, K. "Designing Empty States in Complex Applications: 3 Guidelines", NN/g, 2021. https://www.nngroup.com/articles/empty-state-interface-design/
- Laubheimer, P. "Onboarding Tutorials vs. Contextual Help", NN/g, 2023. https://www.nngroup.com/articles/onboarding-tutorials/
- Harley, A. "Instructional Overlays and Coach Marks for Mobile Apps", NN/g, 2014. https://www.nngroup.com/articles/mobile-instructional-overlay/
- Budiu, R. "Wizards: Definition and Design Recommendations", NN/g, 2017. https://www.nngroup.com/articles/wizards/
- Apple HIG, "Onboarding" (updated 10 Jun 2024). https://developer.apple.com/design/human-interface-guidelines/onboarding
- Linear, "How we redesigned the Linear UI (Part II)", 28 Mar 2024. https://linear.app/blog/how-we-redesigned-the-linear-ui ; changelog 12 Mar 2026 https://linear.app/changelog/2026-03-12-ui-refresh
- Grafana, "Best practices for dashboards". https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/
- Stripe docs, "Design your app". https://docs.stripe.com/stripe-apps/design
- Ström, M. "UI Density", 2024. https://mattstromawn.com/writing/ui-density/
- Wroblewski, L. "Obvious Always Wins", 2015. https://lukew.com/ff/entry.asp?1945
- IBM Carbon, "Onboard". https://carbondesignsystem.com/building-experiences/onboard/
- Raycast manual, Getting started. https://manual.raycast.com/windows/getting-started
- warcraft.wiki.gg, "Damage meter". https://warcraft.wiki.gg/wiki/Damage_meter
- HodorReflexes README. https://github.com/m00nyONE/HodorReflexes ; LibGroupCombatStats https://www.esoui.com/downloads/info4024-LibGroupCombatStats.html
- PGCombatTracker README. https://github.com/TheJebForge/PGCombatTracker
- LOA Logs README. https://github.com/snoww/loa-logs
- Overwolf: basic sample app https://dev.overwolf.com/ow-native/getting-started/basic-sample-app ; overlay troubleshooting https://support.overwolf.com/support/solutions/articles/9000202391
- Steamworks ISteamFriends https://partner.steamgames.com/doc/api/ISteamFriends ; Heathen Rich Presence https://kb.heathen.group/steam/multiplayer/rich-presence
- Excalidraw, "End-to-end encryption" https://plus.excalidraw.com/blog/end-to-end-encryption ; "One year of Excalidraw" https://plus.excalidraw.com/blog/one-year-of-excalidraw
- Jackbox support: "Do games require an account" https://support.jackboxgames.com/hc/en-us/articles/15794759347735 ; "How do I get started" https://support.jackboxgames.com/hc/en-us/articles/15794771245975 (excerpts)
- FFLogs "Getting Started" https://www.fflogs.com/help/start ; Archon uploader help https://www.archon.gg/ffxiv/articles/help/uploader ; Warcraft Logs Companion https://www.warcraftlogs.com/companion ; https://www.archon.gg/wow/articles/help/companion (excerpts; 403 to the fetcher)
- IINACT README https://github.com/marzent/IINACT (excerpt)
- Discord support community threads on the invite flow https://support.discord.com/hc/it/community/posts/1500001263441 (excerpt)
- First Round Review, Superhuman onboarding https://review.firstround.com/superhuman-onboarding-playbook.md ; PMF engine https://review.firstround.com/how-superhuman-built-an-engine-to-find-product-market-fit (excerpts)
- Deceptive Patterns on Arc https://deceptive.design/articles/arc-browsers-pushy-account-requirements ; Input interview on Arc's unboxing https://www.inverse.com/input/design/the-browser-company-arc-design-interview (excerpts)

Vendor / secondary (descriptive use only)
- Candu, Linear onboarding teardown https://www.candu.ai/blog/linear-onboarding-teardown
- 925studios, Stripe dashboard breakdown https://www.925studios.co/blog/stripe-dashboard-design-breakdown
- Chameleon, contextual guidance vs tours https://www.chameleon.io/blog/contextual-in-app-guidance-vs-product-tours-guide
- Appcues, product tour types https://appcues.helpjuice.com/en_US/user-experiences-use-cases/different-types-of-product-tours-for-new-users ; Notion's lightweight onboarding https://goodux.appcues.com/blog/notions-lightweight-onboarding
- Supademo, Notion flow https://supademo.com/user-flow-examples/notion
- Blizzard forum on Details! vs Recount sync https://us.forums.blizzard.com/en/wow/t/details-or-recount/899914 ; WoWInterface thread on sync restrictions https://wowinterface.com/forums/showthread.php?p=120713
- ESO forum on shared DPS https://forums.elderscrollsonline.com/en/discussion/comment/3881071
- Overwolf developer forum on detection https://discuss.overwolf.com/t/my-app-doesnt-start-on-game-startup/86

Repo files referenced
- `/Users/robaxelsen/code/pg-dashboard/static/index.html:53-88` (rail), `:189-244` (Combat view; Party window `:213-236`)
- `/Users/robaxelsen/code/pg-dashboard/static/app.js:755`, `:1813` (no-log findings), `:1589-1596` (everyoneLine), `:1611-1623` (Discord form), `:1645-1700` (renderParty; empty copy `:1666`), `:5558`/`:5780` (remembered tab / boot)
- `/Users/robaxelsen/code/pg-dashboard/server.py:1666-1668` (ROOM_DEFAULT / PG_ROOM), `everyone_publish`
- `/Users/robaxelsen/code/pg-dashboard/cloud/src/worker.js:13-17`, `/Users/robaxelsen/code/pg-dashboard/cloud/src/everyone.html`
- `/Users/robaxelsen/code/pg-dashboard/docs/DPS-FEASIBILITY.md:104`, `:127`, `:197`; `/Users/robaxelsen/code/pg-dashboard/docs/SHARING.md:3`; `/Users/robaxelsen/code/pg-dashboard/README.md:13-14`, `:73-75`
- `/Users/robaxelsen/code/pg-dashboard/DESIGN.md` → Views → Combat (lines 1288-1309), Shell (1235-1266)
- Screenshots: `/Users/robaxelsen/code/pg-dashboard/design/screenshots/combat-1440-dark.jpg`, `combat-nolog-1440-dark.png`, `session-1440-dark.png`
