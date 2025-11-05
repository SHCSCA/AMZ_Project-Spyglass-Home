# 🚀 生产环境快速修复 - 执行清单

## ⚡ 一键修复（最快）

```bash
cd /path/to/AMZ_Project-Spyglass-Home
./scripts/production-fix.sh
```

---

## 📋 问题和解决方案

### ❌ 问题：静态资源 502 错误

```
GET http://156.238.230.229:8082/assets/DashboardPage-xxx.js
net::ERR_ABORTED 502 (Bad Gateway)
```

### ✅ 根本原因

1. **nginx 配置问题**：`/` location 拦截了 `/assets/` 请求
2. **缺少性能优化**：无 gzip 压缩和缓存策略
3. **构建参数传递**：docker-compose.yml 环境变量问题

### ✅ 已修复内容

- ✅ nginx.conf 优化（/assets/ 优先匹配 + gzip + 缓存）
- ✅ docker-compose.yml 修复（环境变量正确传递）
- ✅ 新增小类BSR排名趋势图
- ✅ 历史表格新增小类排名列

---

## 🔧 手动部署流程

```bash
# 1. 拉取代码
git pull origin main

# 2. 清理旧容器
docker rm -f spyglass-frontend
docker rmi -f spyglass-frontend:latest

# 3. 重新构建（无缓存）
./scripts/docker-up.sh --no-cache --rebuild

# 4. 验证部署
./scripts/docker-diagnose.sh
```

---

## ✅ 验证清单

### 1. 容器状态

```bash
docker ps | grep spyglass-frontend
# 状态应为: Up
```

### 2. 静态资源

```bash
docker exec spyglass-frontend ls -lh /usr/share/nginx/html/assets/ | wc -l
# 应该 > 10
```

### 3. nginx 配置

```bash
docker exec spyglass-frontend nginx -t
# 输出: nginx: configuration file ... test is successful
```

### 4. 网页访问

```
http://156.238.230.229:8082/dashboard
```

- ✅ 无 502 错误
- ✅ 页面正常加载
- ✅ 可以看到小类BSR排名趋势图
- ✅ 历史表格有小类排名列

### 5. 性能检查

```bash
# gzip 压缩
curl -H "Accept-Encoding: gzip" -I http://localhost:8082/assets/index-*.js | grep gzip

# 缓存策略
curl -I http://localhost:8082/assets/index-*.js | grep "Cache-Control"
```

---

## 🔍 快速排查

### 问题1: 容器无法启动

```bash
docker logs spyglass-frontend
# 查看错误信息
```

### 问题2: 502 错误仍然存在

```bash
# 检查 nginx 配置是否生效
docker exec spyglass-frontend cat /etc/nginx/conf.d/default.conf | grep -A3 "location /assets"

# 重启容器
docker restart spyglass-frontend
```

### 问题3: 新功能不显示

```bash
# 清空浏览器缓存
Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

# 检查后端数据
curl http://156.238.230.229:8081/api/asin/1/history?range=7d | jq '.items[0] | {bsrSubcategoryRank, bsrSubcategory}'
```

---

## 📞 紧急回滚

```bash
# 回滚到上一个版本
git reset --hard 75d1ac0
./scripts/docker-up.sh --rebuild
```

---

## 📦 提交历史

- `03ba3c2` - docs: 添加生产环境部署完整指南
- `c2fa408` - feat: 添加生产环境一键修复脚本
- `0720e7e` - docs: 添加docker部署问题排查指南
- `27c2560` - fix: 修复docker部署静态资源502问题并新增功能
- `75d1ac0` - feat: 优化用户体验,移除库存趋势和全局告警

---

## 🎯 执行顺序（推荐）

1. **在生产服务器执行**

   ```bash
   cd /path/to/AMZ_Project-Spyglass-Home
   git pull origin main
   ./scripts/production-fix.sh
   ```

2. **等待部署完成**（约 3-5 分钟）

3. **验证部署**
   - 浏览器访问: http://156.238.230.229:8082/dashboard
   - 检查控制台无错误
   - 验证新功能

4. **如有问题**
   - 查看日志: `docker logs -f spyglass-frontend`
   - 运行诊断: `./scripts/docker-diagnose.sh`
   - 参考文档: `PRODUCTION_DEPLOY.md`

---

**部署前提**:

- ✅ 服务器已安装 Docker 和 docker-compose
- ✅ 已克隆代码仓库
- ✅ 有执行 shell 脚本的权限

**预计时间**: 5-10 分钟

**风险等级**: 低（前端无状态，数据在后端）

---

✨ 祝部署成功！
