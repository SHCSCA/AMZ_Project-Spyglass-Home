# 🚀 生产环境部署指令 (v0.2.2 紧急修复)

> **目标**: 修复生产环境 http://156.238.230.229:8082 的 React #310 错误

---

## 📋 部署前检查

### 1. 确认代码已推送
```bash
# 本地已完成
✅ Commit: e124ce2
✅ Push: origin/main
✅ 版本: v0.2.2
```

### 2. 关键修复内容
- ✅ useFetch hook - reload() 方法增加 mountedRef 检查
- ✅ App.tsx - 版本信息加载增加 mountedRef 保护
- ✅ LogViewer - 异步操作增加 mountedRef 保护
- ✅ 配置优化 - 默认后端地址改为 http://shcamz.xyz:8081

---

## 🎯 生产服务器部署步骤

### 步骤 1: 登录生产服务器
```bash
# 请根据实际情况替换登录命令
ssh user@156.238.230.229
```

### 步骤 2: 进入项目目录
```bash
cd /path/to/AMZ_Project-Spyglass-Home
# 或者你的实际部署路径
```

### 步骤 3: 停止当前容器
```bash
# 停止运行中的容器
docker compose down

# 可选：查看容器状态
docker compose ps
```

### 步骤 4: 拉取最新代码
```bash
# 确保在main分支
git checkout main

# 拉取最新代码
git pull origin main

# 确认当前commit
git log --oneline -1
# 应该看到: e124ce2 hotfix: 修复所有组件的React #310错误 (v0.2.2)
```

### 步骤 5: 清理旧镜像（可选但推荐）
```bash
# 删除旧的前端镜像
docker rmi spyglass-frontend:latest 2>/dev/null || true

# 清理未使用的镜像
docker image prune -f
```

### 步骤 6: 重新构建并启动
```bash
# 使用增强的启动脚本，强制重新构建
./scripts/docker-up.sh --rebuild

# 或者如果需要禁用缓存
./scripts/docker-up.sh --rebuild --no-cache
```

**预期输出:**
```
=========================================
🚀 Spyglass Frontend Docker 启动脚本
=========================================
📦 镜像名称: spyglass-frontend:latest
🌐 API地址:  http://shcamz.xyz:8081
🔌 前端端口: 8082
📝 Git提交:  e124ce2
⏰ 构建时间: 20251104073XXX
=========================================

🔄 强制重新构建镜像...
🔨 开始构建镜像...
[+] Building ...
✅ 镜像构建成功！
🚀 启动容器服务...
[+] Running 1/1
 ✔ Container spyglass-frontend-1  Started
```

### 步骤 7: 验证容器状态
```bash
# 查看容器状态
docker compose ps

# 应该看到:
# NAME                  STATUS
# spyglass-frontend-1   Up X seconds

# 查看容器日志
docker compose logs -f frontend
# Ctrl+C 退出日志查看
```

---

## ✅ 部署后验证

### 1. 基础连通性测试
```bash
# 测试生产环境是否可访问
curl -I http://156.238.230.229:8082/

# 应该返回:
# HTTP/1.1 200 OK
# Server: nginx/1.27.5
```

### 2. 版本信息验证
```bash
# 检查版本信息
curl -s http://156.238.230.229:8082/version.json | jq

# 应该包含:
# {
#   "version": "e124ce2",
#   "buildTime": "20251104...",
#   "apiBase": "http://shcamz.xyz:8081"
# }
```

### 3. 浏览器测试（关键！）

#### 测试 1: 主页访问
**URL**: http://156.238.230.229:8082/

**检查项**:
- [ ] 页面正常加载
- [ ] 按 F12 打开开发者工具
- [ ] Console 中**无 React #310 错误**
- [ ] 可以看到正常的 API 请求日志

#### 测试 2: ASIN 详情页（原报错页面）
**URL**: http://156.238.230.229:8082/asin/1

**检查项**:
- [ ] 页面正常加载
- [ ] 图表正常渲染
- [ ] 快速刷新页面（F5）2-3 次
- [ ] **Console 无 React #310 错误**

#### 测试 3: Dashboard 页面
**URL**: http://156.238.230.229:8082/dashboard

**操作**:
1. 等待页面加载完成
2. 点击 "管理分组" 按钮
3. Modal 打开后立即点击浏览器后退按钮
4. 重复操作 2-3 次

**检查项**:
- [ ] 操作流畅，无卡顿
- [ ] **Console 无 React #310 错误**
- [ ] **Console 无 "unmounted component" 警告**

#### 测试 4: 告警页面
**URL**: http://156.238.230.229:8082/alerts

**操作**:
1. 页面加载后点击 "刷新" 按钮
2. 立即切换到其他页面（如 Dashboard）
3. 重复操作 2-3 次

**检查项**:
- [ ] **Console 无 React #310 错误**
- [ ] 页面切换流畅

#### 测试 5: 日志查看器
**操作**:
1. 点击页面顶部的 "查看日志" 按钮
2. Drawer 打开后立即点击关闭（X 按钮）
3. 快速重复打开/关闭操作 5 次

**检查项**:
- [ ] **Console 无 React #310 错误**
- [ ] 日志列表正常显示
- [ ] 版本信息显示正确

---

## 🎯 预期结果

### ✅ 成功标志
1. **所有测试场景**: Console 中**无 React #310 错误**
2. **快速操作**: 无 "unmounted component" 警告
3. **用户体验**: 页面流畅，无异常

### ❌ 如果仍然出现错误

#### 情况 1: 浏览器缓存问题
```bash
# 解决方案：
1. 按 Ctrl+Shift+Delete 清除浏览器缓存
2. 或使用无痕模式访问
3. 或强制刷新 Ctrl+F5
```

#### 情况 2: Docker 缓存问题
```bash
# 重新构建（禁用所有缓存）
docker compose down
docker rmi spyglass-frontend:latest
./scripts/docker-up.sh --rebuild --no-cache
```

#### 情况 3: 代码未正确拉取
```bash
# 检查当前 commit
git log --oneline -1

# 如果不是 e124ce2，强制拉取
git fetch origin
git reset --hard origin/main
git log --oneline -1
```

#### 情况 4: 构建时环境变量问题
```bash
# 检查 .env 文件
cat .env
# 应该包含: VITE_API_BASE_URL=http://shcamz.xyz:8081

# 手动设置环境变量重新构建
VITE_API_BASE_URL=http://shcamz.xyz:8081 ./scripts/docker-up.sh --rebuild
```

---

## 📞 故障排查

### 查看容器日志
```bash
# 实时查看 Nginx 访问日志
docker compose exec frontend tail -f /var/log/nginx/access.log

# 查看 Nginx 错误日志
docker compose exec frontend tail -f /var/log/nginx/error.log

# 查看容器启动日志
docker compose logs frontend
```

### 查看构建时注入的环境变量
```bash
# 进入容器查看 version.json
docker compose exec frontend cat /usr/share/nginx/html/version.json

# 应该看到:
# {
#   "version": "e124ce2",
#   "buildTime": "...",
#   "apiBase": "http://shcamz.xyz:8081"
# }
```

### 检查后端 API 连接
```bash
# 从容器内测试后端连接
docker compose exec frontend wget -O- http://shcamz.xyz:8081/api/groups?page=0&size=1
```

---

## 📝 回滚方案

### 如果新版本有问题，回滚到 v0.2.1

```bash
# 1. 停止当前版本
docker compose down

# 2. 回滚代码到上一个版本
git checkout d73a2f7  # v0.2.1 的 commit hash

# 3. 重新构建部署
./scripts/docker-up.sh --rebuild

# 4. 验证回滚成功
curl -s http://156.238.230.229:8082/version.json | jq
# 应该看到 "version": "d73a2f7"
```

---

## 🎉 部署成功确认

### 完成所有验证后，请确认：

- [x] 容器状态: `Up` ✅
- [x] 版本信息: `e124ce2` ✅
- [x] 主页访问: 无错误 ✅
- [x] ASIN详情页: 无 React #310 错误 ✅
- [x] Dashboard: 快速操作无错误 ✅
- [x] 告警页: reload 功能正常 ✅
- [x] 日志查看器: 快速打开/关闭无错误 ✅

**签字确认:**
```
部署人员: _______________
部署时间: _______________
验证时间: _______________
```

---

## 📚 相关文档

- **修复详情**: `docs/HOTFIX_v0.2.2.md`
- **部署检查清单**: `docs/PRODUCTION_CHECKLIST.md`
- **发布说明**: `docs/RELEASE_v0.2.1.md`
- **实现总结**: `docs/IMPLEMENTATION_SUMMARY.md`

---

**祝部署顺利！** 🚀

如有任何问题，请查看上述故障排查部分或联系开发团队。
