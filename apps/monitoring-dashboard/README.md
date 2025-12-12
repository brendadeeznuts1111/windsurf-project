# Windsurf Monitoring Dashboard

Real-time system monitoring dashboard built with React, TypeScript, and Tailwind CSS. Connects to the Windsurf REST API server for live metrics visualization.

## Features

- 📊 **Real-time Metrics**: Live charts and graphs showing system performance
- 🏥 **Health Monitoring**: System health status with tension scoring
- 📈 **Analytics Dashboard**: User and content analytics
- 🔄 **Auto-refresh**: Automatic data updates every 5-10 seconds
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Clean interface with Tailwind CSS

## Quick Start

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dashboard will be available at `http://localhost:5173`.

## Prerequisites

- **Windsurf REST API Server** running on `http://localhost:3000`
- Node.js 18+ and npm

## Project Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Card.tsx          # Reusable card components
│   │   └── Badge.tsx         # Status badges
│   ├── MetricsChart.tsx      # Real-time metrics chart
│   ├── HealthStatus.tsx      # System health display
│   └── Navigation.tsx        # Top navigation bar
├── pages/
│   ├── Dashboard.tsx         # Main dashboard page
│   ├── HealthMonitor.tsx     # Health monitoring page
│   └── MetricsViewer.tsx     # Detailed metrics viewer
├── App.tsx                   # Main app component
├── App.css                   # Additional styles
├── main.tsx                  # React entry point
└── index.css                 # Global styles
```

## API Integration

The dashboard connects to the Windsurf REST API server with these endpoints:

- `GET /api/health` - System health and metrics
- `GET /api/analytics` - User and content analytics
- `GET /api/metrics` - Detailed system metrics

## Features Overview

### Dashboard Page
- **Overview Cards**: Total users, posts, weekly activity, health score
- **Real-time Charts**: Tension score, user growth, content creation
- **Service Status**: Database, metrics, UUID generator status
- **Health Status**: Current system health with detailed metrics

### Health Monitor Page
- **System Health**: Overall status and tension scoring
- **Health Alerts**: Real-time alerts and notifications
- **Performance Metrics**: Uptime, response times, memory usage

### Metrics Viewer Page
- **Resource Usage**: CPU, memory, disk, network utilization
- **Request Volume**: Historical request patterns
- **Raw Metrics**: JSON view of all system metrics
- **Performance Stats**: Response times, error rates, throughput

## Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run type checking
npm run build

# Run linting
npm run lint
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Vite** - Build tool and dev server
- **Lucide React** - Icons

## Configuration

The dashboard automatically connects to the API server at `http://localhost:3000`. To change this:

1. Update the fetch URLs in the page components
2. Or set up environment variables for different environments

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test components with the API server running
4. Update this README for new features

## License

MIT