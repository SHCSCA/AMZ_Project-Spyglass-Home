/**
 * API 基础地址，通过 Vite 环境变量注入；生产部署时推荐使用相对路径 `/api` 以通过同域反代规避 CORS。
 */
export const apiBase = import.meta.env.VITE_API_BASE_URL as string;

/**
 * 请求选项扩展：支持跳过错误提示、重试次数、超时毫秒、是否使用缓存。
 */
interface RequestOptions extends RequestInit {
  skipErrorToast?: boolean;
  retry?: number; // 重试次数（仅 GET 或幂等请求建议使用）
  timeoutMs?: number; // 超时时间
  cacheTtlMs?: number; // 自定义缓存 TTL
  useCache?: boolean; // 强制使用缓存（默认仅 GET）
}

/** 简单内存缓存结构：url -> { expiry, data } */
const cache = new Map<string, { expiry: number; data: any }>();

// 默认 TTL 及网络健壮性参数，可后续抽取到 config 常量
const DEFAULT_TTL = 30_000; // 30s
const DEFAULT_TIMEOUT = 10_000; // 10s
const DEFAULT_RETRY = 2;

import { logInfo, logWarn, logError } from '../logger';

/**
 * 统一的 API 请求函数：
 * - 自动缓存 GET
 * - 支持重试与指数退避
 * - 支持超时取消 (AbortController)
 * - 结构化日志（ok / error / network_error）
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${apiBase}${path}`;
  const method = (options.method || 'GET').toUpperCase();
  const useCache = options.useCache ?? method === 'GET';
  const retry = options.retry ?? DEFAULT_RETRY;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT;
  const cacheTtl = options.cacheTtlMs ?? DEFAULT_TTL;

  if (useCache) {
    const cached = cache.get(url);
    if (cached && cached.expiry > Date.now()) {
      logInfo('api_cache_hit', { url });
      return cached.data as T;
    }
  }

  let attempt = 0;
  let lastError: any;
  while (attempt <= retry) {
    const start = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        signal: controller.signal,
        ...options,
      });
      clearTimeout(timer);
      const ms = Math.round(performance.now() - start);
      if (!res.ok) {
        const text = await res.text();
        // 4xx 认为是客户端或业务错误，不重试；5xx/网络超时可重试
        const shouldRetry = res.status >= 500 && attempt < retry;
        logWarn('api_error', { url, status: res.status, body: text, ms, attempt, shouldRetry });
        if (shouldRetry) {
          attempt++;
          await backoff(attempt);
          continue;
        }
        throw new Error(`API请求失败 ${res.status}: ${text}`);
      }
      const data = await res.json();
      if (useCache) cache.set(url, { data, expiry: Date.now() + cacheTtl });
      logInfo('api_ok', { url, status: res.status, attempt, ms });
      return data as T;
    } catch (e: any) {
      clearTimeout(timer);
      lastError = e;
      const isAbort = e?.name === 'AbortError';
      const shouldRetry = !isAbort && attempt < retry;
      logError('network_error', { url, error: e?.message, attempt, shouldRetry });
      if (shouldRetry) {
        attempt++;
        await backoff(attempt);
        continue;
      }
      throw e instanceof Error ? e : new Error(String(e));
    }
  }
  // 理论上不会到这
  throw lastError instanceof Error ? lastError : new Error('未知错误');
}

/** 指数退避：基础 200ms * 2^(attempt-1) */
async function backoff(attempt: number) {
  const base = 200;
  const wait = base * Math.pow(2, attempt - 1);
  await new Promise((r) => setTimeout(r, wait));
}

/** 清空缓存 */
export function apiCacheClear() { cache.clear(); }
