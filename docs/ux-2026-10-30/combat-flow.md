# Combat and sharing flow, traced end to end (code reader, 30 Oct 2026)

Scope: what a player must do today to (a) see their own damage meter and (b) see their party's damage together, with every step, control, term and failure message as the code writes it; then what is technically possible for a plug-and-play flow with the pieces that exist. Everything below is read from the repo at `/Users/robaxelsen/code/pg-dashboard` (HEAD `68f89da`, v0.11.0) and from GET requests against the live server; nothing was posted or written.

Files: `server.py` (5,177 lines), `static/app.js` (5,803), `static/index.html` (533), `cloud/src/worker.js` (261), `cloud/src/everyone.html` (268), docs as cited.

---

## 0. The pieces, in one table

| Piece | Where | Transport | Needs | Who sees it |
|---|---|---|---|---|
| Personal DPS meter | `server.py` `DpsTracker` 961–1438, `GET /api/combat` 4974; `static/app.js` `renderCombatView` 1796 | local only | chat log + combat logging in the game | you |
| Party window (code room) | `server.py` `party_*` 1654–2354; `app.js` 1376–1785; `index.html` 213–240 | Cloudflare Worker DO per code (`ROOM_DEFAULT` 1667), ntfy.sh fallback (1656, 1974–2009) | each member runs the app, one shared code | anyone with the code |
| Everyone feed + page | `server.py` `everyone_*` 1865–1931; `worker.js` 55–66, 115–153; `everyone.html` | the same Worker, DO named `everyone` | nothing: on by default (1874–1876) | anyone with the URL (public) |
| Discord: Connect a channel | `server.py` 2410–2449; `worker.js` 171–261; `app.js` 1611–1643, 1725–1750 | Worker brokers an OAuth2 `webhook.incoming` exchange | a Discord account with Manage Webhooks in that server | that channel |
| Discord: Post | `server.py` `discord_fight` 2658–2693, `discord_post` 2618–2655; `app.js` `postDiscord` 1453–1475 | webhook POST from the app | a connected webhook | that channel |
| Discord: paste a fight | `server.py` `party_paste` 2034–2062; `app.js` 1752–1765; `index.html` 233–237 | clipboard | an old post with a json block (posts stopped carrying it 26 Oct) | you |
| Copy for Discord | `app.js` `discordText` 2072–2088, button `index.html` 208 | clipboard | a picked fight | wherever you paste |

---

## 1. (a) Seeing your own damage meter: every step in order

### 1.1 Before the app: the game must write the right lines

1. **Have VIP.** The chat-log combat lines are gated by the game key `VIP_CombatLogging` (`server.py` 3055, 3467; `docs/DPS-FEASIBILITY.md` "Game settings"). The health check marks combat logging "off (VIP_CombatLogging 0)" at 3476–3479. Whether a non-VIP account writes `[Combat]` lines at all is **unverified** (DPS-FEASIBILITY open question 1); the community tools say VIP is required.
2. **Turn on the chat log.** Exact in-game path as the repo states it (verified by the user's 27 Oct Settings screenshot, `docs/DATA-SOURCES.md:40`; `DESIGN.md:1131`): **Settings → V.I.P. → Save Chat Logs**. The app's fix text: `app.js:255` `'chat-logging': ['Settings → V.I.P. → Save Chat Logs']`; plaque `app.js:278`; server copy `server.py:3316` "No chat log found. The game only writes one with Save Chat Logs on." Still open in ROADMAP: "Confirm in game that the toggle is labelled 'Save Chat Logs' and sits in the V.I.P. tab (only the hint naming it was seen)."
3. **Turn on combat logging, every category.** Settings → V.I.P. → **Combat Logging**: the per-category "Log when…" dropdowns set to a "Log File" option, plus "Log non-damaging abilities" (`DATA-SOURCES.md:40`; fix text `app.js:261`: "Settings → V.I.P. → Combat Logging: every "Log when…" row on a Log File option, Log non-damaging abilities on, and Save Chat Logs on. The meter needs every category."). The server reads `GorgonSettings.txt` keys `combatLog_*` (must be 2), `LogNonAttacks` (1), `VIP_CombatLogging` (1) at `server.py:3046–3062` and judges them at 3464–3494. What levels 0/1/2 mean in the UI is **unverified** (only "2 = damage numbers" is known).
4. **Log out and back in** so a log file appears: `server.py:3326` "No log file has appeared yet: log out and back in, then check again."; `app.js:5720` "Still no chat log file. … Check Settings → V.I.P. → Save Chat Logs is on, log out and back in, then check again."

### 1.2 Start the app

5. **Install/start.** Mac: the menu-bar app (`mac/GorgonNotes/main.swift`, base URL 127.0.0.1:8787, line 15) or `python3 server.py`. Windows: `GorgonNotes.exe`, with the "Windows protected your PC → More info → Run anyway" step (`windows/README-WINDOWS.txt` 10–13), self-update from GitHub on every start (17–19).
6. **The server starts sharing before any UI opens.** `main()` calls `party_load()` and `party_thread()` at `server.py:5149–5150`; the thread runs `everyone_tick()` every 10 s even with no party code (`2129–2132`), and `everyone_on()` is **True when `settings.json` has no `shareEveryone` key** (`1874–1876`). So on a fresh install, with a chat log present, every closed fight of the day scope is posted to the public everyone feed within 10 s of start (`everyone_publish` 1883–1909), with character name, area, enemy ids, the party roster names the log saw, and timestamps (`party_summary` 1741–1763). The only in-app notice is the Party window's line "Every fight also goes to the everyone's fights page…" with a "Stop sending" text button (`app.js:1589–1597`), which the player sees only after opening Combat.
7. **The app opens on Session, not Combat.** Start view = URL hash, else `pgdash.tab` from localStorage, else `'session'` (`app.js:5780`). The Mac app's menu and ⌘2 open Combat (`main.swift` views list line 16). The player must click **Combat** in the rail (`index.html:59–61`).

### 1.3 On the Combat view (`index.html:189–242`, `app.js:1796–1878`)

Order on the page, top to bottom: title "Combat" + finding sentence + stamp ("Live from today's chat log · last line hh:mm" or "No chat log found / missing") → optional follow note ("The chat log follows X…", `app.js:1818–1823`) → **At a glance** (Per second now / Per second, last fight; Damage; Fights; Kills; Damage taken) → **Fights** (primary window; TODAY / THIS LOGIN tabs; columns Time, Length, Damage, Per second, You, Pets, Kills, Fought; grand "Total · N fights"; fold "Show N skirmishes under 5 s and 500 damage") → **Breakdown** (Copy for Discord, Post fight to Discord; You/Pets/Taken/Kills/Deaths figures; damage-a-second chart; By ability; What hit you; By enemy with You/Pets/Damage over time/Not yours/Total; notes on party, damage over time, unattributed ticks, unclassified attackers) → **Party** window (section 2). Right margin: "Where these numbers come from" with the health notes and the fix plaque.

8. **Nothing to do but fight.** The meter polls `/api/combat` every 2 s while the view is open (`app.js:5789`). A fight opens on the first direct-damage line involving you or a pet and closes after `DPS_GAP_SEC` 15 s without damage (`server.py:877`, `_open` 1010–1021). Empty state: "No fights today. The first hit you land or take opens one; 15 s without damage closes it." (`app.js:1871`). The Breakdown shows the live/newest fight by default (`pickedFight` 1787–1794).

### 1.4 Decisions and terms the player meets here

- Decision: TODAY vs THIS LOGIN (shared `pgdash.xpScope`, `app.js:1282`).
- Decision: which fight to pick (click/Enter/Space on a row); "Show skirmishes"; "Show all N enemies".
- Terms: per second, skirmish, Breakdown, By ability, What hit you, By enemy, Damage over time, "Not yours", "kill mechanic", "Fought … +N more", "now" tag, "Not placed: <name>" (unclassified attacker, 1875 area), "Counted from hh:mm yesterday" (midnight carry-over, 1897), pets named by behaviour heuristic (`classify` 1177–1215, `KNOWN_PETS` 905).

### 1.5 Failure modes and their exact messages (own meter)

| Condition | Where decided | Message |
|---|---|---|
| No chat log file | `server.py:3312–3331` | "No chat log found. The game only writes one with Save Chat Logs on. Looked in <path>[, which doesn't exist]. The game's settings file (saved hh:mm) says chat logging is on/off. [No log file has appeared yet: log out and back in, then check again.]" Fix "Settings → V.I.P. → Save Chat Logs". Combat finding: "No chat log to read, so there's nothing to measure. Turn on chat logging and the meter starts with your first hit." (`app.js:1813`); windows "Needs the chat log." (1828) |
| `LogChat 0` in settings file | `server.py:3332–3335`; `app.js:1813` | "Chat logging is off in the game, so nothing new is recorded." / "Chat logging is off in the game, so there's nothing to measure." |
| Logged in, log silent 15 min | `server.py:3339–3341` | "You're logged in but nothing was written since hh:mm." |
| Game running, no log for today | `server.py:3342–3344` | "The game is running but there's no chat log for today yet." |
| `VIP_CombatLogging != 1` | `server.py:3476–3479` | "Combat logging is off (VIP_CombatLogging N), so kills, killers and damage aren't in the log. Deaths still count from the game's Dying XP line, without a killer." (severity only `info`, 3493) |
| some `combatLog_*` 0 or keys missing | `3480–3485` | "Some fights aren't logged: combatLog_X is 0 in GorgonSettings.txt. Deaths need EnemyAttackMe, kills MeAttackEnemy, pet kills PetAttackEnemy; the DPS meter needs them all." |
| some `combatLog_*` 1 | `3486–3489` | "combatLog_X is 1 in GorgonSettings.txt. Only 2 is verified to write damage numbers, so the DPS meter may miss hits." |
| Settings file unreadable | `3327` | "The game's settings file (GorgonSettings.txt) couldn't be read." |
| Old server (404 on /api/combat) | `app.js:1361, 1816, 1830` | "The DPS meter needs a newer server.py." / "Needs a newer server.py." |
| Chat log follows another character | `app.js:1818–1823` | "The chat log follows X, who is logged in / the last to log in. This meter is X's." |
| No login line in the log | `server.py:1058–1060`, `last_login_before` 275–287 | the character is taken from the previous log's last login; if none, `character` is null and summaries carry `who: None` (party posting then skips: `party_publish` 1829 `if not code or not me: return`) |
| A pet the heuristic can't place | `app.js:1875` region (renderBreakdown note) | "Not placed: X. It hit things you never fought and nothing you fought hit it, so the meter can't tell a pet from a stranger; if it is your pet, its damage is missing above." |
| Game data folder not found | `server.py:5138–5143` | exit: "Game data folder not found: <path>. Set PG_DIR to the folder that holds Reports and ChatLogs (usually …). In game, the VIP menu's export buttons show the Reports path." |
| Port in use | `5148–5153` | "Port 8787 is already in use (…); Gorgon Notes is probably running already." |

Note the severity mismatch: combat-logging problems are `info` (`3493`), so they never turn the pill or stamp amber; a player with the chat log on but combat categories off sees a green-ish page with zero fights and the note only in the margin ("the rest fold", DESIGN.md Combat → Margin sources).

---

## 2. (b) Seeing the party's damage together: every step in order

There are **three** parallel paths today. None is automatic for the party, but path B needs nothing from the player except opening a URL.

### Path A. The Party window with a code (the per-party table + live ticks)

Prerequisite for every member: sections 1.1–1.2 on their own machine ("Each party member runs Gorgon Notes with chat logging on, since each log only holds its owner's hits", `README.md:75`; `everyone.html:81`). A party member's hits never appear in your log (DPS-FEASIBILITY q4, verified on a friend's log).

Controls (`index.html:213–240`): title tool **New code**; form: **Party code** field (`#pcode`, placeholder `gn-…`), **Join** (submit), **Copy code**, **Leave** (hidden until joined), state line; Discord row: **Connect Discord** / **Cancel** / **Remove** (+ "Change channel" label when connected, `app.js:1621`); the fights/session box; the hidden paste box (**Add** / **Cancel**).

Steps, leader:
1. Open Combat, scroll under Breakdown to **Party**. Empty copy (`app.js:1668`): "Share fights with your party. One of you presses New code and pastes it into party chat; the others paste the code here (the whole chat line is fine) and press Join. Your last three fights and every one that closes from then on are shared, and everyone's shows up here side by side." Footer (1670): "Party room · not joined" / "Press New code, or paste a code from party chat. Fight numbers and character names go to the party room; anyone with the code can read them".
2. Press **New code** → `POST /api/party {action:"new"}` (`app.js:1700–1703`; `server.py:5066`, `party_set` 1717–1738): a code `gn-` + 12 chars from alphabet `abcdefghjkmnpqrstuvwxyz23456789` (1657–1658), saved to `party.json` (`code`, `since`, `posted`, `sessions`; 1691–1695). The join clock `since` = the start of the third most recent closed fight (`PARTY_BACKFILL` 1698–1714). Clipboard write; state "[Status] Joined gn-… and copied it. Paste it into party chat." or "[Error] Couldn't reach the clipboard. The code is gn-…" (1492–1495).
3. **Alt-tab to the game, paste the code into party chat.** (A manual, out-of-app step; the game has no API.)

Steps, each other member:
4. **Copy the code out of the game's chat window.** Whether Project: Gorgon's chat lets you select/copy a line is not stated anywhere in the repo (**unverified**); the code's alphabet was chosen so it can be "read out loud or retyped" (`server.py:1658`), i.e. the designers expected retyping.
5. Open Gorgon Notes → Combat → Party → paste or type into the code field. A paste containing `gn-[a-z0-9]{12}` joins at once without pressing Join (`app.js:1705–1709`); typing needs **Join**. Errors: "[Error] A code looks like gn- and 12 letters or digits." (1499); server 400 "a party code looks like gn- and 12 letters or digits" (`server.py:1728`); "[Error] The server didn't answer; try again." (1488). Success: "[Status] Joined gn-…. Your last three fights and every new one are shared." (1502).
6. Wait: "Joined at hh:mm. Fights that close from now on are sent; the others' arrive within 10 s. Here so far: X." (1680). Publishing every 10 s (`PARTY_TICK_SEC` 1659), polling every 10 s while the view was requested in the last 90 s (`PARTY_IDLE_SEC` 1660; 2074–2076), every 2 s while someone is fighting (`party_thread` 2133–2141).
7. Read the result: the **session table** (Session select: "<Area> hh:mm to hh:mm" automatic runs = merged fights in one area ≤ 15 min apart, `SESSION_GAP_SEC` 1677, `party_sessions` 2236–2266; "All today"; columns Player / Health / Armor / Damage / Per second / Share / Kills; "you" tag; `app.js:1574–1587`), the "Fighting now in <area>: X 123/s" live line (1529–1535), the roster line "In your party per the chat log: A and B. Not sharing yet: B. Send them the code." (1599–1606), then **Fights** newest first with tags "only you so far", "without you", "same enemies", "same party", "pasted" (1515–1527), "Show all N fights", "Show N fights nobody else was in".
8. **Leave** → "[Status] Left gn-…. Undo" for 30 s (1712–1721).

Merge rules a player is implicitly trusting (`party_merge` 2147–2233): summaries whose time windows overlap are one fight, one row per player; two summaries that both carry a roster and name neither player stay apart; enemy ids only add the "same enemies" chip. A remote fight that ended before your join clock is dropped (2157–2158), so a late joiner never sees the earlier fights in the Party window (but does on the everyone page). Known limits recorded in ROADMAP: one long fight overlapping two short ones joins only one; strangers in the same cave with no roster line merge.

Failure modes, path A:

| Condition | Where | Message |
|---|---|---|
| Room unreachable, ntfy fallback working | `app.js:1690`; `server.py` `room_fail` 1792 | footer "The party room hasn't answered since hh:mm; sharing over ntfy.sh meanwhile, so only others on ntfy.sh see you" |
| Neither answers | `app.js:1689`; health `server.py:3560–3565` | "The party room not answering since hh:mm; N fights waiting, sent when it answers again"; health warn "The party room hasn't answered since hh:mm; N fights wait and go out when it does.", fix "Nothing to do but wait: the app retries every 10 s. Copy for Discord on the Breakdown shares a fight by hand." (`app.js:265`) |
| Member in party per log but not sharing | `server.py:3568–3575`; `app.js:1604` | health ok-line "X is in your party per the chat log but not sharing: send them the code."; roster line "Not sharing yet: X. Send them the code." |
| Party roster unknown | `app.js:1603` | "Your chat log says you are in a party but names nobody yet (members already in it when you joined only show up when they speak or leave)." |
| Old server | `app.js:1656` | "Needs a newer Gorgon Notes: this page knows the Party window, the server it talks to does not." |
| Summary > 4 KB | `server.py:1762` | enemy ids halved silently until it fits |
| Room body > 8 KB / bad JSON / missing fields | `worker.js:40, 96–103, 116–117` | 400 "body over 8192 bytes" / "body must be JSON" / "a fight summary needs who, start, end and dmg" (surfaces as the post error above) |
| ntfy limits (fallback only) | `docs/SHARING.md` §1 | 250 messages/day/IP, 12 h cache; a shared IP can hit "daily quota reached" |
| A friend's copy is older than the summary version | `party_clean` 2012–2031 drops anything not `v: 1` | the fight silently never appears |

Live state on this Mac (GET `/api/party`, 30 Oct 00:46): joined `gn-z4g5yhyzj3h9` since 25 Oct 18:54; 356 fights sent; room members Akriex (v0.10.0), Faechew, Ragnaurok (v0.10.0), Robchew, Woltlump (v0.9.0). Note the friends are on v0.9–v0.10, i.e. before the everyone feed existed.

### Path B. The everyone page (no code)

1. Each member's app posts every closed fight of the day scope automatically (section 1.2 step 6). Only copies on **v0.11.0 or newer** post there: the live feed's `members` list for the last 24 h is `['Akriex', 'Robchew']` (GET `/everyone/fights`, 30 Oct 00:48) while the party room has five members, so today three of the five friends are invisible on the page.
2. Open `https://gorgon-notes-room.rob-30c.workers.dev/everyone` in a browser (link in the Party window line, `app.js:1591`; README line 14). There is no link from the Combat page header, At a glance or Fights window; only the small dim line inside the Party window.
3. Controls (`everyone.html:69–76`): **Show** (6 h / 24 h / 3 days / 7 days), **Player** filter, **Refresh**, stamp "read hh:mm · refreshes every 30 s". Runs are windows titled "<Area> · d Mon hh:mm to hh:mm (N min)" with the session table and a "N fights in this run" foldout; footer names the players and "last fight received N min ago".
4. Grouping (`everyone.html:108–176`): `party_merge` ported, then runs = same area, ≤ 15 min gap, **sharing a player**. So the page shows your party's run as one window *if* at least one of your logs named a party member or nobody else fought in that area at that time. Known limit, stated on the page (84): "Strangers fighting in the same area at the same time can land in one run: saying 'I was not in this group' is the next step."

Failure modes, path B:

| Condition | Where | Message |
|---|---|---|
| Nothing in range | `everyone.html:220–221` | "No fights in the last 24 hours. The page fills as players' copies of Gorgon Notes send theirs." / "Nothing yet. Fight with Gorgon Notes running and chat logging on, then come back: a fight shows up within 10 s of ending." |
| Feed fails | `everyone.html:236–238` | "Couldn't read the feed (the feed answered N); showing what was read before. Press Refresh." / "The feed did not answer." |
| App can't reach the feed, fights waiting | `server.py:3533–3544`; `app.js:1595` | health warn "The everyone page hasn't taken fights since hh:mm; N fights wait and go out when it answers.", fix "Nothing to do but wait…"; Party line "not answering since hh:mm" |
| Sending turned off | `app.js:1592` | "Your fights are not sent to the everyone's fights page. Start sending" |
| `PG_ROOM` empty | `server.py:1879–1880`, `everyone_info` `available: false` | the line is simply absent (`app.js:1590`) |
| App closed for days | ROADMAP "Older days" | only today + a run carried over midnight is sent; older days never |

### Path C. Discord (post, connect, paste)

**Connect** (`docs/DISCORD.md` option B):
1. Party window → **Connect Discord** (primary button, `index.html:227`). State line before: "Opens Discord in your browser to pick a server and a channel; Post to Discord then goes there" (`app.js:1630`).
2. `POST /api/discord/connect` → server makes a 24-byte `state`, returns `<room>/discord/start?state=…` (`server.py:2410–2424`); the page `window.open`s it (`app.js:1728–1731`); error "[Status] Your browser blocked the Discord page. Open it yourself: <url>" (1733); 400 "Connect Discord needs the party room, which this copy is not using (PG_ROOM is empty)." (2417).
3. The Worker 302s to Discord's authorize page with `scope=webhook.incoming` (`worker.js:184–188`). **The player must have Manage Webhooks in that Discord server** (DISCORD.md "Needs Manage Webhooks: yes (Discord enforces it)"). They pick a server and channel, press Authorize.
4. Worker `/discord/callback` exchanges the code with the client secret, parks the webhook 10 minutes in the `Broker` DO, shows "Connected to Discord … Go back to Gorgon Notes: the Party window says Connected within a few seconds." (`worker.js:190–224`). Error pages: "That link is not from Gorgon Notes", "Nothing connected: You left Discord's page without picking a channel…", "Discord sent no code…", "Discord didn't answer…", "Discord didn't accept the connection: Discord answered N and gave no webhook. Discord said: …", "Couldn't keep the connection…".
5. The app's party thread polls `/discord/claim` every 2 s (`discord_claim_tick` 2427–2449) and saves `discordWebhook` + `discordConnected {channelId, guildId, name, at}` into `settings.json` (`set_discord_webhook` 2464–2494). Meanwhile the page shows "Waiting for Discord: pick a server and a channel in your browser (until hh:mm)" + **Cancel** (`app.js:1628`), polling `/api/settings` every 2 s (1632–1643). Done: system line "Discord connected. Post to Discord goes to the channel you picked." Timeout: "Nothing came back from Discord in 10 minutes. Press Connect Discord again." (2434). The app never learns the channel's name, only ids (DISCORD.md mechanism 2).
6. Connected state: "[Status] Connected: fights post to the channel you picked (webhook "name") · last post hh:mm"; buttons **Change channel** + **Remove** (1621–1629). Remove → `POST /api/settings {discordWebhook:null}` → "Discord disconnected. Post to Discord asks to connect again." (1744–1750).

**Post** (three buttons): Breakdown **Post fight to Discord** (`index.html:208`; `app.js:2180–2183`); per party fight **Post fight to Discord** link, only when the merged fight has > 1 member (1521); **Post session to Discord** (primary) on the session table when Discord is connected and rows exist (1578). Flow `postDiscord` 1453–1475: if no webhook → scrolls to Party, focuses Connect, "[Status] Connect Discord here first, then press Post to Discord again."; else `POST /api/discord {…, preview:true}` for the card, canvas-draws a PNG (`fightCardPng` 1405–1443), posts with the image; success "[Status] Posted the fight/the party fight/the session to Discord (table as text, plus a picture of it)." Server errors: "Discord isn't connected yet. Press Connect Discord in the Party window first." (2622), "Discord removed that webhook (someone deleted it in the channel's Integrations). Connect Discord again in the Party window." (2637, and the webhook is forgotten per Discord's 404 rule), "Discord asks to wait N s before the next post." (2644), "Discord answered N. Try again in a moment." (2646), "Discord didn't answer (X). Check the connection and try again." (2650), "That session has no fights to post." (2668), "That party fight isn't in the table any more." (2675), "That fight isn't in today's log any more." (2686). Each member who connects posts their own copy → duplicate posts for one party fight (DISCORD.md "Why it does not scale").

**Paste a fight from Discord** (fallback): the link appears only when the copy is on ntfy, not the room (`pasteLink` `app.js:1608`), i.e. never in the default build; and posts have carried no json block since 26 Oct, so the box can only ingest old posts. Messages: "[Error] Nothing pasted yet." / "[Error] No fight in that text. Paste the whole Discord post, including its json block." / "[Status] Already here…" / "[Status] Added N fights from the paste." (1752–1765).

**Copy for Discord**: plain text of the picked fight (`discordText` 2072–2088), "[Status] Copied the fight for Discord."

### 2.x Terms the party player meets, in order of appearance

Party · New code · Party code (gn-…) · Join · Copy code · Leave · Undo · [Status]/[Error] tags · Connect Discord · Cancel · Change channel · Remove · "everyone's fights page" · Start/Stop sending · "Fighting now in …" · "In your party per the chat log" · "Not sharing yet … Send them the code" · Session (select) · "<Area> hh:mm to hh:mm" · All today · Post session to Discord · Player / Health / Armor / Damage / Per second / Share / Kills · "you" tag · Fights · "only you so far" · "without you" · "same enemies" · "same party" · "pasted" · "Post fight to Discord" · "Show all N fights" · "Show N fights nobody else was in" · footer "Party room · gn-… · last message hh:mm · N fights sent · N pasted" · margin "Party sharing: Topic gn-…" · margin "Everyone's fights" · "Paste a fight from Discord" (hidden on the room).

That is 11 buttons, one text field, one select, 5 tag chips, 2 toggles and roughly 35 distinct terms on one window, for a task the user wants to be "plug and play".

---

## 3. What is technically possible for a plug-and-play flow, given the pieces

### 3.1 State at first open (no `settings.json`, no `party.json`)

- `load_settings()` returns `{}` (`server.py:2369–2375`); `party_load()` catches the missing file (1681–1689): `code=None`, `since=None`, `posted={}`, `sessions=[]`.
- `everyone_on()` → **True** (1874–1876). `room_usable()` → True because `ROOM_DEFAULT` is baked in (1667–1668). So: **sharing to the public feed is already the zero-config default**; the party code and Discord are the only opt-ins.
- Character identity: `DpsTracker.char` from the newest log's `**** Logged In As <name>` line (1030–1034), else the previous log's (`last_login_before` 275–287). Per-fight `character` handles alts (`char_at` 1217–1226). No account, no typed name anywhere.
- The client's only persisted choices are localStorage `pgdash.tab`, `pgdash.xpScope`, `pgdash.sort`, `pgdash.character`, theme (`app.js:85–105`, 1282, 5578, 5780).
- Everything else that could be "defaulted" already is: scope day, room URL, 15 s gap, 15 min session gap, newest fight followed.

What could additionally be defaulted with no new infrastructure:
- Open on **Combat** when the game is running and a fight is open or the day has fights (`/api/health` `game`, `/api/combat` `now.inFight`), else Session. Today the first open is always Session (5780).
- Show the party table on the Combat page **without a code**, from the everyone feed (3.2).

### 3.2 Could the everyone feed replace codes entirely? Yes, for the after-the-fight table; mostly for live too.

What the code room gives that the everyone feed does not, today:
1. **A client-side merged table in the app.** The app only reads `room/<code>/fights` (`room_poll` 1934–1971). But the Worker already serves the everyone DO with the same routes (`worker.js:62–66`: `/everyone/fights|tick|live` "as a room") including `after=<ms>` paging (142–153). So `room_poll("everyone")`-style reading is a URL change: `party_merge` (2147) with `since=None` and `remote` = everyone rows would produce the same `fights` and `sessions` in `/api/party` with no code. Cost: the everyone room has up to 20,000 rows (`KEEP_ROWS_EVERYONE` 42) and `PAGE` 500 per call; the app would need the `after=` filter (last 24 h) and the `who` filter it already has (`local_names` 2151).
2. **Live per-second ticks.** `party_live_tick` (2081–2113) posts to `room/<code>/tick`; `/everyone/tick` and `/everyone/live` exist on the Worker (62–66, 126–140) and the tick carries `area` and `fightStart`. Live ticks from everyone in the same area within ±20 s would show "Fighting now" without a code; strangers in the same area would show too (the same limit as grouping).
3. **Scoping to *my* party.** The everyone merge has a stronger rule than time overlap: a run must share a player, and rosters keep strangers apart (`everyone.html:160–176`, 118–120). In the app the local tracker knows `in_party`, `party_name`, `roster` (961–1000, 1152–1176) and each fight's `party` list. A "my party" filter = fights whose `who` is in my roster, or whose `party` names me, or (fallback) overlap in my area while my log says I'm in a party. This is the merge the Party window already does with the room's rows, just fed from the public feed.

So the code is not needed for the table. What the code still buys: (a) a private-ish room (only code holders read it; the everyone feed is readable by anyone) and (b) the live tick scoping. Both can be replaced by an in-app "my party" filter plus the privacy opt-out that already exists (`shareEveryone`).

### 3.3 Could the app auto-join a room keyed by the party roster from the chat log? Partly; not reliably as the only mechanism.

Facts from the log (`docs/DATA-SOURCES.md:62`, `server.py:65–71`, `_party_line` 1152–1176):
- `[Status] You are now in hunting party "My Group"!` — the party **name** is a free label; "My Group" is the default (57 of 78 occurrences), so it is not a shared unique id.
- Joining prints **no roster**; members already present are learned only when they chat in `[Party]`, join after you, leave, or become leader. So every member's roster is a different partial set, and the leader's is often empty of the first joiners.
- No party id, no leader id, no server-side party number exists in any line.

Consequences for a roster-derived key:
- A key = sorted(roster ∪ me) differs per member and changes as people chat; two members would compute different keys for the same party. A key = the leader's name (from "X is now the leader" / "You are now the leader") is only known to members who saw a leader-change line; the default leader (whoever formed the party) prints nothing to late joiners.
- **Workable variant without a shared key:** every app subscribes to *rooms named by character* — my own room `char/<Me>` where I post, and I read `char/<X>` for each X in my roster as it grows (the Worker needs only a different name regex than `CODE_RE` at `worker.js:39`, 61). Discovery is symmetric enough: if A's log names B (B spoke), A reads B's room; if B's log never names A, B still reads A's room once A speaks or the rosters converge via `party` arrays in summaries (`party_summary` carries `party` 1759; a received summary naming me is a discovery signal, `party_merge` `names()` 2173–2174). Privacy: a per-character room is as public as the everyone feed (names are guessable), so it is no better than the everyone feed, just smaller.
- **Simplest honest answer:** the everyone feed + the roster filter (3.2 item 3) *is* the auto-join, because the roster is only ever a filter, never a key. The remaining ambiguity (two parties in one cave, neither log naming the other) is exactly the "I was not in this group" edit already planned in ROADMAP / SHARING.md, and a one-tap "Yes, that's my party" chip in the app would feed the same edit store.

### 3.4 Identity and privacy constraints (fixed by the design, not changeable without accounts)

- **No accounts, no auth anywhere.** The Worker accepts any `who` from any client (`postFight` 115–125 trusts `s.who`); a fight can be posted under any character name, and `/everyone/fights` is world-readable (55–66). The party code is the only secret and is itself pasted into party chat. `cloud/README.md` and `worker.js:3–4` state this model ("the same model as party chat itself").
- **Character names are public** in game; the app treats them as identity (`who`), with trimming to 40 chars (`party_clean` 2016–2018, `worker.js:119`) as the only validation. Impersonation is possible and undetectable; the planned "I was not in this group" edits will have the same weakness (ROADMAP: "identify the editor by character name, no accounts").
- **What leaves the machine per fight** (`party_summary` 1741–1763): your character name, start/end ISO times with your timezone offset, duration, damage split, pet names, top 5 abilities, top 3 target names, up to 40 enemy ids, area name, **the names of up to 12 party members your log saw** (who may not use the app and never consented), app version. That is a location-and-company trail for every logged player, retained 30 days on the Worker (`KEEP_MS` 41). The README's line 3 discloses it in one sentence; in-app the disclosure is the dim Party line and the footer "anyone with the code can read them".
- **Opt-out exists but is buried**: `shareEveryone:false` via the Party window's "Stop sending" (`app.js:1597`) only; no first-run prompt, no setting elsewhere. Default on was the user's explicit ask (SHARING.md status 29 Oct).
- **Discord** needs a real Discord account with Manage Webhooks and a browser round-trip; it cannot be made plug-and-play beyond the one-click picker that exists. The client secret stays on the Worker (`worker.js:21–24`), so friends never handle secrets.
- Timezones: summaries carry each machine's offset (`local_iso`), merges use epoch seconds (2164–2170), the everyone page renders in the viewer's clock (`everyone.html:85`). Fine for plug-and-play.

### 3.5 Concrete plug-and-play shape the existing pieces support (no new backend)

1. Keep the automatic everyone publish (exists). Add one first-run line on Combat, not inside Party: "Your fights are shared with players you group with · Stop" (reuse `everyoneLine`, `app.js:1589`).
2. Replace the Party window's code UI with a **"Your party" table built from the everyone feed**, filtered by the chat-log roster and by overlap in your area (`party_merge` + `party_sessions` unchanged; `room_poll` pointed at `everyone/fights?after=` with `who=`). The Worker already serves it. No code, no Join, no Leave, no paste box.
3. Keep live ticks by posting to `/everyone/tick` (route exists) and showing only ticks whose `area` equals yours and whose `who` is in your roster or in the current merged fight.
4. Keep a "Share by code" behind an "Advanced" link only for the private-room case, or drop it.
5. Discord stays a one-button opt-in ("Connect Discord") with one "Post this run" button on the session table.
6. Ambiguity handling: when a merged fight joins a player neither log names, show "Also here: X — in your party? Yes / No" and store the answer in the everyone DO (the planned edit store), which both the page and the app apply before grouping.
7. First-run checks that must stay, because nothing works without them: Save Chat Logs on, Combat Logging rows on, VIP active, log out/in once. These are the real "grandmother" steps; the app can only detect and name them (it does: `server.py:3312–3350, 3464–3494`), but the combat-logging verdict should be `warn`/`bad` on Combat, not `info` (3493), and the chat-log plaque should be the first thing on the Combat page when the log is missing (today the plaque sits in the right margin while the finding sentence carries the fix only as prose).

### 3.6 Facts still unverified that a plug-and-play design depends on

- Whether a non-VIP account writes `[Combat]` lines at all (DPS-FEASIBILITY q1).
- The exact labels and tab of "Save Chat Logs" and the Combat Logging dropdown options (seen only in the game's own hint text, ROADMAP open item).
- Whether text can be copied out of the in-game chat window (needed by the code path; moot if codes go).
- Whether the friends' copies auto-update to v0.11.0+ (only two of five party-room members post to the everyone feed today).
- Whether `/everyone/tick` at a few hundred players scales within the Worker's free plan (100k requests/day; `cloud/README.md` says a party evening of four is "far under"; the everyone DO is a single object, so every app's 2 s tick while fighting lands on one DO).
