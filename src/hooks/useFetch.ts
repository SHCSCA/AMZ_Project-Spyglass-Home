import { useEffect, useState, useRef } from 'react';

/**
 * 通用数据获取 Hook：
 * - 支持组件卸载安全性（active 标记）
 * - 每次依赖变化自动触发调用
 * - reload 方法可手动刷新（不会更改依赖数组）
 */
export function useFetch<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn; // 若 fn 创建了闭包，可保证最新引用

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fnRef.current()
      .then((d) => { if (active) setData(d); })
      .catch((e) => { if (active) setError(e instanceof Error ? e : new Error('未知错误')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const reload = () => fnRef.current().then(setData).catch(setError);
  return { data, loading, error, reload };
}
