@echo off
setlocal

set "TOMCAT_HOME=D:\apache-tomcat-9.0.115"

if not exist "%TOMCAT_HOME%\bin\startup.bat" (
  echo [ERROR] TOMCAT_HOME is invalid: %TOMCAT_HOME%
  pause
  exit /b 1
)

call "%TOMCAT_HOME%\bin\startup.bat"
echo [OK] Tomcat started.
echo [URL] http://localhost:8080/sample_pro
pause
