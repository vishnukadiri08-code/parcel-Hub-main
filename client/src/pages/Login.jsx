import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { sounds } from '../utils/sound';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(username, password);
      toast.success(
        'SECURITY CLEARANCE VERIFIED',
        `Welcome, ${user.fullName || user.username}. Authorized session established.`
      );
    } catch (err) {
      sounds.playAlertBeep();
      setError(err.message || 'Invalid credentials. Access rejected.');
      toast.error('AUTHENTICATION REJECTED', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-black">

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Main Card */}
        <div className="rounded-2xl border border-white/20 bg-neutral-950 p-7 sm:p-8 shadow-2xl relative overflow-hidden">

          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-3 text-blue-400 shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold font-mono tracking-tight text-white uppercase">
              CAMPUS PARCEL HUB
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
              Security Operations & Parcel Management
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-mono flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 font-semibold mb-1.5">
                Staff / Admin Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 font-semibold mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 rounded-xl glass-input text-sm font-mono placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all transform active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{isLoading ? 'AUTHENTICATING...' : 'ACCESS SECURITY DESK'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Footer info */}
        <p className="mt-4 text-center text-xs font-mono text-slate-500">
          Powered By Zenlyft
        </p>
      </motion.div>
    </div>
  );
}
