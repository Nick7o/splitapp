import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import SettleUp from '../components/SettleUp';
import AppLayout from '../components/AppLayout';

interface User {
  id: string;
  name: string;
  email: string;
}

interface DebtTransfer {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

interface GroupDetails {
  id: string;
  name: string;
  currency: string;
  members: User[];
  optimizedDebts: DebtTransfer[];
}

const SettleUpPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const response = await api.get(`/groups/${id}`);
        setGroup(response.data);
      } catch (error) {
        console.error('Failed to fetch group details', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGroupDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <AppLayout title="Settlements" backTo={`/groups/${id}`}>
        <div className="py-20 text-center text-on-surface-variant">Loading...</div>
      </AppLayout>
    );
  }

  if (!group) {
    return (
      <AppLayout title="Settlements" backTo={`/groups/${id}`}>
        <div className="py-20 text-center text-error">Group not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Settlements" backTo={`/groups/${id}`}>
      <SettleUp groupId={id || ''} debts={group.optimizedDebts || []} members={group.members} currency={group.currency} />
    </AppLayout>
  );
};

export default SettleUpPage;
