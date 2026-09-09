@echo off
cd /d "%~dp0"
start "NESORA Vite" /min cmd /c "npm run dev -- --host localhost"
timeout /t 3 /nobreak >nul
start "NESORA Website" http://localhost:5173
