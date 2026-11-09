import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { JobApplication, DashboardStatistics, DashboardChartsData, StatusHistory } from '../types';
import { getStatusColor, formatDate } from '../utils';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface DashboardViewProps {
  stats: DashboardStatistics | null;
  charts: DashboardChartsData | null;
  recentApplications: JobApplication[];
  recentHistory: StatusHistory[];
  onOpenApplication: (appId: string) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenNewApplication: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  charts,
  recentApplications,
  recentHistory,
  onOpenApplication,
  onNavigateToTab,
  onOpenNewApplication,
}) => {
  const onHoldApps = recentApplications.filter((a) => a.status === 'On Hold');

  // Doughnut Chart Data for Status Distribution
  const doughnutData = {
    labels: charts?.statusDistribution.labels || ['Applied', 'Interview', 'Selected', 'Rejected', 'On Hold'],
    datasets: [
      {
        data: charts?.statusDistribution.data || [0, 0, 0, 0, 0],
        backgroundColor: charts?.statusDistribution.colors || ['#2563EB', '#9333EA', '#16A34A', '#DC2626', '#EA580C'],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 16,
          font: { family: 'Plus Jakarta Sans', size: 11 },
        },
      },
    },
    cutout: '70%',
  };

  // Bar Chart Data for Timeline
  const barData = {
    labels: charts?.timeline.labels || [],
    datasets: [
      {
        label: 'Applications Submitted',
        data: charts?.timeline.data || [],
        backgroundColor: '#3B82F6',
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { family: 'JetBrains Mono', size: 10 } },
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
      },
      x: {
        ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pipeline metrics, application velocity, and candidate responses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToTab('applications')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            View All Applications
          </button>
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            <Briefcase className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {stats?.total ?? 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active pipeline</span>
        </div>

        {/* Applied - Blue */}
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Applied</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-600 tabular-nums">
            {stats?.applied ?? 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting reply</span>
        </div>

        {/* Interview - Purple */}
        <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-2xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Interview</span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600 tabular-nums">
            {stats?.interview ?? 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">In conversation</span>
        </div>

        {/* Selected - Green */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Selected</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
            {stats?.selected ?? 0}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Offers extended</span>
        </div>

        {/* Rejected - Red */}
        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 tabular-nums">
            {stats?.rejected ?? 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Closed process</span>
        </div>

        {/* On Hold - Orange */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">On Hold</span>
            <PauseCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
            {stats?.onHold ?? 0}
          </div>
          <span className="text-[11px] text-amber-800 font-medium mt-1 block">Reason logged</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doughnut Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Application Status Distribution</h3>
              <p className="text-xs text-slate-500">Live share across all application stages</p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-400">Chart.js</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Application Velocity Over Time</h3>
              <p className="text-xs text-slate-500">Submissions over the last 6 months</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* On Hold Highlight Section if any */}
      {onHoldApps.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-bold text-amber-900">Applications Currently On Hold</h3>
            </div>
            <button
              onClick={() => onNavigateToTab('on_hold')}
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
            >
              <span>Manage all On Hold</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {onHoldApps.slice(0, 2).map((app) => (
              <div
                key={app.id}
                onClick={() => onOpenApplication(app.id)}
                className="bg-white p-3.5 rounded-lg border border-amber-200 hover:border-amber-300 cursor-pointer shadow-2xs transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-xs">{app.job_position}</span>
                  <span className="text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    On Hold
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{app.company_name}</div>
                {app.on_hold_reason && (
                  <p className="text-xs text-amber-900 mt-2 bg-amber-50 p-2 rounded border border-amber-100 line-clamp-2">
                    <strong>Reason:</strong> {app.on_hold_reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Grid: Recent Applications & Status History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Applications</h3>
              <p className="text-xs text-slate-500">Latest roles added to your tracker</p>
            </div>
            <button
              onClick={() => onNavigateToTab('applications')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentApplications.slice(0, 5).map((app) => {
              const statusColor = getStatusColor(app.status);
              return (
                <div
                  key={app.id}
                  onClick={() => onOpenApplication(app.id)}
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-900">{app.job_position}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="font-medium text-slate-700">{app.company_name}</span>
                      <span>·</span>
                      <span>{app.job_location || 'Remote'}</span>
                      <span>·</span>
                      <span className="font-mono">{formatDate(app.application_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                    >
                      {app.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status History Stream (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Latest Pipeline Updates</h3>
            <p className="text-xs text-slate-500">Live feed of status changes</p>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {recentHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No status changes yet.</div>
            ) : (
              recentHistory.slice(0, 6).map((item) => {
                const sColor = getStatusColor(item.new_status);
                return (
                  <div key={item.id} className="text-xs space-y-1 pb-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                        {item.job_position}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${sColor.bg} ${sColor.text} ${sColor.border}`}>
                        {item.new_status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      <span>{item.company_name}</span>
                      {item.reason && <p className="text-slate-600 italic mt-0.5 text-[11px]">"{item.reason}"</p>}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatDate(item.changed_at)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
