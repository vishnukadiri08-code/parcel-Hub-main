import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PackagePlus, 
  User, 
  Phone, 
  MapPin, 
  Barcode, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Info
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { sounds } from '../utils/sound';

export default function AddParcel({ onParcelAdded }) {
  const { user } = useAuth();
  const toast = useToast();

  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [appName, setAppName] = useState('Amazon');
  const [rackNo, setRackNo] = useState('');
  const [trackingId, setTrackingId] = useState('');

  const [activeRacks, setActiveRacks] = useState([]);
  const [availableApps, setAvailableApps] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Duplicate Tracking ID Alert State
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [checkingTracking, setCheckingTracking] = useState(false);

  // Fetch active racks and carrier apps
  useEffect(() => {
    async function loadFormMetadata() {
      try {
        const [racks, apps] = await Promise.all([
          api.get('/api/admin/racks/active'),
          api.get('/api/admin/apps/active')
        ]);
        setActiveRacks(racks);
        setAvailableApps(apps);

        if (racks.length > 0) {
          // Auto-select rack with lowest occupancy
          const sorted = [...racks].sort((a, b) => (a.current_count || 0) - (b.current_count || 0));
          setRackNo(sorted[0].rack_code);
        }
      } catch (err) {
        console.error('Failed to load active metadata:', err);
      }
    }
    loadFormMetadata();
  }, []);

  // Debounced duplicate tracking ID checker
  useEffect(() => {
    if (!trackingId || trackingId.trim().length < 4) {
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingTracking(true);
      try {
        const res = await api.get(`/api/parcels/check-tracking/${encodeURIComponent(trackingId.trim())}`);
        if (res.exists) {
          sounds.playAlertBeep();
          setDuplicateWarning(res.parcel);
        } else {
          setDuplicateWarning(null);
        }
      } catch (err) {
        console.error('Tracking check failed:', err);
      } finally {
        setCheckingTracking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [trackingId]);

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 10) {
      setPhone(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    sounds.playClickSound();

    if (!personName.trim()) {
      toast.error('VALIDATION ERROR', 'Recipient name is required.');
      return;
    }

    if (phone.length !== 10) {
      toast.error('VALIDATION ERROR', 'Phone number must be exactly 10 digits.');
      sounds.playAlertBeep();
      return;
    }

    if (!rackNo) {
      toast.error('VALIDATION ERROR', 'Please assign a storage rack.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/api/parcels', {
        person_name: personName.trim(),
        phone,
        app_name: appName,
        rack_no: rackNo,
        tracking_id: trackingId.trim() || null
      });

      sounds.playSuccessChime();
      toast.success(
        'PARCEL INTAKE RECORDED',
        `Assigned to ${res.parcel.rack_no} for ${res.parcel.person_name}`
      );

      // Reset form
      setPersonName('');
      setPhone('');
      setTrackingId('');
      setDuplicateWarning(null);

      if (onParcelAdded) {
        onParcelAdded(res.parcel);
      }
    } catch (err) {
      sounds.playAlertBeep();
      toast.error('INTAKE FAILED', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const appOptions = availableApps.length > 0 ? availableApps : [
    { name: 'Amazon', color_code: '#ff9900' },
    { name: 'Flipkart', color_code: '#2874f0' },
    { name: 'Meesho', color_code: '#f43397' },
    { name: 'Myntra', color_code: '#ff3f6c' },
    { name: 'Other', color_code: '#00f0ff' }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Page Title */}
      <div>
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <PackagePlus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-mono tracking-tight text-white uppercase">
              NEW PARCEL INTAKE
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              REGISTER INCOMING PACKAGE // ASSIGN RACK // AUTO-TAG TIMESTAMP
            </p>
          </div>
        </div>
      </div>

      {/* Main Intake Form Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Recipient Information */}
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                01. Recipient Details
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Recipient Name */}
              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 font-semibold mb-1.5">
                  Student / Faculty Full Name <span className="text-blue-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="e.g. Rahul Sharma (CS 3rd Yr)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* 10-Digit Phone Number */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono uppercase text-slate-300 font-semibold">
                    10-Digit Phone Number <span className="text-blue-400">*</span>
                  </label>
                  <span className={`text-[10px] font-mono ${
                    phone.length === 10 ? 'text-emerald-400 font-bold' : 'text-slate-400'
                  }`}>
                    {phone.length}/10 digits
                  </span>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder:text-slate-500 tracking-wider"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Carrier & Delivery Source */}
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                02. Carrier & App Logistics
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 font-semibold mb-2">
                Select E-Commerce Carrier App
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {appOptions.map((app) => {
                  const isSelected = appName.toLowerCase() === app.name.toLowerCase();
                  return (
                    <button
                      key={app.name}
                      type="button"
                      onClick={() => {
                        sounds.playClickSound();
                        setAppName(app.name);
                      }}
                      className={`p-3 rounded-xl border text-center font-mono font-bold text-xs uppercase transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-950/60 text-blue-300 shadow-sm'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {app.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Tracking ID with Real-Time Duplicate Detector */}
            <div>
              {checkingTracking && (
                <div className="mb-1.5 text-right">
                  <span className="text-[10px] font-mono text-blue-400 animate-pulse">
                    Scanning for duplicates...
                  </span>
                </div>
              )}
              <div className="relative">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  aria-label="Carrier tracking ID (optional)"
                  placeholder="e.g. AMZ-IN-8891023 or scan barcode"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder:text-slate-500 uppercase ${
                    duplicateWarning ? 'border-red-600 text-red-300' : ''
                  }`}
                />
              </div>

              {/* DUPLICATE TRACKING WARNING BANNER */}
              {duplicateWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2.5 p-3 rounded-xl bg-red-950/70 border border-red-800/80 text-red-300 text-xs font-mono space-y-1 shadow-sm"
                >
                  <div className="flex items-center space-x-2 font-bold uppercase">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>DUPLICATE TRACKING ID WARNING</span>
                  </div>
                  <p className="text-slate-300 pl-6 leading-relaxed">
                    A package with tracking ID <strong className="text-white">{duplicateWarning.tracking_id}</strong> is already pending on <strong className="text-blue-400">{duplicateWarning.rack_no}</strong> for <strong className="text-white">{duplicateWarning.person_name}</strong> (received {duplicateWarning.received_at}).
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Section: Storage Rack Allocation */}
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                03. Storage Rack Allocation
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 font-semibold mb-2">
                Assigned Storage Rack Number <span className="text-blue-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {activeRacks.map((rack) => {
                  const isSelected = rackNo === rack.rack_code;
                  const isFull = (rack.current_count || 0) >= (rack.capacity || 25);

                  return (
                    <button
                      key={rack.rack_code}
                      type="button"
                      onClick={() => {
                        sounds.playClickSound();
                        setRackNo(rack.rack_code);
                      }}
                      className={`p-3 rounded-xl border text-left font-mono transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-950/60 shadow-sm'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-black text-xs ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>
                          {rack.rack_code}
                        </span>
                        <span className={`text-[9px] px-1 rounded ${
                          isFull ? 'bg-red-950 text-red-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {rack.current_count || 0}/{rack.capacity || 25}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-1">
                        {rack.zone}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Or custom rack input */}
              <div className="mt-3 flex items-center space-x-2">
                <input
                  type="text"
                  value={rackNo}
                  onChange={(e) => setRackNo(e.target.value.toUpperCase())}
                  placeholder="Or enter custom rack code (e.g. RACK E-01)"
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono placeholder:text-slate-500 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Section: Auto-Captured Security Metadata */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Intake Timestamp:
              </span>
              <span className="text-slate-200">Automatically captured on submit (Now)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Intake Guard Officer:
              </span>
              <span className="text-blue-400 font-semibold">
                {user?.fullName || user?.username} ({user?.badgeId || 'SEC-OFFICER'})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <Info className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Initial Status:
              </span>
              <span className="text-amber-400 font-semibold">Pending (Awaiting Collection)</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-sm uppercase tracking-wider shadow-sm transition-all transform active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <PackagePlus className="w-5 h-5 stroke-[2.5]" />
            <span>{isSubmitting ? 'RECORDING INTAKE...' : 'CONFIRM INTAKE'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
