import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates dist/stats.html when VIZ=true
    process.env.VIZ === 'true' ? visualizer({ 
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    }) : null,
  ].filter(Boolean),
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split large vendor libraries into separate chunks
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('socket.io-client')) return 'vendor-socketio';
            if (id.includes('react-router-dom')) return 'vendor-router';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('zustand')) return 'vendor-state';
            // Everything else from node_modules goes to vendor
            return 'vendor';
          }
        }
      }
    }
  }
});
