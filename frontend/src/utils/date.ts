import i18n from '../i18n';

export const formatDate = (iso: string, opts?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat(i18n.language, opts).format(date);
};

export const formatDateTime = (iso: string): string =>
  formatDate(iso, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export const formatRelativeTime = (iso: string, fallback: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.345, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' },
  ];

  const formatter = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' });
  let duration = diffSeconds;

  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }

    duration /= division.amount;
  }

  return fallback;
};
