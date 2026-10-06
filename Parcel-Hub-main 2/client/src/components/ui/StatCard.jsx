import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  accent = 'cyan', 
  subtitle, 
  badge,
  isAlert = false,
  onClick 
}) {
  const accentClasses = {
    cyan: {
      border: 'border-blue-500/25 hover:border-blue-500/50',
      text: 'text-blue-400',
      glow: 'shadow-sm',
      bgIcon: 'bg-blue-600/10 text-blue-400',
      badgeBg: 'bg-blue-950 text-blue-300 border-blue-800/60'
    },
    emerald: {
      border: 'border-emerald-500/25 hover:border-emerald-500/50',
      text: 'text-emerald-400',
      glow: 'shadow-sm',
      bgIcon: 'bg-emerald-600/10 text-emerald-400',
      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
    },
    amber: {
      border: 'border-amber-500/25 hover:border-amber-500/50',
      text: 'text-amber-400',
      glow: 'shadow-sm',
      bgIcon: 'bg-amber-600/10 text-amber-400',
      badgeBg: 'bg-amber-950 text-amber-300 border-amber-800/60'
    },
    red: {
      border: 'border-red-500/35 hover:border-red-500/60',
      text: 'text-red-400',
      glow: 'shadow-sm',
      bgIcon: 'bg-red-600/10 text-red-400',
      badgeBg: 'bg-red-950 text-red-300 border-red-800/60'
    }
  }[accent] || {
    border: 'border-slate-700 hover:border-slate-600',
    text: 'text-slate-200',
    glow: 'shadow-sm',
    bgIcon: 'bg-slate-800 text-slate-300',
    badgeBg: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={onClick}
      className={`relative p-5 rounded-2xl border backdrop-blur-xl bg-command-900/70 transition-all ${accentClasses.border} ${
        isAlert ? 'animate-pulse-slow border-cyber-red/60 shadow-glow-red' : ''
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-medium">
            {title}
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className={`text-3xl font-extrabold font-mono tracking-tight ${accentClasses.text}`}>
              {value}
            </span>
            {badge && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${accentClasses.badgeBg}`}>
                {badge}
              </span>
            )}
          </div>
        </div>

        <div className={`p-3 rounded-xl border border-white/5 ${accentClasses.bgIcon}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {subtitle && (
        <p className="mt-3 text-xs text-slate-400 font-mono flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span>{subtitle}</span>
        </p>
      )}

      {/* Decorative corner tick */}
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-white/20 rounded-tr-lg" />
    </motion.div>
  );
}
