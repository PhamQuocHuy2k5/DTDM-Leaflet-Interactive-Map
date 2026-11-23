@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Dang khoi dong web server tai http://127.0.0.1:5500/

where py >nul 2>nul
if not errorlevel 1 (
    start "" "http://127.0.0.1:5500/index.html"
    py -m http.server 5500 --bind 127.0.0.1
    pause
    exit /b
)

where python >nul 2>nul
if not errorlevel 1 (
    start "" "http://127.0.0.1:5500/index.html"
    python -m http.server 5500 --bind 127.0.0.1
    pause
    exit /b
)

echo Khong tim thay Python. Hay dung VS Code Live Server.
pause
