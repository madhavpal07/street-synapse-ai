@echo off
setlocal
cd /d "%~dp0.."
python -m http.server 5500 --bind 127.0.0.1 --directory web-dashboard/authority
if errorlevel 1 pause
