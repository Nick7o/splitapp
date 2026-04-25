import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import AppLayout from '../components/AppLayout';

interface ApiError {
  response?: {
    status?: number;
    data?: {
      Error?: string;
    };
  };
}

const JoinGroup: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
          // Not logged in, redirect to login and save intended destination
          localStorage.setItem('redirectAfterLogin', `/groups/${id}/join`);
          navigate('/');
        } else {
          setError(apiError.response?.data?.Error || 'Failed to join group. The invite link may be invalid.');
          setLoading(false);
        }
      }
    };

    if (id) {
      joinGroup();
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <AppLayout title="Joining group" maxWidthClassName="max-w-md">
        <div className="py-20 text-center text-on-surface-variant">
          Joining group...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Error" maxWidthClassName="max-w-md">
      <div className="app-card p-6 py-12 text-center">
      <h1 className="mb-4 font-headline text-3xl font-extrabold text-error">Error</h1>
      <p className="mb-8 text-on-surface-variant">{error}</p>
      <button 
        onClick={() => navigate('/dashboard')}
        className="app-button-primary"
      >
        Back to Dashboard
      </button>
      </div>
    </AppLayout>
  );
};

export default JoinGroup;
