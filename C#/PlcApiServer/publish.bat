@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo =====================================
echo   PlcApiServer 배포 (Publish)
echo =====================================
echo.

cd /d "%~dp0"

echo 배포 중...
dotnet publish -c Release -o publish-output

if errorlevel 1 (
    echo.
    echo ❌ 배포 실패!
) else (
    echo.
    echo ✅ 배포 성공!
    echo.
    echo 배포 폴더: publish-output\
    echo.
    echo 실행 방법:
    echo   1. 폴더로 이동: cd publish-output
    echo   2. 실행: PlcApiServer.exe
)

pause
