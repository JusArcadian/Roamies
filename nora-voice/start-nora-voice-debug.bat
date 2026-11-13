@echo off
title Nora Voice + Ears (DEBUG: shows everything she hears)
cd /d "%~dp0"
set NORA_DEBUG=1
call npm install --no-audit --no-fund
node server.mjs
pause
