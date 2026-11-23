@echo off
chcp 65001 >nul
setlocal
set "TARGET=C:\Users\Admin\OneDrive\Documents\Tài liệu\DTDM"
for %%I in ("%~dp0.") do set "SOURCE=%%~fI"
for %%I in ("%TARGET%") do set "DEST=%%~fI"

echo.
echo ==============================================
echo  CAI DAT DE TAI LEAFLET VAO THU MUC DTDM
echo ==============================================
echo Nguon: %SOURCE%
echo Dich : %DEST%
echo.

if /I "%SOURCE%"=="%DEST%" (
    echo Ban dang chay truc tiep trong thu muc DTDM. Khong can sao chep.
    goto :done
)

if not exist "%TARGET%" mkdir "%TARGET%"
robocopy "%SOURCE%" "%TARGET%" /E /R:1 /W:1 /XD ".git" /XF "CAI_DAT_VAO_DTDM.bat" >nul
if errorlevel 8 (
    echo Co loi khi sao chep file. Hay copy thu cong vao:
    echo %TARGET%
    pause
    exit /b 1
)

:done
echo.
echo Hoan tat. Mo VS Code tai:
echo %TARGET%
where code >nul 2>nul
if not errorlevel 1 start "" code "%TARGET%"
echo.
echo Sau do mo index.html bang Live Server.
pause
