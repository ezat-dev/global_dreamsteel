@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo =====================================
echo   PlcApiServer 빌드
echo =====================================
echo.

cd /d "%~dp0"

echo 프로젝트 빌드 중...
dotnet build -c Release

if errorlevel 1 (
    echo.
    echo ❌ 빌드 실패!
) else (
    echo.
    echo ✅ 빌드 성공!
    echo.
    echo 출력 파일: bin\Release\net8.0\
)

pause
