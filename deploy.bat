@echo off
REM Server PC deploy: git pull -> build the jar (frontend included) -> swap the jar
REM the WinSW service runs -> restart the service -> wait until 8081 answers.
REM
REM Run on the server PC (double-click is fine - it asks for admin rights, which
REM sc stop/start needs). The build runs while the old server keeps serving, and
REM if the build fails the script stops before touching the service.
REM The service itself must be installed once with WinSW beforehand.
setlocal EnableExtensions

net session >nul 2>&1
if errorlevel 1 (
  echo Requesting administrator rights...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

title SCADA Deploy
cd /d "%~dp0"

set "SERVICE_ID=global_dreamsteel_service"
set "JAR_NAME=mes-backend-0.0.1-SNAPSHOT.jar"
set "SERVICE_DIR=%~dp0service"
set "BACKUP_DIR=%~dp0service\backup"
set "KEEP_BACKUPS=5"
set "APP_URL=http://localhost:8081/"

sc query "%SERVICE_ID%" >nul 2>&1
if errorlevel 1 (
  echo [!] Service %SERVICE_ID% is not installed. Install it with WinSW first.
  goto :fail
)

REM JDK 17 - server PC has Adoptium, dev PC has Oracle. The system JAVA_HOME may be JDK 8.
set "JAVA_HOME="
for /d %%D in ("C:\Program Files\Eclipse Adoptium\jdk-17*") do set "JAVA_HOME=%%~fD"
if not defined JAVA_HOME if exist "C:\Program Files\Java\jdk-17\bin\java.exe" set "JAVA_HOME=C:\Program Files\Java\jdk-17"
if not defined JAVA_HOME (
  echo [!] JDK 17 not found under C:\Program Files\Eclipse Adoptium or C:\Program Files\Java.
  goto :fail
)
set "PATH=%JAVA_HOME%\bin;C:\Program Files\nodejs;%PATH%"
echo JAVA_HOME=%JAVA_HOME%

REM ---------------------------------------------------------------------------
echo.
echo [1/5] git pull
for /f %%H in ('git rev-parse HEAD') do set "OLD_HEAD=%%H"
git pull --ff-only
if errorlevel 1 (
  echo [!] git pull failed. Fix it ^(local changes on this PC?^) and run again.
  goto :fail
)

REM A localhost API address in frontend\.env gets baked into the build, and then
REM tablets call their own localhost and every screen breaks.
if exist "frontend\.env" (
  findstr /i /r /c:"^VITE_API_BASE_URL=.*localhost" /c:"^VITE_API_BASE_URL=.*127\.0\.0\.1" /c:"^VITE_PLC_API_URL=.*localhost" /c:"^VITE_PLC_API_URL=.*127\.0\.0\.1" "frontend\.env"
  if not errorlevel 1 (
    echo [!] frontend\.env points the API at localhost ^(lines above^). Remove or empty those lines.
    goto :fail
  )
)

REM ---------------------------------------------------------------------------
echo.
set "NEED_NPM="
if not exist "frontend\node_modules" set "NEED_NPM=1"
for /f %%F in ('git diff --name-only %OLD_HEAD% HEAD -- frontend/package.json frontend/package-lock.json') do set "NEED_NPM=1"
if defined NEED_NPM (
  echo [2/5] npm install
  pushd frontend
  call "C:\Program Files\nodejs\npm.cmd" install
  if errorlevel 1 (
    popd
    echo [!] npm install failed. The service was not touched.
    goto :fail
  )
  popd
) else (
  echo [2/5] npm install - skipped ^(packages unchanged^)
)

REM ---------------------------------------------------------------------------
echo.
echo [3/5] build jar ^(frontend + backend^)
pushd backend
call gradlew.bat bootJar --console=plain
if errorlevel 1 (
  popd
  echo [!] Build failed. The service was not touched - the old version is still running.
  goto :fail
)
popd
if not exist "backend\build\libs\%JAR_NAME%" (
  echo [!] backend\build\libs\%JAR_NAME% not found after build.
  goto :fail
)

REM ---------------------------------------------------------------------------
echo.
echo [4/5] stop service, back up old jar, put new jar
call :stop_service
if errorlevel 1 goto :fail

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%T"
set "BACKUP_JAR=%BACKUP_DIR%\%STAMP%_%JAR_NAME%"
if exist "%SERVICE_DIR%\%JAR_NAME%" (
  copy /y "%SERVICE_DIR%\%JAR_NAME%" "%BACKUP_JAR%" >nul
  echo backup: %BACKUP_JAR%
)
copy /y "backend\build\libs\%JAR_NAME%" "%SERVICE_DIR%\%JAR_NAME%" >nul
if errorlevel 1 (
  echo [!] Could not copy the new jar. Starting the old one again.
  sc start "%SERVICE_ID%" >nul
  goto :fail
)
powershell -NoProfile -Command "Get-ChildItem -LiteralPath '%BACKUP_DIR%' -Filter '*.jar' | Sort-Object Name -Descending | Select-Object -Skip %KEEP_BACKUPS% | Remove-Item"

REM ---------------------------------------------------------------------------
echo.
echo [5/5] start service
sc start "%SERVICE_ID%" >nul
if errorlevel 1 (
  echo [!] sc start failed. See service\global_dreamsteel_service.wrapper.log
  goto :fail
)
echo Waiting for %APP_URL% ...
for /l %%i in (1,1,60) do (
  curl -s -f -o nul --max-time 2 "%APP_URL%" && goto :ok
  timeout /t 2 /nobreak >nul
)
echo [!] The service started but %APP_URL% did not answer in time.
echo     See service\logs and service\global_dreamsteel_service.out.log / .err.log
echo     To roll back: sc stop %SERVICE_ID%, copy the backup jar over service\%JAR_NAME%, sc start %SERVICE_ID%
goto :fail

:ok
echo.
echo ===== Deploy done =====
git log -1 --format="%%h %%s"
echo.
pause
exit /b 0

:fail
echo.
echo ===== Deploy FAILED =====
pause
exit /b 1

REM Stops the service and waits until it is really stopped (the jar file is locked while it runs).
:stop_service
sc query "%SERVICE_ID%" | find "STOPPED" >nul && exit /b 0
sc stop "%SERVICE_ID%" >nul
for /l %%i in (1,1,60) do (
  sc query "%SERVICE_ID%" | find "STOPPED" >nul && exit /b 0
  timeout /t 1 /nobreak >nul
)
echo [!] Service did not stop within 60 seconds.
exit /b 1
