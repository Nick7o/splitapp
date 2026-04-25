import React from 'react';
import AppLayout from '../components/AppLayout';

const Activity: React.FC = () => {
  return (
    <AppLayout title="Activity">
        <div className="app-card py-16 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-6xl mb-4 opacity-50">notifications_off</span>
          <p className="font-headline text-xl">No new activity.</p>
          <p className="text-sm mt-2">All expense and settlement notifications will appear here.</p>
        </div>
    </AppLayout>
  );
};

export default Activity;
