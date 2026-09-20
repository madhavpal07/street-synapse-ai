@echo off
setlocal
cd /d "%~dp0..\ml"
if not exist "models\best.pt" (
  echo Missing ml\models\best.pt. Add your trained pothole model first.
  pause
  exit /b 1
)
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" live_phone_detection.py
) else (
  python live_phone_detection.py
)
if errorlevel 1 pause
