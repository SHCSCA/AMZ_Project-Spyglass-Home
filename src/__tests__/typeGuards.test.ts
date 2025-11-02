import { describe, it, expect } from 'vitest';
import { isNonEmptyString, isNumber, isPositiveInt, isArray, hasKeys } from '../utils/typeGuards';

describe('typeGuards', () => {
  it('isNonEmptyString', () => {
    expect(isNonEmptyString('abc')).toBe(true);
    expect(isNonEmptyString('   ')).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
  });
  it('isNumber & isPositiveInt', () => {
    expect(isNumber(1.2)).toBe(true);
    expect(isNumber(NaN)).toBe(false);
    expect(isPositiveInt(5)).toBe(true);
    expect(isPositiveInt(-1)).toBe(false);
  });
  it('isArray', () => {
    expect(isArray([])).toBe(true);
    expect(isArray({})).toBe(false);
  });
  it('hasKeys', () => {
    expect(hasKeys<{ a: number; b: string }>({ a: 1, b: 'x' }, ['a', 'b'])).toBe(true);
    expect(hasKeys<{ a: number; b: string }>({ a: 1 }, ['a', 'b'])).toBe(false);
  });
});