@echo off
echo =========================================================================
echo   Starting Shree Ganesh Medical Management System (Full MERN Stack)
echo =========================================================================
echo   [1/2] Launching Node.js Express + Socket.IO Server on Port 5000...
start "Pharmacy Backend (Port 5000)" cmd /k "cd /d %~dp0\backend && npm run start"

timeout /t 2 /nobreak >nul

echo   [2/2] Launching React + Vite Dev Server on Port 5173...
start "Pharmacy Frontend (Port 5173)" cmd /k "cd /d %~dp0\frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo =========================================================================
echo   System is UP and RUNNING!
echo   API Base:       http://localhost:5000/api
echo   Web Application: http://localhost:5173
echo   Demo Login: admin@ganeshpharmacy.com / admin123
echo =========================================================================
pause
