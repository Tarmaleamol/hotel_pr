@echo off
setlocal enabledelayedexpansion

set ROOT_DIR=%~dp0
set DB_NAME=pos
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432
set SCHEMA_FILE=%ROOT_DIR%apps\backend\sql\postgres_schema.sql

rem Auto-detect PostgreSQL bin if PATH is not refreshed yet
where psql >nul 2>&1
if errorlevel 1 (
  for /d %%D in ("%ProgramFiles%\PostgreSQL\*") do (
    if exist "%%~fD\bin\psql.exe" (
      set "PATH=%%~fD\bin;%PATH%"
      goto :path_ready
    )
  )
  for /d %%D in ("%ProgramFiles(x86)%\PostgreSQL\*") do (
    if exist "%%~fD\bin\psql.exe" (
      set "PATH=%%~fD\bin;%PATH%"
      goto :path_ready
    )
  )
)

:path_ready

echo [1/6] Checking PostgreSQL tools...
where psql >nul 2>&1
if errorlevel 1 (
  echo psql not found in PATH.
  echo PostgreSQL is installed but this terminal may not have refreshed PATH.
  echo Close this terminal, open a new one, and run again.
  exit /b 1
)

where pg_isready >nul 2>&1
if errorlevel 1 (
  echo pg_isready not found in PATH. Continuing with psql probe only.
)

echo [2/6] Ensuring PostgreSQL service is running...
powershell -NoProfile -Command "$svc = Get-Service | Where-Object { $_.Name -match 'postgresql' -or $_.DisplayName -match 'postgresql' } | Select-Object -First 1; if(-not $svc){ exit 2 }; if($svc.Status -ne 'Running'){ try { Start-Service -Name $svc.Name -ErrorAction Stop } catch { exit 3 } }; exit 0"
if %errorlevel%==2 (
  echo No PostgreSQL Windows service found.
  echo Start PostgreSQL manually, then rerun this file.
  exit /b 1
)
if %errorlevel%==3 (
  echo Could not start PostgreSQL service automatically.
  echo Run Command Prompt as Administrator or start service manually.
  exit /b 1
)
if not %errorlevel%==0 (
  echo Failed while checking PostgreSQL service.
  exit /b 1
)

echo [3/6] Waiting for PostgreSQL readiness...
set READY=
for /l %%i in (1,1,60) do (
  where pg_isready >nul 2>&1
  if not errorlevel 1 (
    pg_isready -h %DB_HOST% -p %DB_PORT% -U %DB_USER% >nul 2>&1
    if not errorlevel 1 (
      set READY=1
      goto :ready
    )
  ) else (
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "SELECT 1;" >nul 2>&1
    if not errorlevel 1 (
      set READY=1
      goto :ready
    )
  )
  timeout /t 1 >nul
)

:ready
if not defined READY (
  echo PostgreSQL is not reachable at %DB_HOST%:%DB_PORT% as user %DB_USER%.
  echo Ensure credentials are correct. You can set PGPASSWORD before running:
  echo   set PGPASSWORD=your_password
  exit /b 1
)

echo [4/6] Creating database %DB_NAME% if missing...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%';" | findstr /r "1" >nul
if errorlevel 1 (
  psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;" >nul
  if errorlevel 1 (
    echo Failed to create database %DB_NAME%.
    exit /b 1
  )
)

echo [5/6] Applying schema...
if not exist "%SCHEMA_FILE%" (
  echo Schema file not found: %SCHEMA_FILE%
  exit /b 1
)

psql -v ON_ERROR_STOP=1 -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%SCHEMA_FILE%" >nul
if errorlevel 1 (
  echo Failed to apply schema.
  exit /b 1
)

echo [6/6] Done.
echo Local central DB is ready at %DB_HOST%:%DB_PORT%/%DB_NAME%

echo.
echo If needed, set backend mode for central DB in apps\backend\.env:
echo   SYSTEM_MODE=CENTRAL_MODE
echo   PG_CONNECTION_STRING=postgres://postgres:postgres@localhost:5432/pos

endlocal
