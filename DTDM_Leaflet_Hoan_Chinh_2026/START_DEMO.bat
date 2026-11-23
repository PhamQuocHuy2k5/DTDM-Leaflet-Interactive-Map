@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ================================================
echo  DE TAI 3 - LEAFLET - KHOI DONG DEMO
echo ================================================
echo.
echo Dang mo web server tai http://127.0.0.1:5500/
echo.

where py >nul 2>nul
if not errorlevel 1 (
    start "Leaflet Local Server" cmd /k "cd /d ""%~dp0"" && py -m http.server 5500 --bind 127.0.0.1"
    timeout /t 2 /nobreak >nul
    start "" "http://127.0.0.1:5500/index.html"
    exit /b 0
)

where python >nul 2>nul
if not errorlevel 1 (
    start "Leaflet Local Server" cmd /k "cd /d ""%~dp0"" && python -m http.server 5500 --bind 127.0.0.1"
    timeout /t 2 /nobreak >nul
    start "" "http://127.0.0.1:5500/index.html"
    exit /b 0
)

echo Khong tim thay Python.
echo Hay mo thu muc bang VS Code, chuot phai index.html va chon Open with Live Server.
pause
