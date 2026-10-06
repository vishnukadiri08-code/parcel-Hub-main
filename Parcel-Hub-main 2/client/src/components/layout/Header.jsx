import React from 'react';
import { LogOut, Package, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 min-h-16 border-b border-white/15 bg-black px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white text-black flex items-center justify-center">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm sm:text-base font-bold tracking-wide text-white">
            CAMPUS PARCEL HUB
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-400">
            Parcel intake and tracking
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden sm:flex items-center gap-2 text-right">
            <User className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs font-medium text-white">
                {user.fullName || user.username}
              </p>
              <p className="text-[10px] text-slate-400 capitalize">
                {user.role}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-lg border border-white/25 px-3 py-2 text-xs font-medium text-white hover:bg-white hover:text-black transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
