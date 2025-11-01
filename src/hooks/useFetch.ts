import { useEffect, useState } from 'react';

export function useFetch<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e : new Error('未知错误'));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, reload: () => fn().then(setData).catch(setError) };
}
