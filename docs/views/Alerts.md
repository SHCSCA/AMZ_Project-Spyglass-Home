# Alerts View 视图规范

## 目标
提供“登录即知”体验，用户进入系统即可看到近期关键告警，支持跳转到对应 ASIN 详情进行深度分析。

## 核心功能需求
| 编号 | 描述 | 优先级 |
|------|------|--------|
| F-UI-201 | 默认首页展示告警列表 | P0 |
| F-UI-202 | 数据来源：`GET /api/alerts` (分页/过滤) | P0 |
| F-UI-203 | 告警卡片字段：ASIN、类型、时间、摘要详情 | P0 |
| F-UI-204 | 点击跳转 ASIN 详情页 | P0 |
| F-UI-205 | (预留) 标记已读 / 全部清除 | P1 |
| F-UI-206 | 过滤：按类型、严重级别、时间范围 | P1 |

## 数据接口
```
GET /api/alerts?page={page}&size={size}&type={TYPE?}&severity={SEV?}&from={ISO?}&to={ISO?}
```
返回分页结构：`PageResponse<AlertItem>`。

### 字段说明
| 字段 | 类型 | 说明 |
|------|------|------|
| asin | string | 告警所属 ASIN |
| nickname | string | 展示别名（可选） |
| type | string | PRICE_CHANGE / NEGATIVE_REVIEW / INVENTORY_LOW / TITLE_CHANGE 等 |
| severity | string | INFO / WARN / ERROR |
| createdAt | string(ISO) | 告警时间 |
| message | string | 详情摘要 |

## UI 行为
- 加载态：顶部或列表骨架屏；错误态显示 `ErrorMessage`。
- 分页：页码切换触发重新请求；保持滚动位置置顶。
- 类型过滤：select 改变立即刷新。
- 严重级别 Tag 显示颜色：INFO=蓝，WARN=橙，ERROR=红。

## 交互与导航
- 点击卡片：`/asin/{id}` 跳转并附带查询参数保留来源（如 `?from=alerts`）。
- 卡片 Hover：显示“查看详情”按钮（可选）。

## 性能与体验
- 默认加载最近 N 条（如 50 条）避免一次性巨量渲染。
- 支持内存缓存 30s 避免频繁刷新导致后端压力。
- 后续可加虚拟列表（大量告警场景）。

## 边界与错误
| 场景 | 处理 |
|------|------|
| 空数据 | 显示引导文案“暂无最新告警” |
| 接口 5xx | 重试 2 次后显示错误组件 |
| 类型不存在 | 降级为全部类型 |

## 后续扩展 (Roadmap)
- 已读状态持久化（后端支持写接口）。
- 告警搜索（按 ASIN / 文本关键字）。
- 告警合并聚合（同一 ASIN 多条相似类型压缩）。
