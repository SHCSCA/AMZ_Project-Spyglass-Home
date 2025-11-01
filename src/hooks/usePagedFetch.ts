import { useState } from 'react';
import { useFetch } from './useFetch';

/**
 * 通用分页数据获取 Hook
 * @param build (page0Based:number) => Promise<PageResponse<T>> 的函数
 * @param deps 触发重新加载的依赖（除 page 外）
 */
export function usePagedFetch<T>(build: (page: number) => Promise<any>, deps: any[], pageSize = 20) {
  const [page, setPage] = useState(1); // UI 1-based
  const { data, loading, error, reload } = useFetch(() => build(page - 1), [page, ...deps]);
  return {
    page,
    setPage,
    pageSize,
    data,
    loading,
    error,
    reload,
    items: data?.items || [],
    total: data?.total || 0,
  } as const;
}