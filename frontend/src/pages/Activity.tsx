import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../components/AppLayout';
import ActivityRow, { type ActivityLog } from '../components/ActivityRow';
import api from '../api';
import { formatDate } from '../utils/date';

interface UserActivityLog extends ActivityLog {
  groupId: string;
  groupName: string;
}

const PAGE_SIZE = 50;

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

  const groupedItems = useMemo(() => {
    return items.reduce<Record<string, UserActivityLog[]>>((groups, item) => {
      const key = getDayKey(item.createdAt);
      groups[key] = [...(groups[key] ?? []), item];
      return groups;
    }, {});
  }, [items]);

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
