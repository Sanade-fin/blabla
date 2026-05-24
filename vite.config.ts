import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true,
    watch: {
      // Windows: MP3 может быть заблокирован плеером → EBUSY и падение Vite
      ignored: ['**/public/audio/**'],
    },
  },
  build: { target: 'es2022' },
});
