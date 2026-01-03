@echo off
echo ================================================
echo Training Dashboard Local Server
echo ================================================
echo.
echo ERROR: You need Python or Node.js installed to run a local server.
echo.
echo OPTION 1 - Install Python:
echo   1. Type 'python' in Windows search
echo   2. Install from Microsoft Store
echo   3. Run this script again
echo.
echo OPTION 2 - Quick Install Python:
echo   Visit: https://www.python.org/downloads/
echo.
echo Once Python is installed, this script will start the server automatically.
echo.
echo Checking if Python is available...
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Python found! Starting server...
    echo.
    echo Server running at: http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    python -m http.server 8000
) else (
    echo Python not found. Please install Python first.
)
pause
