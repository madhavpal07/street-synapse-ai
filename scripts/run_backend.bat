@echo off
setlocal
cd /d "%~dp0..\backend"
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 5000
) else (
  python -m uvicorn app.main:app --host 127.0.0.1 --port 5000
)
if errorlevel 1 pause
