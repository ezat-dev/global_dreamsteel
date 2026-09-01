@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo =====================================
echo   PlcApiServer 시작
echo =====================================
echo.

cd /d "%~dp0"

REM 빌드
echo [1/2] 프로젝트 빌드 중...
dotnet build -c Debug
if errorlevel 1 (
    echo.
    echo ❌ 빌드 실패!
    pause
    exit /b 1
)

echo.
echo [2/2] 서버 시작 중...
echo.
echo ✅ 포트 5050 에서 실행 중...
echo    http://localhost:5050
echo.
echo Ctrl+C 를 눌러 서버를 중지할 수 있습니다.
echo.

REM 실행
dotnet run -c Debug

pause
