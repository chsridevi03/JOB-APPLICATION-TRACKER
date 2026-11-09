import React from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Bell,
  Paperclip,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onDemoLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin,
  onDemoLogin,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Landing Top Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">JobTrack</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#pipeline" className="hover:text-slate-900 transition-colors">Pipeline System</a>
            <a href="#notifications" className="hover:text-slate-900 transition-colors">Smart Alerts</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg transition-colors"
            >
              Log In
            </button>
            <button
              onClick={onDemoLogin}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              1-Click Demo Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>Real-time Full-Stack Job Application Tracker</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 max-w-3xl leading-tight">
          Master your job search with <span className="text-blue-600">real-time pipeline intelligence</span>
        </h1>

        <p className="mt-4 text-base text-slate-600 max-w-2xl leading-relaxed">
          Record every application sent to employers, monitor status progression live, log mandatory On Hold reasons, attach tailored resumes, and receive instant email notifications when offers arrive.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onDemoLogin}
            className="px-6 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <span>Explore Live Demo (Sarah Connor)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onGetStarted}
            className="px-6 py-3 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-xs transition-colors"
          >
            Create Free Account
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div id="features" className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl w-fit mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Color-Coded Status Pipelines</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Track Applied (Blue), Interview (Purple), Selected (Green), Rejected (Red), and On Hold (Orange) with automatic transition logging.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-2xs bg-amber-50/10">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl w-fit mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Mandatory On Hold Intelligence</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Capture recruiter delay reasons, budget freezes, and headcount realignments with dedicated tracking and amendment tools.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl w-fit mb-4">
              <Paperclip className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Resume & Document Vault</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Attach customized CVs, cover letters, and formal offer letters directly to each opportunity with instant download and preview.
            </p>
          </div>
        </div>

        {/* Notification system highlight */}
        <div id="notifications" className="mt-12 bg-white rounded-2xl border border-slate-200 p-8 w-full max-w-4xl shadow-2xs text-left flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
              <Bell className="w-4 h-4" />
              <span>Automated Alerting Engine</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Configurable Email Notifications</h3>
            <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
              Receive automated email notifications the instant an application transitions to 'Selected' or 'Rejected', plus customizable advance alerts ahead of critical interviews.
            </p>
          </div>
          <button
            onClick={onDemoLogin}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 transition-colors"
          >
            Launch Tracker
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>© 2026 JobTrack. Real-Time Job Application Tracker. Built for software engineers, designers, and job seekers.</p>
      </footer>
    </div>
  );
};
