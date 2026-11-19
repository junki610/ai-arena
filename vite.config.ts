import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite ビルド・開発サーバー設定
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
});
