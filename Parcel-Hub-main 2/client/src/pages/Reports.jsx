import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Download, 
  Lock, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  ShieldAlert, 
  RefreshCw,
  Printer
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDateTime, formatPhone, getAppMeta } from '../utils/formatters';
import { sounds } from '../utils/sound';

export default function Reports() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [analytics, setAnalytics] = useState({
    carrierStats: [],
    avgTurnaroundDays: '1.2',
    totalDeliveredLifetime: 0,
    dailyIntake: [],
    overdueList: []
  });
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/parcels/reports-stats');
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const handleDownloadReport = async (type) => {
    if (!isAdmin) {
      sounds.playAlertBeep();
      toast.warning('ADMIN CLEARANCE REQUIRED', 'Only Administrators are authorized to export official reports.');
      return;
    }

    sounds.playClickSound();
    setDownloading(type);
    try {
      const today = new Date().toISOString().split('T')[0];
      if (type === 'delivered') {
        await api.download('/api/export/delivered', `CampusParcelHub_Delivered_${today}.xlsx`);
        toast.success('DOWNLOAD COMPLETE', 'Delivered parcels spreadsheet saved.');
      } else if (type === 'overdue') {
        await api.download('/api/export/overdue', `CampusParcelHub_Overdue_Audit_${today}.xlsx`);
        toast.success('DOWNLOAD COMPLETE', 'Overdue packages audit report saved.');
      } else if (type === 'audit') {
        await api.download('/api/export/audit', `CampusParcelHub_Security_Audit_${today}.xlsx`);
        toast.success('DOWNLOAD COMPLETE', 'Complete system security audit log saved.');
      }
      sounds.playSuccessChime();
    } catch (err) {
      sounds.playAlertBeep();
      toast.error('EXPORT FAILED', err.message);
    } finally {
      setDownloading(null);
    }
  };

  const handlePrintSummary = () => {
    sounds.playClickSound();
    window.print();
  };

  const totalAllCarriers = analytics.carrierStats.reduce((acc, curr) => acc + curr.total_received, 0) || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <BarChart3 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-mono tracking-tight text-white uppercase">
                SECURITY AUDIT & REPORTS CENTER
              </h1>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                CAMPUS PARCEL ANALYTICS // CARRIER DISTRIBUTION // OFFICIAL EXCEL EXPORTS
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrintSummary}
            className="px-3.5 py-2 rounded-xl bg-command-900 border border-command-700/80 text-xs font-mono text-slate-300 hover:text-white flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={() => {
              sounds.playClickSound();
              fetchReportsData();
            }}
            className="p-2.5 rounded-xl bg-command-900 border border-command-700 text-slate-300 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="p-5 rounded-2xl glass-card space-y-1">
          <span className="text-xs text-slate-400 uppercase">Avg Handover Turnaround</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-cyber-cyan">
              {analytics.avgTurnaroundDays} <span className="text-lg font-normal text-slate-400">days</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500">From gate intake to verified student collection</p>
        </div>

        <div className="p-5 rounded-2xl glass-card space-y-1">
          <span className="text-xs text-slate-400 uppercase">Total Verified Deliveries</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-cyber-emerald">
              {analytics.totalDeliveredLifetime}
            </span>
            <span className="text-xs text-emerald-400 font-bold uppercase">Archived</span>
          </div>
          <p className="text-[11px] text-slate-500">Permanently preserved immutable records</p>
        </div>

        <div className="p-5 rounded-2xl glass-card space-y-1">
          <span className="text-xs text-slate-400 uppercase">Critical Overdue Parcels</span>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-extrabold ${analytics.overdueList.length > 0 ? 'text-cyber-red animate-pulse' : 'text-slate-200'}`}>
              {analytics.overdueList.length}
            </span>
            {analytics.overdueList.length > 0 && (
              <span className="text-xs text-cyber-red font-bold uppercase bg-red-950 px-1.5 py-0.5 rounded">
                &gt; 7 Days
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">Uncollected packages exceeding safety SLA</p>
        </div>
      </div>

      {/* Official Export Center Cards */}
      <div className="rounded-2xl border border-command-700/80 bg-command-900/80 backdrop-blur-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-command-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-cyber-emerald" />
            <h2 className="text-sm font-bold font-mono uppercase text-white tracking-wide">
              Official Spreadsheet Export Center (.xlsx)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {isAdmin ? 'ADMINISTRATIVE ACCESS GRANTED' : 'LOCK: ADMIN ONLY'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Delivered Parcels */}
          <div className="p-4 rounded-xl bg-command-950/80 border border-command-800 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white uppercase">
                  Delivered Audit Sheet
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-cyber-emerald">
                  XLSX
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Full history of delivered packages including verified handover timestamps, student phone, carrier, and officer names.
              </p>
            </div>
            <button
              onClick={() => handleDownloadReport('delivered')}
              disabled={downloading === 'delivered'}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-mono font-bold uppercase flex items-center justify-center space-x-2 transition-all ${
                isAdmin
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-emerald cursor-pointer'
                  : 'bg-command-900 border border-command-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isAdmin ? (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloading === 'delivered' ? 'Exporting...' : 'Export Delivered (.xlsx)'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Clearance Required</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Overdue Parcels */}
          <div className="p-4 rounded-xl bg-command-950/80 border border-command-800 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-red-400 uppercase">
                  Overdue (&gt;7 Days) Report
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-900/60">
                  XLSX
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Official report of long-term abandoned/unclaimed packages for forwarding to hostel wardens and student affairs.
              </p>
            </div>
            <button
              onClick={() => handleDownloadReport('overdue')}
              disabled={downloading === 'overdue'}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-mono font-bold uppercase flex items-center justify-center space-x-2 transition-all ${
                isAdmin
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm cursor-pointer'
                  : 'bg-command-900 border border-command-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isAdmin ? (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloading === 'overdue' ? 'Exporting...' : 'Export Overdue (.xlsx)'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Clearance Required</span>
                </>
              )}
            </button>
          </div>

          {/* 3. System Security Audit */}
          <div className="p-4 rounded-xl bg-command-950/80 border border-command-800 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-400 uppercase">
                  System Audit Logs
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/60">
                  XLSX
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Complete chronological log of all security guard logins, parcel intakes, physical deliveries, and administrative actions.
              </p>
            </div>
            <button
              onClick={() => handleDownloadReport('audit')}
              disabled={downloading === 'audit'}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-mono font-bold uppercase flex items-center justify-center space-x-2 transition-all ${
                isAdmin
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer'
                  : 'bg-command-900 border border-command-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isAdmin ? (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloading === 'audit' ? 'Exporting...' : 'Export Audit Logs (.xlsx)'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Clearance Required</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Carrier App Volume Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-command-700/80 bg-command-900/80 backdrop-blur-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-command-800 pb-3">
            <h3 className="text-sm font-bold font-mono uppercase text-white">
              Carrier Volume Distribution
            </h3>
            <span className="text-xs font-mono text-slate-400">Share of Total Inflow</span>
          </div>

          <div className="space-y-3.5 pt-2">
            {analytics.carrierStats.map(stat => {
              const meta = getAppMeta(stat.app_name);
              const percentage = Math.round((stat.total_received / totalAllCarriers) * 100);

              return (
                <div key={stat.app_name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white">{stat.app_name}</span>
                    <span className="text-slate-400">
                      {stat.total_received} packages ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-command-950 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: meta.tagColor || '#00f0ff'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Delivered: {stat.total_delivered}</span>
                    <span>Currently Pending: {stat.total_pending}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overdue Package Attention Table */}
        <div className="rounded-2xl border border-command-700/80 bg-command-900/80 backdrop-blur-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-command-800 pb-3">
            <div className="flex items-center space-x-2 text-cyber-red">
              <ShieldAlert className="w-4 h-4 animate-bounce" />
              <h3 className="text-sm font-bold font-mono uppercase text-white">
                Parcels Held &gt; 7 Days Registry
              </h3>
            </div>
            <span className="text-xs font-mono text-cyber-red font-bold">
              {analytics.overdueList.length} Active Alerts
            </span>
          </div>

          {analytics.overdueList.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-slate-400">
              No packages currently exceeding the 7-day safety window.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {analytics.overdueList.map(item => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-red-950/20 border border-cyber-red/30 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="font-bold text-white block">{item.person_name}</span>
                    <span className="text-[11px] text-slate-400">{formatPhone(item.phone)} • {item.app_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-cyber-red font-bold block">{item.days_waiting} Days Held</span>
                    <span className="text-cyber-cyan text-[11px]">{item.rack_no}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
