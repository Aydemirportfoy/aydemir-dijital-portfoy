@echo off
title Aydemir Portfoy V2
cd /d "%~dp0"
if not exist node_modules (
  echo Paketler kuruluyor. Bu islem ilk acilista biraz surebilir...
  call npm.cmd install
)
echo Site baslatiliyor...
call npm.cmd run dev
pause
