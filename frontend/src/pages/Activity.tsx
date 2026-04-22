import React from 'react';
import BottomNav from '../components/BottomNav';

const Activity: React.FC = () => {
  return (
    <div className="text-on-surface antialiased min-h-screen bg-background pb-32">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-sm border-b border-white/5">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-screen-xl mx-auto">
          <h1 className="font-headline font-bold text-on-surface text-2xl tracking-wide">Aktywność</h1>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-screen-xl mx-auto">
        <div className="text-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-6xl mb-4 opacity-50">notifications_off</span>
          <p className="font-headline text-xl">Brak nowej aktywności.</p>
          <p className="text-sm mt-2">Wszystkie powiadomienia o wydatkach i rozliczeniach pojawią się tutaj.</p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Activity;
