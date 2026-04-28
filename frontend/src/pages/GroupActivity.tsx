import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import ActivityRow, { type ActivityLog } from '../components/ActivityRow';
import AppLayout from '../components/AppLayout';

interface GroupMember {
  id: string;
  name: string;
}

interface GroupDetails {
  members?: GroupMember[];
}

const PAGE_SIZE = 50;

const GroupActivity: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const [activityResponse, groupResponse] = await Promise.all([
          api.get<ActivityLog[]>(`/groups/${id}/activity`, {
            params: { skip: 0, take: PAGE_SIZE }
          }),
          api.get<GroupDetails>(`/groups/${id}`)
        ]);
        setLogs(activityResponse.data);
        setSkip(activityResponse.data.length);
        setHasMore(activityResponse.data.length === PAGE_SIZE);
        setMemberNames(Object.fromEntries((groupResponse.data.members ?? []).map((member) => [member.id, member.name])));
      } catch (error) {
        console.error('Failed to fetch activity', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchActivity();
    }
  }, [id]);

  const loadMore = async () => {
    if (!id || loadingMore) return;

    setLoadingMore(true);
    try {
      const response = await api.get<ActivityLog[]>(`/groups/${id}/activity`, {
        params: { skip, take: PAGE_SIZE }
      });
      setLogs((current) => [...current, ...response.data]);
      setSkip((current) => current + response.data.length);
      setHasMore(response.data.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load more activity', error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <AppLayout title={t('groupActivity.title')} backTo={`/groups/${id}`}>
        {loading ? (
          <div className="text-center py-10 text-on-surface-variant">{t('common.loading')}</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">history</span>
            <p className="font-headline text-xl">{t('groupActivity.emptyTitle')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative space-y-4 before:absolute before:bottom-0 before:left-5 before:top-0 before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-outline-variant/30 before:to-transparent">
              {logs.map((log) => (
                <ActivityRow key={log.id} log={log} memberNames={log.memberNames ?? memberNames} />
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
    </AppLayout>
  );
};

export default GroupActivity;
