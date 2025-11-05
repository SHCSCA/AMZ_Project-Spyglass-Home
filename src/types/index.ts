// 通用分页响应结构（与后端 PageResponse 对齐）
export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 后端 AsinResponse 对应（原前端 AsinItem）
export interface AsinResponse {
  id: number;
  asin: string;
  site: string;
  nickname?: string;
  inventoryThreshold?: number;
  brand?: string;
  groupId?: number;
  groupName?: string;
  createdAt?: string;
  updatedAt?: string;
  // 聚合的最新快照指标
  lastPrice?: number;
  lastBsr?: number;
  lastInventory?: number;
  totalReviews?: number;
  avgRating?: number;
}

// 兼容旧命名，供现有组件逐步迁移；后续可直接用 AsinResponse 并做聚合扩展
export interface AsinItem extends AsinResponse {}

// 告警日志（AlertLogResponse）
export interface AlertLogResponse {
  id: number;
  asinId: number;
  asinCode: string;
  site: string;
  alertType: string; // PRICE_CHANGE / TITLE / MAIN_IMAGE / BULLET_POINTS / APLUS_CONTENT / NEGATIVE_REVIEW / etc
  severity?: string;
  alertAt: string; // ISO
  oldValue?: string;
  newValue?: string;
  changePercent?: string; // 字符串形式百分比
  refId?: number;
  contextJson?: string;
  message?: string;
}

// 前端统一使用的 AlertItem（映射字段名到更直观/之前使用的命名）
export interface AlertItem {
  id: number;
  asinId: number;
  asin: string; // 映射 asinCode
  type: string; // 映射 alertType
  createdAt: string; // 映射 alertAt
  message: string;
  oldValue?: string;
  newValue?: string;
  changePercent?: string;
  severity?: string;
  // status 字段后端暂未实现，保留可选以兼容 UI 标记逻辑
  status?: string;
}

// 历史快照点（AsinHistoryResponse）
export interface AsinHistoryPoint {
  id?: number;
  asinId?: number;
  price?: number; // Buybox 价格
  bsr?: number;
  bsrCategory?: string;
  bsrSubcategory?: string;
  bsrSubcategoryRank?: number;
  inventory?: number;
  imageMd5?: string;
  aplusMd5?: string;
  totalReviews?: number;
  avgRating?: number;
  title?: string;
  bulletPoints?: string;
  snapshotAt: string; // ISO 时间戳
}

// 为图表消费的通用 HistoryPoint（保持旧结构，但由 AsinHistoryPoint 映射）
export interface HistoryPoint {
  timestamp: string; // ISO = snapshotAt
  price?: number;
  bsr?: number;
  inventory?: number;
}

// ReviewAlertResponse
export interface ReviewAlertResponse {
  id: number;
  asinId: number;
  reviewId: string;
  rating: number;
  reviewDate: string; // LocalDate -> 采用字符串
  reviewText: string;
  alertAt: string;
}

// 前端统一 ReviewItem（映射字段）
export interface ReviewItem {
  id: number;
  asinId: number;
  rating: number;
  createdAt: string; // 映射 reviewDate 或 alertAt （此处使用 reviewDate 更贴近用户期望）
  text: string; // 映射 reviewText
}

// DiffResult 占位（后端暂未提供 content-diff API，保留类型以便将来实现）
export interface DiffResult {
  oldTitle: string;
  newTitle: string;
  oldBullet?: string;
  newBullet?: string;
}
