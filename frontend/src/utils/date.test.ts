import { describe, expect, it, vi } from 'vitest';
import { formatDate, formatRelativeTime } from './date';

describe('date helpers', () => {
  it('returns original value for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
    expect(formatRelativeTime('not-a-date', 'no activity yet')).toBe('no activity yet');
  });

  it('formats relative time against current clock', () => {
    vi.setSystemTime(new Date('2026-04-28T12:00:00.000Z'));

    expect(formatRelativeTime('2026-04-28T11:59:00.000Z', 'fallback')).toBe('1 minute ago');
    expect(formatRelativeTime('2026-04-29T12:00:00.000Z', 'fallback')).toBe('tomorrow');
  });
});
