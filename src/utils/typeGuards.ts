/**
 * 类型守卫与常用判空工具集合。
 * 通过显式类型缩小提高代码可靠性与可读性。
 */

export function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

export function isNumber(val: unknown): val is number {
  return typeof val === 'number' && !Number.isNaN(val);
}

export function isPositiveInt(val: unknown): val is number {
  return isNumber(val) && Number.isInteger(val) && val >= 0;
}

export function isArray<T = unknown>(val: unknown): val is T[] {
  return Array.isArray(val);
}

export function hasKeys<T extends object>(obj: unknown, keys: (keyof T)[]): obj is T {
  if (typeof obj !== 'object' || obj === null) return false;
  return keys.every((k) => k in (obj as any));
}
