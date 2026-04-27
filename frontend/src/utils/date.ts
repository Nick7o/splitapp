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
