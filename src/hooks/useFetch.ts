import { useEffect, useState, useRef } from 'react';

/**
 * 通用数据获取 Hook：
 * - 支持组件卸载安全性（mountedRef 标记）
 * - 每次依赖变化自动触发调用
 * - reload 方法可手动刷新（不会更改依赖数组）
 */
export function useFetch<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fnRef = useRef(fn);
  const mountedRef = useRef(true);

  fnRef.current = fn; // 若 fn 创建了闭包，可保证最新引用

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    fnRef
      .current()
      .then((d) => {
        if (active && mountedRef.current) setData(d);
      })
      .catch((e) => {
        if (active && mountedRef.current) setError(e instanceof Error ? e : new Error('未知错误'));
      })
      .finally(() => {
        if (active && mountedRef.current) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, deps);

  const reload = () => {
    if (!mountedRef.current) {
      return Promise.reject(new Error('Component unmounted'));
    }
    
    setLoading(true);
    setError(null);
    return fnRef
      .current()
      .then((d) => {
        if (mountedRef.current) setData(d);
        return d;
      })
      .catch((e) => {
        if (mountedRef.current) setError(e instanceof Error ? e : new Error('未知错误'));
        throw e;
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  };
  return { data, loading, error, reload };
}
