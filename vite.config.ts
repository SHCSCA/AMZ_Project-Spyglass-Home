import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // 开发端口修改为 8082，保持与部署端区分
    port: 8082
  }
});
