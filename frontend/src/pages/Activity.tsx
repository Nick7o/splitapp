import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../components/AppLayout';
import ActivityRow, { type ActivityLog } from '../components/ActivityRow';
import api from '../api';
import { formatDate } from '../utils/date';
import { getActivityMeta } from '../data/activityTypes';

interface UserActivityLog extends ActivityLog {
  groupId: string;
  groupName: string;
}

const PAGE_SIZE = 50;
type ActivityFilter = 'all' | 'expenses' | 'payments' | 'changes';

const getDayKey = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toISOString().slice(0, 10);
};

const getDayLabel = (dayKey: string, t: (key: string) => string): string => {
  const date = new Date(`${dayKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dayKey;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((todayStart.getTime() - dateStart.getTime()) / 86_400_000);

  if (diffDays === 0) return t('activity.today');
  if (diffDays === 1) return t('activity.yesterday');

  return formatDate(date.toISOString(), { day: '2-digit', month: 'short', year: 'numeric' });
};

const ActivitySkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="flex animate-pulse items-start gap-4">
        <div className="h-10 w-10 shrink-0 rounded-full bg-white/10" />
        <div className="app-card w-full p-4">
          <div className="mb-3 h-4 w-1/3 rounded bg-white/10" />
          <div className="mb-2 h-3 w-2/3 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/10" />
        </div>
      </div>
    ))}
  </div>
);

const Activity: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<UserActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'expenses' && item.activityType.startsWith('expense.')) ||
        (filter === 'payments' && item.activityType.startsWith('payment.')) ||
        (filter === 'changes' && (item.activityType.endsWith('.updated') || item.activityType.endsWith('.deleted') || item.activityType.endsWith('.voided')));

      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;

      const meta = getActivityMeta(item.activityType);
      const searchable = [
        item.userName,
        item.groupName,
        item.content,
        t(meta.labelKey),
        ...Object.values(item.memberNames ?? {}),
      ].join(' ').toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [filter, items, query, t]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce<Record<string, UserActivityLog[]>>((groups, item) => {
      const key = getDayKey(item.createdAt);
      groups[key] = [...(groups[key] ?? []), item];
      return groups;
    }, {});
  }, [filteredItems]);

  const loadActivity = useCallback(async (skip: number) => {
    if (skip === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    setError(null);

    try {
      const response = await api.get<UserActivityLog[]>('/activity', {
        params: { skip, take: PAGE_SIZE }
      });
      setItems((current) => (skip === 0 ? response.data : [...current, ...response.data]));
      setSkip(skip + response.data.length);
      setHasMore(response.data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Failed to fetch activity', err);
      setError(t('activity.loadFailed'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [t]);

  useEffect(() => {
    loadActivity(0);
  }, [loadActivity]);

  return (
    <AppLayout title={t('activity.title')}>
      <div className="space-y-6">
        <section className="app-card p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <label className="relative block">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">search</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('activity.searchPlaceholder')}
                className="app-input py-2.5 pl-10"
              />
            </label>

            <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-surface-container-lowest p-1">
              {(['all', 'expenses', 'payments', 'changes'] as ActivityFilter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-lg px-2 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 ${
                    filter === option
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                  }`}
                >
                  {t(`activity.filters.${option}`)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <div className="flex flex-col gap-3 rounded-xl border border-error/40 bg-error/10 p-4 text-error sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">{error}</p>
            <button type="button" className="app-button-secondary py-2" onClick={() => loadActivity(0)}>
              {t('common.retry')}
            </button>
          </div>
        )}

        {loading ? (
          <ActivitySkeleton />
        ) : items.length === 0 ? (
          <div className="app-card py-16 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-6xl mb-4 opacity-50">notifications_off</span>
          <p className="font-headline text-xl">{t('activity.emptyTitle')}</p>
          <p className="text-sm mt-2">{t('activity.emptyBody')}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="app-card py-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined mb-4 text-5xl opacity-50">search_off</span>
            <p className="font-headline text-xl">{t('activity.noResultsTitle')}</p>
            <p className="mt-2 text-sm">{t('activity.noResultsBody')}</p>
          </div>
        ) : (
          <>
            <div className="space-y-8">
              {Object.entries(groupedItems).map(([dayKey, dayItems]) => (
                <section key={dayKey} className="space-y-4">
                  <h2 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    {getDayLabel(dayKey, t)}
                  </h2>
                  <div className="relative space-y-4 before:absolute before:bottom-0 before:left-5 before:top-0 before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-outline-variant/30 before:to-transparent">
                    {dayItems.map((item) => (
                      <ActivityRow
                        key={item.id}
                        log={item}
                        memberNames={item.memberNames}
                        group={{ id: item.groupId, name: item.groupName }}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center">
                <button
                  type="button"
                  className="app-button-secondary"
                  onClick={() => loadActivity(skip)}
                  disabled={loadingMore}
                >
                  <span className="material-symbols-outlined">expand_more</span>
                  {loadingMore ? t('common.loading') : t('activity.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Activity;
