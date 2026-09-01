@echo off
REM Backend + Frontend only (no PlcApiServer). Use run-all.bat if you also need the C# PLC server.
cd /d "%~dp0"

if not exist "run-backend.bat" (
  echo [!] run-backend.bat not found.
  echo     Copy run-backend.bat.example to run-backend.bat and fill in DB_PASSWORD.
  pause
  exit /b 1
)

start "SCADA Backend"  cmd /k run-backend.bat
start "SCADA Frontend" cmd /k run-frontend.bat

echo Backend (http://localhost:8081), Frontend (http://localhost:5051) started in separate windows.
