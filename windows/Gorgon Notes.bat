@echo off
rem Gorgon Notes for Windows. Starts the local server with the bundled Python (python\python.exe)
rem and opens http://127.0.0.1:8787 in your browser. Close this window to stop it.
rem
rem If it says "Game data folder not found", remove "rem " from the next line and put your folder there
rem (the in-game VIP export panel shows it as "Reports will be stored here", without the Reports part):
rem set PG_DIR=C:\Users\you\AppData\LocalLow\Elder Game\Project Gorgon
setlocal
cd /d "%~dp0"
set PYTHONUTF8=1
set PYTHONDONTWRITEBYTECODE=1
title Gorgon Notes
"%~dp0python\python.exe" "%~dp0server.py" --open
if errorlevel 1 (
  echo.
  echo Gorgon Notes stopped with an error. Read the lines above, then press any key to close.
  pause >nul
)
