/**
 * ASIN监控相关API
 */

import { apiRequest } from './client';
import { PageResponse, AsinResponse } from '../types';

/**
 * ASIN创建/更新时的监控配置
 */
export interface MonitorConfig {
  // 价格变动监控
  enablePriceAlert?: boolean;
  priceChangeThreshold?: number; // 百分比,如 5 表示 ±5%

  // BSR变动监控
  enableBsrAlert?: boolean;
  bsrChangeThreshold?: number; // 百分比

  // 库存监控
  enableInventoryAlert?: boolean;
  inventoryChangeThreshold?: number; // 绝对数量
  inventoryThreshold?: number; // 最低库存阈值 (现有字段)

  // 负面评论监控
  enableNegativeReviewAlert?: boolean;
  negativeReviewRatingThreshold?: number; // 星级阈值,如 2 表示 ≤2星

  // 内容变化监控
  enableTitleChangeAlert?: boolean;
  enableMainImageChangeAlert?: boolean;
  enableBulletPointsChangeAlert?: boolean;
  enableAplusContentChangeAlert?: boolean;
}

export interface CreateAsinDto {
  asin: string; // ASIN Code (必填)
  site: string; // 站点 US/UK/DE/JP等 (必填)
  nickname?: string; // 昵称 (可选)
  groupId?: number; // 分组ID (可选)
  brand?: string; // 品牌 (可选)
  monitorConfig?: MonitorConfig; // 监控配置 (可选)
}

export interface UpdateAsinDto {
  nickname?: string;
  groupId?: number;
  brand?: string;
  monitorConfig?: MonitorConfig;
}

/**
 * 获取ASIN列表
 * @param page 页码 (从0开始)
 * @param size 每页数量
 * @param groupId 分组筛选 (可选)
 */
export async function fetchAsins(
  page: number = 0,
  size: number = 20,
  groupId?: number
): Promise<PageResponse<AsinResponse>> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (groupId !== undefined && groupId !== null) {
    params.append('groupId', groupId.toString());
  }
  return apiRequest<PageResponse<AsinResponse>>(`/api/asin?${params}`);
}

/**
 * 创建新ASIN监控
 */
export async function createAsin(data: CreateAsinDto): Promise<AsinResponse> {
  return apiRequest<AsinResponse>('/api/asin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 更新ASIN配置
 */
export async function updateAsin(id: number, data: UpdateAsinDto): Promise<AsinResponse> {
  // 注意: 原有端点为 /api/asin/{id}/config,需确认后端是否支持整体更新
  // 若不支持,则分别调用 /api/asin/{id} 和 /api/asin/{id}/config
  return apiRequest<AsinResponse>(`/api/asin/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * 删除ASIN监控
 */
export async function deleteAsin(id: number): Promise<void> {
  await apiRequest(`/api/asin/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 获取ASIN详情
 */
export async function fetchAsinDetail(id: number): Promise<AsinResponse> {
  return apiRequest<AsinResponse>(`/api/asin/${id}`);
}

// 注意: fetchLatestSnapshot 已在详情页最新逻辑替换为直接合并 /by-asin 快照 + 历史点
// 若仅仪表盘需要，可在未来单独实现。当前未被引用，移除以减少冗余。
