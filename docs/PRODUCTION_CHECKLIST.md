# 生产环境部署检查清单 (v0.2.1)

> 发布前必读！确保所有检查项都通过后再部署到生产环境。

---

## ✅ 代码质量检查

### 1. 构建验证
```bash
npm run build
```
- [ ] 构建成功，无错误
- [ ] 无TypeScript类型错误
- [ ] 无ESLint警告
- [ ] 产物大小合理（dist文件夹）

**预期结果:**
```
✓ 3567 modules transformed
✓ built in ~15s
```

---

### 2. 单元测试
```bash
npm test
```
- [ ] 所有测试通过 (11/11)
- [ ] 无测试失败
- [ ] 无测试超时

**预期结果:**
```
Test Files  6 passed (6)
Tests  11 passed (11)
```

---

### 3. 类型检查
```bash
npm run type-check
```
- [ ] 无TypeScript错误
- [ ] 所有类型定义正确

---

## 🌐 后端API验证

### 1. API健康检查
```bash
npm run api:verify
```
- [ ] 分组管理API - PASS (200)
- [ ] ASIN管理API - PASS (200)
- [ ] 告警管理API - PASS (200)
- [ ] Swagger文档 - PASS (200)

**或手动验证:**
```bash
# 测试分组API
curl http://shcamz.xyz:8081/api/groups?page=0&size=10

# 测试ASIN API
curl http://shcamz.xyz:8081/api/asin?page=0&size=10

# 测试告警API
curl http://shcamz.xyz:8081/api/alerts?page=0&size=10
```

---

### 2. 关键功能验证
- [ ] 后端服务运行正常 (http://shcamz.xyz:8081)
- [ ] 数据库连接正常
- [ ] 分组管理端点可用
- [ ] ASIN筛选功能支持groupId参数

---

## 🐳 Docker部署准备

### 1. 环境变量检查
```bash
# 检查.env.production文件
cat .env.production
```
- [ ] `VITE_API_BASE_URL` 设置正确（推荐 `/api`）
- [ ] 生产环境配置无误

**推荐配置:**
```env
VITE_API_BASE_URL=/api
```

---

### 2. Nginx配置检查
```bash
# 检查nginx.conf
cat nginx.conf
```
- [ ] 反向代理配置正确
- [ ] `/api` 路径代理到后端
- [ ] 静态资源配置正确
- [ ] 端口映射正确 (8082)

**关键配置:**
```nginx
location /api {
    proxy_pass http://shcamz.xyz:8081/api;
}
```

---

### 3. Docker构建测试
```bash
# 测试Docker构建（不启动）
docker build -t spyglass-frontend:test .
```
- [ ] Docker镜像构建成功
- [ ] 构建无错误
- [ ] 镜像大小合理

---

## 🚀 部署流程

### 1. 使用Docker部署
```bash
# 方式1: 使用docker-up.sh脚本（推荐）
./scripts/docker-up.sh

# 方式2: 强制重新构建
./scripts/docker-up.sh --rebuild

# 方式3: 禁用缓存
./scripts/docker-up.sh --no-cache
```

**部署步骤:**
1. [ ] 停止旧容器: `docker compose down`
2. [ ] 清理旧镜像（可选）: `docker rmi spyglass-frontend:latest`
3. [ ] 运行部署脚本: `./scripts/docker-up.sh --rebuild`
4. [ ] 等待构建完成
5. [ ] 验证容器启动: `docker compose ps`

---

### 2. 部署验证
```bash
# 检查容器状态
docker compose ps

# 查看容器日志
docker compose logs -f frontend
```

- [ ] 容器状态为 `Up`
- [ ] 无启动错误
- [ ] Nginx正常运行
- [ ] 日志无异常

**预期输出:**
```
NAME                  STATUS
spyglass-frontend-1   Up X minutes
```

---

## 🔍 功能测试

### 1. 基础功能验证
访问: http://shcamz.xyz:8082

**Dashboard页面:**
- [ ] 页面正常加载
- [ ] ASIN列表正常显示
- [ ] 分组筛选下拉框正常显示
- [ ] "管理分组"按钮可见
- [ ] "添加ASIN"按钮可见
- [ ] 分页功能正常

**分组管理功能:**
- [ ] 点击"管理分组"打开Modal
- [ ] 分组列表正常显示
- [ ] 可以新增分组
- [ ] 可以编辑分组名称
- [ ] 可以删除分组
- [ ] 操作后列表自动刷新

**分组筛选功能:**
- [ ] 分组下拉框显示所有分组
- [ ] 选择分组后ASIN列表刷新
- [ ] "全部分组"选项正常工作

---

### 2. ASIN详情页验证
访问任意ASIN详情: http://shcamz.xyz:8082/asin/{id}

- [ ] 趋势图表正常显示
- [ ] 告警记录Tab正常
- [ ] 差评列表Tab正常
- [ ] **历史数据表格Tab正常显示（新增）**
- [ ] 点击历史表格行弹出详情Modal
- [ ] Modal显示完整title和bulletPoints

---

### 3. 全局告警页验证
访问: http://shcamz.xyz:8082/alerts

- [ ] 告警列表正常显示
- [ ] 筛选器正常工作
- [ ] 分页功能正常
- [ ] 点击ASIN跳转到详情页

---

## ⚠️ React #310 错误验证（关键！）

### 测试场景
**GroupManageModal:**
1. [ ] 打开分组管理Modal
2. [ ] 点击"新增分组"输入名称
3. [ ] 在请求完成前快速关闭Modal
4. [ ] **检查浏览器控制台无React #310错误**

**DashboardPage:**
1. [ ] 点击"添加ASIN"
2. [ ] 填写表单后提交
3. [ ] 在请求完成前快速刷新页面
4. [ ] **检查浏览器控制台无React #310错误**

**预期结果:**
- ✅ 无 "Minified React error #310" 错误
- ✅ 无 "Can't perform a React state update on an unmounted component" 警告

---

## 📊 性能检查

### 1. 页面加载性能
- [ ] 首屏加载时间 < 3秒
- [ ] 静态资源Gzip压缩生效
- [ ] 图表渲染流畅

### 2. API响应性能
```bash
# 测试API响应时间
time curl http://shcamz.xyz:8081/api/groups?page=0&size=10
```
- [ ] API响应时间 < 500ms
- [ ] 无超时错误

---

## 🔐 安全检查

### 1. 生产配置安全
- [ ] 无敏感信息泄露（API密钥等）
- [ ] CORS配置正确
- [ ] 环境变量正确设置

### 2. 依赖安全
```bash
npm audit
```
- [ ] 无高危漏洞
- [ ] 无中危漏洞（或已评估可接受）

---

## 📝 文档检查

### 1. 版本信息
- [ ] package.json版本号正确 (0.2.1)
- [ ] CHANGELOG更新（如有）
- [ ] README.md功能说明准确

### 2. 发布说明
- [ ] docs/RELEASE_v0.2.1.md 已创建
- [ ] 发布说明包含所有重要变更
- [ ] 已知问题已记录

---

## 🎯 回滚方案

### 如果部署失败
```bash
# 1. 停止新版本
docker compose down

# 2. 恢复到上一个Git提交
git log --oneline -5  # 查看历史
git checkout <previous-commit-hash>

# 3. 重新构建部署
./scripts/docker-up.sh --rebuild

# 4. 验证旧版本运行正常
```

### 回滚检查清单
- [ ] 数据库无破坏性变更
- [ ] API兼容性保持
- [ ] 用户数据安全

---

## ✅ 最终发布清单

**部署前:**
- [ ] 所有代码已提交: `git status`
- [ ] 所有测试通过
- [ ] 后端API验证通过
- [ ] Docker构建测试通过

**部署中:**
- [ ] 执行 `./scripts/docker-up.sh --rebuild`
- [ ] 监控构建日志
- [ ] 验证容器启动成功

**部署后:**
- [ ] 访问生产URL验证
- [ ] 分组管理功能正常
- [ ] React #310错误已修复
- [ ] 历史数据表格Tab正常
- [ ] 浏览器控制台无错误
- [ ] 性能指标正常

**通知相关人员:**
- [ ] 通知后端团队新版本已上线
- [ ] 确认分组管理API正常工作
- [ ] 收集用户反馈

---

## 📞 紧急联系

**遇到问题时:**
1. 查看容器日志: `docker compose logs -f frontend`
2. 检查nginx日志: `docker compose exec frontend cat /var/log/nginx/error.log`
3. 验证后端API: `npm run api:verify`
4. 回滚到上一版本（见上方回滚方案）

**关键日志位置:**
- 容器日志: `docker compose logs frontend`
- Nginx错误日志: 容器内 `/var/log/nginx/error.log`
- 浏览器控制台: 开发者工具 → Console

---

## 🎉 部署成功标准

**所有以下条件都满足时，视为部署成功:**

✅ 构建测试全部通过  
✅ 后端API验证通过  
✅ Docker容器正常运行  
✅ 生产URL可访问 (http://shcamz.xyz:8082)  
✅ 分组管理功能正常  
✅ 分组筛选功能正常  
✅ 历史数据表格Tab正常  
✅ React #310错误已修复  
✅ 浏览器控制台无错误  
✅ 所有核心功能可用  

**完成后请在下方签字确认:**

```
部署人员: _______________
部署时间: _______________
验证人员: _______________
验证时间: _______________
```

---

**祝部署顺利！** 🚀
