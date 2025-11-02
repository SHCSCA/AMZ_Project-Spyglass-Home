# Dashboard View 视图规范

## 目标
展示受监控 ASIN 的整体状态，支持增删改操作与跳转详情；成为运维/分析的中心入口。

## 核心功能需求
| 编号 | 描述 | 优先级 |
|------|------|--------|
| F-UI-301 | 表格展示 ASIN 列表 | P0 |
| F-UI-302 | 数据来源：`GET /api/asin` | P0 |
| F-UI-303 | 添加 ASIN：`POST /api/asin` | P0 |
| F-UI-304 | 编辑配置：`PUT /api/asin/{id}/config` | P0 |
| F-UI-305 | 删除：`DELETE /api/asin/{id}` | P0 |
| F-UI-306 | 行级告警标识（红点） | P1 |
| F-UI-307 | 分页与页面大小切换 | P1 |
| F-UI-308 | 按站点/品牌过滤 | P1 |

## 表格列定义
| 列名 | 字段 | 说明 |
|------|------|------|
| 昵称 / ASIN | nickname / asin | 主键，点击跳转详情 |
| 站点 | site | `US/EU/JP/...` |
| 最新价格 | lastPrice | 最近一次价格快照 |
| 最新BSR | lastBsr | 最近一次 Best Seller Rank |
| 最新库存 | lastInventory | 最近库存数（可为空） |
| 评论数 | totalReviews | 总评论数 |
| 平均评分 | avgRating | 平均星级 |
| 库存阈值 | inventoryThreshold | 触发告警阈值 |
| 品牌 | brand | 后端新增字段 |
| 分组 | groupName | 业务分组（可用于聚合分析） |
| 操作 | actions | 编辑 / 删除 |

## 数据接口 & 分页
```
GET /api/asin?page={page}&size={size}&site={site?}&brand={brand?}&groupId={gid?}
```
返回：`PageResponse<AsinItem>`。

## 交互细节
- 添加 / 编辑 使用同一弹窗组件，根据是否存在 id 区分模式。
- 删除前确认二次弹窗；成功后刷新列表保持当前页。
- 行点击与“查看”按钮等价，进入详情。
- 分页切换维护 query state；可用于分享链接。

## 校验与错误
| 字段 | 规则 |
|------|------|
| asin | 必填，长度 10，字母数字 |
| site | 必填，枚举 |
| nickname | 允许空，最长 50 |
| inventoryThreshold | 非负整数 |

## 性能策略
- 首屏仅加载第一页数据；用户滚动或分页才继续请求。
- 可加“预取 next page”提升翻页体验。
- 内存缓存最近一次列表响应，短时间返回加速。

## 行级告警标识
- 请求 `GET /api/alerts?status=NEW` 聚合出有未读告警的 ASIN 集合。
- 在对应行渲染一个红色圆点或 `Badge`。

## Roadmap 扩展
- 批量导入 ASIN CSV。
- 批量编辑库存阈值。
- 图表迷你 Sparklines（最近价格趋势嵌入行）。
