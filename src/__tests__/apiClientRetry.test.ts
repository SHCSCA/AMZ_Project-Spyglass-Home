import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiRequest } from '../api/client';

// 通过 mock fetch 验证重试逻辑（模拟前2次失败，第3次成功）
describe('apiRequest 重试与超时', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('在 2 次失败后成功返回数据', async () => {
    let call = 0;
    // @ts-ignore
    global.fetch = vi.fn(async () => {
      call++;
      if (call < 3) {
        return new Response('server error', { status: 500 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const data = await apiRequest('/echo', { retry: 2 });
    expect(data).toEqual({ ok: true });
    expect(call).toBe(3); // 两次失败 + 一次成功
  });

  it('超时触发 AbortError', async () => {
    // 使用不会完成的 Promise 模拟长时间连接，AbortController 应在 timeout 后中断。
    // @ts-ignore
    global.fetch = vi.fn((url, init: any) => new Promise((_resolve, _reject) => {
      if (init?.signal) {
        init.signal.addEventListener('abort', () => {
          _reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
        });
      }
    }));
    await expect(apiRequest('/timeout', { timeoutMs: 30, retry: 0 })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
