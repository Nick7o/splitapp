import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <AppLayout title="Profile" maxWidthClassName="max-w-md">
        <div className="app-card-strong mb-8 p-6 text-center sm:p-8">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary text-4xl font-bold text-on-primary shadow-lg shadow-primary/20">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h2 className="font-headline text-2xl font-bold">{user.name}</h2>
          <p className="text-on-surface-variant mt-1">{user.email}</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-error/20 bg-error/10 px-6 py-4 font-body text-base font-bold text-error transition-colors hover:bg-error/20 focus:outline-none focus:ring-2 focus:ring-error/60 focus:ring-offset-2 focus:ring-offset-background"
          >
            <span className="material-symbols-outlined">logout</span>
            Log out
          </button>
        </div>
    </AppLayout>
  );
};

export default Profile;
