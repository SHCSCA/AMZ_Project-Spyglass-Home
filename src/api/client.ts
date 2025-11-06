/**
 * API 基础地址，通过 Vite 环境变量注入；生产部署时推荐使用相对路径 `/api` 以通过同域反代规避 CORS。
 */
export const apiBase = import.meta.env.VITE_API_BASE_URL as string;

// 规范化与回退：
// 如果配置了跨域完整域名但后端未开启 CORS，则自动回退到同源相对路径（''），
// 依赖 nginx 反向代理 /api 避免 CORS。避免出现 /api/api 重复，通过统一拼接处理。
function resolveApiBase(raw: string | undefined): string {
  const base = (raw || '').trim();
  if (!base) return '';
  try {
    if (/^https?:/i.test(base)) {
      const url = new URL(base);
      const currentHost = typeof window !== 'undefined' ? window.location.host : '';
      if (currentHost && url.host !== currentHost) {
        // 跨域且可能无 CORS，回退为空字符串使用同源反代
        return '';
      }
      return url.origin; // 只保留 origin，避免路径段与后续 /api 重复
    }
    // 如果传入 '/api' 之类，交给后续拼接处理，避免 '/api/api'
    return base.replace(/\/$/, '');
  } catch {
    return '';
  }
}

const normalizedApiBase = resolveApiBase(apiBase);

import {
  DEFAULT_API_TIMEOUT_MS,
  DEFAULT_API_RETRY,
  DEFAULT_API_CACHE_TTL_MS,
} from '../constants/config';
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
const cache = new Map<string, { expiry: number; data: unknown }>();

// 默认 TTL 及网络健壮性参数，可后续抽取到 config 常量
const DEFAULT_TTL = DEFAULT_API_CACHE_TTL_MS;
const DEFAULT_TIMEOUT = DEFAULT_API_TIMEOUT_MS;
const DEFAULT_RETRY = DEFAULT_API_RETRY;

import { logInfo, logWarn, logError } from '../logger';

/**
 * 统一的 API 请求函数：
 * - 自动缓存 GET
 * - 支持重试与指数退避
 * - 支持超时取消 (AbortController)
 * - 结构化日志（ok / error / network_error）
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  // 统一去除 path 前重复的 /，并避免 base='/api' + path='/api/...'
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = normalizedApiBase
    ? `${normalizedApiBase}${cleanPath}`.replace(/(\/api){2,}/g, '/api')
    : cleanPath; // 同源相对路径
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
  let lastError: unknown;
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
    } catch (e: unknown) {
      clearTimeout(timer);
      lastError = e;
      const isAbort = (e as Error)?.name === 'AbortError';
      const shouldRetry = !isAbort && attempt < retry;
      const errorMessage = e instanceof Error ? e.message : String(e);
      logError('network_error', { url, error: errorMessage, attempt, shouldRetry });
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
export function apiCacheClear() {
  cache.clear();
}
