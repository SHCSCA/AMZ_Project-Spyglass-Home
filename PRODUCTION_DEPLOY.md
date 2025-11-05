# 🚀 生产环境部署指南

## 问题描述

您遇到的问题：

- ✅ **已修复**: Docker 部署后静态资源返回 502 Bad Gateway
- ✅ **已添加**: 小类BSR排名趋势图表
- ✅ **已添加**: 历史表格小类排名列

---

## 一键修复（推荐）

在生产服务器上执行：

```bash
cd /path/to/AMZ_Project-Spyglass-Home
./scripts/production-fix.sh
```

这个脚本会自动完成：

1. ✅ 拉取最新代码
2. ✅ 清理旧容器和镜像
3. ✅ 无缓存重新构建
4. ✅ 启动容器
5. ✅ 运行诊断检查

---

## 手动部署步骤

如果需要手动控制，按以下步骤操作：

### 1️⃣ 拉取最新代码

```bash
cd /path/to/AMZ_Project-Spyglass-Home
git pull origin main
```

### 2️⃣ 停止并删除旧容器

```bash
docker-compose down
docker rm -f spyglass-frontend
```

### 3️⃣ 清理旧镜像（可选但推荐）

```bash
docker rmi spyglass-frontend:latest
```

### 4️⃣ 重新构建并启动

```bash
# 方式A: 使用脚本（推荐）
./scripts/docker-up.sh --no-cache --rebuild

# 方式B: 使用 docker-compose
VITE_API_BASE_URL=/api \
APP_BUILD_TIME=$(date +%Y%m%d%H%M%S) \
GIT_COMMIT=$(git rev-parse --short HEAD) \
docker-compose up -d --build --force-recreate frontend
```

### 5️⃣ 验证部署

```bash
# 运行诊断脚本
./scripts/docker-diagnose.sh

# 查看容器日志
docker logs -f spyglass-frontend

# 检查容器状态
docker ps | grep spyglass
```

---

## 验证新功能

访问：`http://156.238.230.229:8082/dashboard`

### ✅ 小类BSR排名趋势图

1. 点击任意 ASIN 进入详情页
2. 向下滚动到图表区域
3. 应该看到三张趋势图：
   - 价格趋势
   - BSR趋势
   - **小类BSR排名趋势** ⬅️ 新增

### ✅ 历史表格小类排名列

1. 在详情页点击"历史数据表格"Tab
2. 表格第一列（快照时间）后应该有：
   - **小类BSR排名** ⬅️ 新增
   - 价格
   - BSR排名
   - 库存
   - 评分
   - 评论数
   - ...

---

## 问题排查

### 问题1: 仍然出现 502 错误

```bash
# 1. 检查 nginx 配置是否生效
docker exec spyglass-frontend cat /etc/nginx/conf.d/default.conf | grep assets

# 预期输出应包含:
# location /assets/ {
#   try_files $uri =404;
#   ...
# }

# 2. 测试 nginx 配置
docker exec spyglass-frontend nginx -t

# 3. 重启容器
docker restart spyglass-frontend
```

### 问题2: 容器启动失败

```bash
# 查看详细错误
docker logs spyglass-frontend

# 常见问题:
# - 端口 8082 被占用 → 修改 FRONTEND_PORT
# - 构建失败 → 检查网络和磁盘空间
# - nginx 配置错误 → 查看上一步输出
```

### 问题3: 图表不显示

```bash
# 1. 检查浏览器控制台是否有 JS 错误
# 2. 清空浏览器缓存并刷新
# 3. 确认后端数据中有 bsrSubcategoryRank 字段

# 4. 手动测试 API
curl http://156.238.230.229:8081/api/asin/1/history?range=7d | jq '.items[0].bsrSubcategoryRank'
# 应该返回数字，而不是 null
```

### 问题4: 历史表格列不显示

```bash
# 检查浏览器开发者工具
# 1. Network Tab: 确认 HistoryDataTable chunk 已加载
# 2. Console Tab: 查看是否有 React 错误
# 3. 强制刷新: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
```

---

## 性能验证

### 检查 gzip 压缩

```bash
curl -H "Accept-Encoding: gzip" -I http://156.238.230.229:8082/assets/index-*.js 2>&1 | grep -i "content-encoding"
```

**预期输出**: `Content-Encoding: gzip`

### 检查缓存策略

```bash
curl -I http://156.238.230.229:8082/assets/index-*.js 2>&1 | grep -i "cache-control"
```

**预期输出**: `Cache-Control: public, immutable`

### 测试加载速度

```bash
# 首次加载（无缓存）
time curl -o /dev/null -s http://156.238.230.229:8082/

# 应该 < 2 秒
```

---

## 核心修复说明

### 修复1: nginx.conf

**问题**: `/` location 拦截了所有请求，包括 `/assets/` 静态资源

**解决**:

```nginx
# 优先匹配静态资源
location /assets/ {
  try_files $uri =404;
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# SPA fallback 放在最后
location / {
  try_files $uri $uri/ /index.html;
}
```

### 修复2: docker-compose.yml

**问题**: 环境变量未正确传递到构建阶段

**解决**:

```yaml
build:
  args:
    VITE_API_BASE_URL: ${VITE_API_BASE_URL:-/api}
    APP_BUILD_TIME: ${APP_BUILD_TIME}
    GIT_COMMIT: ${GIT_COMMIT:-unknown}
```

### 新增: 性能优化

```nginx
# gzip 压缩
gzip on;
gzip_comp_level 6;
gzip_types application/javascript text/css ...

# 静态资源缓存
expires 1y;
add_header Cache-Control "public, immutable";
```

---

## 回滚方案

如果新版本有问题，快速回滚：

```bash
# 1. 回滚代码
git reset --hard 75d1ac0  # 上一个稳定版本

# 2. 重新构建
./scripts/docker-up.sh --rebuild

# 3. 验证
./scripts/docker-diagnose.sh
```

---

## 环境变量说明

| 变量名              | 默认值   | 说明         |
| ------------------- | -------- | ------------ |
| `VITE_API_BASE_URL` | `/api`   | API 基础路径 |
| `FRONTEND_PORT`     | `8082`   | 宿主机端口   |
| `APP_VERSION`       | `latest` | 镜像标签     |
| `GIT_COMMIT`        | 自动获取 | Git 提交号   |

### 修改示例

```bash
# 修改端口
FRONTEND_PORT=9090 ./scripts/docker-up.sh

# 使用直连模式（不推荐）
VITE_API_BASE_URL=http://shcamz.xyz:8081 ./scripts/docker-up.sh
```

---

## 联系支持

如遇到无法解决的问题，请收集以下信息：

```bash
# 生成诊断报告
./scripts/docker-diagnose.sh > diagnose-$(date +%Y%m%d-%H%M%S).log 2>&1
docker logs spyglass-frontend > container-$(date +%Y%m%d-%H%M%S).log 2>&1

# 查看 nginx 配置
docker exec spyglass-frontend cat /etc/nginx/conf.d/default.conf > nginx-config.txt

# 打包发送
tar -czf debug-$(date +%Y%m%d-%H%M%S).tar.gz *.log *.txt
```

---

## 更新历史

- **c2fa408** (2025-11-05): 添加生产环境一键修复脚本
- **0720e7e** (2025-11-05): 添加 Docker 部署问题排查指南
- **27c2560** (2025-11-05): 修复 Docker 部署静态资源 502 问题
- **75d1ac0** (2025-11-05): 优化用户体验，移除库存趋势和全局告警

---

## 常见问题 FAQ

**Q: 为什么要无缓存构建？**  
A: 确保 nginx.conf 等配置文件被更新到镜像中。

**Q: 构建需要多长时间？**  
A: 首次约 3-5 分钟，后续有缓存约 1-2 分钟。

**Q: 如何确认部署成功？**  
A: 运行 `./scripts/docker-diagnose.sh`，所有检查项应为 ✅。

**Q: 数据会丢失吗？**  
A: 不会。前端无状态，数据在后端。

**Q: 可以不停机更新吗？**  
A: 可以，使用蓝绿部署或更改端口。

---

祝部署顺利！🎉
