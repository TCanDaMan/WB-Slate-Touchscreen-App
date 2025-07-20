# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: TOUCHSCREEN FUNCTIONALITY

This application runs on **85-inch touchscreen displays** and must support full touch interaction. The current implementation has **significant bugs** with drag-and-drop on touch devices because it only uses HTML5 drag API (mouse-only).

### Current Touch Issues
1. **No touch event handlers** - Drag-and-drop only works with mouse
2. **HTML5 Drag API doesn't support touch** - Requires touch event simulation
3. **No touch-friendly libraries** - Missing react-dnd-touch-backend or similar
4. **CSS not optimized for touch** - Missing touch-action and user-select properties

## Project Overview

WBDTouchScreen is a React-based executive dashboard for Warner Bros. Discovery (WBD) content slate planning, designed for large touchscreen displays and iPad testing.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm start

# Build for production (outputs to /build directory)
npm run build

# Run tests
npm test

# iPad Testing (access from iPad on same network)
# Start dev server with: npm start
# Access via: http://[your-computer-ip]:3000
```

## 🔧 REQUIRED UPGRADES

### 1. React Version Upgrade
Current setup has version conflicts:
- Package.json: React 17.0.2
- Resolutions: React 19.1.0

**Upgrade Path:**
```bash
# Update all React packages
npm install react@latest react-dom@latest
npm install react-scripts@latest

# Update testing libraries
npm install @testing-library/react@latest @testing-library/jest-dom@latest
```

### 2. Touch Support Libraries
Install one of these touch-enabled drag libraries:
```bash
# Option 1: React DnD with touch backend
npm install react-dnd react-dnd-html5-backend react-dnd-touch-backend

# Option 2: Framer Motion (modern, touch-first)
npm install framer-motion

# Option 3: InteractJS (powerful touch gestures)
npm install interactjs
```

## Architecture Overview

### Core Technology Stack
- **React** - Main framework (NEEDS UPGRADE)
- **Create React App** - Build tooling
- **Monday.com SDK** - Platform integration
- **Touch Libraries** - MISSING (needs implementation)

### Touch-Critical Components
```
src/
├── App.js                    # Main component - Contains broken drag-drop (lines 947-975)
├── App.css                   # Needs touch-specific CSS properties
└── Timeline Components/      # May need touch gesture support
```

## Touch Implementation Guide

### Current Broken Implementation (App.js:947-975)
```javascript
// PROBLEM: Only works with mouse, not touch
const handleDragStart = (e, itemId) => {
  e.dataTransfer.setData('text/plain', itemId);
  // ... mouse-only implementation
};
```

### Required Touch Implementation Pattern
```javascript
// Add touch event handlers alongside drag handlers
const handleTouchStart = (e, itemId) => {
  const touch = e.touches[0];
  // Store initial touch position
  // Set dragging state
};

const handleTouchMove = (e) => {
  e.preventDefault(); // Prevent scrolling
  const touch = e.touches[0];
  // Update element position
  // Check for drop targets
};

const handleTouchEnd = (e, year) => {
  // Determine drop target
  // Execute drop logic
};
```

### Essential CSS for Touch
```css
.draggable-item {
  touch-action: none; /* Prevent default touch behaviors */
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  cursor: grab;
}

.dragging {
  cursor: grabbing;
  opacity: 0.8;
}
```

## iPad & Touch Device Testing

### Local Network Testing
1. Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Start dev server: `npm start`
3. On iPad: Open Safari, navigate to `http://[your-ip]:3000`
4. Enable Web Inspector on iPad for debugging

### Touch Debugging Tools
```javascript
// Add to App.js for touch debugging
useEffect(() => {
  if (window.location.hostname !== 'localhost') return;
  
  window.addEventListener('touchstart', (e) => {
    console.log('Touch Start:', e.touches[0].clientX, e.touches[0].clientY);
  });
  
  window.addEventListener('touchmove', (e) => {
    console.log('Touch Move:', e.touches[0].clientX, e.touches[0].clientY);
  });
}, []);
```

### Chrome DevTools Touch Simulation
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select iPad or custom 85" display dimensions
4. Enable touch simulation

## Common Development Tasks

### Fixing Drag-and-Drop for Touch
1. Replace HTML5 drag API with touch events
2. Add touch event handlers to all draggable elements
3. Implement gesture recognition for better UX
4. Test on actual iPad device, not just simulator

### Testing on 85" Display
- Set browser to fullscreen (F11)
- Use Chrome's device emulation at 1920x1080 or 3840x2160
- Test touch targets are at least 44x44px (Apple HIG)
- Ensure gestures work at arm's length distance

### Monday.com Integration (Unchanged)
- Runs within Monday.com iframe
- Uses Monday SDK for data access
- Column mapping via settings

## Known Issues & Solutions

### Issue: Drag-drop doesn't work on touch devices
**Solution:** Implement touch event handlers or use touch-compatible library

### Issue: React version mismatch
**Solution:** Upgrade to React 18+ for better concurrent features

### Issue: Small touch targets
**Solution:** Increase clickable areas to minimum 44x44px

### Issue: Conflicting click and drag handlers
**Solution:** Use pointer events API or gesture library to disambiguate

## Performance Considerations for Large Displays
- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Optimize re-renders during drag operations
- Consider CSS transforms instead of position changes

## Deployment with Touch Support
1. Test thoroughly on actual touch devices
2. Verify touch events work in Monday.com iframe
3. Ensure proper touch event permissions in iframe
4. Test on both iPad and large touchscreens