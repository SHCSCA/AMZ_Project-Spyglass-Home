# Docker 部署问题修复指南

## 问题分析

您遇到的 **502 Bad Gateway** 和 **静态资源加载失败** 问题，主要原因是：

### 1. Nginx 配置问题

- **原配置**：`location /` 优先级高，拦截了所有请求（包括 `/assets/`）
- **问题表现**：静态 JS 文件返回 502，因为被 SPA fallback 拦截或代理配置干扰
- **解决方案**：添加 `/assets/` 专用 location，优先级高于 `/`

### 2. 缺少静态资源优化

- 未启用 gzip 压缩
- 未配置静态资源缓存策略
- 代理超时设置缺失

### 3. docker-compose.yml 构建参数问题

- 原配置使用 `${VAR-default}` 语法在某些环境下可能无法正确解析
- 构建时间戳使用了 shell 命令，但在 compose 中无法执行

---

## 已修复内容

### ✅ 1. nginx.conf 优化

```nginx
# 新增配置项
location /assets/ {
  try_files $uri =404;
  expires 1y;
  add_header Cache-Control "public, immutable";
  access_log off;
}

# gzip 压缩
gzip on;
gzip_vary on;
gzip_comp_level 6;
gzip_types text/plain text/css application/javascript ...

# 代理超时设置
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

**关键点**：

- `/assets/` 优先于 `/`，避免被 SPA fallback 拦截
- 静态资源缓存 1 年，提升性能
- gzip 压缩减少传输体积 60%+

### ✅ 2. docker-compose.yml 修复

```yaml
build:
  args:
    VITE_API_BASE_URL: ${VITE_API_BASE_URL:-/api} # 使用 :- 语法
    APP_BUILD_TIME: ${APP_BUILD_TIME} # 由脚本传入
    GIT_COMMIT: ${GIT_COMMIT:-unknown}
image: spyglass-frontend:${APP_VERSION:-latest}
container_name: spyglass-frontend # 固定容器名，方便诊断
```

### ✅ 3. 新增功能

- **小类BSR排名趋势图表**（AsinDetailPage.tsx）
- **历史表格新增小类排名列**（HistoryDataTable.tsx）
- **诊断脚本** `scripts/docker-diagnose.sh`

---

## 部署步骤

### 1. 在生产服务器上拉取最新代码

```bash
cd /path/to/AMZ_Project-Spyglass-Home
git pull origin main
```

### 2. 重新构建并部署（强制无缓存）

```bash
./scripts/docker-up.sh --no-cache --rebuild
```

**预期输出**：

```
🚀 Spyglass Frontend Docker 启动脚本
========================================
📦 镜像名称: spyglass-frontend:latest
🌐 API地址:  /api
🔌 前端端口: 8082
📝 Git提交:  27c2560
⏰ 构建时间: 20251105123456
========================================

🔨 开始构建镜像...
✅ 镜像构建成功！
🚀 启动容器服务...
✅ 部署完成！
```

### 3. 运行诊断脚本

```bash
./scripts/docker-diagnose.sh
```

**检查项**：

- ✅ 容器状态: running
- ✅ assets 文件数 > 0
- ✅ nginx 配置正确
- ✅ DashboardPage chunk 可访问
- ✅ 无 nginx 错误日志

### 4. 验证访问

浏览器访问：

```
http://156.238.230.229:8082/dashboard
```

**正常情况**：

- 页面正常加载
- 控制台无 502 错误
- 可以看到小类BSR排名趋势图
- 历史表格显示小类排名列

---

## 常见问题排查

### 问题 1: 仍然出现 502 错误

**排查步骤**：

```bash
# 1. 检查容器日志
docker logs -f spyglass-frontend

# 2. 进入容器检查文件
docker exec -it spyglass-frontend sh
ls -lh /usr/share/nginx/html/assets/

# 3. 检查 nginx 配置
docker exec spyglass-frontend nginx -t

# 4. 查看 nginx 错误日志
docker exec spyglass-frontend tail -50 /var/log/nginx/error.log
```

### 问题 2: 容器无法启动

```bash
# 查看容器状态
docker ps -a | grep spyglass

# 查看详细日志
docker logs spyglass-frontend

# 重新构建（清理旧镜像）
docker rm -f spyglass-frontend
docker rmi spyglass-frontend:latest
./scripts/docker-up.sh --no-cache
```

### 问题 3: 构建失败

```bash
# 检查 Node 版本（需要 20+）
node --version

# 清理 npm 缓存
npm cache clean --force

# 手动构建测试
npm ci
npm run build
ls -lh dist/assets/
```

---

## 环境变量配置

如需修改 API 地址或端口：

```bash
# 使用反向代理模式（推荐）
VITE_API_BASE_URL=/api FRONTEND_PORT=8082 ./scripts/docker-up.sh

# 或直连后端模式
VITE_API_BASE_URL=http://shcamz.xyz:8081 FRONTEND_PORT=8082 ./scripts/docker-up.sh
```

---

## 性能优化验证

部署后，验证优化效果：

### 1. 检查 gzip 压缩

```bash
curl -H "Accept-Encoding: gzip" -I http://156.238.230.229:8082/assets/index-xxx.js
# 应该看到: Content-Encoding: gzip
```

### 2. 检查缓存策略

```bash
curl -I http://156.238.230.229:8082/assets/index-xxx.js
# 应该看到: Cache-Control: public, immutable
```

### 3. 页面加载速度

- 首次加载：< 2s
- 缓存后加载：< 500ms

---

## 联系支持

如遇到其他问题，请提供以下信息：

```bash
# 收集诊断信息
./scripts/docker-diagnose.sh > diagnose.log 2>&1
docker logs spyglass-frontend > container.log 2>&1

# 打包发送
tar -czf debug-info.tar.gz diagnose.log container.log
```

---

## 更新日志

**v0.2.5** (2025-11-05)

- 🐛 修复 Docker 部署静态资源 502 问题
- ✨ 新增小类BSR排名趋势图
- ✨ 历史表格新增小类排名展示
- 🔧 优化 nginx 配置（gzip + 缓存）
- 🛠️ 新增 docker-diagnose.sh 诊断工具
