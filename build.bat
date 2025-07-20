@echo off
echo Cleaning build directory...
rmdir /s /q build 2>nul
rmdir /s /q node_modules\.cache 2>nul

echo Setting production environment...
set NODE_ENV=production
set GENERATE_SOURCEMAP=false
set INLINE_RUNTIME_CHUNK=false
set DISABLE_ESLINT_PLUGIN=true

echo Building production version...
call npm run build

echo Build complete!
echo.
echo IMPORTANT: The build folder now contains your production files.
echo Run 'mapps code:push' to deploy.