@echo off
setlocal
echo Starts separate demo services; this does not connect camera evidence to the API.
echo Complete the setup steps in docs\setup-guide.md first.
start "SAWAARI Bus Tracker" cmd /k call "%~dp0run_bus_tracker.bat"
start "SAWAARI Incident API" cmd /k call "%~dp0run_backend.bat"
start "SAWAARI Authority Dashboard" cmd /k call "%~dp0run_dashboard.bat"
if exist "%~dp0..\ml\models\best.pt" (
  start "SAWAARI Phone Camera" cmd /k call "%~dp0run_ml.bat"
) else (
  echo Camera skipped: ml\models\best.pt is missing.
)
