import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import ActivityRow, { type ActivityLog } from '../components/ActivityRow';
import AppLayout from '../components/AppLayout';
import { getActivityMeta } from '../data/activityTypes';
import { formatDate } from '../utils/date';
import type { MemberProfile } from '../components/MemberProfileDialog';
import type { ApiGroupDetails } from '../types/api';

const PAGE_SIZE = 50;
type ActivityFilter = 'all' | 'expenses' | 'payments' | 'changes';

const ActivitySkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="flex animate-pulse items-start gap-4">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-white/10" />
        <div className="app-card w-full p-4">
          <div className="mb-3 h-4 w-1/3 rounded bg-white/10" />
          <div className="mb-2 h-3 w-2/3 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/10" />
        </div>
      </div>
    ))}
  </div>
);

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

const GroupActivity: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [memberProfiles, setMemberProfiles] = useState<Record<string, MemberProfile>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'expenses' && log.activityType.startsWith('expense.')) ||
        (filter === 'payments' && log.activityType.startsWith('payment.')) ||
        (filter === 'changes' && (log.activityType.endsWith('.updated') || log.activityType.endsWith('.deleted') || log.activityType.endsWith('.voided')));

      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;

      const meta = getActivityMeta(log.activityType);
      const searchable = [
        log.userName,
        log.content,
        t(meta.labelKey),
        ...Object.values(log.memberNames ?? memberNames),
      ].join(' ').toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [filter, logs, memberNames, query, t]);

  const groupedLogs = useMemo(() => {
    return filteredLogs.reduce<Record<string, ActivityLog[]>>((groups, log) => {
      const key = getDayKey(log.createdAt);
      groups[key] = [...(groups[key] ?? []), log];
      return groups;
    }, {});
  }, [filteredLogs]);

  const fetchActivity = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const [activityResponse, groupResponse] = await Promise.all([
        api.get<ActivityLog[]>(`/groups/${id}/activity`, {
          params: { skip: 0, take: PAGE_SIZE }
        }),
        api.get<ApiGroupDetails>(`/groups/${id}`)
      ]);
      setLogs(activityResponse.data);
      setSkip(activityResponse.data.length);
      setHasMore(activityResponse.data.length === PAGE_SIZE);
      setMemberNames(Object.fromEntries((groupResponse.data.members ?? []).map((member) => [member.id, member.name])));
      setMemberProfiles(Object.fromEntries((groupResponse.data.members ?? []).map((member) => [member.id, member])));
    } catch (error) {
      console.error('Failed to fetch activity', error);
      setError(t('activity.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void fetchActivity();
  }, [fetchActivity]);

  const loadMore = async () => {
    if (!id || loadingMore) return;

    setLoadingMore(true);
    setError(null);
    try {
      const response = await api.get<ActivityLog[]>(`/groups/${id}/activity`, {
        params: { skip, take: PAGE_SIZE }
      });
      setLogs((current) => [...current, ...response.data]);
      setSkip((current) => current + response.data.length);
      setHasMore(response.data.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load more activity', error);
      setError(t('activity.loadFailed'));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <AppLayout title={t('groupActivity.title')} backTo={`/groups/${id}`}>
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

            <div className="flex overflow-x-auto rounded-xl border border-white/10 bg-surface-container-lowest p-1 no-scrollbar">
              {(['all', 'expenses', 'payments', 'changes'] as ActivityFilter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`min-w-[5rem] rounded-lg px-3 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 ${
                    filter === option
                      ? 'bg-primary text-on-primary shadow-lg shadow-primary/15'
                      : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                  }`}
                >
                  {t(`activity.filters.${option}`)}
                </button>
              ))}
            </div>
          </div>
          {!loading && logs.length > 0 ? (
            <p className="mt-3 text-xs font-semibold text-on-surface-variant">
              {t('activity.resultSummary', { shown: filteredLogs.length, total: logs.length })}
            </p>
          ) : null}
        </section>

        {error && (
          <div className="flex flex-col gap-3 rounded-xl border border-error/40 bg-error/10 p-4 text-error sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">{error}</p>
            <button type="button" className="app-button-secondary py-2" onClick={() => fetchActivity()}>
              {t('common.retry')}
            </button>
          </div>
        )}

        {loading ? (
          <ActivitySkeleton />
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-surface-container-lowest/70 px-5 py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined mb-4 text-6xl opacity-50">history</span>
            <p className="font-headline text-xl text-on-surface">{t('groupActivity.emptyTitle')}</p>
            <p className="mt-2 text-sm">{t('activity.emptyBody')}</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-surface-container-lowest/70 px-5 py-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined mb-4 text-5xl opacity-50">search_off</span>
            <p className="font-headline text-xl text-on-surface">{t('activity.noResultsTitle')}</p>
            <p className="mt-2 text-sm">{t('activity.noResultsBody')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-8">
              {Object.entries(groupedLogs).map(([dayKey, dayLogs]) => (
                <section key={dayKey} className="space-y-4">
                  <h2 className="font-label text-xs font-bold uppercase tracking-normal text-on-surface-variant">
                    {getDayLabel(dayKey, t)}
                  </h2>
                  <div className="relative space-y-4 before:absolute before:bottom-0 before:left-5 before:top-0 before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-outline-variant/30 before:to-transparent">
                    {dayLogs.map((log) => (
                      <ActivityRow key={log.id} log={log} memberNames={log.memberNames ?? memberNames} memberProfiles={log.memberProfiles ?? memberProfiles} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {hasMore ? (
              <div className="flex justify-center">
                <button type="button" className="app-button-secondary" onClick={loadMore} disabled={loadingMore}>
                  <span className="material-symbols-outlined">expand_more</span>
                  {loadingMore ? t('common.loading') : t('activity.loadMore')}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default GroupActivity;
