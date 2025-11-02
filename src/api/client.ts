export const apiBase = import.meta.env.VITE_API_BASE_URL as string;

interface RequestOptions extends RequestInit {
  skipErrorToast?: boolean;
}

const cache = new Map<string, { expiry: number; data: any }>();
const DEFAULT_TTL = 30_000; // 30s

import { logInfo, logWarn, logError } from '../logger';

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${apiBase}${path}`;
  const method = (options.method || 'GET').toUpperCase();
  const useCache = method === 'GET';
  if (useCache) {
    const cached = cache.get(url);
    if (cached && cached.expiry > Date.now()) return cached.data as T;
  }
  const start = performance.now();
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (e: any) {
    logError('network_error', { url, error: e?.message });
    throw e;
  }
  const ms = Math.round(performance.now() - start);
  if (!res.ok) {
    const text = await res.text();
    logWarn('api_error', { url, status: res.status, body: text, ms });
    throw new Error(`API请求失败 ${res.status}: ${text}`);
  }
  const data = await res.json();
  if (useCache) cache.set(url, { data, expiry: Date.now() + DEFAULT_TTL });
  logInfo('api_ok', { url, status: res.status, ms });
  return data as T;
}

export function apiCacheClear() { cache.clear(); }
