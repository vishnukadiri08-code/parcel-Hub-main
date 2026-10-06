import React, { useState } from 'react';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Shield, 
  Server, 
  Database, 
  CheckCircle2, 
  FileText, 
  Radio, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { sounds } from '../utils/sound';

export default function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [soundEnabled, setSoundEnabled] = useState(sounds.isSoundEnabled());
  const [gateLocation, setGateLocation] = useState('Gate 1 — Main North Security Post');
  const [shiftDuration, setShiftDuration] = useState('08:00 - 16:00 (Day Shift)');

  const handleToggleSound = () => {
    const newState = sounds.toggleSound();
    setSoundEnabled(newState);
    if (newState) sounds.playClickSound();
    toast.info('SOUND PREFERENCE SAVED', newState ? 'Audio FX Enabled' : 'Audio FX Muted');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 rounded-xl bg-command-800 border border-command-700 text-slate-300">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-mono tracking-tight text-white uppercase">
              SECURITY CONFIGURATION & SETTINGS
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              POST IDENTIFIERS // AUDIO PREFERENCES // COMPLIANCE POLICIES
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Audio & Alert Preferences */}
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-command-800">
            <Radio className="w-5 h-5 text-cyber-cyan" />
            <h3 className="font-mono font-bold uppercase text-sm text-white">
              Tactical Audio & HUD Alerts
            </h3>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-mono font-bold text-xs text-white block">
                Synthesized Web Audio FX
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Play acoustic confirmation chimes on delivery and alert beeps for 7-day overdue parcels.
              </p>
            </div>
            <button
              onClick={handleToggleSound}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-blue-950/60 border-blue-500/50 text-blue-400 shadow-sm'
                  : 'bg-command-900 border-command-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-command-950/70 border border-command-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Delivery Handover:</span>
              <span className="text-cyber-emerald">Harmonic Chime (880Hz)</span>
            </div>
            <div className="flex justify-between">
              <span>Overdue / Duplicate:</span>
              <span className="text-cyber-red">Caution Pulse (480Hz)</span>
            </div>
          </div>
        </div>

        {/* Security Post Information */}
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-command-800">
            <Shield className="w-5 h-5 text-cyber-cyan" />
            <h3 className="font-mono font-bold uppercase text-sm text-white">
              Active Security Guard Post
            </h3>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-slate-400 uppercase mb-1">Gate Post Assigned</label>
              <select
                value={gateLocation}
                onChange={e => setGateLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input bg-command-950 text-slate-200"
              >
                <option value="Gate 1 — Main North Security Post">Gate 1 — Main North Security Post</option>
                <option value="Gate 2 — East Campus Hostel Post">Gate 2 — East Campus Hostel Post</option>
                <option value="Admin Complex Central Gateway">Admin Complex Central Gateway</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 uppercase mb-1">Duty Shift Window</label>
              <select
                value={shiftDuration}
                onChange={e => setShiftDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input bg-command-950 text-slate-200"
              >
                <option value="08:00 - 16:00 (Day Shift)">08:00 - 16:00 (Day Shift)</option>
                <option value="16:00 - 00:00 (Evening Shift)">16:00 - 00:00 (Evening Shift)</option>
                <option value="00:00 - 08:00 (Night Vigil Shift)">00:00 - 08:00 (Night Vigil Shift)</option>
              </select>
            </div>
          </div>
        </div>

        {/* System & Database Health */}
        <div className="p-6 rounded-2xl glass-card space-y-4 md:col-span-2">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-command-800">
            <Server className="w-5 h-5 text-cyber-emerald" />
            <h3 className="font-mono font-bold uppercase text-sm text-white">
              System Architecture & Immutable Policy
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-command-950 border border-command-800 space-y-1">
              <span className="text-slate-500 uppercase text-[10px]">Database Engine</span>
              <p className="font-bold text-blue-400 text-sm">SQLite Local DB</p>
              <p className="text-[10px] text-slate-400">Zero latency file-backed storage</p>
            </div>

            <div className="p-3.5 rounded-xl bg-command-950 border border-command-800 space-y-1">
              <span className="text-slate-500 uppercase text-[10px]">Handover Retention</span>
              <p className="font-bold text-emerald-400 text-sm">Permanent Storage</p>
              <p className="text-[10px] text-slate-400">Delivered packages never deleted</p>
            </div>

            <div className="p-3.5 rounded-xl bg-command-950 border border-command-800 space-y-1">
              <span className="text-slate-500 uppercase text-[10px]">Report Generator</span>
              <p className="font-bold text-indigo-400 text-sm">ExcelJS (.xlsx)</p>
              <p className="text-[10px] text-slate-400">Direct binary Excel workbook engine</p>
            </div>
          </div>

          {/* Compliance Card */}
          <div className="p-4 rounded-xl bg-command-950/80 border border-blue-500/30 flex items-start space-x-3 text-xs font-mono">
            <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white uppercase">
                Campus Security Policy Enforced
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Under Campus Hub Directive §4.2, once a parcel status transitions to <strong className="text-cyber-emerald">Delivered</strong>, the record cannot be purged or deleted. Delivery timestamp, recipient handover notes, and the verifying staff ID are permanently retained in the audit log for campus dispute resolution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
