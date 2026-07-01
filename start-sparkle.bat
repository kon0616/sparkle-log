@echo off
:: Sparkle Log — auto-start via start-sparkle.vbs in shell:startup

set "NODE=C:\Program Files\nodejs\node.exe"
set "DIR=C:\Users\z1635\Desktop\vibe coding\sparkle-log"

:: Give Windows a few seconds to finish booting
ping -n 8 127.0.0.1 >nul

:: Start server (exits cleanly if port already in use)
start "" /B "%NODE%" "%DIR%\server.js"

:: Wait then open browser
ping -n 5 127.0.0.1 >nul
start http://localhost:3456
