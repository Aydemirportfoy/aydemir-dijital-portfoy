@echo off
cd /d "%~dp0"
powershell -NoProfile -Command "Get-Content '.\supabase\aydemir-v3-gunluk-takip.sql' -Raw | Set-Clipboard"
echo.
echo GUNLUK TAKIP SQL KODU PANOYA KOPYALANDI.
echo.
echo Simdi Supabase SQL Editor ekranina donun:
echo 1. Ctrl + A
echo 2. Ctrl + V
echo 3. Run
echo.
echo SQL ekranina bu dosyanin adini degil, panoya kopyalanan uzun SQL kodunu yapistirin.
echo.
pause
