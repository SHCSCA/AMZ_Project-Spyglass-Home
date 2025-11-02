/**
 * 全局可调配置常量：集中声明默认网络与缓存策略。
 * 根据实际运行环境可在构建阶段或运行时（通过环境变量扩展）调整。
 */
export const DEFAULT_API_TIMEOUT_MS = 10_000; // 默认 API 超时时间 10s
export const DEFAULT_API_RETRY = 2;           // 默认重试次数（仅 5xx / 网络错误重试）
export const DEFAULT_API_CACHE_TTL_MS = 30_000; // 默认 GET 缓存 TTL 30s

/** swagger 文档地址（后端公开接口），用于 README 链接或自动化脚本 */
export const SWAGGER_URL = 'http://shcamz.xyz:8081/swagger-ui/index.html';

/** 后续可扩展：不同环境下覆盖策略 */
export interface RuntimeConfig {
  apiBase: string;
  timeoutMs: number;
  retry: number;
  cacheTtlMs: number;
}

export function buildRuntimeConfig(): RuntimeConfig {
  return {
    apiBase: import.meta.env.VITE_API_BASE_URL || '/api',
    timeoutMs: DEFAULT_API_TIMEOUT_MS,
    retry: DEFAULT_API_RETRY,
    cacheTtlMs: DEFAULT_API_CACHE_TTL_MS,
  };
}