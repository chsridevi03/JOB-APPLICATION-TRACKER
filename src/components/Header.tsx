import React from 'react';
import { Plus, Bell, Radio } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewApplication: () => void;
  onOpenNotifications: () => void;
  isConnected: boolean;
  user: User | null;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewApplication,
  onOpenNotifications,
  isConnected,
  user,
  unreadCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Brand wordmark & Real-time Live connection pill */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap hover:text-blue-600 transition-colors"
          >
            JobTrack
          </button>
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={isConnected ? 'WebSocket real-time sync active' : 'Connecting to WebSocket...'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className="hidden sm:inline">{isConnected ? 'Live Sync' : 'Connecting'}</span>
          </div>
        </div>

        {/* Zone 2: 4–5 single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentTab === 'dashboard' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onSelectTab('applications')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentTab === 'applications' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'hover:text-slate-900'
            }`}
          >
            Applications
          </button>
          <button
            onClick={() => onSelectTab('on_hold')}
            className={`whitespace-nowrap transition-colors py-1 flex items-center gap-1.5 ${
              currentTab === 'on_hold' ? 'text-amber-600 font-bold border-b-2 border-amber-600' : 'hover:text-slate-900'
            }`}
          >
            <span>On Hold</span>
          </button>
          <button
            onClick={() => onSelectTab('companies')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentTab === 'companies' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'hover:text-slate-900'
            }`}
          >
            Companies
          </button>
          <button
            onClick={() => onSelectTab('profile')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentTab === 'profile' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'hover:text-slate-900'
            }`}
          >
            Profile & Alerts
          </button>
        </nav>

        {/* Zone 3: Primary Action & Notifications */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenNotifications}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors relative"
            title="Email Notifications Outbox"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>

          <button
            onClick={onOpenNewApplication}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Application</span>
          </button>
        </div>
      </div>
    </header>
  );
};
