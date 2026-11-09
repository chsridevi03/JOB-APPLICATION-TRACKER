import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  RotateCcw,
  LayoutGrid,
  List,
  Calendar,
  Building2,
  DollarSign,
  MapPin,
  FileText,
  Clock,
  MoreVertical,
  Trash2,
  Edit,
  ExternalLink,
  Paperclip,
  Briefcase,
} from 'lucide-react';
import { JobApplication, Company, JobStatus } from '../types';
import { getStatusColor, formatDate } from '../utils';

interface ApplicationsViewProps {
  applications: JobApplication[];
  companies: Company[];
  onOpenNewApplication: () => void;
  onEditApplication: (app: JobApplication) => void;
  onDeleteApplication: (id: string) => void;
  onOpenApplicationDetails: (id: string) => void;
  onStatusChangeRequest: (app: JobApplication, newStatus: JobStatus) => void;
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  applications,
  companies,
  onOpenNewApplication,
  onEditApplication,
  onDeleteApplication,
  onOpenApplicationDetails,
  onStatusChangeRequest,
}) => {
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        // Status filter
        if (statusFilter !== 'all' && app.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
        // Company filter
        if (companyFilter !== 'all' && app.company_id !== companyFilter) {
          return false;
        }
        // Search
        if (search.trim()) {
          const s = search.toLowerCase();
          const matchPos = app.job_position.toLowerCase().includes(s);
          const matchComp = (app.company_name || '').toLowerCase().includes(s);
          const matchLoc = (app.job_location || '').toLowerCase().includes(s);
          if (!matchPos && !matchComp && !matchLoc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.application_date).getTime();
        const timeB = new Date(b.application_date).getTime();
        return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA;
      });
  }, [applications, search, statusFilter, companyFilter, sortOrder]);

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCompanyFilter('all');
    setSortOrder('newest');
  };

  const hasActiveFilters = search || statusFilter !== 'all' || companyFilter !== 'all' || sortOrder !== 'newest';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Job Applications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your opportunities, status progression, and attached documents
          </p>
        </div>
        <button
          onClick={onOpenNewApplication}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Application</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job position, company name, or location..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="Applied">Applied (Blue)</option>
              <option value="Interview">Interview (Purple)</option>
              <option value="Selected">Selected (Green)</option>
              <option value="Rejected">Rejected (Red)</option>
              <option value="On Hold">On Hold (Orange)</option>
            </select>

            {/* Company Filter */}
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 max-w-[160px] truncate"
            >
              <option value="all">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                title="Clear all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="font-mono text-slate-800">{filteredApplications.length}</strong> of{' '}
            <strong className="font-mono text-slate-800">{applications.length}</strong> applications
          </span>
          {hasActiveFilters && (
            <span className="text-[11px] text-blue-600">Active filters applied</span>
          )}
        </div>
      </div>

      {/* APPLICATIONS LIST */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No applications match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or record a new job application.
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Job Position & Company</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Location & Type</th>
                  <th className="py-3 px-4">Salary</th>
                  <th className="py-3 px-4">Status & Reason</th>
                  <th className="py-3 px-4 text-center">Docs</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app) => {
                  const statusColor = getStatusColor(app.status);
                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onOpenApplicationDetails(app.id)}
                    >
                      {/* Position & Company */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {app.job_position}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="font-medium text-slate-700">{app.company_name}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {formatDate(app.application_date)}
                      </td>

                      {/* Location & Type */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div>{app.job_location || 'Remote'}</div>
                        <div className="text-[11px] text-slate-400">{app.job_type}</div>
                      </td>

                      {/* Salary */}
                      <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {app.salary || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1 items-start">
                          <select
                            value={app.status}
                            onChange={(e) => onStatusChangeRequest(app, e.target.value as JobStatus)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full border focus:outline-none cursor-pointer ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                          >
                            <option value="Applied">Applied (Blue)</option>
                            <option value="Interview">Interview (Purple)</option>
                            <option value="Selected">Selected (Green)</option>
                            <option value="Rejected">Rejected (Red)</option>
                            <option value="On Hold">On Hold (Orange)</option>
                          </select>
                          {app.status === 'On Hold' && app.on_hold_reason && (
                            <span
                              className="text-[10px] text-amber-800 italic truncate max-w-[180px]"
                              title={app.on_hold_reason}
                            >
                              "{app.on_hold_reason}"
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Docs Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono ${
                            (app.documentsCount || 0) > 0
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-slate-400'
                          }`}
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>{app.documentsCount || 0}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenApplicationDetails(app.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View details & attachments"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditApplication(app)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit application"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteApplication(app.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete application"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApplications.map((app) => {
            const statusColor = getStatusColor(app.status);
            return (
              <div
                key={app.id}
                onClick={() => onOpenApplicationDetails(app.id)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                    >
                      {app.status}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {formatDate(app.application_date)}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors">
                    {app.job_position}
                  </h3>
                  <div className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{app.company_name}</span>
                  </div>

                  {app.status === 'On Hold' && app.on_hold_reason && (
                    <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-snug">
                      <strong className="block text-[10px] uppercase text-amber-800">Reason:</strong>
                      {app.on_hold_reason}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{app.job_location || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono truncate">{app.salary || 'Undisclosed'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                    <span>{app.documentsCount || 0} docs</span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onEditApplication(app)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit application"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteApplication(app.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete application"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
