#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting clean production build...');

// Clean build directory
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  console.log('Removing old build directory...');
  fs.rmSync(buildDir, { recursive: true, force: true });
}

// Set production environment
process.env.NODE_ENV = 'production';
process.env.GENERATE_SOURCEMAP = 'false';
process.env.INLINE_RUNTIME_CHUNK = 'false';

// Run build
console.log('Building production version...');
try {
  execSync('npm run build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: 'false',
      NODE_ENV: 'production',
      GENERATE_SOURCEMAP: 'false',
      DISABLE_ESLINT_PLUGIN: 'true'
    }
  });
  
  console.log('Build completed successfully!');
  
  // Verify no dev server code
  const mainJs = fs.readdirSync(path.join(buildDir, 'static', 'js'))
    .find(f => f.startsWith('main') && f.endsWith('.js'));
    
  if (mainJs) {
    const content = fs.readFileSync(path.join(buildDir, 'static', 'js', mainJs), 'utf8');
    if (content.includes('webpack-dev-server')) {
      console.error('WARNING: Build contains webpack-dev-server code!');
      process.exit(1);
    }
  }
  
  console.log('Build verified - no dev server code found.');
  
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}