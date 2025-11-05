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
    }
  },
  build: {
    rollupOptions: {
      external: ['occt-import-js']
    }
  }
});