import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { getApiErrorMessage } from './apiError';

const t = ((key: string, options?: { defaultValue?: string }) => {
  const translations: Record<string, string> = {
    'apiErrors.group.notMember': 'You are not in this group.',
    'common.error': 'Something went wrong',
    'fallback.key': 'Fallback message',
  };

  return translations[key] ?? options?.defaultValue ?? key;
}) as TFunction;

describe('getApiErrorMessage', () => {
  it('translates stable problem details codes', () => {
    const message = getApiErrorMessage(
      { response: { data: { code: 'group.notMember', detail: 'group.notMember' } } },
      t,
    );

    expect(message).toBe('You are not in this group.');
  });

  it('uses problem detail when code has no translation', () => {
    const message = getApiErrorMessage(
      { response: { data: { code: 'new.code', detail: 'Human readable detail' } } },
      t,
      'fallback.key',
    );

    expect(message).toBe('Human readable detail');
  });

  it('falls back to provided locale key for unknown errors', () => {
    expect(getApiErrorMessage(new Error('network'), t, 'fallback.key')).toBe('Fallback message');
  });
});
