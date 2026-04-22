import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

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
      } catch (err: any) {
        console.error('Failed to join group', err);
        if (err.response?.status === 401) {
          // Not logged in, redirect to login and save intended destination
          localStorage.setItem('redirectAfterLogin', `/groups/${id}/join`);
          navigate('/');
        } else {
          setError(err.response?.data?.Error || 'Nie udało się dołączyć do grupy. Być może link jest nieprawidłowy.');
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
      <div className="min-h-screen bg-background flex justify-center items-center text-on-surface">
        Dołączanie do grupy...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 text-center">
      <h1 className="font-headline font-extrabold text-error text-3xl mb-4">Błąd</h1>
      <p className="text-on-surface-variant mb-8">{error}</p>
      <button 
        onClick={() => navigate('/dashboard')}
        className="px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary-container transition-colors"
      >
        Wróć do Dashboardu
      </button>
    </div>
  );
};

export default JoinGroup;
