import { apiRequest } from './client';
import { AsinCost } from '../types';

export interface UpsertAsinCostDto {
  fobCost: number;
  shippingCost: number;
  referralFee?: number;
  fbaFeeOverride?: number;
}

export async function fetchAsinCost(asinId: number): Promise<AsinCost | null> {
  if (!asinId) return null;
  try {
    return await apiRequest<AsinCost>(`/api/asin/${asinId}/costs`);
  } catch (error) {
    // 接口若返回 404 或无配置，统一返回 null，供前端走默认值
    if ((error as { status?: number })?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function upsertAsinCost(asinId: number, payload: UpsertAsinCostDto): Promise<AsinCost> {
  return apiRequest<AsinCost>(`/api/asin/${asinId}/costs`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
