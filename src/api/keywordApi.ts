import { apiRequest } from './client';
import { AsinKeyword, KeywordRankPoint } from '../types';

export interface CreateKeywordDto {
  keyword: string;
  isTracked?: boolean;
}

export interface UpdateKeywordDto {
  keyword: string;
  isTracked: boolean;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function fetchAsinKeywords(asin: string | undefined | null): Promise<AsinKeyword[]> {
  if (!asin) return [];
  const params = new URLSearchParams({ size: '100' });
  const records = await apiRequest<AsinKeyword[] | Array<Record<string, unknown>>>(
    `/api/v1/asins/${encodeURIComponent(asin)}/keywords?${params.toString()}`
  );
  return (records as Array<Record<string, unknown>>)
    .map((item, index) => ({
      id: Number(item.id ?? index),
      keyword: String(item.keyword ?? '').trim(),
      isTracked: Boolean(item.isTracked ?? item.tracked ?? true),
      lastOrganicRank: toNullableNumber(
        item.lastOrganicRank ?? item.organicRank ?? item.latestOrganicRank
      ),
      lastSponsoredRank: toNullableNumber(
        item.lastSponsoredRank ?? item.sponsoredRank ?? item.latestSponsoredRank
      ),
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
    }))
    .filter((item) => item.keyword.length > 0);
}

export async function createAsinKeyword(asin: string, payload: CreateKeywordDto): Promise<AsinKeyword> {
  return apiRequest<AsinKeyword>(`/api/v1/asins/${encodeURIComponent(asin)}/keywords`, {
    method: 'POST',
    body: JSON.stringify({
      isTracked: payload.isTracked ?? true,
      keyword: payload.keyword,
    }),
  });
}

export async function updateAsinKeyword(
  asin: string,
  keywordId: number,
  payload: UpdateKeywordDto
): Promise<AsinKeyword> {
  return apiRequest<AsinKeyword>(
    `/api/v1/asins/${encodeURIComponent(asin)}/keywords/${keywordId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteAsinKeyword(asin: string, keywordId: number): Promise<void> {
  await apiRequest(`/api/v1/asins/${encodeURIComponent(asin)}/keywords/${keywordId}`, {
    method: 'DELETE',
  });
}

export async function fetchKeywordHistory(
  asin: string,
  keywordId: number
): Promise<KeywordRankPoint[]> {
  const records = await apiRequest<Array<Record<string, unknown>>>(
    `/api/v1/asins/${encodeURIComponent(asin)}/keywords/${keywordId}/history`
  );
  
  // 获取关键词信息以填充 keyword 字段 (可选，如果不需要可以在上层处理)
  // 这里为了保持 KeywordRankPoint 结构完整，我们假设 keyword 字段在图表中可能需要
  // 但历史接口不返回 keyword 文本，只返回排名。
  // 我们暂时留空 keyword 文本，或者由调用方填充。
  
  return records.map((item) => ({
    keywordId: keywordId,
    keyword: '', // 历史接口不包含关键词文本
    snapshotAt: String(item.scrapeDate ?? ''),
    organicRank: toNullableNumber(item.naturalRank),
    sponsoredRank: toNullableNumber(item.sponsoredRank),
  }));
}

export async function fetchKeywordRankTrend(
  asin: string | undefined | null,
  range: string = '30d' // range 参数目前在历史接口未被使用，但保留接口兼容
): Promise<KeywordRankPoint[]> {
  if (!asin) return [];
  
  // 1. 获取该 ASIN 的所有关键词
  const keywords = await fetchAsinKeywords(asin);
  if (keywords.length === 0) return [];

  // 2. 并行获取每个关键词的历史数据
  const promises = keywords.map(async (kw) => {
    try {
      const history = await fetchKeywordHistory(asin, kw.id);
      // 填充关键词文本
      return history.map(h => ({ ...h, keyword: kw.keyword }));
    } catch (e) {
      console.warn(`Failed to fetch history for keyword ${kw.id}`, e);
      return [];
    }
  });

  const results = await Promise.all(promises);
  return results.flat();
}
