# WBD Executive Slate TouchScreen Dashboard

A touchscreen-optimized dashboard for Warner Bros. Discovery executive slate planning, built as a Monday.com app.

## Features

- 📱 **Touch-Optimized Interface**: Designed for 85-inch touchscreen displays and iPad testing
- 🎯 **Drag & Drop**: Move titles between years with smooth touch interactions
- 📊 **Real-time Analytics**: Visual charts for revenue, investment, and ROI tracking
- 🔄 **Monday.com Integration**: Seamlessly syncs with Monday.com boards
- 🎨 **Responsive Design**: Works on all screen sizes from mobile to large displays

## Tech Stack

- React 18.3.1
- Monday SDK JS
- Recharts for data visualization
- CRACO for custom build configuration
- Monday Apps Framework (OAuth authentication)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Deploy to Monday
mapps code:push
```

## Deployment

The app is deployed using Monday's app framework:

```bash
# Build and deploy
./deploy-clean.bat
```

## Project Structure

```
├── src/
│   ├── App.js           # Main dashboard component
│   ├── App.css          # Styles and animations
│   ├── SimpleUI.js      # Lightweight UI components
│   └── index.js         # App entry point
├── public/
│   ├── monday-manifest.json  # Monday app configuration
│   └── index.html
└── package.json
```

## Monday.com Setup

1. This app uses OAuth authentication - no API keys needed
2. Required permissions: `boards:read`, `boards:write`
3. The app automatically syncs with selected Monday boards

## License

Proprietary - Warner Bros. Discovery