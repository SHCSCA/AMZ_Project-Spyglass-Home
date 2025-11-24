import { apiRequest } from './client';
import { AsinKeyword, KeywordRankPoint } from '../types';

export interface CreateKeywordDto {
  keyword: string;
  isTracked?: boolean;
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
      isTracked: true,
      ...payload,
    }),
  });
}

export async function deleteAsinKeyword(asin: string, keywordId: number): Promise<void> {
  await apiRequest(`/api/v1/asins/${encodeURIComponent(asin)}/keywords/${keywordId}`, {
    method: 'DELETE',
  });
}

export async function fetchKeywordRankTrend(
  asin: string | undefined | null,
  range: string = '30d'
): Promise<KeywordRankPoint[]> {
  if (!asin) return [];
  const params = new URLSearchParams({ range });
  const records = await apiRequest<KeywordRankPoint[] | Array<Record<string, unknown>>>(
    `/api/v1/asins/${encodeURIComponent(asin)}/keywords/ranks?${params.toString()}`
  );
  return (records as Array<Record<string, unknown>>)
    .map((item) => ({
      keywordId: Number(item.keywordId ?? item.id ?? 0),
      keyword: String(item.keyword ?? ''),
      snapshotAt: String(item.snapshotAt ?? item.capturedAt ?? item.measureAt ?? ''),
      organicRank: toNullableNumber(
        item.organicRank ?? item.lastOrganicRank ?? item.latestOrganicRank
      ),
      sponsoredRank: toNullableNumber(
        item.sponsoredRank ?? item.lastSponsoredRank ?? item.latestSponsoredRank
      ),
    }))
    .filter((item) => item.keyword.length > 0 && item.snapshotAt.length > 0);
}
