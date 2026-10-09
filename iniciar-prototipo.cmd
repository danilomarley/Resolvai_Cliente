@echo off
setlocal
cd /d "%~dp0"
title ResolvAI - Prototipo local
if /I "%~1"=="--api" goto api
if exist "%~dp0apresentacao\ResolvAI.html" (
  start "" "%~dp0apresentacao\ResolvAI.html"
  exit /b 0
)
:api
set "NO_COLOR=1"
set "FORCE_COLOR="

set "RESOLVAI_NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  set "RESOLVAI_NODE=%~dp0..\.tools\node.exe"
  if exist "%ProgramFiles%\nodejs\node.exe" set "RESOLVAI_NODE=%ProgramFiles%\nodejs\node.exe"
)

if not "%RESOLVAI_NODE%"=="node" if not exist "%RESOLVAI_NODE%" (
  echo Node.js nao encontrado. Instale o Node.js e execute este arquivo novamente.
  pause
  exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
  echo As dependencias ainda nao foram instaladas.
  echo Abra o terminal nesta pasta e execute: npm ci
  pause
  exit /b 1
)

"%RESOLVAI_NODE%" "%~dp0scripts\start-prototype.mjs"
if errorlevel 1 (
  echo.
  echo Nao foi possivel iniciar o prototipo. Veja o motivo acima.
  echo Copie a mensagem de erro acima para identificar o problema.
  pause
  exit /b 1
)
