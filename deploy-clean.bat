@echo off
echo === CLEAN MONDAY DEPLOYMENT ===
echo.

echo Cleaning everything...
rmdir /s /q build 2>nul
rmdir /s /q node_modules\.cache 2>nul

echo Building with craco (no dev server)...
call npm run build

echo.
echo Checking build output...
dir build\static\js\*.js

echo.
echo Deploying to Monday...
call mapps code:push --force

echo.
echo === DONE ===
echo If still seeing old code:
echo 1. Try a different browser
echo 2. Clear Monday app cache in Monday admin panel
echo 3. Create a new app version