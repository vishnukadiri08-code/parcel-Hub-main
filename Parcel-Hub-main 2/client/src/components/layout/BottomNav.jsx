import React from 'react';
import { History, Package, PlusCircle } from 'lucide-react';
import { sounds } from '../../utils/sound';

const navItems = [
  { id: 'pending', label: 'Search', icon: Package },
  { id: 'add', label: 'Add', icon: PlusCircle },
  { id: 'history', label: 'History', icon: History }
];

export default function BottomNav({ currentPage, onNavigate, pendingCount = 0 }) {
  const handleNav = (page) => {
    sounds.playClickSound();
    onNavigate(page);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 border-t border-white/20 px-3 py-2">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative min-w-20 flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
              {id === 'pending' && pendingCount > 0 && (
                <span className="absolute top-0 right-3 min-w-4 h-4 px-1 rounded-full bg-white text-black text-[9px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
