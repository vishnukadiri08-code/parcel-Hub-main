import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Layers, 
  Users, 
  Package, 
  Activity, 
  Plus, 
  ToggleLeft, 
  ToggleRight, 
  FileSpreadsheet, 
  RefreshCw, 
  Lock, 
  Eye,
  EyeOff,
  Check, 
  X, 
  AlertTriangle 
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDateTime } from '../utils/formatters';
import { sounds } from '../utils/sound';

export default function AdminCenter() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('racks'); // 'racks' | 'staff' | 'apps' | 'audit'
  const [loading, setLoading] = useState(true);

  // Data states
  const [racks, setRacks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [apps, setApps] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Modal forms
  const [showAddRackModal, setShowAddRackModal] = useState(false);
  const [newRack, setNewRack] = useState({ rack_code: '', zone: '', capacity: 25 });

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showNewStaffPassword, setShowNewStaffPassword] = useState(false);
  const [newStaff, setNewStaff] = useState({ username: '', password: '', full_name: '', badge_id: '', role: 'staff' });

  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [newApp, setNewApp] = useState({ name: '', color_code: '#00f0ff' });

  const loadAdminData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [racksData, staffData, appsData, auditData] = await Promise.all([
        api.get('/api/admin/racks'),
        api.get('/api/admin/staff'),
        api.get('/api/admin/apps'),
        api.get('/api/admin/audit-logs')
      ]);
      setRacks(racksData);
      setStaffList(staffData);
      setApps(appsData);
      setAuditLogs(auditData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      toast.error('ADMIN SYNC ERROR', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-cyber-red/50 bg-red-950/20 p-12 text-center max-w-lg mx-auto space-y-4">
        <Lock className="w-12 h-12 text-cyber-red mx-auto animate-pulse" />
        <h2 className="text-xl font-bold font-mono text-white uppercase">
          ADMINISTRATIVE CLEARANCE REQUIRED
        </h2>
        <p className="text-xs text-slate-300 font-mono leading-relaxed">
          You are currently logged in with <strong className="text-cyber-cyan uppercase">{user?.role}</strong> credentials. The Admin Command Module is restricted to Level-1 Security Administrators.
        </p>
      </div>
    );
  }

  // Handlers for Racks
  const handleCreateRack = async (e) => {
    e.preventDefault();
    sounds.playClickSound();
    try {
      await api.post('/api/admin/racks', newRack);
      sounds.playSuccessChime();
      toast.success('RACK CREATED', `Rack ${newRack.rack_code} initialized.`);
      setShowAddRackModal(false);
      setNewRack({ rack_code: '', zone: '', capacity: 25 });
      loadAdminData();
    } catch (err) {
      sounds.playAlertBeep();
      toast.error('FAILED TO ADD RACK', err.message);
    }
  };

  const handleToggleRack = async (id) => {
    sounds.playClickSound();
    try {
      await api.put(`/api/admin/racks/${id}/toggle`);
      toast.info('RACK STATUS UPDATED');
      loadAdminData();
    } catch (err) {
      toast.error('ERROR', err.message);
    }
  };

  // Handlers for Staff
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    sounds.playClickSound();
    try {
      await api.post('/api/admin/staff', newStaff);
      sounds.playSuccessChime();
      toast.success('STAFF ENROLLED', `Security account @${newStaff.username} provisioned.`);
      setShowAddStaffModal(false);
      setNewStaff({ username: '', password: '', full_name: '', badge_id: '', role: 'staff' });
      loadAdminData();
    } catch (err) {
      sounds.playAlertBeep();
      toast.error('FAILED TO ENROLL STAFF', err.message);
    }
  };

  const handleToggleStaff = async (id) => {
    sounds.playClickSound();
    try {
      await api.put(`/api/admin/staff/${id}/toggle`);
      toast.info('STAFF STATUS UPDATED');
      loadAdminData();
    } catch (err) {
      toast.error('ERROR', err.message);
    }
  };

  // Handlers for Apps
  const handleCreateApp = async (e) => {
    e.preventDefault();
    sounds.playClickSound();
    try {
      await api.post('/api/admin/apps', newApp);
      sounds.playSuccessChime();
      toast.success('CARRIER APP REGISTERED', `${newApp.name} enabled.`);
      setShowAddAppModal(false);
      setNewApp({ name: '', color_code: '#00f0ff' });
      loadAdminData();
    } catch (err) {
      sounds.playAlertBeep();
      toast.error('FAILED TO ADD APP', err.message);
    }
  };

  // Export Audit Logs
  const handleExportAuditLogs = async () => {
    sounds.playClickSound();
    try {
      await api.download('/api/export/audit', `CampusParcelHub_Security_Audit_${new Date().toISOString().split('T')[0]}.xlsx`);
      sounds.playSuccessChime();
      toast.success('AUDIT LOGS DOWNLOADED');
    } catch (err) {
      toast.error('EXPORT FAILED', err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/40 text-purple-300 shadow-glow-subtle">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-mono tracking-tight text-white uppercase">
                ADMIN COMMAND & CONFIGURATION
              </h1>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                CLEARANCE LEVEL 1 // RACKS, PERSONNEL, PARTNER APPS & AUDIT LOGS
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClickSound();
            loadAdminData();
          }}
          className="p-2.5 rounded-xl bg-command-900 border border-command-700 text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Module Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-command-800 pb-3">
        {[
          { id: 'racks', label: 'Storage Racks', icon: Layers, count: racks.length },
          { id: 'staff', label: 'Security Personnel', icon: Users, count: staffList.length },
          { id: 'apps', label: 'Carrier Apps', icon: Package, count: apps.length },
          { id: 'audit', label: 'System Audit Log', icon: Activity, count: auditLogs.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playClickSound();
                setActiveTab(tab.id);
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-command-800 text-cyber-cyan border border-cyber-cyan/40 shadow-glow-cyan'
                  : 'bg-command-950/70 text-slate-400 hover:text-white border border-command-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded bg-command-950 text-[10px] text-slate-300">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Storage Racks Management */}
      {activeTab === 'racks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-mono uppercase text-white">
              Storage Racks & Zone Allocations
            </h2>
            <button
              onClick={() => setShowAddRackModal(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Provision New Rack</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {racks.map(rack => (
              <div
                key={rack.id}
                className="p-4 rounded-2xl glass-card space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black font-mono text-cyber-cyan">
                    {rack.rack_code}
                  </span>
                  <button
                    onClick={() => handleToggleRack(rack.id)}
                    title="Toggle active status"
                    className="text-slate-400 hover:text-white"
                  >
                    {rack.is_active === 1 ? (
                      <ToggleRight className="w-6 h-6 text-cyber-emerald" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-600" />
                    )}
                  </button>
                </div>

                <div className="text-xs font-mono text-slate-400">
                  <p className="truncate text-slate-300">{rack.zone}</p>
                  <div className="mt-2 flex justify-between text-[11px]">
                    <span>Current Load:</span>
                    <span className="font-bold text-white">{rack.current_count || 0} / {rack.capacity}</span>
                  </div>
                </div>

                <div className="w-full h-1.5 rounded-full bg-command-800 overflow-hidden">
                  <div
                    className="h-full bg-cyber-cyan rounded-full"
                    style={{ width: `${Math.min(100, Math.round(((rack.current_count || 0) / rack.capacity) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Security Staff Management */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-mono uppercase text-white">
              Security Roster & Duty Clearance
            </h2>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Enroll Security Staff</span>
            </button>
          </div>

          <div className="rounded-2xl border border-command-700/80 bg-command-900/80 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-command-950 text-slate-400 uppercase tracking-wider border-b border-command-800">
                  <tr>
                    <th className="py-3 px-4">Officer Name</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Badge ID</th>
                    <th className="py-3 px-4">Clearance Role</th>
                    <th className="py-3 px-4">Intakes Logged</th>
                    <th className="py-3 px-4">Deliveries Handed</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-command-800 text-slate-200">
                  {staffList.map(member => (
                    <tr key={member.id} className="hover:bg-command-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                        {member.full_name}
                      </td>
                      <td className="py-3.5 px-4 text-cyber-cyan">
                        @{member.username}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-command-800 border border-command-700 text-slate-300 font-bold">
                          {member.badge_id || 'SEC-00'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 uppercase">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          member.role === 'admin'
                            ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                            : 'bg-cyan-950 text-cyber-cyan border border-cyan-500/40'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {member.intakes_count || 0}
                      </td>
                      <td className="py-3.5 px-4 text-cyber-emerald font-semibold">
                        {member.deliveries_count || 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          member.is_active === 1 ? 'text-cyber-emerald bg-emerald-950/60' : 'text-slate-500 bg-slate-800'
                        }`}>
                          {member.is_active === 1 ? 'ACTIVE' : 'DEACTIVATED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {member.id !== user.id && (
                          <button
                            onClick={() => handleToggleStaff(member.id)}
                            className="text-xs text-slate-400 hover:text-white font-mono px-2 py-1 rounded bg-command-800 hover:bg-command-700"
                          >
                            {member.is_active === 1 ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Delivery Carrier Apps */}
      {activeTab === 'apps' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-mono uppercase text-white">
              Supported Delivery Carriers & Color Codes
            </h2>
            <button
              onClick={() => setShowAddAppModal(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Carrier App</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {apps.map(app => (
              <div
                key={app.id}
                className="p-4 rounded-2xl glass-card flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: app.color_code || '#00f0ff' }}
                  />
                  <span className="font-mono font-bold text-white text-sm">
                    {app.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-command-800 text-slate-400">
                  {app.is_active === 1 ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: System Audit Activity Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-mono uppercase text-white">
              System Audit Trail & Compliance Ticker
            </h2>
            <button
              onClick={handleExportAuditLogs}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase flex items-center space-x-1.5 shadow-glow-emerald"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Audit Excel</span>
            </button>
          </div>

          <div className="rounded-2xl border border-command-700/80 bg-command-900/80 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-command-950 text-slate-400 uppercase tracking-wider border-b border-command-800">
                  <tr>
                    <th className="py-3 px-4">Audit ID</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Operation Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-command-800 text-slate-200">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-command-800/40">
                      <td className="py-3 px-4 text-slate-500">
                        #{log.id}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 text-cyber-cyan whitespace-nowrap">
                        @{log.username}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-white">
                        <span className="px-2 py-0.5 rounded bg-command-800 border border-command-700 text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Rack Modal */}
      {showAddRackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-command-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-command-700 bg-command-900 p-6 text-white shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-mono font-bold uppercase text-sm">Provision New Storage Rack</h3>
              <button onClick={() => setShowAddRackModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateRack} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block uppercase text-slate-400 mb-1">Rack Code (e.g. RACK E-01)</label>
                <input
                  type="text"
                  required
                  value={newRack.rack_code}
                  onChange={e => setNewRack({ ...newRack, rack_code: e.target.value.toUpperCase() })}
                  placeholder="RACK E-01"
                  className="w-full px-3 py-2 rounded-xl glass-input uppercase"
                />
              </div>
              <div>
                <label className="block uppercase text-slate-400 mb-1">Zone Location Description</label>
                <input
                  type="text"
                  required
                  value={newRack.zone}
                  onChange={e => setNewRack({ ...newRack, zone: e.target.value })}
                  placeholder="e.g. Science Block South Entrance"
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block uppercase text-slate-400 mb-1">Parcel Capacity</label>
                <input
                  type="number"
                  required
                  value={newRack.capacity}
                  onChange={e => setNewRack({ ...newRack, capacity: parseInt(e.target.value) || 25 })}
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
              >
                Save Rack
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-command-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-command-700 bg-command-900 p-6 text-white shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-mono font-bold uppercase text-sm">Enroll New Security Personnel</h3>
              <button onClick={() => setShowAddStaffModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block uppercase text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaff.full_name}
                  onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  placeholder="Officer Vikram Rathore"
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block uppercase text-slate-400 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newStaff.username}
                  onChange={e => setNewStaff({ ...newStaff, username: e.target.value.toLowerCase().trim() })}
                  placeholder="guard_vikram"
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block uppercase text-slate-400 mb-1">Temporary Password</label>
                <div className="relative">
                  <input
                    type={showNewStaffPassword ? 'text' : 'password'}
                    required
                    value={newStaff.password}
                    onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 pr-11 rounded-xl glass-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewStaffPassword((visible) => !visible)}
                    aria-label={showNewStaffPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showNewStaffPassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                  >
                    {showNewStaffPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Badge ID</label>
                  <input
                    type="text"
                    required
                    value={newStaff.badge_id}
                    onChange={e => setNewStaff({ ...newStaff, badge_id: e.target.value.toUpperCase() })}
                    placeholder="SEC-112"
                    className="w-full px-3 py-2 rounded-xl glass-input uppercase"
                  />
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Role Clearance</label>
                  <select
                    value={newStaff.role}
                    onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input bg-command-950"
                  >
                    <option value="staff">Staff Officer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer mt-2"
              >
                Provision Account
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add App Modal */}
      {showAddAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-command-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl border border-command-700 bg-command-900 p-6 text-white shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-mono font-bold uppercase text-sm">Add Courier / Partner App</h3>
              <button onClick={() => setShowAddAppModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateApp} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block uppercase text-slate-400 mb-1">App / Carrier Name</label>
                <input
                  type="text"
                  required
                  value={newApp.name}
                  onChange={e => setNewApp({ ...newApp, name: e.target.value })}
                  placeholder="e.g. Blinkit, Dunzo"
                  className="w-full px-3 py-2 rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block uppercase text-slate-400 mb-1">Badge Brand Color</label>
                <input
                  type="color"
                  value={newApp.color_code}
                  onChange={e => setNewApp({ ...newApp, color_code: e.target.value })}
                  className="w-full h-10 rounded-xl bg-command-950 border border-command-700 cursor-pointer"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
              >
                Add Partner
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
