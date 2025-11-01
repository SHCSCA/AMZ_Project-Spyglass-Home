import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // 开发端口修改为 8082，保持与部署端区分
    port: 8082,
    proxy: {
      '/api': {
        target: 'http://shcamz.xyz:8081',
        changeOrigin: true,
        // 仅当后端不需要额外路径前缀时，保持重写
        rewrite: (path) => path,
      }
    }
  }
});
