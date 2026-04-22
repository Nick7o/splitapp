import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="text-on-surface antialiased min-h-screen bg-background pb-32">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-sm border-b border-white/5">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-screen-xl mx-auto">
          <h1 className="font-headline font-bold text-on-surface text-2xl tracking-wide">Profil</h1>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-screen-xl mx-auto max-w-md">
        <div className="glass-panel p-8 rounded-3xl text-center mb-8">
          <div className="w-24 h-24 bg-primary text-on-primary rounded-full mx-auto flex items-center justify-center text-4xl font-headline font-bold mb-4 shadow-lg shadow-primary/20">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h2 className="font-headline text-2xl font-bold">{user.name}</h2>
          <p className="text-on-surface-variant mt-1">{user.email}</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleLogout}
            className="w-full bg-error/10 text-error px-6 py-4 rounded-xl font-headline font-bold text-base flex items-center justify-center gap-2 hover:bg-error/20 transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            Wyloguj się
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
