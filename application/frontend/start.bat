@echo off
TITLE NOVA LUXE - Frontend Store
COLOR 0E
CLS
echo =======================================================
echo          NOVA LUXE - FRONTEND WEB SERVER
echo =======================================================
echo.
echo Starting frontend server on http://localhost:4173...
start http://localhost:4173
python -m http.server 4173
pause
