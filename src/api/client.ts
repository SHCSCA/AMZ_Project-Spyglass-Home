export const apiBase = import.meta.env.VITE_API_BASE_URL as string;

interface RequestOptions extends RequestInit {
  skipErrorToast?: boolean;
}

const cache = new Map<string, { expiry: number; data: any }>();
const DEFAULT_TTL = 30_000; // 30s

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${apiBase}${path}`;
  const method = (options.method || 'GET').toUpperCase();
  const useCache = method === 'GET';
  if (useCache) {
    const cached = cache.get(url);
    if (cached && cached.expiry > Date.now()) return cached.data as T;
  }
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API请求失败 ${res.status}: ${text}`);
  }
  const data = await res.json();
  if (useCache) cache.set(url, { data, expiry: Date.now() + DEFAULT_TTL });
  return data as T;
}

export function apiCacheClear() { cache.clear(); }
