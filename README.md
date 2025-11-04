<div align="center">

![CI](https://github.com/SHCSCA/AMZ_Project-Spyglass-Home/actions/workflows/ci.yml/badge.svg)

<h1>Spyglass Frontend</h1>
<p>亚马逊竞品情报系统前端 · React + Vite + TypeScript + Ant Design + ECharts</p>
<p><strong>快速、稳健、可维护</strong> 的电商监控可视化界面</p>

</div>

---

## 🔍 项目概览 (Overview)

本仓库为**前端UI**部分,后端接口已部署在外部服务器(`http://shcamz.xyz:8081`),通过环境变量 `VITE_API_BASE_URL` 指定(推荐使用相对路径 `/api` 并配合nginx反向代理)。

完整的产品需求文档 (PRD) 见：`docs/PRD.md`  
功能Gap分析报告见：`docs/GAP_ANALYSIS.md`

**核心功能：**

1. **全局告警** - 实时查看所有ASIN的价格/库存/内容变更告警
2. **监控仪表盘** - 批量管理ASIN监控任务,支持分组筛选
3. **ASIN详情** - 多维度图表(价格/BSR/库存趋势)+告警记录+差评列表+历史数据表格
4. **分组管理** - 创建/编辑/删除分组,组织ASIN监控任务

---

## ✨ 新增功能 (Latest Updates)

### v0.2.0 (2024-01)

- ✅ **分组管理** (F-WEB-2): 新增 `GroupManageModal` 组件,支持分组CRUD
- ✅ **分组筛选** (F-WEB-1.1): Dashboard添加分组下拉筛选器
- ✅ **历史数据表格** (F-WEB-4.5): ASIN详情页新增第3个Tab,表格形式展示历史快照
- ✅ **API层重构**: 抽离内联API调用到 `groupApi.ts` 和 `asinApi.ts`
- ✅ **监控配置类型**: 定义 `MonitorConfig` 接口支持监控阈值配置(待后端实现)

### v0.1.0 (2023-11)

- ✅ 基础ASIN监控功能
- ✅ 告警红点提示
- ✅ ECharts动态图表
- ✅ 适配后端PageResponse分页结构

---

## 🧱 技术栈 (Stack)

| 层面     | 选型                                   |
| -------- | -------------------------------------- |
| 框架     | React 18 + Vite 5                      |
| 语言     | TypeScript 5                           |
| UI       | Ant Design 5                           |
| 图表     | ECharts 5 (懒加载优化)                 |
| 路由     | React Router v6                        |
| 构建     | Vite / ESBuild                         |
| 测试     | Vitest + Testing Library               |
| 提交规范 | commitlint + husky + lint-staged       |
| 格式化   | Prettier + ESLint (@typescript-eslint) |
| 日志     | 简易内存日志 + LogViewer组件           |

---

## 🚀 快速开始 (Quick Start)

### 环境准备

```bash
Node.js >= 20
npm >= 10
```

### 安装依赖

```bash
npm install
```

### 配置后端地址

```bash
cp .env.example .env
echo "VITE_API_BASE_URL=/api" >> .env
```

### 本地开发

```bash
npm run dev
```

访问: http://localhost:8082

### 构建/预览

```bash
npm run build       # 生产构建
npm run preview     # 预览构建产物
npm run test        # 运行测试
npm run lint        # 代码检查
```

### Docker部署

```bash
# 快速启动 (使用默认配置)
./scripts/docker-up.sh

# 自定义配置
VITE_API_BASE_URL=/api FRONTEND_PORT=9090 ./scripts/docker-up.sh
```

详细部署文档: `docs/DEPLOYMENT.md`

---

## 📁 目录结构 (Structure)

```
src/
    api/                # API客户端层
        client.ts         # 核心apiRequest函数(重试/超时/日志)
        adapters.ts       # 数据适配器(ensurePageResponse/formatPercent)
        mappers.ts        # 响应数据映射函数
        groupApi.ts       # 分组管理API (NEW)
        asinApi.ts        # ASIN管理API (NEW)
    components/         # 可复用组件
        AppSidebar.tsx    # 侧边导航栏
        AsinAlertsList.tsx
        NegativeReviewsList.tsx
        ErrorMessage.tsx
        Loading.tsx
        LogViewer.tsx     # 日志查看器
        GroupManageModal.tsx      # 分组管理Modal (NEW)
        HistoryDataTable.tsx      # 历史数据表格 (NEW)
    hooks/              # 自定义Hooks
        useFetch.ts       # 通用数据获取Hook
        usePagedFetch.ts  # 分页数据Hook
    pages/              # 页面组件
        AlertsPage.tsx         # 全局告警页
        DashboardPage.tsx      # ASIN监控仪表盘 (已集成分组筛选)
        AsinDetailPage.tsx     # ASIN详情页 (已新增历史表格Tab)
        ReactEChartsLazy.tsx   # ECharts懒加载封装
    constants/          # 全局配置
        config.ts         # API超时/重试/缓存配置
    types/              # TypeScript类型定义
        index.ts          # 核心类型(PageResponse/AsinItem/AlertItem等)
    utils/              # 工具函数
        typeGuards.ts     # 类型守卫
    __tests__/          # 单元测试
    logger.ts           # 日志工具
    main.tsx            # 应用入口
    App.tsx             # 根组件

docs/
    PRD.md              # 产品需求文档
    GAP_ANALYSIS.md     # 功能缺口分析报告 (NEW)
    DEPLOYMENT.md       # 部署文档
    views/              # 视图需求细节
        Alerts.md
        Dashboard.md
        AsinDetail.md

scripts/
    docker-up.sh        # Docker快速启动脚本
    check-api.sh        # API健康检查脚本

tests/                  # 测试配置
    setup.ts

配置文件:
    vite.config.ts      # Vite构建配置
    vitest.config.ts    # 测试配置
    tsconfig.json       # TypeScript配置
    commitlint.config.cjs   # 提交消息规范
    .prettierrc         # 代码格式化
    .env.example        # 环境变量模板
    docker-compose.yml  # Docker编排
    nginx.conf          # Nginx配置
```

    types/          # TypeScript 接口与类型
    utils/          # 类型守卫等工具

````

---

## 🔌 API 客户端设计 (API Client)

`src/api/client.ts` 提供统一请求：

- 自动缓存：默认缓存 GET 30s，可通过 `cacheTtlMs` 调整
- 重试策略：默认 2 次，仅对 5xx 与网络异常；指数退避 `200ms * 2^(attempt-1)`
- 超时控制：默认 10s，AbortController 取消请求
- 结构化日志：`api_ok` / `api_error` / `network_error` / `api_cache_hit` 方便在 `LogViewer` 中观察
- 可扩展：未来支持 ETag / SW / IndexedDB 持久化

常量集中：`src/constants/config.ts` (`DEFAULT_API_TIMEOUT_MS`, `DEFAULT_API_RETRY`, `DEFAULT_API_CACHE_TTL_MS`)，避免魔法数字散落。

---

## 🧪 测试策略 (Testing)

`vitest` + `@testing-library/react`：

- 逻辑单测：API 重试 / 超时 / 类型守卫
- 组件基础渲染：AlertsPage / DashboardPage / AsinDetailPage
- 后续扩展：使用 MSW 模拟分页与错误；Diff 组件快照

运行：

```bash
npm run test
````

---

## 🛠 工程脚本 (Scripts)

| 命令                  | 作用                             |
| --------------------- | -------------------------------- |
| dev                   | Vite 开发服务器                  |
| build                 | 类型检查 + 生产构建              |
| preview               | 预览生产构建                     |
| lint                  | ESLint 检查                      |
| type-check            | TypeScript 无输出检查            |
| format / format:check | Prettier 格式化 / 校验           |
| test / test:watch     | 单测运行 / 监听模式              |
| analyze               | 构建分析（未来可结合可视化报告） |
| prepare               | 安装 husky (自动执行)            |

Husky 钩子：

- `pre-commit`: lint-staged 执行 ESLint + Prettier
- `commit-msg`: commitlint 校验 Conventional Commits 格式

---

## 🧾 提交与规范 (Conventions)

遵循 Conventional Commits：`feat|fix|chore|docs|refactor|test|perf|style`。
格式示例：

```text
feat: 支持 ASIN 告警分页过滤
fix: 修复超时后未清理计时器的问题
```

代码风格：统一 Prettier；避免魔法数字；新增常量放 `constants/` 或页面局部 `const`。

---

## 📊 日志与观测 (Logging & Observability)

`src/logger.ts` 提供：`logInfo/logWarn/logError` + 内存环形数组（上限 500）。
`LogViewer` 抽屉组件展示：时间戳 + 级别 + 消息 + 上下文。可扩展：导出 JSON / 上传后端。

可行后续：接入浏览器 Performance API 上报首屏/渲染耗时；接入 OpenTelemetry Web SDK。

---

## ⚙️ 运行时配置 (Runtime Config)

构建期注入：`VITE_API_BASE_URL`。生产推荐使用相对路径 `/api` + Nginx 反代。
未来可扩展：

- `window.__APP_CONFIG__` 运行时覆盖
- 拉取 `/config.json` 动态调整重试/超时

---

## 🔐 安全与稳健性 (Security & Resilience)

- 统一错误处理组件 `ErrorMessage`
- API 层避免直接暴露后端错误结构，做基础封装与兜底
- 计划：输入校验（表单层级）、XSS 内容过滤（对用户生成内容做转义）、CSP 头配置（由部署层添加）

---

## 🩺 故障排查 (Troubleshooting)

| 现象         | 可能原因                                 | 建议操作                                             |
| ------------ | ---------------------------------------- | ---------------------------------------------------- |
| 请求全部失败 | `VITE_API_BASE_URL` 配置错误或后端不可达 | 使用 `scripts/check-api.sh` 验证；检查网络或反代配置 |
| CORS 提示    | 跨域直接访问后端                         | 使用同域 `/api` 反代或后端开启 CORS                  |
| SSL 协议错误 | 使用 https 但后端仅 http                 | 改为 http 或配置证书反代                             |
| 图表空白     | 响应字段缺失或改名                       | 检查后端字段映射，console.log 调试点位               |
| 重试仍失败   | 网络持续异常或服务端 5xx                 | 增大重试次数或联系后端排查                           |

后端接口文档：`http://shcamz.xyz:8081/swagger-ui/index.html`

健康检查脚本：

```bash
./scripts/check-api.sh http://shcamz.xyz:8081/api
```

---

## 📈 Roadmap (Next)

| 优先级 | 任务           | 描述                                  |
| ------ | -------------- | ------------------------------------- |
| P1     | 缓存策略升级   | 基于 ETag / 条件请求 减少带宽         |
| P1     | MSW 集成       | 更全面的 API 行为测试                 |
| P1     | 图表性能优化   | 大数据点时降采样/虚拟化               |
| P2     | 日志持久化     | 上传后端或 IndexedDB 保留             |
| P2     | 运行时配置拉取 | 支持动态调整缓存/重试策略             |
| P2     | 安全加固       | CSP / X-XSS-Protection / 依赖版本审计 |
| P3     | 国际化 (i18n)  | 多语言 UI 翻译层                      |

---

## 📜 License

内部项目（未开源），如需开放请补充 LICENSE 文件与条款。

---

> 若需查看完整 PRD，请前往 `docs/PRD.md`。

### 1.1. 目标

本项目仅包含前端 (UI)，不包含后端代码。它消费外部部署的 `spyglass-backend` V2.0 提供的 RESTful API，实现 PRD 中定义的所有 P0 和 P1 级用户故事。后端仓库或接口地址需通过环境变量 `VITE_API_BASE_URL` 指定。

**核心用户旅程：**

1.  **登录即知：** 用户打开界面，首先看到“全局告警中心”，立刻知道哪些产品发生了什么事。
2.  **概览大盘：** 用户切换到“ASIN仪表盘”，查看所有监控ASIN的最新状态。
3.  **深度分析：** 用户点击单个ASIN，进入“详情页”，查看历史图表和具体的差评内容。
4.  **管理监控：** 用户在仪表盘上添加或删除ASIN。

### 1.2. 技术栈与API

- **技术栈 (推荐):** React (Vite) 或 Vue 3。
- **图表库 (推荐):** Chart.js 或 ECharts。
- **UI 库 (推荐):** Ant Design, Material-UI, 或 Chakra UI (确保有强大的表格和模态框组件)。
- **API 来源:** 严格遵循后端提供的 OpenAPI 规范 (`/v3/api-docs`)。

---

## 2. 功能模块 (Functional Modules & Views)

### F-MOD-1: 全局布局 (Global Layout)

- **F-UI-101 (导航):** 必须提供一个持久化的侧边栏或顶部导航栏，允许用户在以下三个主要视图之间切换：
  1.  **全局告警 (Global Alerts)** (默认页)
  2.  **ASIN 仪表盘 (Dashboard)**
  3.  _(V3.0 预留) 设置 (Settings)_
- **F-UI-102 (加载状态):** 在任何API请求期间（例如加载表格、图表数据），必须显示清晰的加载指示器（Loading Spinner/Skeleton）。
- **F-UI-103 (错误处理):** 当API调用失败时（例如500或404），必须在界面上显示用户友好的错误提示（例如 "数据加载失败"）。

### F-MOD-2: 视图 1 - 全局告警中心 (Global Alert Feed)

- **F-UI-201 (目标):** 满足 "登录即知" 的需求。作为应用的默认首页。
- **F-UI-202 (数据源):** `GET /api/alerts?limit=50&status=NEW`。
- **F-UI-203 (布局):**
  - 显示一个“告警列表”（List或Feed）。
  - **列表项 (Alert Card):** 每一项必须清晰地显示：
    - ASIN (及 昵称)
    - 告警类型 (例如: `PRICE_CHANGE`, `NEGATIVE_REVIEW`, `INVENTORY_LOW`)
    - 告警时间 (例如: "2小时前")
    - **告警详情 (P0):**
      - **价格:** "价格从 $19.99 变为 $17.99"
      - **库存:** "库存 (5) 低于阈值 (10)"
      - **标题/五点:** "标题发生变更"
      - **差评 (V2.0):** "收到新差评 (2星): [差评内容截断...]"
  - **F-UI-204 (交互):** 点击任一告警卡片，应导航到该ASIN的“详情页” (F-MOD-4)。
  - **F-UI-205 (操作):** (V2.1) 提供“标记为已读”或“全部清除”按钮。

### F-MOD-3: 视图 2 - ASIN 仪表盘 (Dashboard)

- **F-UI-301 (目标):** 概览所有监控的ASIN，并提供管理入口。
- **F-UI-302 (数据源):** `GET /api/asin`。
- **F-UI-303 (布局 - 表格):**
  - 必须使用“表格” (Table) 布局展示ASIN列表。
  - **表格列 (Columns):**
    - 昵称 (Nickname) / ASIN (点击可进入详情页 F-MOD-4)
    - 站点 (Site)
    - 最新价格 (Last Price)
    - 最新BSR (Last BSR)
    - **最新库存 (V2.0)** (Last Inventory)
    - 最新评论数 (Total Reviews)
    - 最新评分 (Avg Rating)
    - 库存阈值 (Threshold)
    - 操作 (Actions)
- **F-UI-304 (交互 - 添加ASIN):**
  - 页面必须有一个“添加ASIN”按钮。
  - 点击按钮弹出一个“模态框” (Modal)。
  - 模态框表单包含 `asin`, `site`, `nickname`, `inventoryThreshold` 字段。
  - 表单提交时调用 `POST /api/asin`。成功后自动关闭模态框并刷新表格。
- **F-UI-305 (交互 - 操作):**
  - “操作”列中，每一行必须有“编辑”和“删除”按钮。
  - **编辑:** 点击弹出模态框，预填充该ASIN数据，调用 `PUT /api/asin/{id}/config` 保存。
  - **删除:** 点击弹出确认框，确认后调用 `DELETE /api/asin/{id}`，成功后刷新表格。
- **F-UI-306 (告警标识):** (V2.1 优化) 仪表盘应能调用 `GET /api/alerts` 并聚合，在ASIN行上显示一个“红点”或标识，表明该ASIN有新告警。

### F-MOD-4: 视图 3 - ASIN 详情页 (ASIN Detail Page)

- **F-UI-401 (目标):** 深度分析单个ASIN的历史趋势和具体变更内容。
- **F-UI-402 (布局):**
  - **顶部:** 显示ASIN的昵称、ASIN码、当前价格、BSR等关键信息。
  - **中部 (图表区):**
    - **数据源:** `GET /api/asin/{id}/history?range=30d`。
    - 必须提供时间范围切换器 (例如: 7天, 30天, 90天)，切换时重新调用API。
    - **图表 1 (P0):** 价格 (Price) 历史折线图。
    - **图表 2 (P0):** BSR (BSR) 历史折线图。
    - **图表 3 (P1):** 库存 (Inventory) 历史折线图 (V2.0 需求)。
  - **底部 (V2.0 Tab页):**
    - **Tab 1: 告警记录 (Alerts)**
      - **数据源:** `GET /api/asin/{id}/alerts`。
      - 显示此ASIN的所有历史告警列表 (同 F-UI-203 布局)。
    - **Tab 2: 差评列表 (Negative Reviews)**
      - **数据源:** `GET /api/asin/{id}/reviews?rating=negative`。
      - **布局:** 显示一个差评列表 (1-3星)。
      - **列表项:** 必须显示 评分、评论日期、**评论全文 (Review Text)**。
    - **Tab 3: (V2.1) 内容变更对比 (Diff)**
      - 当告警类型为 标题/五点/A+ 变更时，在此处调用API获取新旧值，并高亮显示差异 (Diff)。

---

## 3. 非功能性需求 (NFRs)

| 类别       | 需求 (NFR)                                                                                                                   |
| :--------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **性能**   | **NFR-UI-P001:** 仪表盘页面 (UI) 首次加载时间必须在 **3 秒** 以下。                                                          |
|            | **NFR-UI-P002:** 页面内导航切换（例如 告警 -> 仪表盘）必须感觉即时（< 500ms）。                                              |
|            | **NFR-UI-P003:** 详情页图表必须在 1.5 秒内渲染完成（API响应后）。                                                            |
| **兼容性** | **NFR-UI-C001:** 必须在最新版的 Chrome 和 Firefox 浏览器上完美运行。                                                         |
| **响应式** | **NFR-UI-R001:** 界面必须是响应式的，在桌面（主要）和移动设备（次要，可读）上均可正常访问。                                  |
| **API**    | **NFR-UI-A001:** **禁止**在前端硬编码任何API URL。所有API端点必须可通过环境变量 (`VITE_API_BASE_URL`) 配置，以指向后端服务。 |

---

## 4. API 关键依赖 (V2.0)

前端开发**必须**依赖以下V2.0 API端点：

| HTTP     | 路径                     | 描述                    | 视图依赖              |
| :------- | :----------------------- | :---------------------- | :-------------------- |
| `GET`    | `/api/asin`              | 获取所有ASIN列表        | **仪表盘** (P0)       |
| `POST`   | `/api/asin`              | 添加新ASIN              | **仪表盘** (P0)       |
| `PUT`    | `/api/asin/{id}/config`  | 更新ASIN配置            | **仪表盘** (P0)       |
| `DELETE` | `/api/asin/{id}`         | 删除ASIN                | **仪表盘** (P0)       |
| `GET`    | `/api/asin/{id}/history` | 获取ASIN历史数据        | **详情页-图表** (P0)  |
| `GET`    | `/api/alerts`            | (V2.0) 获取全局告警     | **全局告警中心** (P0) |
| `GET`    | `/api/asin/{id}/alerts`  | (V2.0) 获取ASIN特定告警 | **详情页-Tab1** (P1)  |
| `GET`    | `/api/asin/{id}/reviews` | (V2.0) 获取ASIN差评     | **详情页-Tab2** (P1)  |

---

## 5. 项目实现现状 (Implementation Status)

本仓库已初始化一个基于 **Vite + React + TypeScript + Ant Design + ECharts** 的前端项目，实现了以下 P0 基础能力：

| 模块                                 | 完成情况 | 说明                                                                     |
| :----------------------------------- | :------- | :----------------------------------------------------------------------- |
| 全局布局导航 F-UI-101                | ✅       | 侧边菜单切换 Alerts / Dashboard                                          |
| 加载与错误状态 F-UI-102/103          | ✅       | `Loading` 与 `ErrorMessage` 组件封装                                     |
| 全局告警中心 F-UI-201~204            | ✅       | 列表展示告警，点击跳转详情页                                             |
| 仪表盘表格 F-UI-301~305              | ✅       | 表格列齐全，增/改/删 ASIN 操作模态框                                     |
| ASIN 详情页基础图表 F-UI-401~402     | ✅       | 价格 & BSR 折线图，支持 7/30/90 天切换                                   |
| ASIN 详情页统计卡片增强              | ✅       | 顶部展示当前/平均价格、BSR、库存等概览                                   |
| ASIN 详情页图表交互增强              | ✅       | 折线图支持 tooltip、缩放(dataZoom)、最大/最小/最新点标记、平滑与面积渐变 |
| 库存历史图表 F-UI-402 (P1)           | ✅       | 详情页新增库存折线图                                                     |
| 后端字段支持 (brand/group 分组)      | ✅       | 基于后端接口字段新增 brand, groupId, groupName 类型与 UI 编辑            |
| 详情页告警 Tab F-UI-401/Alerts (P1)  | ✅       | Tabs: 告警记录显示                                                       |
| 详情页差评 Tab F-UI-401/Reviews (P1) | ✅       | Tabs: 差评列表（1-3星过滤）                                              |
| 差评分页 (P1 扩展)                   | ✅       | 前端分页参数 page/limit 支持                                             |
| 详情页内容 Diff Tab (V2.1 提前)      | ✅       | 使用 jsdiff 显示标题/要点差异                                            |
| 仪表盘告警红点 (V2.1 优化)           | ✅       | NEW 告警在对应 ASIN 行展示红点                                           |
| 告警标记已读                         | ✅       | 单条与全部标记为已读按钮                                                 |
| GET 请求缓存                         | ✅       | 基础 30s 内存缓存 (api/client.ts)                                        |
| API 基础客户端 NFR-UI-A001           | ✅       | `VITE_API_BASE_URL` 环境变量配置                                         |

尚未实现（后续迭代）：告警聚合标识、已读/清除告警、Diff 对比、性能进一步优化等 P1 / V2.1 需求。

### 5.1 后端接口契约说明（本仓库不包含后端实现）

前端依赖外部后端分页响应格式 `PageResponse<T>`：

```
{
    "items": [...],
    "total": 123,
    "page": 0,
    "size": 20,
    "totalPages": 7,
    "hasNext": true,
    "hasPrevious": false
}
```

| 功能      | 端点                         | 主要查询参数                | 说明                      |
| --------- | ---------------------------- | --------------------------- | ------------------------- |
| 全局告警  | `GET /api/alerts`            | page,size,type,status?      | status 目前后端忽略       |
| ASIN 告警 | `GET /api/asin/{id}/alerts`  | page,size,type,from,to      | 时间范围默认 30 天        |
| 历史快照  | `GET /api/asin/{id}/history` | range(7d/30d/90d),page,size | 前端取 items 组装图表     |
| 评论/差评 | `GET /api/asin/{id}/reviews` | rating=negative,page,size   | rating=negative => 1~3 星 |
| ASIN 列表 | `GET /api/asin`              | page,size                   | 返回基础配置字段          |

字段映射（后端 -> 前端内部类型）：

| 后端                           | 前端                   | 说明             |
| ------------------------------ | ---------------------- | ---------------- |
| AlertLogResponse.alertType     | AlertItem.type         | 告警类型         |
| AlertLogResponse.alertAt       | AlertItem.createdAt    | 告警时间         |
| AlertLogResponse.asinCode      | AlertItem.asin         | ASIN 代码        |
| ReviewAlertResponse.reviewDate | ReviewItem.createdAt   | 使用评论日期展示 |
| ReviewAlertResponse.reviewText | ReviewItem.text        | 评论正文         |
| AsinHistoryPoint.snapshotAt    | HistoryPoint.timestamp | 用于图表 X 轴    |

暂未实现的后端端点（前端做降级处理）：

| 原假设                          | 后端状态 | 当前处理                         |
| ------------------------------- | -------- | -------------------------------- |
| POST /api/alerts/{id}/read      | 未实现   | 移除 UI 功能                     |
| POST /api/alerts/mark-all-read  | 未实现   | 移除 UI 功能                     |
| GET /api/asin/{id}/content-diff | 未实现   | 暂时隐藏 Diff Tab (保留类型占位) |

### 5.2 前端新增增强特性 (最新)

| 特性              | 描述                                                        | 位置                         |
| ----------------- | ----------------------------------------------------------- | ---------------------------- |
| 全局告警类型过滤  | 支持按告警类型下拉筛选并分页刷新                            | `AlertsPage`                 |
| ASIN 告警过滤     | 支持类型 + 起止日期过滤该 ASIN 告警                         | `AsinDetailPage` Tabs->告警  |
| 告警严重级别标签  | 根据 `severity` 渲染颜色 Tag (INFO 蓝 / WARN 橙 / ERROR 红) | 告警列表                     |
| 通用分页 Hook     | `usePagedFetch` 抽象分页获取与状态管理                      | `src/hooks/usePagedFetch.ts` |
| 过滤控件测试      | 新增最小测试验证过滤控件渲染                                | `AlertsPageFilters.test.tsx` |
| 品牌/分组字段支持 | 新增 brand、groupId/groupName 字段类型与表单                | `DashboardPage`              |

## 6. 目录结构 (Project Structure)

```
.
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example              # 环境变量模板（需复制为 .env 设置真实后端 API 地址）
├── src
│   ├── main.tsx              # 应用入口
│   ├── App.tsx               # 顶层布局与路由
│   ├── api
│   │   └── client.ts         # API 请求封装
│   ├── components            # 通用组件 (Sidebar / Loading / ErrorMessage)
│   ├── hooks
│   │   └── useFetch.ts       # 通用数据请求 Hook
│   ├── pages
│   │   ├── AlertsPage.tsx    # 全局告警列表页
│   │   ├── DashboardPage.tsx # 仪表盘增删改查页
│   │   ├── AsinDetailPage.tsx# ASIN 详情页（价格 & BSR 图表）
│   │   └── ReactEChartsLazy.tsx # 简单 ECharts 包装
│   └── types
│       └── index.ts          # TS 接口类型定义
```

## 7. 本地开发与运行 (Getting Started)

### 7.1 前置条件

- Node.js >= 18

### 7.2 安装依赖

```bash
npm install
```

### 7.3 配置后端地址

复制 `.env.example` 为 `.env` 并修改：

```bash
cp .env.example .env
echo "VITE_API_BASE_URL=/api" >> .env
```

### 7.4 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:8082`。

### 7.5 构建生产包

```bash
npm run build
```

### 7.6 预览构建结果

```bash
npm run preview
```

### 7.7 Docker 部署 (推荐生产方式)

#### 构建镜像

```bash
docker build -t spyglass-frontend \
    --build-arg VITE_API_BASE_URL="/api" .
```

#### 运行容器

```bash
docker run -d --name spyglass-frontend -p 8082:80 spyglass-frontend
```

访问: http://localhost:8082

#### 使用 docker-compose

`docker-compose.yml` 已内置：

```bash
VITE_API_BASE_URL=/api docker compose up -d --build
```

#### 一键构建并启动（脚本）

提供脚本 `scripts/docker-up.sh` 用于自动化：构建镜像 + 编排启动。

默认变量：
| 变量 | 默认值 | 说明 |
|------|--------|------|
| VITE_API_BASE_URL | /api | 后端 API 相对路径 (由 Nginx 反代到真实后端) |
| FRONTEND_PORT | 8082 | 宿主机映射端口 |
| APP_VERSION | latest | 前端镜像标签 |
| APP_BUILD_TIME | 当前时间戳 | 写入镜像构建参数 |

使用示例：

```bash
./scripts/docker-up.sh
```

自定义后端与端口：

```bash
VITE_API_BASE_URL=/api FRONTEND_PORT=9090 ./scripts/docker-up.sh
```

脚本执行后访问：`http://localhost:<FRONTEND_PORT>`

> 注意：Vite 前端在构建阶段已将 `VITE_API_BASE_URL` 编译进 bundle。要在运行时动态切换后端地址，可采用以下策略：
>
> 1. 通过 Nginx 反向代理 `/api/` 到实际后端，构建时使用相对路径 `/api`。
> 2. 构建注入占位变量，在 `index.html` 里通过运行时脚本注入 `window.__APP_CONFIG__` 并在 API client 读取（后续可扩展）。

#### 常见问题

| 问题             | 现象                       | 解决                                                           |
| ---------------- | -------------------------- | -------------------------------------------------------------- |
| API 404          | 前端请求 `/api/...` 报 404 | 确认构建时 `VITE_API_BASE_URL` 是否正确，或加 Nginx 反代配置。 |
| 跨域 (CORS)      | 浏览器控制台提示 CORS      | 后端启用 CORS 或通过同域反代 `/api`。                          |
| 修改后端地址失效 | 修改 compose 环境变量无效  | 重新 build 镜像；或改用反代方案。                              |

### 7.8 后端接口文档

后端 Swagger 地址：`http://shcamz.xyz:8081/swagger-ui/index.html`
可在浏览器打开查看最新接口定义，前端依赖分页与字段需与其保持一致。

### 7.9 后端健康检查脚本

提供脚本 `scripts/check-api.sh` 快速验证关键端点可访问：

```bash
./scripts/check-api.sh http://shcamz.xyz:8081/api
```

输出状态码，若非 200/404 将标记为 FAIL。

### HTTP / HTTPS 与 SSL 协议错误说明

如果将后端地址设置为 `https://` 但真实服务仅监听 `http://`，浏览器将尝试 TLS 握手失败并出现：

```
ERR_SSL_PROTOCOL_ERROR
```

解决方式：

1. 临时：使用 `http://` 协议访问后端 (`VITE_API_BASE_URL=http://...`)。
2. 正式生产：在前端前面加一层反向代理 (Nginx / Caddy) 获取合法证书，并在代理层转发 `/api` 到后端 HTTP。
3. 若后端直接启用 HTTPS：配置证书并确认端口开启 TLS，再把前端变量改为对应 `https://`。

示例 Nginx 反代片段：

```nginx
server {
    listen 443 ssl;
    server_name shcamz.xyz;
    ssl_certificate /etc/letsencrypt/live/shcamz.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shcamz.xyz/privkey.pem;

    location / {
        root /usr/share/nginx/html;
        try_files $uri /index.html;
    }
    location /api/ {
        proxy_pass http://shcamz.xyz:8081/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

构建策略建议：
| 场景 | 推荐变量值 | 说明 |
|------|------------|------|
| 本地调试 | `http://shcamz.xyz:8081` | 避免 SSL 错误 |
| 生产（有反代） | `/api` | 通过同域反代减少跨域与证书配置复杂度 |
| 生产（后端直连且有证书） | `https://shcamz.xyz:8081` | 后端自身处理 TLS |

## 8. 后续迭代计划 (Next Milestones)

| 优先级 | 任务              | 说明                            |
| :----- | :---------------- | :------------------------------ |
| P1     | 更丰富错误重试    | ErrorMessage 增加重试按钮       |
| P1     | 差评后端分页/总数 | 当前用前端 total 兜底           |
| P1     | 缓存失效策略优化  | 依据 ETag / Last-Modified       |
| P2     | 告警筛选与搜索    | 类型/时间范围过滤               |
| P2     | Diff 支持更多字段 | 五点、A+、图片差异高亮          |
| P2     | 性能优化          | 图表数据降采样 + SSR/预渲染评估 |
| P2     | 性能优化          | 代码分割、缓存策略、骨架屏      |

## 9. 性能与NFR落实 (NFR Notes)

| NFR                  | 当前策略                                         | 后续优化                       |
| :------------------- | :----------------------------------------------- | :----------------------------- |
| P001 页面首屏 <3s    | 精简依赖；ECharts按需导入；表格首屏 API 单次请求 | 代码分割、HTTP 缓存、Lazy Tabs |
| P002 导航切换 <500ms | 客户端路由 + 轻量页面组件                        | 预取下一页面数据               |
| P003 图表渲染 <1.5s  | 数据点少时直接一次性渲染                         | 虚拟化/降采样大数据集          |
| A001 API 可配置      | 使用 `VITE_API_BASE_URL` 环境变量                | 引入多环境 `.env.*` 并文档化   |
| Cache                | 基于内存 TTL 30s                                 | 改为 SW/IndexedDB 持久缓存     |
| R001 响应式          | Ant Design 默认响应式栅格                        | 针对移动优化菜单折叠           |

## 10. 问题与假设 (Assumptions)

1. 后端提供的字段名称与当前 TS 接口一致，若不一致需在 `api` 层做映射。
2. 历史数据接口 `/api/asin/{id}/history` 返回包含价格与 BSR 的统一数组；库存暂缺将后续扩展。
3. 差评与告警的分页策略暂按照后端默认（无分页或服务端限制）。

## 11. 贡献指南 (Contributing)

欢迎通过 Pull Request 提交改进：

- 确保遵守现有代码风格 (ESLint 通过)。
- 为新增 API 类型更新 `src/types/index.ts`。
- 添加必要的单元测试（计划引入 Vitest）。
  - 已初步集成 Vitest + RTL (`npm run test`)；示例测试位于 `src/__tests__/`。
  - 如需添加组件测试，推荐：mock fetch、使用 `screen.findBy...` 处理异步加载。

## 12. 缓存策略说明 (Caching)

当前仅对 GET 请求做简单 30 秒内存缓存：

- 实现位置：`src/api/client.ts` 使用 Map 存储 (url -> {expiry,data})。
- 命中条件：同 URL + 未过期。
- 清理：调用 `apiCacheClear()` 或页面刷新。
  未来扩展：Service Worker、基于 HTTP 头的条件请求（If-None-Match）。

## 13. 测试 (Testing)

运行：`npm run test`
包含基础用例：

- apiClient 错误与成功路径。
- DashboardPage / AlertsPage 渲染不报错。
- apiClientRetry 重试与超时逻辑。
- typeGuards 基本类型守卫。
  后续建议：
- 为 Diff 组件增加快照测试。
- 使用 MSW mock 后端多场景（分页、错误码）。

---

## 14. 工程规范 (Engineering Conventions)

### 14.1 代码风格

- 使用 Prettier 统一格式：`npm run format` 自动修复；CI 可用 `format:check`。
- 缩进 2 空格，行宽 100，单引号，尾随逗号（ES5）。
- 尽量避免魔法数字，抽取到常量或配置 (`src/constants` 未来扩展)。

### 14.2 Lint & Type Check

- `npm run lint` 针对 `src` 下 TS/TSX 文件运行 ESLint。
- `npm run type-check` 使用 TypeScript 做静态类型校验，不输出构建产物。
- 新增类型守卫放在 `src/utils/typeGuards.ts`，为复杂数据结构提供边界确认。

### 14.3 提交规范 (Commit Message)

采用 Conventional Commits：

```
feat: 新功能
fix: 修复问题
chore: 构建/依赖/工具
docs: 文档更新
refactor: 代码重构不改变行为
test: 测试相关
perf: 性能优化
style: 代码风格（不影响逻辑）
```

后续可接入 commitlint + husky 拦截 commit-msg（已提供配置文件，需安装 husky 钩子）。

### 14.4 测试策略

- 单元测试只关注纯逻辑：重试、超时、类型守卫。
- 组件测试关注渲染与简单交互，不做复杂快照。
- 后续可引入 MSW 模拟 API 行为（错误码、分页边界）。

### 14.5 API 客户端健壮性

- 自动重试：默认 2 次，仅针对 5xx 与网络错误。
- 超时控制：默认 10 秒，可通过 `timeoutMs` 自定义。
- 指数退避：200ms \* 2^(attempt-1)。
- 缓存：GET 默认缓存 30 秒，可通过 `cacheTtlMs` 覆盖。

### 14.6 环境与版本

- Node 版本通过 `.nvmrc` 指定为 18，可通过 `nvm use` 切换。
- API 基地址通过 `VITE_API_BASE_URL` 注入，构建时确定，不建议在运行时修改。

### 14.7 日志与调试

- `logger.ts` 保留最近 500 条日志，支持分级 (info/warn/error)。
- 后续可扩展下载日志或上传到后端。

### 14.8 构建脚本说明

| 脚本         | 作用                                 |
| ------------ | ------------------------------------ |
| dev          | 启动开发服务器 (Vite)                |
| build        | 类型检查 + 生产构建                  |
| build:prod   | 同 build（预留未来差异化构建）       |
| preview      | 本地预览生产构建                     |
| lint         | ESLint 检查                          |
| type-check   | TS 类型检查（不输出 JS）             |
| format       | Prettier 自动格式化                  |
| format:check | Prettier 校验不修改                  |
| test         | Vitest 一次性运行所有测试            |
| test:watch   | Vitest 监听模式                      |
| analyze      | 构建并输出分析信息（可用于体积分析） |

### 14.9 后续可扩展

- 引入 husky 钩子：`npm run prepare` 后添加 `pre-commit`（运行 lint-staged），`commit-msg`（运行 commitlint）。
- 增加 Cypress 端到端测试。
- 使用 MSW/Playwright 做更真实的交互测试。

以下为原始 PRD 内容：
