@echo off
echo ========================================
echo FFmpeg Installation Helper
echo ========================================
echo.

echo Checking if FFmpeg is already installed...
ffmpeg -version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo FFmpeg is already installed!
    echo.
    ffmpeg -version | findstr "ffmpeg version"
    echo.
    pause
    exit /b 0
)

echo.
echo FFmpeg is not installed.
echo.
echo Installation options:
echo.
echo 1. Chocolatey (Recommended - Easiest)
echo    - If you have Chocolatey: choco install ffmpeg
echo.
echo 2. Manual Installation
echo    - Download from: https://github.com/BtbN/FFmpeg-Builds/releases
echo    - Extract the ZIP file
echo    - Add the 'bin' folder to your PATH environment variable
echo.
echo 3. Winget (Windows 10/11)
echo    - Run: winget install ffmpeg
echo.

set /p choice="Do you want to open the FFmpeg download page? (y/n): "
if /i "%choice%"=="y" (
    start https://github.com/BtbN/FFmpeg-Builds/releases
    echo.
    echo After downloading and installing FFmpeg:
    echo 1. Extract the ZIP file
    echo 2. Add the 'bin' folder to your PATH
    echo 3. Restart this terminal
    echo 4. Run: node convert-videos-to-mp4.js
)

echo.
pause
