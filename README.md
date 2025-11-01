# 产品需求文档 (PRD): 亚马逊竞品情报系统 V2.0 - 前端界面 (UI)

| 文档版本 | V2.0 (UI) |
| :--- | :--- |
| **项目名称** | 亚马逊竞品情报系统 (Project Spyglass) - 前端 |
| **创建日期** | 2025年11月01日 |
| **修订说明** | **V2.0: ** 基于后端 V2.0 PRD 制定。定义了消费 API 所需的核心用户界面，包括仪表盘、详情页图表和 V2.0 新增的告警/差评模块。 |
| **目标** | 提供一个快速、响应式、数据驱动的Web界面，将后端API数据转化为运营者可操作的视觉情报。 |

---

## 1. 简介

### 1.1. 目标
本项目的前端 (UI) 旨在消费 `spyglass-backend` V2.0 提供的 RESTful API，实现PRD中定义的所有P0和P1级用户故事。

**核心用户旅程：**
1.  **登录即知：** 用户打开界面，首先看到“全局告警中心”，立刻知道哪些产品发生了什么事。
2.  **概览大盘：** 用户切换到“ASIN仪表盘”，查看所有监控ASIN的最新状态。
3.  **深度分析：** 用户点击单个ASIN，进入“详情页”，查看历史图表和具体的差评内容。
4.  **管理监控：** 用户在仪表盘上添加或删除ASIN。

### 1.2. 技术栈与API
* **技术栈 (推荐):** React (Vite) 或 Vue 3。
* **图表库 (推荐):** Chart.js 或 ECharts。
* **UI 库 (推荐):** Ant Design, Material-UI, 或 Chakra UI (确保有强大的表格和模态框组件)。
* **API 来源:** 严格遵循后端提供的 OpenAPI 规范 (`/v3/api-docs`)。

---

## 2. 功能模块 (Functional Modules & Views)

### F-MOD-1: 全局布局 (Global Layout)
* **F-UI-101 (导航):** 必须提供一个持久化的侧边栏或顶部导航栏，允许用户在以下三个主要视图之间切换：
    1.  **全局告警 (Global Alerts)** (默认页)
    2.  **ASIN 仪表盘 (Dashboard)**
    3.  *(V3.0 预留) 设置 (Settings)*
* **F-UI-102 (加载状态):** 在任何API请求期间（例如加载表格、图表数据），必须显示清晰的加载指示器（Loading Spinner/Skeleton）。
* **F-UI-103 (错误处理):** 当API调用失败时（例如500或404），必须在界面上显示用户友好的错误提示（例如 "数据加载失败"）。

### F-MOD-2: 视图 1 - 全局告警中心 (Global Alert Feed)
* **F-UI-201 (目标):** 满足 "登录即知" 的需求。作为应用的默认首页。
* **F-UI-202 (数据源):** `GET /api/alerts?limit=50&status=NEW`。
* **F-UI-203 (布局):**
    * 显示一个“告警列表”（List或Feed）。
    * **列表项 (Alert Card):** 每一项必须清晰地显示：
        * ASIN (及 昵称)
        * 告警类型 (例如: `PRICE_CHANGE`, `NEGATIVE_REVIEW`, `INVENTORY_LOW`)
        * 告警时间 (例如: "2小时前")
        * **告警详情 (P0):**
            * **价格:** "价格从 $19.99 变为 $17.99"
            * **库存:** "库存 (5) 低于阈值 (10)"
            * **标题/五点:** "标题发生变更"
            * **差评 (V2.0):** "收到新差评 (2星): [差评内容截断...]"
    * **F-UI-204 (交互):** 点击任一告警卡片，应导航到该ASIN的“详情页” (F-MOD-4)。
    * **F-UI-205 (操作):** (V2.1) 提供“标记为已读”或“全部清除”按钮。

### F-MOD-3: 视图 2 - ASIN 仪表盘 (Dashboard)
* **F-UI-301 (目标):** 概览所有监控的ASIN，并提供管理入口。
* **F-UI-302 (数据源):** `GET /api/asin`。
* **F-UI-303 (布局 - 表格):**
    * 必须使用“表格” (Table) 布局展示ASIN列表。
    * **表格列 (Columns):**
        * 昵称 (Nickname) / ASIN (点击可进入详情页 F-MOD-4)
        * 站点 (Site)
        * 最新价格 (Last Price)
        * 最新BSR (Last BSR)
        * **最新库存 (V2.0)** (Last Inventory)
        * 最新评论数 (Total Reviews)
        * 最新评分 (Avg Rating)
        * 库存阈值 (Threshold)
        * 操作 (Actions)
* **F-UI-304 (交互 - 添加ASIN):**
    * 页面必须有一个“添加ASIN”按钮。
    * 点击按钮弹出一个“模态框” (Modal)。
    * 模态框表单包含 `asin`, `site`, `nickname`, `inventoryThreshold` 字段。
    * 表单提交时调用 `POST /api/asin`。成功后自动关闭模态框并刷新表格。
* **F-UI-305 (交互 - 操作):**
    * “操作”列中，每一行必须有“编辑”和“删除”按钮。
    * **编辑:** 点击弹出模态框，预填充该ASIN数据，调用 `PUT /api/asin/{id}/config` 保存。
    * **删除:** 点击弹出确认框，确认后调用 `DELETE /api/asin/{id}`，成功后刷新表格。
* **F-UI-306 (告警标识):** (V2.1 优化) 仪表盘应能调用 `GET /api/alerts` 并聚合，在ASIN行上显示一个“红点”或标识，表明该ASIN有新告警。

### F-MOD-4: 视图 3 - ASIN 详情页 (ASIN Detail Page)
* **F-UI-401 (目标):** 深度分析单个ASIN的历史趋势和具体变更内容。
* **F-UI-402 (布局):**
    * **顶部:** 显示ASIN的昵称、ASIN码、当前价格、BSR等关键信息。
    * **中部 (图表区):**
        * **数据源:** `GET /api/asin/{id}/history?range=30d`。
        * 必须提供时间范围切换器 (例如: 7天, 30天, 90天)，切换时重新调用API。
        * **图表 1 (P0):** 价格 (Price) 历史折线图。
        * **图表 2 (P0):** BSR (BSR) 历史折线图。
        * **图表 3 (P1):** 库存 (Inventory) 历史折线图 (V2.0 需求)。
    * **底部 (V2.0 Tab页):**
        * **Tab 1: 告警记录 (Alerts)**
            * **数据源:** `GET /api/asin/{id}/alerts`。
            * 显示此ASIN的所有历史告警列表 (同 F-UI-203 布局)。
        * **Tab 2: 差评列表 (Negative Reviews)**
            * **数据源:** `GET /api/asin/{id}/reviews?rating=negative`。
            * **布局:** 显示一个差评列表 (1-3星)。
            * **列表项:** 必须显示 评分、评论日期、**评论全文 (Review Text)**。
        * **Tab 3: (V2.1) 内容变更对比 (Diff)**
            * 当告警类型为 标题/五点/A+ 变更时，在此处调用API获取新旧值，并高亮显示差异 (Diff)。

---

## 3. 非功能性需求 (NFRs)

| 类别 | 需求 (NFR) |
| :--- | :--- |
| **性能** | **NFR-UI-P001:** 仪表盘页面 (UI) 首次加载时间必须在 **3 秒** 以下。 |
| | **NFR-UI-P002:** 页面内导航切换（例如 告警 -> 仪表盘）必须感觉即时（< 500ms）。 |
| | **NFR-UI-P003:** 详情页图表必须在 1.5 秒内渲染完成（API响应后）。 |
| **兼容性**| **NFR-UI-C001:** 必须在最新版的 Chrome 和 Firefox 浏览器上完美运行。 |
| **响应式**| **NFR-UI-R001:** 界面必须是响应式的，在桌面（主要）和移动设备（次要，可读）上均可正常访问。 |
| **API** | **NFR-UI-A001:** **禁止**在前端硬编码任何API URL。所有API端点必须可通过环境变量 (`VITE_API_BASE_URL`) 配置，以指向后端服务。 |

---

## 4. API 关键依赖 (V2.0)

前端开发**必须**依赖以下V2.0 API端点：

| HTTP | 路径 | 描述 | 视图依赖 |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/asin` | 获取所有ASIN列表 | **仪表盘** (P0) |
| `POST`| `/api/asin` | 添加新ASIN | **仪表盘** (P0) |
| `PUT` | `/api/asin/{id}/config`| 更新ASIN配置 | **仪表盘** (P0) |
| `DELETE`| `/api/asin/{id}` | 删除ASIN | **仪表盘** (P0) |
| `GET` | `/api/asin/{id}/history` | 获取ASIN历史数据 | **详情页-图表** (P0) |
| `GET` | `/api/alerts` | (V2.0) 获取全局告警 | **全局告警中心** (P0) |
| `GET` | `/api/asin/{id}/alerts` | (V2.0) 获取ASIN特定告警 | **详情页-Tab1** (P1) |
| `GET` | `/api/asin/{id}/reviews`| (V2.0) 获取ASIN差评 | **详情页-Tab2** (P1) |

---

## 5. 项目实现现状 (Implementation Status)

本仓库已初始化一个基于 **Vite + React + TypeScript + Ant Design + ECharts** 的前端项目，实现了以下 P0 基础能力：

| 模块 | 完成情况 | 说明 |
| :-- | :-- | :-- |
| 全局布局导航 F-UI-101 | ✅ | 侧边菜单切换 Alerts / Dashboard |
| 加载与错误状态 F-UI-102/103 | ✅ | `Loading` 与 `ErrorMessage` 组件封装 |
| 全局告警中心 F-UI-201~204 | ✅ | 列表展示告警，点击跳转详情页 |
| 仪表盘表格 F-UI-301~305 | ✅ | 表格列齐全，增/改/删 ASIN 操作模态框 |
| ASIN 详情页基础图表 F-UI-401~402 | ✅ | 价格 & BSR 折线图，支持 7/30/90 天切换 |
| 库存历史图表 F-UI-402 (P1) | ✅ | 详情页新增库存折线图 |
| 详情页告警 Tab F-UI-401/Alerts (P1) | ✅ | Tabs: 告警记录显示 |
| 详情页差评 Tab F-UI-401/Reviews (P1) | ✅ | Tabs: 差评列表（1-3星过滤） |
| 差评分页 (P1 扩展) | ✅ | 前端分页参数 page/limit 支持 |
| 详情页内容 Diff Tab (V2.1 提前) | ✅ | 使用 jsdiff 显示标题/要点差异 |
| 仪表盘告警红点 (V2.1 优化) | ✅ | NEW 告警在对应 ASIN 行展示红点 |
| 告警标记已读 | ✅ | 单条与全部标记为已读按钮 |
| GET 请求缓存 | ✅ | 基础 30s 内存缓存 (api/client.ts) |
| API 基础客户端 NFR-UI-A001 | ✅ | `VITE_API_BASE_URL` 环境变量配置 |

尚未实现（后续迭代）：告警聚合标识、已读/清除告警、Diff 对比、性能进一步优化等 P1 / V2.1 需求。

### 5.1 后端真实接口对齐 (2025-11)

前端已重构以匹配后端统一分页响应 `PageResponse<T>`：

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

| 功能 | 端点 | 主要查询参数 | 说明 |
|------|------|--------------|------|
| 全局告警 | `GET /api/alerts` | page,size,type,status? | status 目前后端忽略 |
| ASIN 告警 | `GET /api/asin/{id}/alerts` | page,size,type,from,to | 时间范围默认 30 天 |
| 历史快照 | `GET /api/asin/{id}/history` | range(7d/30d/90d),page,size | 前端取 items 组装图表 |
| 评论/差评 | `GET /api/asin/{id}/reviews` | rating=negative,page,size | rating=negative => 1~3 星 |
| ASIN 列表 | `GET /api/asin` | page,size | 返回基础配置字段 |

字段映射（后端 -> 前端内部类型）：

| 后端 | 前端 | 说明 |
|------|------|------|
| AlertLogResponse.alertType | AlertItem.type | 告警类型 |
| AlertLogResponse.alertAt | AlertItem.createdAt | 告警时间 |
| AlertLogResponse.asinCode | AlertItem.asin | ASIN 代码 |
| ReviewAlertResponse.reviewDate | ReviewItem.createdAt | 使用评论日期展示 |
| ReviewAlertResponse.reviewText | ReviewItem.text | 评论正文 |
| AsinHistoryPoint.snapshotAt | HistoryPoint.timestamp | 用于图表 X 轴 |

下线/暂未实现端点说明：

| 原假设 | 后端状态 | 当前处理 |
|--------|----------|----------|
| POST /api/alerts/{id}/read | 未实现 | 移除 UI 功能 |
| POST /api/alerts/mark-all-read | 未实现 | 移除 UI 功能 |
| GET /api/asin/{id}/content-diff | 未实现 | 暂时隐藏 Diff Tab (保留类型占位) |

### 5.2 前端新增增强特性 (最新)

| 特性 | 描述 | 位置 |
|------|------|------|
| 全局告警类型过滤 | 支持按告警类型下拉筛选并分页刷新 | `AlertsPage` |
| ASIN 告警过滤 | 支持类型 + 起止日期过滤该 ASIN 告警 | `AsinDetailPage` Tabs->告警 |
| 告警严重级别标签 | 根据 `severity` 渲染颜色 Tag (INFO 蓝 / WARN 橙 / ERROR 红) | 告警列表 |
| 通用分页 Hook | `usePagedFetch` 抽象分页获取与状态管理 | `src/hooks/usePagedFetch.ts` |
| 过滤控件测试 | 新增最小测试验证过滤控件渲染 | `AlertsPageFilters.test.tsx` |


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
echo "VITE_API_BASE_URL=http://shcamz.xyz:8081" >> .env
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
    --build-arg VITE_API_BASE_URL="http://shcamz.xyz:8081" .
```

#### 运行容器
```bash
docker run -d --name spyglass-frontend -p 8082:80 spyglass-frontend
```
访问: http://localhost:8082

#### 使用 docker-compose
`docker-compose.yml` 已内置：
```bash
VITE_API_BASE_URL=http://shcamz.xyz:8081 docker compose up -d --build
```

#### 一键构建并启动（脚本）
提供脚本 `scripts/docker-up.sh` 用于自动化：构建镜像 + 编排启动。

默认变量：
| 变量 | 默认值 | 说明 |
|------|--------|------|
| VITE_API_BASE_URL | http://shcamz.xyz:8081 | 后端 API 地址 |
| FRONTEND_PORT | 8082 | 宿主机映射端口 |
| APP_VERSION | latest | 前端镜像标签 |
| APP_BUILD_TIME | 当前时间戳 | 写入镜像构建参数 |

使用示例：
```bash
./scripts/docker-up.sh
```
自定义后端与端口：
```bash
VITE_API_BASE_URL=http://shcamz.xyz:8081 FRONTEND_PORT=9090 ./scripts/docker-up.sh
```
脚本执行后访问：`http://localhost:<FRONTEND_PORT>`

> 注意：Vite 前端在构建阶段已将 `VITE_API_BASE_URL` 编译进 bundle。要在运行时动态切换后端地址，可采用以下策略：
> 1. 通过 Nginx 反向代理 `/api/` 到实际后端，构建时使用相对路径 `/api`。
> 2. 构建注入占位变量，在 `index.html` 里通过运行时脚本注入 `window.__APP_CONFIG__` 并在 API client 读取（后续可扩展）。

#### 常见问题
| 问题 | 现象 | 解决 |
|------|------|------|
| API 404 | 前端请求 `/api/...` 报 404 | 确认构建时 `VITE_API_BASE_URL` 是否正确，或加 Nginx 反代配置。|
| 跨域 (CORS) | 浏览器控制台提示 CORS | 后端启用 CORS 或通过同域反代 `/api`。|
| 修改后端地址失效 | 修改 compose 环境变量无效 | 重新 build 镜像；或改用反代方案。|


## 8. 后续迭代计划 (Next Milestones)

| 优先级 | 任务 | 说明 |
| :-- | :-- | :-- |
| P1 | 更丰富错误重试 | ErrorMessage 增加重试按钮 |
| P1 | 差评后端分页/总数 | 当前用前端 total 兜底 |
| P1 | 缓存失效策略优化 | 依据 ETag / Last-Modified |
| P2 | 告警筛选与搜索 | 类型/时间范围过滤 |
| P2 | Diff 支持更多字段 | 五点、A+、图片差异高亮 |
| P2 | 性能优化 | 图表数据降采样 + SSR/预渲染评估 |
| P2 | 性能优化 | 代码分割、缓存策略、骨架屏 |

## 9. 性能与NFR落实 (NFR Notes)

| NFR | 当前策略 | 后续优化 |
| :-- | :-- | :-- |
| P001 页面首屏 <3s | 精简依赖；ECharts按需导入；表格首屏 API 单次请求 | 代码分割、HTTP 缓存、Lazy Tabs |
| P002 导航切换 <500ms | 客户端路由 + 轻量页面组件 | 预取下一页面数据 |
| P003 图表渲染 <1.5s | 数据点少时直接一次性渲染 | 虚拟化/降采样大数据集 |
| A001 API 可配置 | 使用 `VITE_API_BASE_URL` 环境变量 | 引入多环境 `.env.*` 并文档化 |
| Cache | 基于内存 TTL 30s | 改为 SW/IndexedDB 持久缓存 |
| R001 响应式 | Ant Design 默认响应式栅格 | 针对移动优化菜单折叠 |

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
后续建议：
- 为 Diff 组件增加快照测试。
- 使用 MSW mock 后端多场景（分页、错误码）。

---

以下为原始 PRD 内容：
