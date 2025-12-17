import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'src', 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      // `root` is already set to `src`, so point to the public directory directly
      srcDir: 'public',
      filename: 'sw.js',
      registerType: 'prompt',
      includeAssets: ['story.png', 'favicon.png'],
      manifest: {
        name: 'Story App',
        short_name: 'Story',
        description: 'Aplikasi story dengan ikon custom',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'story.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'story.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'story.png',
            sizes: '600x400',
            type: 'image/png',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
});
