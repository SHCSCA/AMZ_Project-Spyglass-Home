import { describe, it, expect } from 'vitest';
import { mapAlertLog } from '../api/mappers';
import { AlertLogResponse } from '../types';

function mockAlert(partial: Partial<AlertLogResponse>): AlertLogResponse {
  return {
    id: 1,
    asinId: 99,
    asinCode: 'TESTASIN',
    site: 'US',
    alertType: 'PRICE_CHANGE',
    severity: 'INFO',
    alertAt: '2025-11-11T00:00:00.000Z',
    oldValue: '19.99',
    newValue: '17.99',
    changePercent: '-10%',
    refId: 0,
    contextJson: '',
    message: undefined,
    ...partial,
  } as AlertLogResponse;
}

describe('mapAlertLog 中文映射', () => {
  it('价格变动构造中文描述', () => {
    const r = mockAlert({ alertType: 'PRICE_CHANGE' });
    const item = mapAlertLog(r);
    expect(item.message).toContain('价格从');
    expect(item.message).toContain('19.99');
    expect(item.message).toContain('17.99');
  });

  it('库存阈值提示', () => {
    const r = mockAlert({ alertType: 'INVENTORY_THRESHOLD', oldValue: '10', newValue: '5' });
    const item = mapAlertLog(r);
    expect(item.message).toContain('库存');
    expect(item.message).toContain('低于阈值');
  });

  it('后端已有 message 优先使用', () => {
    const r = mockAlert({ alertType: 'TITLE', message: '自定义后端消息' });
    const item = mapAlertLog(r);
    expect(item.message).toBe('自定义后端消息');
  });

  it('未知类型回退原始类型名', () => {
    const r = mockAlert({ alertType: 'UNKNOWN_TYPE', oldValue: 'A', newValue: 'B' });
    const item = mapAlertLog(r);
    expect(item.message).toContain('UNKNOWN_TYPE');
  });
});
