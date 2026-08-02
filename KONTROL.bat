@echo off
title Aydemir Portfoy V2 Kontrol
cd /d "%~dp0"
call npm.cmd install
if errorlevel 1 (
  echo Paket kurulumu tamamlanamadi.
  pause
  exit /b 1
)
call npm.cmd run build
if errorlevel 1 (
  echo Proje kontrolunde hata bulundu.
  pause
  exit /b 1
)
echo.
echo PROJE KONTROLU BASARILI.
pause
