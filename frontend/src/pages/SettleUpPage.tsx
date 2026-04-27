import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import SettleUp from '../components/SettleUp';
import AppLayout from '../components/AppLayout';

interface User {
  id: string;
  name: string;
  email: string;
  avatarKey?: string | null;
}

interface DebtTransfer {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

interface GroupDetails {
  id: string;
  name: string;
  members: User[];
  optimizedDebts: DebtTransfer[];
  optimizedDebtsByCurrency?: Record<string, DebtTransfer[]>;
  OptimizedDebtsByCurrency?: Record<string, DebtTransfer[]>;
}

const SettleUpPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGroupDetails = useCallback(async () => {
    if (!id) return;

    try {
      const response = await api.get(`/groups/${id}`);
      setGroup({
        ...response.data,
        optimizedDebtsByCurrency: response.data.optimizedDebtsByCurrency ?? response.data.OptimizedDebtsByCurrency ?? {}
      });
    } catch (error) {
      console.error('Failed to fetch group details', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  if (loading) {
    return (
      <AppLayout title={t('settleUp.title')} backTo={`/groups/${id}`}>
        <div className="py-20 text-center text-on-surface-variant">{t('common.loading')}</div>
      </AppLayout>
    );
  }

  if (!group) {
    return (
      <AppLayout title={t('settleUp.title')} backTo={`/groups/${id}`}>
        <div className="py-20 text-center text-error">{t('groupDetails.notFound')}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t('settleUp.title')} backTo={`/groups/${id}`}>
      <SettleUp
        groupId={id || ''}
        debtsByCurrency={group.optimizedDebtsByCurrency || {}}
        members={group.members}
        onChanged={fetchGroupDetails}
      />
    </AppLayout>
  );
};

export default SettleUpPage;
