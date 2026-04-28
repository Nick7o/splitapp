import type { TFunction } from 'i18next';
import type { ApiProblemDetails } from '../types/api';

interface ErrorLike {
  response?: {
    data?: ApiProblemDetails & { Error?: string };
  };
}

export const getApiErrorMessage = (error: unknown, t: TFunction, fallbackKey = 'common.error'): string => {
  const apiError = error as ErrorLike;
  const data = apiError.response?.data;
  const code = data?.code;

  if (code) {
    const translated = t(`apiErrors.${code}`, { defaultValue: '' });
    if (translated) return translated;
  }

  return data?.detail || data?.Error || t(fallbackKey);
};
