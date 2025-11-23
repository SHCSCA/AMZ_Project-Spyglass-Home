import { apiRequest } from './client';
import { AsinKeyword, KeywordRankPoint } from '../types';

export interface CreateKeywordDto {
  keyword: string;
}

export async function fetchAsinKeywords(asinId: number): Promise<AsinKeyword[]> {
  if (!asinId) return [];
  const params = new URLSearchParams({ size: '100' });
  return apiRequest<AsinKeyword[]>(`/api/asin/${asinId}/keywords?${params.toString()}`);
}

export async function createAsinKeyword(asinId: number, payload: CreateKeywordDto): Promise<AsinKeyword> {
  return apiRequest<AsinKeyword>(`/api/asin/${asinId}/keywords`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteAsinKeyword(asinId: number, keywordId: number): Promise<void> {
  await apiRequest(`/api/asin/${asinId}/keywords/${keywordId}`, {
    method: 'DELETE',
  });
}

export async function fetchKeywordRankTrend(
  asinId: number,
  range: string = '30d'
): Promise<KeywordRankPoint[]> {
  if (!asinId) return [];
  const params = new URLSearchParams({ range });
  return apiRequest<KeywordRankPoint[]>(`/api/asin/${asinId}/keywords/ranks?${params.toString()}`);
}
