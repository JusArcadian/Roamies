@echo off
title Nora Voice Server
cd /d "%~dp0"
if not exist node_modules (
  echo First run: installing Kokoro...
  call npm install
)
node server.mjs
pause
