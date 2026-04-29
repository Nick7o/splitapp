import { describe, expect, it } from 'vitest';
import {
  clearAuthSession,
  clearRedirectAfterLogin,
  getRecentCurrencies,
  getRedirectAfterLogin,
  getStoredUser,
  getToken,
  pushRecentCurrency,
  setAuthSession,
  setRedirectAfterLogin,
  setStoredUser,
} from './storage';

describe('storage helpers', () => {
  it('stores and clears auth session consistently', () => {
    setAuthSession('jwt-token', { id: 'u1', name: 'Ada', email: 'ada@example.com' });

    expect(getToken()).toBe('jwt-token');
    expect(getStoredUser()).toEqual({ id: 'u1', name: 'Ada', email: 'ada@example.com' });

    setStoredUser({ id: 'u2', name: 'Grace', email: 'grace@example.com', hasPassword: true });
    expect(getStoredUser()).toMatchObject({ id: 'u2', hasPassword: true });

    clearAuthSession();
    expect(getToken()).toBeNull();
    expect(getStoredUser()).toEqual({});
  });

  it('stores redirect path separately from auth state', () => {
    setRedirectAfterLogin('/groups/123');
    expect(getRedirectAfterLogin()).toBe('/groups/123');

    clearRedirectAfterLogin();
    expect(getRedirectAfterLogin()).toBeNull();
  });

  it('keeps recent currencies unique and capped', () => {
    ['PLN', 'EUR', 'USD', 'GBP', 'CHF', 'EUR'].forEach(pushRecentCurrency);

    expect(getRecentCurrencies()).toEqual(['EUR', 'CHF', 'GBP', 'USD', 'PLN']);
  });

  it('handles corrupted persisted JSON defensively', () => {
    localStorage.setItem('user', '{bad json');
    localStorage.setItem('splitapp:recent-currencies', '{"not":"an array"}');

    expect(getStoredUser()).toEqual({});
    expect(getRecentCurrencies()).toEqual([]);
  });
});
