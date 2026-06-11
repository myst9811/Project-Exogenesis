import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Vite build/dev configuration. The app is a single-page client (CLAUDE.md
 * §1): no server runtime. The physics engine and renderer are plain modules
 * bundled into the client.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2023',
    sourcemap: true,
  },
});
