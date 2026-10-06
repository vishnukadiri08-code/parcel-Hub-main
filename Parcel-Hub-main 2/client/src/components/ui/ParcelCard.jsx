import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Phone, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  Check, 
  ExternalLink,
  MessageCircle,
  MapPin,
  User,
  ShieldAlert
} from 'lucide-react';
import { formatDateTime, formatPhone, getAppMeta } from '../../utils/formatters';
import { sounds } from '../../utils/sound';

export default function ParcelCard({ parcel, onSelectDeliver, isDelivering }) {
  const [copied, setCopied] = useState(false);
  const appMeta = getAppMeta(parcel.app_name);
  const isOverdue = parcel.is_overdue === 1 || parcel.days_waiting >= 7;

  const handleCopyTracking = (e) => {
    e.stopPropagation();
    if (!parcel.tracking_id) return;
    navigator.clipboard.writeText(parcel.tracking_id);
    sounds.playClickSound();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanPhone = (parcel.phone || '').replace(/[^0-9]/g, '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${
        isOverdue ? 'glass-card-overdue' : 'glass-card'
      }`}
    >
      {/* Top Header: Carrier Badge, Overdue Tag, & Days Counter */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border ${appMeta.bg}`}>
              {appMeta.name}
            </span>

            {/* Live Days Waiting Counter */}
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold flex items-center space-x-1 ${
                isOverdue
                  ? 'bg-cyber-red/20 text-cyber-red border border-cyber-red/50 animate-pulse-fast'
                  : parcel.days_waiting >= 3
                  ? 'bg-cyber-amber/20 text-cyber-amber border border-cyber-amber/40'
                  : 'bg-command-800 text-slate-300 border border-command-700'
              }`}
            >
              <Clock className="w-3 h-3 mr-1" />
              <span>
                {parcel.days_waiting === 0 ? 'Arrived Today' : `${parcel.days_waiting}d Waiting`}
              </span>
            </span>
          </div>

          {/* Pending Status Pulse */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOverdue ? 'bg-cyber-red' : 'bg-cyber-amber'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isOverdue ? 'bg-cyber-red' : 'bg-cyber-amber'
              }`}></span>
            </span>
            <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${
              isOverdue ? 'text-cyber-red' : 'text-cyber-amber'
            }`}>
              {isOverdue ? 'OVERDUE' : 'PENDING'}
            </span>
          </div>
        </div>

        {/* Overdue 7-Day Warning Banner */}
        {isOverdue && (
          <div className="mb-3 px-3 py-1.5 rounded-lg bg-cyber-red/15 border border-cyber-red/40 flex items-center space-x-2 text-cyber-red">
            <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
            <span className="text-[11px] font-mono font-bold tracking-wide">
              WARNING: Parcel has been stored over 7 days!
            </span>
          </div>
        )}

        {/* Recipient Details */}
        <div className="space-y-1 mb-4">
          <h3 className="text-base font-bold text-slate-100 tracking-wide flex items-center">
            <User className="w-4 h-4 mr-2 text-blue-400 shrink-0" />
            <span className="truncate">{parcel.person_name}</span>
          </h3>

          {/* Phone Number with Click to Call & WhatsApp */}
          <div className="flex items-center space-x-3 text-xs font-mono text-slate-300 pl-6">
            <span className="text-slate-400">{formatPhone(parcel.phone)}</span>
            <div className="flex items-center space-x-1.5">
              <a
                href={`tel:${cleanPhone}`}
                title="Call Recipient"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <Phone className="w-3 h-3" />
              </a>
              <a
                href={`https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(parcel.person_name)},%20your%20${encodeURIComponent(parcel.app_name)}%20parcel%20is%20waiting%20at%20Campus%20Security%20Gate%20on%20Rack%20${encodeURIComponent(parcel.rack_no)}.`}
                target="_blank"
                rel="noreferrer"
                title="Notify on WhatsApp"
                className="p-1 rounded bg-emerald-950/70 hover:bg-emerald-900 text-emerald-400 border border-emerald-700/40 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* High Visibility Large Rack Number Display */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/70 flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block leading-tight">
                Assigned Storage
              </span>
              <span className="text-lg font-black font-mono tracking-wider text-blue-400">
                {parcel.rack_no}
              </span>
            </div>
          </div>

          {/* Barcode graphic visualizer */}
          <div className="hidden sm:block text-right">
            <div className="w-16 h-5 barcode-lines opacity-30 ml-auto rounded-sm" />
            <span className="text-[9px] font-mono text-slate-500">ID #{parcel.id}</span>
          </div>
        </div>

        {/* Tracking ID & Timestamp */}
        <div className="space-y-1.5 text-xs font-mono text-slate-400 border-t border-slate-800 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Tracking:</span>
            {parcel.tracking_id ? (
              <button
                onClick={handleCopyTracking}
                title="Click to copy tracking ID"
                className="flex items-center space-x-1 font-mono text-slate-300 hover:text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 transition-colors"
              >
                <span className="truncate max-w-[140px]">{parcel.tracking_id}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
            ) : (
              <span className="text-slate-600 italic">No Tracking ID</span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Received:</span>
            <span className="text-slate-300">{formatDateTime(parcel.received_at)}</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Intake Guard:</span>
            <span className="text-blue-300">@{parcel.received_by}</span>
          </div>
        </div>
      </div>

      {/* Action Button: Mark As Delivered */}
      <div className="mt-5 pt-3 border-t border-slate-800">
        <button
          onClick={() => {
            onSelectDeliver(parcel);
          }}
          disabled={isDelivering}
          className={`w-full py-2.5 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all transform active:scale-98 shadow-sm disabled:cursor-wait disabled:opacity-60 ${
            isOverdue
              ? 'bg-red-700 hover:bg-red-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          <CheckCircle className="w-4 h-4 stroke-[2.5]" />
          <span>{isDelivering ? 'MARKING DELIVERED...' : 'MARK AS DELIVERED'}</span>
        </button>
      </div>
    </motion.div>
  );
}
