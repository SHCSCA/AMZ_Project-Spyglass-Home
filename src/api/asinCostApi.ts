import { apiRequest } from './client';
import { AsinCost } from '../types';

export interface UpsertAsinCostRequest {
  purchaseCost: number;
  shippingCost?: number;
  fbaFee?: number;
  tariffRate?: number;
  otherCost?: number;
}

function normalizeAsinCost(raw: AsinCost | Record<string, unknown> | null, fallbackAsin: string): AsinCost {
  const source = (raw ?? {}) as Record<string, unknown>;
  return {
    asin: String(source.asin ?? fallbackAsin),
    purchaseCost: Number(source.purchaseCost ?? 0),
    shippingCost: source.shippingCost === undefined ? undefined : Number(source.shippingCost),
    fbaFee: source.fbaFee === undefined ? undefined : Number(source.fbaFee),
    tariffRate: source.tariffRate === undefined ? undefined : Number(source.tariffRate),
    otherCost: source.otherCost === undefined ? undefined : Number(source.otherCost),
    profit: source.profit === undefined ? undefined : Number(source.profit),
    profitMargin: source.profitMargin === undefined ? undefined : Number(source.profitMargin),
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : undefined,
  };
}

export async function fetchAsinCost(asin: string | undefined | null): Promise<AsinCost | null> {
  if (!asin) return null;
  try {
    const cost = await apiRequest<AsinCost | Record<string, unknown>>(
      `/api/v1/asins/${encodeURIComponent(asin)}/costs`
    );
    if (!cost) return null;
    return normalizeAsinCost(cost, asin);
  } catch (error) {
    if ((error as { status?: number })?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchAsinProfit(asin: string, price: number): Promise<number | null> {
  const res = await apiRequest<{ profit: number }>(
    `/api/v1/asins/${encodeURIComponent(asin)}/costs/calculate-profit?price=${price}`
  );
  return res.profit;
}

export async function upsertAsinCost(asin: string, payload: UpsertAsinCostRequest): Promise<AsinCost> {
  const saved = await apiRequest<AsinCost | Record<string, unknown>>(
    `/api/v1/asins/${encodeURIComponent(asin)}/costs`,
    {
    method: 'POST',
    body: JSON.stringify(payload),
    }
  );
  return normalizeAsinCost(saved, asin);
}
