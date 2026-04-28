import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import AppLayout from '../components/AppLayout';
import type { ApiProblemDetails } from '../types/api';
import { getApiErrorMessage } from '../utils/apiError';
import { setRedirectAfterLogin } from '../utils/storage';

interface ApiError {
  response?: {
    status?: number;
    data?: ApiProblemDetails;
  };
}

const JoinGroup: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const joinGroup = async () => {
      try {
        await api.post(`/groups/${id}/join`);
        navigate(`/groups/${id}`);
      } catch (err: unknown) {
        console.error('Failed to join group', err);
        const apiError = err as ApiError;
        if (apiError.response?.status === 401) {
          setRedirectAfterLogin(`/groups/${id}/join`);
          navigate('/');
        } else {
          setError(getApiErrorMessage(err, t, 'joinGroup.failed'));
          setLoading(false);
        }
      }
    };

    if (id) {
      joinGroup();
    }
  }, [id, navigate, t]);

  if (loading) {
    return (
      <AppLayout title={t('joinGroup.joiningTitle')} maxWidthClassName="max-w-md">
        <div className="py-20 text-center text-on-surface-variant">
          {t('joinGroup.joining')}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t('common.errorTitle')} maxWidthClassName="max-w-md">
      <div className="app-card p-6 py-12 text-center">
      <h1 className="mb-4 font-headline text-3xl font-extrabold text-error">{t('common.errorTitle')}</h1>
      <p className="mb-8 text-on-surface-variant">{error}</p>
      <button 
        onClick={() => navigate('/dashboard')}
        className="app-button-primary"
      >
        {t('joinGroup.backToDashboard')}
      </button>
      </div>
    </AppLayout>
  );
};

export default JoinGroup;
