import React from 'react';
import { History, Package, PlusCircle } from 'lucide-react';
import { sounds } from '../../utils/sound';

const navItems = [
  { id: 'pending', label: 'Search & Pending', icon: Package },
  { id: 'add', label: 'Add Parcel', icon: PlusCircle },
  { id: 'history', label: 'History', icon: History }
];

export default function Sidebar({ currentPage, onNavigate, pendingCount = 0 }) {
  const handleNav = (page) => {
    sounds.playClickSound();
    onNavigate(page);
  };

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col border-r border-command-700/50 bg-command-950/90 p-4 min-h-[calc(100vh-4rem)]">
      <div>
        <p className="px-3 text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">
          Parcel Modules
        </p>
        <nav className="space-y-1.5" aria-label="Parcel modules">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-colors border ${
                  isActive
                    ? 'bg-white text-black border-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-command-800 border-transparent'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {label}
                </span>
                {id === 'pending' && pendingCount > 0 && (
                  <span className={`text-xs tabular-nums ${isActive ? 'text-black/70' : 'text-slate-400'}`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
