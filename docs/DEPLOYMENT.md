# 生产环境部署说明

## 环境变量配置

在生产环境构建前，需创建 `.env.production` 文件（此文件不入库，已被 .gitignore 忽略）：

```bash
# 根据实际部署情况配置 API 地址
# 方式1: 使用绝对地址（需允许跨域）
VITE_API_BASE_URL=http://shcamz.xyz:8081

# 方式2: 使用相对路径通过 nginx 反代（推荐）
# VITE_API_BASE_URL=/api
```

## 构建步骤

```bash
# 1. 安装依赖
npm install

# 2. 构建生产包
npm run build

# 3. 输出目录：dist/
```

## Nginx 配置示例（推荐）

使用反向代理避免跨域问题：

```nginx
server {
    listen 8082;
    server_name shcamz.xyz;

    # 前端静态资源
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:8081/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

此时 `.env.production` 中使用：

```
VITE_API_BASE_URL=/api
```

## 常见问题

### React 310 错误

已修复：`useFetch` 的 `reload` 方法现在正确处理组件卸载后的状态更新。

### 接口访问失败

- 检查 `VITE_API_BASE_URL` 是否正确
- 若使用绝对地址，确认后端已配置 CORS
- 浏览器 F12 Network 面板查看实际请求 URL

## 验证部署

访问 `http://shcamz.xyz:8082` 后：

1. 打开浏览器 F12 控制台，确认无 React 错误
2. Network 面板检查 API 请求路径与响应
3. 访问 `/asin/2` 等路由确认页面正常
