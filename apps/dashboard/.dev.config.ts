// apps/dashboard/.dev.config.ts
export interface DevConfig {
  // Server configuration
  server: {
    port: number;
    host: string;
    open: boolean;
    cors: boolean;
  };

  // API endpoints for testing
  apis: {
    jsonplaceholder: string;
    httpbin: string;
    custom: string;
  };

  // Development features
  features: {
    hotReload: boolean;
    errorOverlay: boolean;
    performanceMonitoring: boolean;
    debugLogging: boolean;
  };

  // Build configuration
  build: {
    sourcemaps: boolean;
    minify: boolean;
    analyze: boolean;
  };
}

export const devConfig: DevConfig = {
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: false,
    cors: true
  },

  apis: {
    jsonplaceholder: 'https://jsonplaceholder.typicode.com',
    httpbin: 'https://httpbin.org',
    custom: 'https://dev.api.example.com'
  },

  features: {
    hotReload: true,
    errorOverlay: true,
    performanceMonitoring: true,
    debugLogging: process.env.NODE_ENV === 'development'
  },

  build: {
    sourcemaps: true,
    minify: false,
    analyze: false
  }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  devConfig.build.minify = true;
  devConfig.build.sourcemaps = false;
}

if (process.env.VITE_ANALYZE === 'true') {
  devConfig.build.analyze = true;
}

export default devConfig;