@echo off
title SCADA Frontend (5051)
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0frontend"
call "C:\Program Files\nodejs\npm.cmd" run dev

echo.
echo [frontend process exited - see log above. Press any key to close this window]
pause >nul
