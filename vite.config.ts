import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: entry('./index.html'),
        play: entry('./play.html'),
      },
    },
  },
});
