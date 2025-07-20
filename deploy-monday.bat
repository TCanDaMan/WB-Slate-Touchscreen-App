@echo off
echo === MONDAY APP DEPLOYMENT SCRIPT ===
echo.

echo Step 1: Cleaning old files...
rmdir /s /q build 2>nul
rmdir /s /q node_modules\.cache 2>nul
del /q .mappscache 2>nul

echo Step 2: Setting production environment...
set NODE_ENV=production
set GENERATE_SOURCEMAP=false
set INLINE_RUNTIME_CHUNK=false
set DISABLE_ESLINT_PLUGIN=true

echo Step 3: Installing dependencies (if needed)...
call npm install

echo Step 4: Building production version...
call npm run build

if not exist build (
    echo ERROR: Build failed! No build directory created.
    exit /b 1
)

echo Step 5: Verifying build...
findstr /C:"webpack-dev-server" build\static\js\*.js >nul
if %errorlevel% == 0 (
    echo ERROR: Development server code found in build!
    echo This is a development build, not production!
    exit /b 1
) else (
    echo SUCCESS: Build verified - no dev server code found.
)

echo Step 6: Deploying to Monday...
echo Running: mapps code:push --force
call mapps code:push --force

echo.
echo === DEPLOYMENT COMPLETE ===
echo If you still see old code, try:
echo 1. Clear your browser cache
echo 2. Open the app in an incognito window
echo 3. Wait 2-3 minutes for Monday CDN to update