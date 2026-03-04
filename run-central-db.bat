@echo off
setlocal enabledelayedexpansion

set CONTAINER_NAME=pos-postgres
set POSTGRES_PASSWORD=postgres
set POSTGRES_DB=pos
set PG_PORT=5432
set ROOT_DIR=%~dp0
set SCHEMA_FILE=%ROOT_DIR%apps\backend\sql\postgres_schema.sql

echo [1/4] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
  echo Docker CLI not found in PATH.
  echo Install Docker Desktop and reopen Command Prompt.
  echo Suggested command: winget install -e --id Docker.DockerDesktop
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  echo Docker Engine is not running. Attempting to start Docker Desktop...
  set DOCKER_DESKTOP_EXE=%ProgramFiles%\Docker\Docker\Docker Desktop.exe
  if not exist "%DOCKER_DESKTOP_EXE%" (
    set DOCKER_DESKTOP_EXE=%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe
  )
  if exist "%DOCKER_DESKTOP_EXE%" (
    start "" "%DOCKER_DESKTOP_EXE%"
  ) else (
    echo Docker Desktop executable not found.
    echo Start Docker Desktop manually, then rerun this file.
    exit /b 1
  )

  set ENGINE_READY=
  for /l %%i in (1,1,120) do (
    docker info >nul 2>&1
    if not errorlevel 1 (
      set ENGINE_READY=1
      goto :engine_ready
    )
    timeout /t 1 >nul
  )

  :engine_ready
  if not defined ENGINE_READY (
    echo Docker Engine did not become ready in time.
    echo Wait until Docker Desktop shows "Engine running", then rerun this file.
    exit /b 1
  )
)

echo [2/4] Ensuring PostgreSQL container is running...
docker ps -a --format "{{.Names}}" | findstr /i /x "%CONTAINER_NAME%" >nul
if errorlevel 1 (
  echo Creating container %CONTAINER_NAME%...
  docker run --name %CONTAINER_NAME% -e POSTGRES_PASSWORD=%POSTGRES_PASSWORD% -e POSTGRES_DB=%POSTGRES_DB% -p %PG_PORT%:5432 -d postgres:16 >nul
) else (
  docker start %CONTAINER_NAME% >nul
)

echo [3/4] Waiting for PostgreSQL to be ready...
set READY=
for /l %%i in (1,1,30) do (
  docker exec %CONTAINER_NAME% pg_isready -U postgres -d %POSTGRES_DB% >nul 2>&1
  if not errorlevel 1 (
    set READY=1
    goto :ready
  )
  timeout /t 1 >nul
)

:ready
if not defined READY (
  echo PostgreSQL did not become ready in time.
  exit /b 1
)

echo [4/4] Applying schema...
if not exist "%SCHEMA_FILE%" (
  echo Schema file not found: %SCHEMA_FILE%
  exit /b 1
)

type "%SCHEMA_FILE%" | docker exec -i %CONTAINER_NAME% psql -U postgres -d %POSTGRES_DB% >nul
if errorlevel 1 (
  echo Failed to apply schema.
  exit /b 1
)

echo Central DB is running at localhost:%PG_PORT% and schema is applied.
endlocal
