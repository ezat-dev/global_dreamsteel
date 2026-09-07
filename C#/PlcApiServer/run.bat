@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ---------------------------------------------------------------------------
REM Keep this file ASCII-only. Do not put Korean text back in.
REM
REM cmd.exe parses a .bat one line at a time using the *console* code page.
REM This file used to hold UTF-8 Korean text; on Korean Windows (cp949 console)
REM every multi-byte character shifted the parser and ate the first characters
REM of the following commands - "echo." ran as "ho.", "set" as "et", "5050" as
REM "050", and "cd /d %~dp0" was mangled so dotnet ran in the wrong directory
REM ("Couldn't find a project to run").
REM
REM "chcp 65001" on line 2 does NOT fix it: cmd has already begun reading the
REM file under the previous code page, so the byte offsets are wrong either way.
REM It stays only so that dotnet's own output renders correctly.
REM ---------------------------------------------------------------------------

echo.
echo =====================================
echo   PlcApiServer start
echo =====================================
echo.

cd /d "%~dp0"

REM build
echo [1/2] Building project...
dotnet build -c Debug
if errorlevel 1 (
    echo.
    echo [X] Build failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Starting server...
echo.
echo Listening on port 5050
echo    http://localhost:5050
echo.
echo Press Ctrl+C to stop the server.
echo.

REM run
dotnet run -c Debug

pause
