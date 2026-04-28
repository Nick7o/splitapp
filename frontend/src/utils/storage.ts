import type { ApiUser } from '../types/api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const REDIRECT_KEY = 'redirectAfterLogin';
const RECENT_CURRENCIES_KEY = 'splitapp:recent-currencies';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const setAuthSession = (token: string, user: ApiUser): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): Partial<ApiUser> => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as Partial<ApiUser> : {};
  } catch {
    return {};
  }
};

export const setStoredUser = (user: ApiUser): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getRedirectAfterLogin = (): string | null => localStorage.getItem(REDIRECT_KEY);

export const setRedirectAfterLogin = (path: string): void => {
  localStorage.setItem(REDIRECT_KEY, path);
};

export const clearRedirectAfterLogin = (): void => {
  localStorage.removeItem(REDIRECT_KEY);
};

export const getRecentCurrencies = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_CURRENCIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string').slice(0, 5)
      : [];
  } catch {
    return [];
  }
};

export const pushRecentCurrency = (currency: string): string[] => {
  const updated = [currency, ...getRecentCurrencies().filter((item) => item !== currency)].slice(0, 5);
  localStorage.setItem(RECENT_CURRENCIES_KEY, JSON.stringify(updated));
  return updated;
};
