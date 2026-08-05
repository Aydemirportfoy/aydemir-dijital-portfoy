@echo off
powershell -NoProfile -Command "Get-Content '.\supabase\aydemir-v3-talep-merkezi.sql' -Raw | Set-Clipboard"
echo.
echo SQL panoya kopyalandi.
echo Supabase SQL Editor'u acin, Ctrl+V yapin ve RUN tusuna basin.
echo.
pause
