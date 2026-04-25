import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import AppLayout from '../components/AppLayout';

interface ActivityLog {
  id: string;
  content: string;
  createdAt: string;
  userName: string;
}

const GroupActivity: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await api.get(`/groups/${id}/activity`);
        setLogs(response.data);
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

  return (
    <AppLayout title="History" backTo={`/groups/${id}`}>
        {loading ? (
          <div className="text-center py-10 text-on-surface-variant">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">history</span>
            <p className="font-headline text-xl">No history yet.</p>
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant/30 before:to-transparent">
            {logs.map((log) => (
              <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-surface-container-highest text-secondary shadow md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <span className="material-symbols-outlined text-sm">history</span>
                </div>
                <div className="app-card w-[calc(100%-4rem)] p-4 md:w-[calc(50%-2.5rem)]">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-on-surface">{log.userName}</div>
                    <time className="font-label text-xs text-on-surface-variant">{new Date(log.createdAt).toLocaleString()}</time>
                  </div>
                  <div className="text-on-surface-variant">{log.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}
    </AppLayout>
  );
};

export default GroupActivity;
