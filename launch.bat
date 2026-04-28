@echo off
echo.
echo  =============================================
echo   3D BUILDER - Local Dev Server
echo  =============================================
echo.
if not exist node_modules (
    echo  Installing dependencies...
    call npm install
    echo.
)
echo  Starting server at http://localhost:3000
echo  Press Ctrl+C to stop.
echo.
call npm run dev
pause
