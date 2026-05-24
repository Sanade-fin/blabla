@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "NODE_DIR=C:\Program Files\nodejs"
if exist "%NODE_DIR%\npm.cmd" (
  set "PATH=%NODE_DIR%;%PATH%"
) else (
  echo Node.js не найден. Установите с https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Установка зависимостей...
  call npm install
  if errorlevel 1 pause & exit /b 1
)

echo.
echo Игра запускается: http://localhost:5173
echo Закройте это окно, чтобы остановить сервер.
echo.
call npm run dev
