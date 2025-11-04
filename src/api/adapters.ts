/**
 * 兼容后端分页升级过程的适配工具。
 * 当前后端计划将原本返回数组的接口改为 PageResponse<T>；
 * 在升级完成前，前端需要能够同时处理：
 * 1. 直接返回数组 (旧版)
 * 2. 返回 PageResponse<T> (新版)
 *
 * 该适配函数会统一包装成 PageResponse 结构，避免页面 & hook 代码修改过多。
 */
export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * 若后端已是 PageResponse 结构则原样返回；若是数组则包装。
 * total 以数组长度估算（旧接口无法获知真实总数）。
 */
export function ensurePageResponse<T>(raw: unknown, page = 0, size = 20): PageResponse<T> {
  if (!raw) {
    return {
      items: [],
      total: 0,
      page,
      size,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    };
  }
  // 新版判断：同时具备 items 与 total 字段
  if (typeof raw === 'object' && raw !== null && 'items' in raw && 'total' in raw) {
    const cast = raw as { items: unknown; total: unknown } & PageResponse<T>;
    if (Array.isArray(cast.items) && typeof cast.total === 'number') {
      return cast as PageResponse<T>;
    }
  }
  // 旧版：直接数组
  if (Array.isArray(raw)) {
    const total = raw.length;
    return {
      items: raw as T[],
      total,
      page,
      size,
      totalPages: total === 0 ? 0 : 1,
      hasNext: false,
      hasPrevious: false,
    };
  }
  // 非预期结构：尝试从对象中寻找数组字段
  if (typeof raw === 'object' && raw !== null) {
    const rawObj = raw as Record<string, unknown>;
    const arrKey = Object.keys(rawObj).find((k) => Array.isArray(rawObj[k]));
    if (arrKey) {
      const items = rawObj[arrKey] as T[];
      return {
        items,
        total: items.length,
        page,
        size,
        totalPages: items.length === 0 ? 0 : 1,
        hasNext: false,
        hasPrevious: false,
      };
    }
  }
  // 兜底：视为空
  return {
    items: [],
    total: 0,
    page,
    size,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  };
}

/**
 * 将数字型 change_percent 格式化为带符号百分比字符串。
 * 后端若返回数值：25 -> +25%
 * -10.5 -> -10.5%
 * 若原始为字符串且已包含 %，则保持原样。
 */
export function formatPercent(val: number | string | undefined | null): string | undefined {
  if (val == null) return undefined;
  if (typeof val === 'string') {
    // 已经是字符串，若包含 % 直接返回，否则尝试补 %
    return val.includes('%') ? val : `${val}%`;
  }
  const sign = val > 0 ? '+' : val < 0 ? '' : '';
  // 保留最多两位小数，但去掉无意义的 .00
  const fixed = Math.abs(val) % 1 === 0 ? Math.abs(val).toString() : Math.abs(val).toFixed(2);
  return `${sign}${fixed}%`;
}
