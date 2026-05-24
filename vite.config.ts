import { defineConfig } from 'vite';

export default defineConfig({
  // Относительные пути — кнопки и скрипты работают на GitHub Pages / в подпапке конкурса
  base: './',
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
