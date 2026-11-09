import { JobStatus } from './types';

export function getStatusColor(status: JobStatus | string) {
  switch (status) {
    case 'Applied':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-600',
        hex: '#2563EB',
        lightBg: '#EFF6FF',
      };
    case 'Interview':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        dot: 'bg-purple-600',
        hex: '#9333EA',
        lightBg: '#FAF5FF',
      };
    case 'Selected':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-600',
        hex: '#16A34A',
        lightBg: '#F0FDF4',
      };
    case 'Rejected':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-600',
        hex: '#DC2626',
        lightBg: '#FFF1F2',
      };
    case 'On Hold':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-600',
        hex: '#EA580C',
        lightBg: '#FFFBEB',
      };
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-500',
        hex: '#64748B',
        lightBg: '#F8FAFC',
      };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[month - 1]} ${day}, ${year}`;
    }
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}
