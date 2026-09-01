@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo =====================================
echo   PlcApiServer 백그라운드 실행
echo =====================================
echo.

cd /d "%~dp0"

REM 빌드
echo [1/2] 프로젝트 빌드 중...
dotnet build -c Release >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ 빌드 실패!
    pause
    exit /b 1
)

echo [2/2] 서버 시작 중...

REM 백그라운드에서 실행
start "PlcApiServer" dotnet run -c Release

timeout /t 2 /nobreak

echo.
echo ✅ 서버 시작됨 (백그라운드)
echo.
echo 접속 주소: http://localhost:5050
echo.
echo 테스트:
echo   http://localhost:5050/api/plc/config
echo   http://localhost:5050/api/plc/ping
echo.
echo 서버를 중지하려면:
echo   Task Manager → dotnet.exe 찾아서 중지
echo   또는 taskkill /IM dotnet.exe
