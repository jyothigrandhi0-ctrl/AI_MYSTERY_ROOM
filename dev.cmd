@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0.tools\node-v22.16.0-win-x64\node.exe" set "PATH=%~dp0.tools\node-v22.16.0-win-x64;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or newer is required. Install Node.js, then run this file again.
  exit /b 1
)
call npm run dev
