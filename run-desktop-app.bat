@echo off
setlocal

set ROOT_DIR=%~dp0
set BACKEND_DIR=%ROOT_DIR%apps\backend
set FRONTEND_DIR=%ROOT_DIR%apps\frontend
set POS_HOST=192.168.1.11
set FRONTEND_PORT=5175

echo [1/5] Ensuring env files exist...
if not exist "%BACKEND_DIR%\.env" copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
if not exist "%FRONTEND_DIR%\.env" copy "%FRONTEND_DIR%\.env.example" "%FRONTEND_DIR%\.env" >nul

echo [2/5] Installing backend dependencies if needed...
if not exist "%BACKEND_DIR%\node_modules" (
  call npm --prefix "%BACKEND_DIR%" install
)

echo [3/5] Installing frontend dependencies if needed...
if not exist "%FRONTEND_DIR%\node_modules" (
  call npm --prefix "%FRONTEND_DIR%" install
)

echo [4/5] Starting backend and frontend servers in separate windows...
start "POS Backend" cmd /k "cd /d %BACKEND_DIR% && npm run start:dev"
start "POS Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev -- --host 0.0.0.0 --port %FRONTEND_PORT% --strictPort"

echo Waiting for frontend server at http://%POS_HOST%:%FRONTEND_PORT% ...
powershell -NoProfile -Command "for($i=0;$i -lt 60;$i++){ try { $r=Invoke-WebRequest -Uri 'http://%POS_HOST%:%FRONTEND_PORT%' -UseBasicParsing -TimeoutSec 1; if($r.StatusCode -ge 200){ exit 0 } } catch {}; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo Frontend did not start in time. Check the POS Frontend window.
  exit /b 1
)

echo [5/5] Launching Electron desktop app...
start "POS Desktop" cmd /k "cd /d %FRONTEND_DIR% && set ELECTRON_START_URL=http://%POS_HOST%:%FRONTEND_PORT% && npm run electron"

echo Desktop startup complete.
endlocal
