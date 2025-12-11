import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import devConfig from './.dev.config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      'odds-core': resolve(__dirname, '../../packages/odds-core/src'),
      'odds-websocket': resolve(__dirname, '../../packages/odds-websocket/src'),
      'odds-arbitrage': resolve(__dirname, '../../packages/odds-arbitrage/src'),
      'odds-ml': resolve(__dirname, '../../packages/odds-ml/src'),
      'odds-temporal': resolve(__dirname, '../../packages/odds-temporal/src'),
      'odds-validation': resolve(__dirname, '../../packages/odds-validation/src')
    }
  },
  server: {
    host: devConfig.server.host,
    port: devConfig.server.port,
    strictPort: false, // Allow fallback to next available port
    open: devConfig.server.open, // Auto-open browser based on config
    cors: devConfig.server.cors, // Enable CORS for development
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('API proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('API proxy request:', req.method, req.url);
          });
        }
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true,
        secure: false
      },
      // Add proxy for custom API endpoints
      '/custom-api': {
        target: 'https://dev.api.example.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/custom-api/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Custom API proxy error:', err);
          });
        }
      },
      // Health check endpoint
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: false,
        selfHandleResponse: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Handle health check directly
            if (req.url === '/health') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'bun-fetch-demo',
                version: '1.0.0'
              }, null, 2));
            }
          });
        }
      }
    },
    hmr: {
      port: 3000,
    },
    watch: {
      usePolling: false, // Use native file watching
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: devConfig.build.sourcemaps,
    minify: devConfig.build.minify ? 'esbuild' : false, // Conditional minification
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@testing-library/react', '@testing-library/user-event']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@testing-library/react'],
    exclude: ['@vite/client', '@vite/env']
  },
  preview: {
    port: 3001, // Different port for preview
    host: true,
    cors: true
  }
});
