@echo off
REM Scout Backend Setup Script for Windows

echo.
echo Setting up Scout Content Backend...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Install dependencies
echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo Dependencies installed
echo.

REM Initialize database
echo Initializing database...
call npm run init-db

if %errorlevel% neq 0 (
    echo Failed to initialize database
    pause
    exit /b 1
)

echo Database initialized
echo.

REM Ask if user wants to migrate files
set /p migrate="Do you want to migrate existing files now? (y/n): "

if /i "%migrate%"=="y" (
    echo Starting file migration...
    call npm run migrate
    echo Migration complete
) else (
    echo Skipping migration (you can run 'npm run migrate' later)
)

echo.
echo ====================================================
echo.
echo Setup complete!
echo.
echo To start the server:
echo   npm start
echo.
echo To run in development mode:
echo   npm run dev
echo.
echo To migrate files later:
echo   npm run migrate
echo.
echo To test the API:
echo   npm test
echo.
echo Check README.md for full documentation
echo Check QUICKSTART.md for quick start guide
echo Check DEPLOYMENT.md for deployment options
echo.
echo ====================================================
echo.
pause
