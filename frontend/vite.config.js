import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8787';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      open: false,
      // Local only: when VITE_API_BASE is empty, /api is proxied to Railway-local backend
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
    },
  };
});
