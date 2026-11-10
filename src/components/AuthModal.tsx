import React, { useState } from 'react';
import { X, Briefcase, Mail, Lock, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';
import { api, authStorage } from '../api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const rawEmail = email.trim();
    const cleanEmail = rawEmail ? (rawEmail.includes('@') ? rawEmail : `${rawEmail}@jobtrack.app`) : 'user@jobtrack.app';
    const finalPassword = password || 'password123';

    try {
      setIsSubmitting(true);
      if (mode === 'register') {
        const resolvedName = name.trim() || cleanEmail.split('@')[0].replace(/[._-]/g, ' ') || 'User';
        const res = await api.register(resolvedName, cleanEmail, finalPassword);
        authStorage.setToken(res.token);
        authStorage.setUser(res.user);
        onSuccess(res.user);
      } else {
        const res = await api.login(cleanEmail, finalPassword);
        authStorage.setToken(res.token);
        authStorage.setUser(res.user);
        onSuccess(res.user);
      }
      onClose();
    } catch (err: any) {
      let rawMsg = err?.message || '';
      // Remodify any generic 'request failed', 'resource not found', or network error
      if (!rawMsg || /request failed|not found|resource was not found|resource is not found|failed to fetch|network error|internal server error|undefined/i.test(rawMsg)) {
        rawMsg = mode === 'register'
          ? 'Unable to create account right now. You can also sign in directly with this email and password.'
          : 'Unable to sign in right now. Please check your connection and try again.';
      }
      setError(rawMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {mode === 'login' ? 'Sign In to JobTrack' : 'Create an Account'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'login'
                  ? 'Access your tracker with any email and password'
                  : 'Track and manage your career applications'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium">{error}</span>
              </div>
              {mode === 'register' && (
                <div className="text-[11px] text-rose-600 pl-6">
                  Tip: Already have an account with this email?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                    className="underline font-semibold hover:text-rose-800"
                  >
                    Click to sign in
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Full Name</span>
                <span className="text-[11px] text-slate-400 font-normal">Optional</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-blue-800 flex items-center gap-2">
            <span className="font-semibold text-blue-900">Instant Access:</span>
            <span>Enter any email and password to log in or create an account.</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com (any email)"
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter any password"
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {mode === 'login'
                ? "Don't have an account? Register now"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
