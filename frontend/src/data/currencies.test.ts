import { describe, expect, it } from 'vitest';
import { CURRENCY_BY_CODE, formatMoney } from './currencies';

describe('currency data', () => {
  it('indexes supported currencies by ISO code', () => {
    expect(CURRENCY_BY_CODE.PLN).toMatchObject({ code: 'PLN', name: 'Polish Zloty' });
    expect(CURRENCY_BY_CODE.EUR.symbol).toBe('€');
  });

  it('formats money with locale-aware Intl output', () => {
    expect(formatMoney(1234.5, 'PLN', 'en-US')).toContain('PLN');
    expect(formatMoney(12, 'INVALID', 'en-US')).toBe('12.00 INVALID');
  });
});
