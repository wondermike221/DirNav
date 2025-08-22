import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { resolve } from 'path';

export default defineConfig({
  optimizeDeps: {
    noDiscovery: false,
  },
  plugins: [solidPlugin()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'SolidDirnavUI',
      formats: ['es', 'umd'],
      fileName: (format) => `solid-dirnav-ui.${format}.js`
    },
    rollupOptions: {
      external: ['solid-js'],
      output: {
        globals: {
          'solid-js': 'SolidJS'
        }
      }
    },
    sourcemap: true,
    emptyOutDir: true
  }
});