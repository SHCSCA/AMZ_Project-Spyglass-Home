# 前端产品需求文档 (PRD): 亚马逊竞品情报系统 V2.1

| 文档版本 | V2.1 (UX Upgrade) |
| :--- | :--- |
| **项目名称** | Project Spyglass - Frontend |
| **涉及端** | Web 桌面端 (推荐分辨率 1920x1080 / 1440x900) |
| **后端状态** | V2.1 已验收 (API Ready) |
| **前端状态** | **待开发** |
| **最后修订** | 2025-11-23 |

---

## 1. 升级愿景 (Vision)
本次升级旨在承接后端 V2.1 的核心数据能力（利润分析、真实库存、关键词排名），并将产品体验从单纯的“数据罗列”升级为**“专业决策驾驶舱”**。
界面风格追求**极简主义 (Minimalism) 与高信噪比**，交互追求**流畅 (Fluidity) 与即时反馈**，打造媲美现代 SaaS 工具（如 Linear, Vercel）的使用体验。

---

## 2. UI/UX 设计规范 (Design System)

### 2.1 视觉风格 (Visual Style)
* **设计语言：** Modern Clean（现代极简）。
* **色彩系统 (Color Palette)：**
    * **背景色：** 使用冷灰/米白系列 (`bg-gray-50` / `#F9FAFB`) 作为应用底色，卡片使用纯白 (`#FFFFFF`) 配合微弱的边框 (`border-gray-100`)，减少对重阴影的依赖。
    * **主色调：** 靛蓝 (Indigo-600) 用于主按钮和激活状态，传达专业与冷静。
    * **语义色：**
        * **利润/上涨：** <span style="color:#10B981">翡翠绿 (Emerald-500)</span> —— 用于正毛利、排名上升。
        * **亏损/下跌/差评：** <span style="color:#EF4444">赤红 (Rose-500)</span> —— 用于负毛利、断货警告、1-2星评论。
        * **警示/Deal：** <span style="color:#F59E0B">琥珀色 (Amber-500)</span> —— 用于库存紧张、秒杀标记。
* **排版 (Typography)：**
    * 字体：优先使用系统无衬线字体栈 (`Inter`, `-apple-system`, `Segoe UI`)。
    * **数字展示：** 所有关键数据（价格、排名、库存）必须使用 **Tabular Nums (等宽数字)** 字体特性 (`font-variant-numeric: tabular-nums`)，确保列表中的数字垂直对齐，便于对比。
* **质感与圆角：**
    * 统一使用 `rounded-lg` (8px) 或 `rounded-xl` (12px) 圆角。
    * 顶部导航栏和模态框背景采用 **Backdrop Blur (毛玻璃)** 效果，增加层级感与通透感。

### 2.2 交互原则 (Interaction Principles)
* **骨架屏加载 (Skeleton Loading)：** 严禁使用全屏 Loading 转圈。数据加载过程中，必须展示与内容块形状匹配的灰色脉冲骨架屏，保持页面布局稳定。
* **乐观 UI (Optimistic UI)：** 在“添加关键词”、“修改成本”等操作中，前端先假定成功并立即更新界面状态，后台异步请求。若请求失败，再优雅回滚并提示错误。
* **微交互 (Micro-interactions)：**
    * 按钮 Hover 时应有细微的上浮 (`-translate-y-0.5`) 或阴影加深效果。
    * 图表 Tooltip 必须跟随鼠标流畅移动，无卡顿。
    * Tab 切换应配合平滑的 **Fade In / Slide** 动画，杜绝生硬的内容跳变。
* **空状态 (Empty States)：** 当没有数据（如无关键词、无历史记录）时，展示精美的 SVG 插画与引导文案（如：“暂无监控关键词，点击右上角添加”），而非空白一片。

---

## 3. 核心功能模块详解

### 3.1 ASIN 详情页重构 (Page: `AsinDetailPage`)

**布局变更：** 废弃原有的瀑布流长页面，重构为 **“固定头部概览 + 悬浮 Tab 导航 + 内容面板”** 结构。

#### 3.1.1 头部利润看板 (Profit Header)
* **区域定义：** 页面顶部 240px 区域，采用高质感卡片设计。
* **左侧：商品情报**
    * 商品缩略图：大尺寸圆角矩形，支持点击查看大图 (Lightbox)。
    * 标题：两行截断，Hover 显示全称。
    * 元数据：ASIN（点击复制）、父体/变体标识、站点旗帜。
* **右侧：核心指标阵列 (Key Metrics Grid)**
    * **当前价格：** 大号数字展示。若检测到 Coupon，数字旁显示绿色胶囊标签 `Coupon -$10`。
    * **预估毛利 (New)：**
        * 计算公式：`Price - (FOB + Shipping + FBA_Fee + Referral_Fee)`。
        * 样式：若为正，显示绿色数字 + `▲`；若为负，显示红色数字 + `▼`。
        * **交互：** 整个毛利区域可点击，或提供明显的“配置成本”幽灵按钮，点击唤起成本配置弹窗。
    * **真实库存 (New)：**
        * 展示后端“999加购法”返回的数值。
        * 逻辑：若库存 > 999，显示 `999+`；若库存 < 10，显示红色数字 + 呼吸光点动画（警示）。
    * **BSR 排名：** 展示主排名，带有趋势箭头（对比昨日）。

#### 3.1.2 Tab 1: 趋势监控 (Trend Monitor)
* **主图表升级 (Advanced ECharts):**
    * **双轴设计：** 左轴为价格（货币），右轴为 BSR/库存（数值，逆序显示 BSR）。
    * **事件标记 (Annotations)：**
        * **Coupon:** 在时间轴对应日期显示绿色小圆点，Hover Tooltip 显示“开启 $5 优惠券”。
        * **Lightning Deal:** 在时间轴对应区间显示浅红色背景带（MarkArea），标注“秒杀中”。
    * **交互：** 支持鼠标滚轮缩放 (DataZoom)，拖动滑块查看特定时间段细节。
* **历史数据表：**
    * 仅展示最近 30 条记录，底部提供“加载更多”按钮。
    * 表格行 Hover 时，上方图表应同步高亮对应的时间点（联动交互）。

#### 3.1.3 Tab 2: 流量与排名 (Traffic & Keywords) - **NEW**
* **布局：** 左右分栏布局（左 30% 列表，右 70% 图表）。
* **左侧：关键词管理列表**
    * **列表项：** 每个关键词为一个 Card，包含：
        * 关键词文本（加粗）。
        * **自然排名 (Organic)：** 显示最新排名数字（如 `#12`），对比昨日变化（如 `↑ 3` 绿字）。
        * **广告排名 (Sponsored)：** 显示最新广告位。
    * **操作：** 鼠标悬停 Card 时，右侧浮现“删除”图标。
    * **快速添加：** 列表底部常驻一个输入框 `Input + Enter`，输入回车即提交，列表立即出现 Loading 态新行（乐观 UI）。
* **右侧：排名走势图**
    * 类型：折线图 (Line Chart)。
    * **Y 轴特殊处理：** **逆序排列**（Rank 1 在最上方，Rank 100 在下方）。
    * 维度：展示所有（或选中）关键词的排名变化趋势。线条使用不同颜色区分。

#### 3.1.4 Tab 3: 评论洞察 (Review Insights)
* **顶部 Banner (AI 预留)：** 设计一个带有“AI 分析中...”微动效的占位符 Banner（为后续 F-BIZ-003 预留）。
* **列表优化：** 复用现有的 `NegativeReviewsList`，但增加**关键词高亮**功能（高亮 "broken", "stopped", "bad" 等负面词汇）。

---

### 3.2 成本配置模态框 (Cost Configuration Modal)

* **呼出方式：** 点击头部看板的“配置成本”按钮或毛利数字区域。
* **视觉体验：** 模态框从屏幕中心淡入并轻微放大 (Scale Up)，背景模糊。
* **表单设计：**
    * **FOB Cost (采购成本):** 输入框，支持小数。
    * **Shipping Cost (头程运费):** 输入框，支持小数。
    * **FBA Fee (配送费):** 输入框。默认显示后端估算值（如有），允许用户覆盖修改。
* **实时试算 (Live Calculation)：**
    * 在输入框下方，设计一个**实时计算器面板**。
    * 当用户输入成本时，面板实时变动：
      `当前售价 $29.99 - 采购 $5.00 - 运费 $2.00 - 佣金 $4.50 - FBA $6.00 = 预估毛利 $12.49 (41%)`
    * 让用户在保存前就能直观看到利润结构。

---

## 4. 技术实现建议 (Technical Implementation)

基于现有项目架构（React + Vite + TypeScript），本版本需引入新的 API 模块并升级图表组件。

### 4.1 目录结构与组件规范
建议在 `src/` 下保持现有的分层结构，并扩展业务组件：

```text
src/
├── api/
│   ├── asinCostApi.ts       # [NEW] 成本与利润计算接口
│   ├── keywordApi.ts        # [NEW] 关键词排名监控接口
│   └── ...
├── components/
│   ├── Business/            # [NEW] 特定业务逻辑组件
│   │   ├── ProfitHeader.tsx    # 头部利润看板 (含实时计算逻辑)
│   │   ├── CostConfigModal.tsx # 成本配置弹窗 (表单 + 试算)
│   │   ├── KeywordManager.tsx  # 关键词列表 (CRUD + 乐观UI)
│   │   └── RankingChart.tsx    # 排名趋势图 (逆序Y轴)
│   ├── UI/                  # 通用 UI 组件 (无业务逻辑)
│   │   ├── StatCard.tsx        # 核心指标卡片
│   │   ├── Badge.tsx           # 语义化标签 (Coupon/Deal)
│   │   └── Skeleton.tsx        # 骨架屏占位符
│   └── ...
└── types/
    └── index.ts             # 全局类型定义补充
 ```
 ### 4.2 核心依赖与工具链
 * **UI 框架 (Ant Design 5.x):**
    * **布局:** 使用 Flex, Row, Col 进行响应式排版
    * **数据展示:** 使用 Statistic (带箭头的主指标), Descriptions (详情), Badge.Ribbon (促销标记)。
    * **交互:** 使用 Modal (表单弹窗), Popconfirm (删除确认), Input.Search (关键词添加)。
 * **图表库 (ECharts):**
     * 继续使用 src/pages/ReactEChartsLazy.tsx 作为渲染容器。
     * 需引入 MarkPoint (气泡标记) 和 MarkArea (区域高亮) 组件。
 * **状态管理:**
    * 由于项目目前使用自定义 useFetch，对于复杂的联动（如修改成本后刷新列表），建议引入 React Query (@tanstack/react-query) 或扩展 client.ts 的事件机制。若暂不引入新库，需在父组件通过 callback 刷新数据。

 ### 4.3 API 适配与类型定义 (src/types/index.ts)
 请在 src/types/index.ts 中追加以下 Interface，以匹配后端 V2.1 的 DTO：
```TypeScript
 // 1. 扩展 AsinHistoryPoint (对应后端 AsinHistoryResponse)
export interface AsinHistoryPoint {
  // ... 现有字段
  couponValue?: string | null;      // e.g. "$5.00"
  isLightningDeal?: boolean;        // true 表示正在秒杀
  inventory?: number | null;        // 真实库存数值
}

// 2. 新增: 成本配置 (对应后端 AsinCosts)
export interface AsinCost {
  id?: number;
  asinId: number;
  fobCost: number;          // FOB 采购成本
  shippingCost: number;     // 头程运费
  fbaFeeOverride?: number;  // FBA 费率 (可选覆写)
  estimatedProfit?: number; // 后端计算的预估毛利 (可选)
  profitMargin?: number;    // 毛利率 (可选)
}

// 3. 新增: 关键词排名 (对应后端 AsinKeywords)
export interface AsinKeyword {
  id: number;
  keyword: string;
  lastOrganicRank: number | null;   // 自然排名
  lastSponsoredRank: number | null; // 广告排名
  updatedAt: string;                // ISO 时间
}
```

 ### 4.4 ECharts 图表高级配置 (Tab 1: 趋势分析)
 为了在同一张图表中展示价格、库存以及促销事件，建议配置如下：
 ```JavaScript
 // components/Business/TrendAnalysis/CombinedChart.tsx Option 配置
const option = {
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
    // 自定义 formatter 显示 Coupon 信息
    formatter: (params: any) => {
       // 实现逻辑：拼接时间、价格、排名、库存及 Coupon 文本
    }
  },
  legend: { data: ['价格', 'BSR排名', '真实库存'] },
  grid: { right: '15%' }, // 预留右侧双 Y 轴空间
  xAxis: { type: 'category', data: dates },
  yAxis: [
    {
      type: 'value',
      name: '价格',
      position: 'left',
      axisLabel: { formatter: '${value}' }
    },
    {
      type: 'value',
      name: '排名',
      position: 'right',
      inverse: true, // BSR 逆序显示（1在顶部）
      min: 1
    },
    {
      type: 'value',
      name: '库存',
      position: 'right',
      offset: 60, // 向右偏移，避免重叠
      splitLine: { show: false }
    }
  ],
  series: [
    {
      name: '价格',
      type: 'line',
      data: priceData,
      itemStyle: { color: '#1677ff' }, // Ant Design Blue
      // 促销标记核心配置
      markPoint: {
        data: historyList
          .filter(h => h.couponValue)
          .map(h => ({
            coord: [h.snapshotAt, h.price],
            value: '券',
            itemStyle: { color: '#52c41a' }, // Ant Design Green
            tooltip: { formatter: `优惠券: ${h.couponValue}` }
          }))
      },
      // 秒杀区间标记
      markArea: {
        itemStyle: { color: 'rgba(255, 77, 79, 0.1)' }, // Ant Design Red Light
        data: [ /* 根据 isLightningDeal 连续时间段生成 */ ]
      }
    },
    {
      name: 'BSR排名',
      type: 'line',
      yAxisIndex: 1,
      data: bsrData,
      itemStyle: { color: '#faad14' } // Ant Design Gold
    },
    {
      name: '真实库存',
      type: 'line', // 或 bar
      yAxisIndex: 2,
      data: inventoryData,
      itemStyle: { color: '#722ed1' }, // Ant Design Purple
      step: 'end' // 库存通常是阶梯状变化
    }
  ]
};
 ```

## 5. 验收标准 (UAT - User Acceptance Testing)

| 模块 | 测试场景 | 预期结果 (Pass Criteria) |
| :--- | :--- | :--- |
| **利润看板** | **成本配置交互** | 1. 点击 Header 中的“配置成本”按钮，Ant Design `Modal` 带遮罩层弹出。<br>2. 在 `InputNumber` 中输入 FOB 和头程运费，界面应**实时计算**并展示预估毛利（无需点击保存即可预览）。<br>3. 点击“保存”后，Modal 关闭，并通过 `message.success` 提示成功，页面无刷新自动更新 Header 数据。 |
| **趋势图表** | **促销信息展示** | 1. 在包含 Coupon 的日期节点，价格曲线上方应显示绿色 `MarkPoint` 气泡。<br>2. 鼠标悬停该标记，Tooltip 显示具体的 Coupon 面额（如 "$5.00"）。<br>3. 秒杀期间，图表背景应有浅红色 `MarkArea` 高亮带。 |
| **关键词监控** | **增删与展示** | 1. 在 `Input.Search` 输入关键词并回车，表格立即显示 Loading 状态的新行（乐观更新）。<br>2. 点击“删除”图标，需弹出 `Popconfirm` 二次确认框，确认后记录从表格中移除。<br>3. 排名图表的 Y 轴必须是**逆序**的（第 1 名在图表最上方）。 |
| **真实库存** | **数据展示** | 1. 当库存 > 999 时，界面显示文本 `999+`。<br>2. 当库存 < 20 时，使用红色 `Tag` 或 `Badge` 组件进行视觉警示。 |
| **响应式布局** | **屏幕适配** | 1. 在 1366x768 分辨率下，Header 的 `Statistic` 组件自动换行或缩放，不出现遮挡。<br>2. `Table` 组件在小屏下应显示横向滚动条，且操作列固定在右侧。 |

---

## 6. 开发路线图 (Roadmap)

建议按以下阶段分步开发，优先打通核心数据链路。

* **Phase 1: 基础建设 (Infrastructure)**
    * [ ] 更新 `src/types/index.ts`，补充 `AsinCost` 和 `AsinKeyword` 等类型定义。
    * [ ] 创建 `src/api/asinCostApi.ts` 和 `src/api/keywordApi.ts`，封装 Axios 请求。
    * [ ] 封装通用的业务弹窗组件 `CostConfigModal` (基于 Antd Modal + Form)。

* **Phase 2: 详情页框架重构 (Refactor)**
    * [ ] 将 `AsinDetailPage.tsx` 重构为 `Header + Tabs` 布局 (使用 Antd `Tabs` 组件)。
    * [ ] 实现 `ProfitDashboard` 组件，使用 `Statistic` 和 `Descriptions` 展示基础信息，暂时对接 Mock 数据。

* **Phase 3: 核心功能 - 成本与利润 (Cost & Profit)**
    * [ ] 完善 `CostConfigModal` 组件，实现表单校验与提交。
    * [ ] 对接后端 API，实现成本数据的读取与保存。
    * [ ] 联调 Header，根据成本动态计算并展示毛利（使用语义化颜色：盈绿亏红）。

* **Phase 4: 核心功能 - 关键词与库存 (Keywords & Inventory)**
    * [ ] 开发 `KeywordRank` 模块，使用 `Table` 展示关键词列表，集成 `Input.Search` 添加功能。
    * [ ] 开发 `RankChart` 组件，处理 ECharts 逆序 Y 轴逻辑。
    * [ ] 更新趋势图表 (`CombinedChart`)，适配 `couponValue` (MarkPoint) 和 `999` 库存显示逻辑。

* **Phase 5: 视觉与交互打磨 (Polish)**
    * [ ] 配置 Ant Design Token (ConfigProvider)，统一微调主题色。
    * [ ] 优化全局 Loading 状态，使用 `Skeleton` 骨架屏替换生硬的 Spin 加载。
    * [ ] 添加 Empty 状态（Antd `Empty` 组件），当图表或列表无数据时显示引导文案。

---

## 7. 附录：参考资源

* **后端 API 文档:**
    * 本地开发环境: `http://localhost:8081/swagger-ui/index.html`
    * 请重点关注 `AsinCostsController` 和 `AsinKeywordsController` 的接口定义。
* **UI 组件库文档 (Ant Design 5.x):**
    * [Statistic 数值展示](https://ant.design/components/statistic-cn)
    * [Badge.Ribbon 缎带徽标](https://ant.design/components/badge-cn#badge-demo-ribbon) (可用于商品图上的 Deal 标记)
    * [Descriptions 描述列表](https://ant.design/components/descriptions-cn)
* **ECharts 配置手册:**
    * [series-line.markPoint](https://echarts.apache.org/zh/option.html#series-line.markPoint) (用于 Coupon 标记)
    * [series-line.markArea](https://echarts.apache.org/zh/option.html#series-line.markArea) (用于 Deal 区间标记)

