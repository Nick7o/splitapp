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
        <div className="app-card-strong px-6 py-12 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-fixed/25 bg-primary/12 text-primary-fixed">
            <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{t('joinGroup.joining')}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t('common.errorTitle')} maxWidthClassName="max-w-md">
      <div className="app-card-strong px-6 py-12 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-error/25 bg-error/10 text-error">
          <span className="material-symbols-outlined" aria-hidden="true">link_off</span>
        </div>
        <h1 className="mb-3 font-headline text-3xl font-extrabold text-on-surface">{t('common.errorTitle')}</h1>
        <p className="mb-8 text-sm font-medium leading-relaxed text-on-surface-variant">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="app-button-primary"
        >
          <span className="material-symbols-outlined" aria-hidden="true">dashboard</span>
          {t('joinGroup.backToDashboard')}
        </button>
      </div>
    </AppLayout>
  );
};

export default JoinGroup;
