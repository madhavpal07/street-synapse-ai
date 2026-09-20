@echo off
setlocal
cd /d "%~dp0..\bus-tracker"
if not exist "node_modules" (
  echo Run npm ci in bus-tracker first. See docs\setup-guide.md.
  pause
  exit /b 1
)
call npm run setup
if errorlevel 1 exit /b 1
if not exist ".next\BUILD_ID" (
  call npm run build
  if errorlevel 1 exit /b 1
)
call npm start
if errorlevel 1 pause
