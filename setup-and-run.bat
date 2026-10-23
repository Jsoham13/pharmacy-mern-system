@echo off
setlocal enabledelayedexpansion

echo =========================================================================
echo   Shree Ganesh Medical System - Automated First-Time Setup & Launcher
echo =========================================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js (v18+ or v20+) from: https://nodejs.org
    pause
    exit /b 1
)

echo [1/4] Node.js found:
node -v
echo.

:: 2. Backend Dependencies
echo [2/4] Installing Backend Dependencies (this takes ~30 seconds)...
cd /d "%~dp0\backend"
if not exist node_modules (
    call npm install
) else (
    echo node_modules already exists, skipping install.
)

:: 3. Frontend Dependencies
echo.
echo [3/4] Installing Frontend Dependencies (this takes ~30 seconds)...
cd /d "%~dp0\frontend"
if not exist node_modules (
    call npm install
) else (
    echo node_modules already exists, skipping install.
)

:: 4. Seed MongoDB
echo.
echo [4/4] Seeding MongoDB with Sangli Maharashtra Pharmacy Catalog...
cd /d "%~dp0\backend"
call node src/scripts/seed.js

echo.
echo =========================================================================
echo   SETUP COMPLETE! Launching Backend & Frontend Servers...
echo =========================================================================

cd /d "%~dp0"
start "Pharmacy Backend (Port 5000)" cmd /k "cd /d %~dp0\backend && npm run start"
timeout /t 2 /nobreak >nul

start "Pharmacy Frontend (Port 5173)" cmd /k "cd /d %~dp0\frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo Demo Accounts:
echo   Owner / Admin:   admin@ganeshpharmacy.com   / admin123
echo   Pharmacist:      pharmacist@ganeshpharmacy.com / pharm123
echo   Cashier:         cashier@ganeshpharmacy.com / cash123
echo   Delivery:        delivery@ganeshpharmacy.com / deliv123
echo.
echo (Press any key to close this launcher window, servers will stay running)
pause >nul
