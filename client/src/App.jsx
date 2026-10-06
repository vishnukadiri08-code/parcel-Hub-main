import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { api } from './utils/api';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import ToastContainer from './components/ui/Toast';

import Login from './pages/Login';
import AddParcel from './pages/AddParcel';
import PendingParcels from './pages/PendingParcels';
import DeliveryHistory from './pages/DeliveryHistory';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('pending');

  const [pendingCount, setPendingCount] = useState(0);

  const refreshBadges = async () => {
    if (!isAuthenticated) return;
    try {
      const stats = await api.get('/api/parcels/dashboard-stats');
      setPendingCount(stats.pendingCount || 0);
    } catch (err) {
      console.error('Failed to refresh pending parcel count:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshBadges();
      const interval = setInterval(refreshBadges, 20000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleParcelAdded = () => {
    refreshBadges();
  };

  if (authLoading) {
    return (
      <div className="monochrome-theme min-h-screen bg-command-950 flex flex-col items-center justify-center space-y-4 text-cyan-400 font-mono">
        <div className="w-10 h-10 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin shadow-glow-cyan" />
        <span className="text-xs tracking-widest uppercase">INITIALIZING COMMAND PROTOCOLS...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="monochrome-theme min-h-screen">
        <ToastContainer />
        <Login />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-command-950 text-slate-100 flex flex-col font-sans monochrome-theme">
      <ToastContainer />

      <Header />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          pendingCount={pendingCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 pb-24 lg:pb-12 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentPage === 'pending' && (
                <PendingParcels />
              )}

              {currentPage === 'add' && (
                <AddParcel
                  onParcelAdded={handleParcelAdded}
                />
              )}

              {currentPage === 'history' && (
                <DeliveryHistory />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav
        currentPage={currentPage}
        onNavigate={handleNavigate}
        pendingCount={pendingCount}
      />
    </div>
  );
}
