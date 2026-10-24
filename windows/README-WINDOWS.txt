Gorgon Notes for Windows (test build)
=====================================

A personal dashboard for Project: Gorgon: session log, personal DPS meter, vendors, storage,
character sheet, built from the game's VIP exports and chat logs. Everything runs on your own PC
in your browser; nothing about your character leaves it. Only game data (item names, vault
sizes, …) is fetched from cdn.projectgorgon.com.

Start (the .exe)
----------------
1. Double-click GorgonNotes.exe.
   If Windows shows "Windows protected your PC": click "More info", then "Run anyway". This happens
   once because the file was downloaded; nothing is installed and nothing is signed.
2. The Gorgon Notes window opens (the first start takes a few seconds longer while it unpacks
   itself into C:\Users\<you>\AppData\Local\Gorgon Notes\app). The first page can take ten
   seconds or so while it reads your chat logs; after that it is quick.
3. Close the window to stop.
It keeps itself current: at each start it asks GitHub for the newest release and, if there is one,
fetches it (about 15 MB) before opening. You never need a new .exe. No internet, no update.
No console, no browser: the window is the program. What it did is written to
C:\Users\<you>\AppData\Local\Gorgon Notes\gorgon-notes.log (open it in Notepad if something fails;
an error also shows in a message box).
To remove it: delete the .exe and the folder C:\Users\<you>\AppData\Local\Gorgon Notes.

Start (the .zip, if the .exe is blocked)
----------------------------------------
Extract the whole zip somewhere (for example Documents\Gorgon Notes), keep the folder together, and
double-click "Gorgon Notes.bat". Same window, same browser page.

Nothing to install either way: the folder carries its own copy of Python (the "python" subfolder).

Where the data comes from
-------------------------
- Exports: in game, VIP menu -> Export Character JSON and Export Storage JSON. They land in
  C:\Users\<you>\AppData\LocalLow\Elder Game\Project Gorgon\Reports\ and the app reads them there.
  The top of every view says how old your data is and what to export to improve it.
- Chat logs: the game writes ChatLogs\Chat-<date>.log only with Log All Chat turned on. The Session
  and Combat views come from these, live, while you play.
- The app only reads the game folder. It writes two things, both in its own folder: capacity.json
  (vault sizes you type in) and cache\ (downloaded game data).

If something is off
-------------------
- "Game data folder not found": the app looks in C:\Users\<you>\AppData\LocalLow\Elder Game\Project
  Gorgon. If yours is elsewhere (the VIP export panel shows it as "Reports will be stored here",
  without the trailing Reports part), tell the person who sent you this, or with the zip: open
  "Gorgon Notes.bat" in Notepad, follow the comment about PG_DIR, save, run again.
- "Port 8787 is already in use": it's already running; the browser just opens the existing one.
- The page says exports or logs are missing: follow the fix it names; that message is the point
  of the app.

What to tell the person who sent you this
-----------------------------------------
- The first lines of gorgon-notes.log (game folder, how many exports and chat logs it found), or
  the black window's lines if you used the zip.
- Whether the window looked right (crisp text, its own taskbar entry) or opened in your browser
  with a message about WebView2 instead.
- Whether the Session view's "Live game events" line (Player.log) says OK or not: on Mac the game
  never writes those events, and whether the Windows build does is an open question.
- Anything that looks wrong or is Mac-flavoured: this is the first Windows build and it was made
  on a Mac without a Windows machine to try it on.
