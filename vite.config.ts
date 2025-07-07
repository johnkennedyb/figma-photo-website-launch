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
        target: `http://localhost:${process.env.VITE_SERVER_PORT || 3002}`,
        changeOrigin: true,
        onError(err) {
          console.error('[Vite Proxy Error]', err);
        },
      },
      '/socket.io': {
        target: `http://localhost:${process.env.VITE_SERVER_PORT || 3002}`,
        ws: true,
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
        onError(err: Error) {
          console.error('[Vite Socket.IO Proxy Error]', err.message);
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
