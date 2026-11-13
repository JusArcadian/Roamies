@echo off
title Nora Voice + Ears
cd /d "%~dp0"
echo Checking packages...
call npm install --no-audit --no-fund
node server.mjs
pause
