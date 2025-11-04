import { useState } from 'react';
import { useFetch } from './useFetch';

/**
 * 分页数据获取 Hook：
 * - 统一维护当前页 (UI 1-based) 与 pageSize
 * - 内部自动将页码转换为后端 0-based
 * - 返回 items/total 便于直接解构使用
 */
export function usePagedFetch<T = unknown>(
  build: (page: number) => Promise<{ items?: T[]; total?: number }>,
  deps: unknown[],
  pageSize = 20
) {
  const [page, setPage] = useState(1); // UI 使用 1 起始更符合直觉
  const { data, loading, error, reload } = useFetch(() => build(page - 1), [page, ...deps]);

  return {
    page,
    setPage,
    pageSize,
    data,
    loading,
    error,
    reload,
    items: (data?.items || []) as T[],
    total: data?.total || 0,
  } as const;
}
