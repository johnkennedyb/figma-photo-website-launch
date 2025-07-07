import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? process.env.VITE_API_BASE_URL || 'https://figma-photo-website-launch.onrender.com'
          : `http://localhost:${process.env.VITE_SERVER_PORT || 3002}`,
        changeOrigin: true,
        secure: true,
        onError(err: Error) {
          console.error('[Vite Proxy Error]', err.message);
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.error('API Proxy error:', err);
            res.writeHead(500, {
              'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({
              error: 'API Error',
              message: err.message
            }));
          });
          proxy.onProxyReq((proxyReq: any, req: any, res: any) => {
            // Add proper headers for production
            if (process.env.NODE_ENV === 'production') {
              proxyReq.setHeader('Origin', process.env.VITE_API_BASE_URL);
              proxyReq.setHeader('Referer', process.env.VITE_API_BASE_URL);
              proxyReq.setHeader('Accept', 'application/json');
              proxyReq.setHeader('Content-Type', 'application/json');
            }
          });
        }
      },
      '/socket.io': {
        target: process.env.NODE_ENV === 'production' 
          ? process.env.VITE_WS_BASE_URL || 'wss://figma-photo-website-launch.onrender.com'
          : `http://localhost:${process.env.VITE_SERVER_PORT || 3002}`,
        ws: true,
        changeOrigin: true,
        secure: true,
        logLevel: 'debug',
        onError(err: Error) {
          console.error('[Vite Socket.IO Proxy Error]', err.message);
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.error('WebSocket Proxy error:', err);
            res.writeHead(500, {
              'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({
              error: 'WebSocket Error',
              message: err.message
            }));
          });
        }
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
