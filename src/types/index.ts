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
  // V2.1 新增：快照数据映射
  latestPrice?: string;        // 后端返回的是 String 类型的数值
  latestInventory?: number;    // 999加购法获取的库存
  latestBsr?: string;
  latestTotalReviews?: number;
  latestAvgRating?: number;
  
  // ★★★ 必须新增以下字段适配 V2.1 促销抓取 ★★★
  couponValue?: string;        // e.g. "$10 off"
  isLightningDeal?: boolean;   // e.g. true
  inventoryLimited?: boolean;  // e.g. true (表示遭遇限购)

  // 前端聚合使用的字段 (DashboardPage enriched rows)
  lastTitle?: string;
  lastPrice?: number;
  lastInventory?: number;
  lastBsr?: number;
  lastBsrSubcategory?: string;
  lastBsrSubcategoryRank?: number;
  lastBulletPoints?: string;
  lastAplusMd5?: string;
  lastCouponValue?: string;
  lastIsLightningDeal?: boolean;
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
  typeLabel?: string;
  createdAt: string; // 映射 alertAt
  message: string;
  oldValue?: string;
  newValue?: string;
  changePercent?: string;
  severity?: string;
  // status 字段后端暂未实现，保留可选以兼容 UI 标记逻辑
  status?: string;
  contextJson?: string;
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
  referralFee?: number;
  couponValue?: string | null;
  isLightningDeal?: boolean;
  snapshotAt: string; // ISO 时间戳
}

// 根据 swagger: /api/asin/by-asin/{asin} 返回最新一次历史快照结构（与单条 AsinHistoryPoint 基本一致，提供 asinId 主键）
export interface AsinHistorySnapshot {
  id: number; // snapshot id
  asinId: number; // 真实 ASIN 主键
  price?: number;
  bsr?: number;
  inventory?: number;
  bsrSubcategory?: string;
  bsrSubcategoryRank?: number;
  totalReviews?: number;
  avgRating?: number;
  referralFee?: number;
  couponValue?: string | null;
  isLightningDeal?: boolean;
  snapshotAt: string;
  title?: string;
  bulletPoints?: string;
  aplusMd5?: string;
}

// 为图表消费的通用 HistoryPoint（保持旧结构，但由 AsinHistoryPoint 映射）
export interface HistoryPoint {
  timestamp: string; // ISO = snapshotAt
  price?: number;
  bsr?: number;
  inventory?: number;
}

export interface AsinCost {
  asin: string;
  purchaseCost: number;
  shippingCost?: number;
  fbaFee?: number;
  tariffRate?: number;
  otherCost?: number;
  profit?: number;
  profitMargin?: number;
  updatedAt?: string;
}

export interface AsinKeyword {
  id: number;
  keyword: string;
  isTracked: boolean;
  lastOrganicRank?: number | null;
  lastSponsoredRank?: number | null;
  updatedAt?: string;
}

export interface KeywordRankPoint {
  keywordId: number;
  keyword: string;
  snapshotAt: string;
  organicRank?: number | null;
  sponsoredRank?: number | null;
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
