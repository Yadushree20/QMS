import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';  // ← v4 plugin

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),  // ← Add this line
  ],
  // Configure Vite to handle WebAssembly files properly
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['occt-import-js']
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    fs: {
      // Allow serving files from node_modules
      allow: ['../../']
    },
    proxy: {
      // Proxy all API requests to the backend server
      '^/api/.*': {
        target: 'http://172.18.7.93:8800',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      }
    },
    cors: true
  },
  build: {
    rollupOptions: {
      external: ['occt-import-js']
    }
  }
});