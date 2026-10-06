import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Search, 
  Filter, 
  AlertTriangle, 
  Grid, 
  List, 
  RefreshCw,
  X,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '../utils/api';
import ParcelCard from '../components/ui/ParcelCard';
import { formatDateTime, formatPhone, getAppMeta } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { useToast } from '../context/ToastContext';

export default function PendingParcels() {
  const toast = useToast();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState('ALL');
  const [selectedRack, setSelectedRack] = useState('ALL');
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [sortBy, setSortBy] = useState('oldest'); // 'oldest' | 'newest' | 'rack'

  const [isDelivering, setIsDelivering] = useState(false);

  const fetchPendingParcels = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/parcels/pending');
      setParcels(data);
    } catch (err) {
      console.error('Failed to load pending parcels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingParcels();
  }, []);

  // Extract unique active racks and apps for filter dropdowns
  const uniqueRacks = useMemo(() => {
    const set = new Set(parcels.map(p => p.rack_no).filter(Boolean));
    return Array.from(set).sort();
  }, [parcels]);

  const uniqueApps = useMemo(() => {
    const set = new Set(parcels.map(p => p.app_name).filter(Boolean));
    return Array.from(set).sort();
  }, [parcels]);

  // Real-time client search and filtering
  const filteredParcels = useMemo(() => {
    let result = [...parcels];

    // Search query
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(p => 
        (p.person_name && p.person_name.toLowerCase().includes(term)) ||
        (p.phone && p.phone.includes(term)) ||
        (p.app_name && p.app_name.toLowerCase().includes(term)) ||
        (p.rack_no && p.rack_no.toLowerCase().includes(term)) ||
        (p.tracking_id && p.tracking_id.toLowerCase().includes(term))
      );
    }

    // Overdue filter
    if (onlyOverdue) {
      result = result.filter(p => p.is_overdue === 1 || p.days_waiting >= 7);
    }

    // App filter
    if (selectedApp !== 'ALL') {
      result = result.filter(p => p.app_name === selectedApp);
    }

    // Rack filter
    if (selectedRack !== 'ALL') {
      result = result.filter(p => p.rack_no === selectedRack);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'oldest') {
        return (b.days_waiting || 0) - (a.days_waiting || 0); // highest waiting first
      }
      if (sortBy === 'newest') {
        return (a.days_waiting || 0) - (b.days_waiting || 0);
      }
      if (sortBy === 'rack') {
        return (a.rack_no || '').localeCompare(b.rack_no || '');
      }
      return 0;
    });

    return result;
  }, [parcels, searchTerm, onlyOverdue, selectedApp, selectedRack, sortBy]);

  const overdueCount = parcels.filter(p => p.is_overdue === 1 || p.days_waiting >= 7).length;

  const handleSelectDeliver = async (parcel) => {
    if (isDelivering) return;

    sounds.playClickSound();
    setIsDelivering(true);
    try {
      await api.put(`/api/parcels/${parcel.id}/deliver`, {
        recipient_note: 'Verified by Gate Security'
      });
      setParcels((current) => current.filter((item) => item.id !== parcel.id));
      sounds.playSuccessChime();
      toast.success(
        'PARCEL DELIVERED',
        `Parcel #${parcel.id} marked as delivered to ${parcel.person_name}.`
      );
    } catch (error) {
      sounds.playAlertBeep();
      toast.error('DELIVERY FAILED', error.message || 'Could not mark this parcel as delivered.');
    } finally {
      setIsDelivering(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-600/30 text-amber-400">
              <Package className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white uppercase">
                SEARCH & PENDING PARCELS
              </h1>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                CAMPUS STORAGE INVENTORY // {parcels.length} ACTIVE PACKAGES AWAITING HANDOVER
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle & Refresh */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-1 flex items-center space-x-1">
            <button
              onClick={() => {
                sounds.playClickSound();
                setViewMode('grid');
              }}
              title="Grid View"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-blue-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sounds.playClickSound();
                setViewMode('table');
              }}
              title="Table View"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-blue-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              sounds.playClickSound();
              fetchPendingParcels();
            }}
            title="Refresh Registry"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-blue-500/40 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time Multi-Field Search & Filter Controls */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-4 sm:p-5 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search instantly by Recipient Name, Phone, Carrier, Rack, or Tracking ID..."
            className="w-full pl-12 pr-10 py-3 rounded-xl glass-input text-sm font-mono placeholder:text-slate-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills & Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* All Pending Pill */}
            <button
              onClick={() => {
                sounds.playClickSound();
                setOnlyOverdue(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                !onlyOverdue
                  ? 'bg-slate-800 text-blue-400 border border-blue-500/40 shadow-sm'
                  : 'bg-slate-950/70 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              All Pending ({parcels.length})
            </button>

            {/* Overdue (> 7 Days) Pill */}
            <button
              onClick={() => {
                sounds.playAlertBeep();
                setOnlyOverdue(!onlyOverdue);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
                onlyOverdue
                  ? 'bg-red-950 text-red-300 border border-red-700 shadow-sm'
                  : overdueCount > 0
                  ? 'bg-red-950/40 text-red-400 border border-red-800/50 hover:bg-red-950/70'
                  : 'bg-slate-950/70 text-slate-500 border border-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>&gt; 7 Days Overdue ({overdueCount})</span>
            </button>
          </div>

          {/* Dropdown Filters: Rack, App & Sort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Rack Filter */}
            <div className="flex items-center space-x-1.5 bg-command-950 px-2.5 py-1.5 rounded-xl border border-command-800">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedRack}
                onChange={(e) => setSelectedRack(e.target.value)}
                className="bg-transparent text-xs font-mono text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-command-900 text-white">All Racks</option>
                {uniqueRacks.map(r => (
                  <option key={r} value={r} className="bg-command-900 text-white">{r}</option>
                ))}
              </select>
            </div>

            {/* App Filter */}
            <div className="flex items-center space-x-1.5 bg-command-950 px-2.5 py-1.5 rounded-xl border border-command-800">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value)}
                className="bg-transparent text-xs font-mono text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-command-900 text-white">All Carriers</option>
                {uniqueApps.map(a => (
                  <option key={a} value={a} className="bg-command-900 text-white">{a}</option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center space-x-1.5 bg-command-950 px-2.5 py-1.5 rounded-xl border border-command-800">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-mono text-slate-200 outline-none cursor-pointer"
              >
                <option value="oldest" className="bg-command-900 text-white">Longest Waiting</option>
                <option value="newest" className="bg-command-900 text-white">Recently Arrived</option>
                <option value="rack" className="bg-command-900 text-white">Rack Order</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 rounded-2xl glass-card animate-pulse bg-command-900/40 border border-command-800" />
          ))}
        </div>
      ) : filteredParcels.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-command-800 bg-command-900/40 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-command-800 border border-command-700 flex items-center justify-center mx-auto text-slate-400">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-mono text-white uppercase">
            No Matching Pending Parcels
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            {searchTerm || onlyOverdue || selectedApp !== 'ALL' || selectedRack !== 'ALL'
              ? 'Try resetting the filters or clearing the search query.'
              : 'All incoming packages have been safely handed over!'}
          </p>
          {(searchTerm || onlyOverdue || selectedApp !== 'ALL' || selectedRack !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setOnlyOverdue(false);
                setSelectedApp('ALL');
                setSelectedRack('ALL');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-command-800 hover:bg-command-700 text-xs font-mono text-blue-400 border border-command-700 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredParcels.map((parcel) => (
              <ParcelCard
                key={parcel.id}
                parcel={parcel}
                onSelectDeliver={handleSelectDeliver}
                isDelivering={isDelivering}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-command-700/80 bg-command-900/80 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-command-950/90 text-slate-400 uppercase tracking-wider border-b border-command-800">
                <tr>
                  <th className="py-3 px-4">Status & Days</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Carrier</th>
                  <th className="py-3 px-4">Rack</th>
                  <th className="py-3 px-4">Tracking ID</th>
                  <th className="py-3 px-4">Received Time</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-command-800/80 text-slate-200">
                {filteredParcels.map((parcel) => {
                  const isOverdue = parcel.is_overdue === 1 || parcel.days_waiting >= 7;
                  const appMeta = getAppMeta(parcel.app_name);

                  return (
                    <tr
                      key={parcel.id}
                      className={`hover:bg-command-800/50 transition-colors ${
                        isOverdue ? 'bg-red-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isOverdue
                            ? 'bg-red-950/60 text-red-400 border border-red-800/80'
                            : 'bg-command-800 text-amber-400 border border-amber-900/50'
                        }`}>
                          {parcel.days_waiting}d waiting
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                        {parcel.person_name}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono whitespace-nowrap">
                        {formatPhone(parcel.phone)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${appMeta.bg}`}>
                          {parcel.app_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-black text-blue-400 text-sm">
                        {parcel.rack_no}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                        {parcel.tracking_id || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                        {formatDateTime(parcel.received_at)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          disabled={isDelivering}
                          onClick={() => handleSelectDeliver(parcel)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all disabled:cursor-wait disabled:opacity-60"
                        >
                          {isDelivering ? 'Marking...' : 'Mark Delivered'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
