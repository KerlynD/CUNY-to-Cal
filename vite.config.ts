import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    // Simple plugin to copy static files
    {
      name: 'copy-files',
      writeBundle() {
        // Ensure dist directory exists
        if (!fs.existsSync('dist')) {
          fs.mkdirSync('dist', { recursive: true });
        }
        
        // Copy manifest.json
        fs.copyFileSync('manifest.json', 'dist/manifest.json');
        
        // Create icons directory and copy placeholder files
        if (!fs.existsSync('dist/icons')) {
          fs.mkdirSync('dist/icons', { recursive: true });
        }
        
        // Copy icon placeholders
        if (fs.existsSync('src/icons')) {
          const files = fs.readdirSync('src/icons');
          files.forEach(file => {
            fs.copyFileSync(`src/icons/${file}`, `dist/icons/${file}`);
          });
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        options: resolve(__dirname, 'src/options/options.html'),
        background: resolve(__dirname, 'src/background.ts'),
        contentScript: resolve(__dirname, 'src/contentScript.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
}); 