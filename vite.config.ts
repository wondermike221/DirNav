import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  build: {
    target: 'esnext',
    lib: {
      entry: 'src/index.tsx',
      name: 'SolidDirnavUI',
      fileName: (format) => `solid-dirnav-ui.${format}.js`,
    },
    rollupOptions: {
      external: ['solid-js'],
    },
  },
});