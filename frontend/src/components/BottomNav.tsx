import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.3)] border-t border-white/5 rounded-t-3xl z-50">
      <div className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3">
        <button 
          onClick={() => navigate('/dashboard')} 
          className={`flex flex-col items-center justify-center px-4 py-2 transition-all active:scale-90 duration-150 ${isActive('/dashboard') && !isActive('/groups') ? 'bg-secondary-container border border-secondary/10 text-secondary rounded-2xl shadow-inner' : 'text-on-surface-variant hover:text-secondary'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/dashboard') && !isActive('/groups') ? "'FILL' 1" : "'FILL' 0" }}>home</span>
          <span className="font-label text-[10px] font-bold uppercase tracking-widest mt-1">Home</span>
        </button>
        
        <button 
          onClick={() => navigate('/groups')} 
          className={`flex flex-col items-center justify-center px-4 py-2 transition-all active:scale-90 duration-150 ${isActive('/groups') ? 'bg-secondary-container border border-secondary/10 text-secondary rounded-2xl shadow-inner' : 'text-on-surface-variant hover:text-secondary'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/groups') ? "'FILL' 1" : "'FILL' 0" }}>group</span>
          <span className="font-label text-[10px] font-medium uppercase tracking-widest mt-1">Groups</span>
        </button>
        
        <button 
          onClick={() => {
            // If we are in a group, go to add expense, else go to dashboard to add group
            const match = location.pathname.match(/\/groups\/([^\/]+)/);
            if (match) {
              navigate(`/groups/${match[1]}/add-expense`);
            } else {
              // Trigger modal in dashboard (we can use a global state or just navigate to dashboard with a hash)
              navigate('/dashboard#new-group');
            }
          }}
          className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-2 hover:text-secondary active:scale-90 transition-all duration-150 cursor-pointer"
        >
          <span className="material-symbols-outlined text-3xl text-tertiary drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
          <span className="font-label text-[10px] font-medium uppercase tracking-widest mt-1 text-tertiary">Add</span>
        </button>
        
        <button 
          onClick={() => navigate('/activity')}
          className={`flex flex-col items-center justify-center px-4 py-2 transition-all active:scale-90 duration-150 ${isActive('/activity') ? 'bg-secondary-container border border-secondary/10 text-secondary rounded-2xl shadow-inner' : 'text-on-surface-variant hover:text-secondary'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/activity') ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
          <span className="font-label text-[10px] font-medium uppercase tracking-widest mt-1">Activity</span>
        </button>
        
        <button 
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center justify-center px-4 py-2 transition-all active:scale-90 duration-150 ${isActive('/profile') ? 'bg-secondary-container border border-secondary/10 text-secondary rounded-2xl shadow-inner' : 'text-on-surface-variant hover:text-secondary'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/profile') ? "'FILL' 1" : "'FILL' 0" }}>person</span>
          <span className="font-label text-[10px] font-medium uppercase tracking-widest mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
