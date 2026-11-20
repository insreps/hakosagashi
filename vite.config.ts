import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

function buildSpa404Html(): string {
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HakoSagashi</title>
    <script>
      (function () {
        var l = window.location;
        var p = l.pathname;
        var roomsIdx = p.indexOf('/rooms/');
        if (roomsIdx !== -1) {
          l.replace(l.protocol + '//' + l.host + p.slice(0, roomsIdx) + '/#' + p.slice(roomsIdx) + l.search);
          return;
        }
        var searchIdx = p.lastIndexOf('/search');
        if (searchIdx !== -1 && (searchIdx + 7 === p.length || p.slice(searchIdx) === '/search/')) {
          l.replace(l.protocol + '//' + l.host + p.slice(0, searchIdx) + '/#/search' + l.search);
          return;
        }
        var parts = p.split('/').filter(Boolean);
        var repoBase = '/';
        if (parts.length > 0 && l.hostname.slice(-9) === 'github.io') {
          repoBase = parts[1] === 'docs' ? '/' + parts[0] + '/docs/' : '/' + parts[0] + '/';
        }
        l.replace(l.protocol + '//' + l.host + repoBase);
      })();
    </script>
  </head>
  <body></body>
</html>
`;
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const mapsApiKey =
    env.VITE_GOOGLE_MAPS_API_KEY ||
    env.GOOGLE_MAPS_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    '';

  let resolvedOutDir = path.resolve(__dirname, 'dist');

  return {
    base: './',
    define: {
      'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(mapsApiKey),
    },
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into outDir so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        configResolved(config): void {
          resolvedOutDir = path.resolve(config.root, config.build.outDir);
        },
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const outAssets = path.join(resolvedOutDir, 'src/assets');
          if (fs.existsSync(resolvedOutDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, outAssets, {recursive: true, force: true});
          }
        },
      },
      // Generates GitHub Pages SPA helpers (.nojekyll and 404.html redirect to hash route)
      {
        name: 'github-pages-spa',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          if (!fs.existsSync(resolvedOutDir)) {
            return;
          }
          fs.writeFileSync(path.join(resolvedOutDir, '.nojekyll'), '');
          fs.writeFileSync(path.join(resolvedOutDir, '404.html'), buildSpa404Html(), 'utf8');
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('@vis.gl/react-google-maps')) {
              return 'google-maps';
            }
            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/')
            ) {
              return 'react-vendor';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
