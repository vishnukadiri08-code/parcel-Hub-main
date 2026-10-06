import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  ArrowDownLeft, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  Search, 
  History, 
  Layers, 
  Activity, 
  ArrowRight,
  TrendingUp,
  RefreshCw,
  MapPin,
  Clock,
  ShieldAlert
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { api } from '../utils/api';
import { formatTime, formatDate } from '../utils/formatters';
import { sounds } from '../utils/sound';

export default function Dashboard({ onNavigate, onFilterOverdue }) {
  const [stats, setStats] = useState({
    pendingCount: 0,
    todayArrivals: 0,
    todayDeliveries: 0,
    overdueCount: 0,
    rackOccupancy: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.get('/api/parcels/dashboard-stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    // Auto refresh every 30 seconds for live command center sync
    const interval = setInterval(() => fetchDashboardStats(), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickAction = (page) => {
    sounds.playClickSound();
    onNavigate(page);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white uppercase">
              SECURITY OPERATIONS DASHBOARD
            </h1>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            CAMPUS CENTRAL GATE // INVENTORY & LOGISTICS TELEMETRY
          </p>
        </div>

        <button
          onClick={() => {
            sounds.playClickSound();
            fetchDashboardStats(true);
          }}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white hover:border-blue-500/40 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          <span>{refreshing ? 'SYNCHRONIZING...' : 'REFRESH DATA'}</span>
        </button>
      </div>

      {/* URGENT 7-DAY OVERDUE ALERT BANNER (If > 0) */}
      {stats.overdueCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-4 sm:p-5 border border-red-800/60 bg-red-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-900/40 border border-red-700/50 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold uppercase text-red-400 tracking-wider">
                  SECURITY ACTION MANDATED
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-900 text-red-200">
                  {stats.overdueCount} PARCELS OVERDUE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {stats.overdueCount} packages have been held in campus storage for more than 7 days without pickup.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playAlertBeep();
              if (onFilterOverdue) onFilterOverdue();
            }}
            className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center space-x-1.5 shrink-0 shadow-sm"
          >
            <span>INSPECT OVERDUE PACKAGES</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* 4 Glowing Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Pending Parcels */}
        <StatCard
          title="Pending Parcels"
          value={stats.pendingCount}
          icon={Package}
          accent="amber"
          subtitle="Currently on security racks"
          badge="AWAITING PICKUP"
          onClick={() => handleQuickAction('pending')}
        />

        {/* 2. Today's Arrivals */}
        <StatCard
          title="Today's Arrivals"
          value={stats.todayArrivals}
          icon={ArrowDownLeft}
          accent="cyan"
          subtitle="Incoming carrier dropoffs"
          badge="INTAKE TODAY"
          onClick={() => handleQuickAction('pending')}
        />

        {/* 3. Today's Deliveries */}
        <StatCard
          title="Today's Deliveries"
          value={stats.todayDeliveries}
          icon={CheckCircle2}
          accent="emerald"
          subtitle="Handed over to recipients"
          badge="VERIFIED HANDOFF"
          onClick={() => handleQuickAction('history')}
        />

        {/* 4. Overdue > 7 Days */}
        <StatCard
          title="Parcels > 7 Days"
          value={stats.overdueCount}
          icon={AlertTriangle}
          accent="red"
          subtitle="Exceeds standard pickup window"
          badge={stats.overdueCount > 0 ? "ACTION REQUIRED" : "CLEAR"}
          isAlert={stats.overdueCount > 0}
          onClick={() => {
            if (onFilterOverdue) onFilterOverdue();
          }}
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => handleQuickAction('add')}
          className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-blue-500/40 text-left transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold font-mono uppercase text-white tracking-wide">
            Add New Parcel
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Log incoming package, assign storage rack & generate security ticket.
          </p>
        </button>

        <button
          onClick={() => handleQuickAction('pending')}
          className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 text-left transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold font-mono uppercase text-white tracking-wide">
            Search Parcels
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Instant search by student name, phone, tracking number or rack.
          </p>
        </button>

        <button
          onClick={() => handleQuickAction('history')}
          className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-emerald-600/30 text-left transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 group-hover:scale-105 transition-transform">
              <History className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold font-mono uppercase text-white tracking-wide">
            Delivery History
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Permanent archive of all delivered packages and verified audit logs.
          </p>
        </button>
      </div>

      {/* Lower Section: Storage Rack Status Visualizer & Security Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Racks Occupancy Overview (2 columns on wide screens) */}
        <div className="lg:col-span-2 rounded-2xl border border-command-700/60 bg-command-900/70 backdrop-blur-xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-command-800 text-cyber-cyan border border-command-700">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono uppercase text-white tracking-wide">
                  Storage Rack Occupancy Visualizer
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  PHYSICAL STORAGE LOAD ACROSS CAMPUS ZONES
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {stats.rackOccupancy.length} Active Racks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
            {stats.rackOccupancy.map((rack) => {
              const count = rack.current_parcels || 0;
              const capacity = rack.capacity || 25;
              const percent = Math.min(100, Math.round((count / capacity) * 100));
              const isFull = percent >= 80;

              return (
                <div
                  key={rack.rack_code}
                  className="p-3.5 rounded-xl bg-command-950/70 border border-command-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-extrabold text-sm text-white">
                        {rack.rack_code}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                        {rack.zone}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-blue-400">
                        {count} <span className="text-slate-500 font-normal">/ {capacity}</span>
                      </span>
                      <span className={`block text-[10px] font-mono font-semibold ${
                        isFull ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {percent}% Full
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFull
                          ? 'bg-red-500'
                          : percent > 50
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Audit Activity Feed (1 column) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-4">
              <div className="p-2 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono uppercase text-white tracking-wide">
                  Security Log Activity
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  REAL-TIME VERIFIED LOGISTICS FEED
                </p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {stats.recentActivity.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-blue-400 font-semibold">@{item.username}</span>
                    <span className="text-slate-500">{formatTime(item.timestamp)}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-snug">
                    {item.details}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Audit Compliance Protocol Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
