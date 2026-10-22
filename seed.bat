@echo off
echo ========================================================
echo  Shree Ganesh Medical Store - Database Seeder
echo ========================================================
cd /d "%~dp0\backend"
node src/scripts/seed.js
pause
