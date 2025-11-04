# PRD功能对比与Gap分析报告

生成时间: 2024-01-XX  
分析范围: F-WEB-1 至 F-WEB-5

---

## 📊 分析摘要

| 功能模块          | PRD要求   | 现有实现        | 缺失程度             | 优先级 |
| ----------------- | --------- | --------------- | -------------------- | ------ |
| F-WEB-1 Dashboard | 完整功能  | 基础实现        | 🟡 中等 (缺分组筛选) | P0     |
| F-WEB-2 分组管理  | 完整CRUD  | 🔴 **完全缺失** | 🔴 高                | P0     |
| F-WEB-3 ASIN管理  | 增强表单  | 🟡 基础表单     | 🟡 中等              | P0     |
| F-WEB-4 ASIN详情  | 多Tab视图 | 🟢 部分实现     | 🟢 低 (缺表格Tab)    | P1     |
| F-WEB-5 全局告警  | 完整功能  | 🟢 基本完整     | 🟢 低                | P2     |

---

## 📋 详细功能对比

### F-WEB-1: Dashboard ASIN监控主页

#### PRD要求

```
1.1 分组筛选功能
    - 下拉菜单展示所有分组
    - 支持"全部"选项
    - 筛选后列表动态刷新
1.2 ASIN列表 (已实现 ✅)
1.3 新增告警红点 (已实现 ✅)
1.4 添加ASIN入口 (已实现 ✅)
```

#### 现有实现 (`DashboardPage.tsx`)

```typescript
✅ ASIN列表表格 (Table组件)
✅ 分页功能 (pagination)
✅ 告警红点显示 (Badge组件)
✅ 添加ASIN按钮
✅ 编辑/删除操作
✅ 分组列列显示 (groupName字段)

❌ 分组下拉筛选组件 - **缺失**
❌ fetchGroups API调用 - **缺失**
❌ groupId参数传递 - **缺失**
```

#### Gap清单

- [ ] **添加分组筛选下拉框** (Ant Design Select)
- [ ] 调用 `fetchGroups()` API获取分组列表
- [ ] 状态管理: `selectedGroupId`
- [ ] 修改 `fetchAsins()` 添加 `groupId` 查询参数
- [ ] 响应式布局: 筛选器放置在"添加ASIN"按钮旁

---

### F-WEB-2: 分组管理

#### PRD要求

```
2.1 分组管理入口
    - Dashboard顶部"管理分组"按钮
    - 打开分组管理Modal
2.2 分组列表
    - 显示所有分组 (id, name, asinCount)
    - 支持翻页
2.3 新增分组
    - 输入分组名称
    - 调用 createGroup API
2.4 编辑/删除分组
    - 修改分组名称
    - 删除确认
```

#### 现有实现

```
🔴 完全缺失 - 无任何相关组件或Modal
```

#### Gap清单

- [ ] **创建 `GroupManageModal.tsx` 组件** (新文件)
  - [ ] Modal框架 (title, footer按钮)
  - [ ] 分组列表Table (columns: id, name, asinCount)
  - [ ] 新增分组表单 (Form + Input)
  - [ ] 编辑/删除操作按钮
- [ ] **在 `DashboardPage.tsx` 添加入口**
  - [ ] "管理分组"按钮
  - [ ] Modal开关状态管理
- [ ] **API函数** (见 F-API-1)

---

### F-WEB-3: ASIN新增/编辑

#### PRD要求

```
3.1 表单字段
    ✅ ASIN Code (必填)
    ✅ 站点 (必填)
    ✅ 昵称 (可选)
    ❌ 分组选择 (下拉,可选) - **缺失**
    ✅ 库存阈值 (可选)
    ❌ 监控选项 (复选框组) - **缺失**
        - 价格变动 ≥ X%
        - BSR变动 ≥ X%
        - 库存变动 ≥ X件
        - 负面评论 (星级 ≤ X)
        - 内容变化 (标题/图片/五点/A+)
```

#### 现有实现 (`DashboardPage.tsx` Modal)

```typescript
✅ 基础表单框架
✅ ASIN Code 输入框
❌ 站点选择 - 使用InputNumber,应为Select
✅ 昵称输入框
❌ 分组下拉选择 - **缺失**
❌ 监控配置选项 - **完全缺失**
```

#### Gap清单

- [ ] **增强现有Modal表单**
  - [ ] 分组选择 (Select,调用 `fetchGroups()`)
  - [ ] 站点改为Select (US/UK/DE/JP等预设选项)
  - [ ] 监控配置区域 (Collapse折叠面板)
    - [ ] 价格变动阈值 (Checkbox + InputNumber)
    - [ ] BSR变动阈值
    - [ ] 库存变动阈值
    - [ ] 负面评论阈值
    - [ ] 内容变化监控 (多个Checkbox)
- [ ] **表单验证规则**
  - [ ] ASIN Code正则验证 (10位字母数字)
  - [ ] 必填字段提示
- [ ] **API对接**
  - [ ] 修改POST/PUT请求体结构,包含监控配置
  - [ ] 后端确认字段名称 (参考数据库表结构)

---

### F-WEB-4: ASIN详情页

#### PRD要求

```
4.1 Tab1: 趋势图表 (已实现 ✅)
    ✅ 价格/BSR/库存折线图
    ✅ 时间范围筛选
    ✅ 指标选择
4.2 Tab2: 变化告警 (已实现 ✅)
4.3 Tab3: 负面评论 (已实现 ✅)
4.4 Tab4: 日志 (已实现 ✅)
4.5 Tab5: 历史数据表格 - **缺失**
    - 表格展示所有历史快照
    - 分页
    - 详情弹窗 (完整title/bulletPoints)
```

#### 现有实现 (`AsinDetailPage.tsx`)

```typescript
✅ Tab1: 图表视图 (ReactECharts)
✅ Tab2: 告警列表 (AsinAlertsList)
✅ Tab3: 负面评论 (NegativeReviewsList)
❌ Tab5: 历史数据表格 - **缺失**
```

#### Gap清单

- [ ] **新增Tab5组件**
  - [ ] 历史数据表格 (Table)
    - [ ] 列: 时间/价格/BSR/库存/评分/评论数/标题(截断)/五点(截断)
    - [ ] 分页 (复用现有 `historyPoints` 数据)
  - [ ] 详情Modal
    - [ ] 展示完整 `title` 和 `bulletPoints`
    - [ ] 快照时间、其他字段
  - [ ] 点击行触发详情弹窗
- [ ] **数据处理**
  - [ ] 复用现有 `useFetch()` 获取的历史数据
  - [ ] 添加字段映射 (确保包含 `title`/`bulletPoints`)

---

### F-WEB-5: 全局告警页

#### PRD要求

```
5.1 告警列表 (已实现 ✅)
5.2 筛选功能 (已实现 ✅)
    - ASIN筛选
    - 类型筛选
    - 严重程度筛选
5.3 跳转ASIN详情 (已实现 ✅)
```

#### 现有实现 (`AlertsPage.tsx`)

```typescript
✅ 完整告警列表
✅ 筛选器 (Select组件)
✅ 分页
✅ 跳转链接
```

#### Gap清单

- **无** - 功能已完整实现 ✅

---

## 🔧 API层Gap分析

### 现有API (`src/api/`)

```typescript
✅ client.ts - apiRequest核心函数
✅ adapters.ts - ensurePageResponse兼容层
✅ mappers.ts - 数据映射函数
❌ index.ts - 仅导出,无具体API函数
```

### 缺失API函数 (需在 `src/api/index.ts` 或新建 `asinApi.ts` 添加)

#### F-API-1: 分组管理

```typescript
❌ fetchGroups(page?, size?) - GET /api/groups
❌ createGroup(name: string) - POST /api/groups
❌ updateGroup(id: number, name: string) - PUT /api/groups/{id}
❌ deleteGroup(id: number) - DELETE /api/groups/{id}
```

#### F-API-2: ASIN管理

```typescript
✅ fetchAsins() - 已在DashboardPage内联实现
❌ createAsin(data: CreateAsinDto) - POST /api/asin
   需包含监控配置参数
❌ updateAsin(id: number, data: UpdateAsinDto) - PUT /api/asin/{id}
   目前仅有 /api/asin/{id}/config
❌ deleteAsin(id: number) - DELETE /api/asin/{id}
   已在DashboardPage内联实现,需抽取
```

#### F-API-3: 历史数据

```typescript
✅ fetchHistory() - 已在AsinDetailPage内联实现
   需确认是否包含 title/bulletPoints 字段
```

---

## 🗂️ 组件结构优化建议

### 建议新增文件

```
src/
  components/
    ✨ GroupManageModal.tsx       # F-WEB-2 分组管理
    ✨ AsinFormModal.tsx          # F-WEB-3 增强的ASIN表单(从DashboardPage抽离)
    ✨ HistoryDataTable.tsx       # F-WEB-4.5 历史数据表格Tab
    ✨ HistoryDetailModal.tsx     # 历史快照详情弹窗
  api/
    ✨ groupApi.ts               # 分组相关API
    ✨ asinApi.ts                # ASIN相关API(抽离内联函数)
```

### 需要重构的文件

```
📝 DashboardPage.tsx
   - 抽离Modal为独立组件
   - 添加分组筛选器
   - 添加"管理分组"入口

📝 AsinDetailPage.tsx
   - 添加第5个Tab (历史数据表格)
   - 复用现有historyPoints数据
```

---

## 📦 无用代码清理

### 待检查项

- [ ] `src/types/jsdiff.d.ts` - 检查是否实际使用
- [ ] 未使用的imports (通过ESLint扫描)
- [ ] 重复的内联API调用 (应抽取到api/目录)
- [ ] 测试文件覆盖度 (现有11个测试,检查是否需要新增)

---

## ⏱️ 优先级与时间估算

| 任务                  | 优先级 | 工作量 | 依赖             |
| --------------------- | ------ | ------ | ---------------- |
| F-WEB-1.1 分组筛选    | P0     | 2h     | F-API-1          |
| F-WEB-2 分组管理Modal | P0     | 4h     | F-API-1          |
| F-WEB-3 ASIN表单增强  | P0     | 3h     | F-API-1, F-API-2 |
| F-API-1 分组API       | P0     | 1h     | 后端确认         |
| F-API-2 ASIN API      | P0     | 1h     | 后端确认         |
| F-WEB-4.5 历史表格Tab | P1     | 2h     | F-API-3确认      |
| 代码清理              | P1     | 1h     | -                |
| 文档更新              | P2     | 1h     | 所有功能完成     |

**总计**: ~15小时

---

## 🚀 实施顺序建议

### Phase 1: API层准备 (必须优先)

1. ✅ 确认后端API端点可用性
2. 创建 `src/api/groupApi.ts` 和 `asinApi.ts`
3. 编写API函数 (fetchGroups, createGroup等)

### Phase 2: 核心功能 (P0)

1. 实现 `GroupManageModal` 组件
2. Dashboard添加分组筛选
3. 增强ASIN表单 (分组选择+监控配置)

### Phase 3: 增强功能 (P1)

1. 历史数据表格Tab
2. 优化交互细节

### Phase 4: 收尾 (P2)

1. 代码清理
2. 文档更新 (README.md, PRD.md)
3. 脚本优化

---

## 📝 后端协作检查点

### 需要后端确认的事项

- [ ] `/api/groups` 端点是否已实现?
- [ ] ASIN创建/更新是否支持监控配置参数?
  - 参数名称: `priceChangeThreshold`, `bsrChangeThreshold` 等?
  - 是否存储在 `asin` 表还是独立的 `monitor_config` 表?
- [ ] 历史数据API是否返回 `title` 和 `bulletPoints` 字段?
  - 当前 `AsinHistoryPoint` 类型已定义,需验证实际响应

### 数据库表确认 (基于已提供DDL)

```sql
✅ asin.group_id (外键)
✅ asin_group表存在
✅ asin_history.title, bullet_points字段存在
❌ 监控配置字段未在DDL中明确 (需确认)
   可能在 price_alert/change_alert 表的threshold字段?
```

---

## 🎯 结论

**核心Gap**:

- 🔴 **分组管理功能完全缺失** (F-WEB-2)
- 🟡 **ASIN表单缺少分组选择和监控配置** (F-WEB-3)
- 🟡 **Dashboard缺少分组筛选** (F-WEB-1.1)
- 🟢 **ASIN详情页缺少历史数据表格Tab** (F-WEB-4.5)

**技术债务**:

- 内联API调用需抽取到统一模块
- Modal组件可复用性低,需重构

**阻塞风险**:

- 后端API可用性需优先确认 (特别是分组管理和监控配置相关)
