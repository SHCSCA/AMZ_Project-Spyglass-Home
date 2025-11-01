import { describe, it, expect } from 'vitest';
import { apiRequest } from '../api/client';

// 这里只是示例：实际测试需要后端或 mock fetch。

describe('apiRequest', () => {
  it('throws on non-ok response', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({ ok: false, status: 500, text: async () => 'err' }) as any;
    await expect(apiRequest('/test')).rejects.toThrow(/500/);
    global.fetch = originalFetch;
  });

  it('returns json on ok', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({ ok: true, json: async () => ({ a: 1 }) }) as any;
    const res = await apiRequest<{ a: number }>('/ok');
    expect(res.a).toBe(1);
    global.fetch = originalFetch;
  });
});
