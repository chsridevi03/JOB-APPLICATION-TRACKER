import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Edit3,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { JobApplication, JobStatus } from '../types';
import { formatDate } from '../utils';

interface OnHoldViewProps {
  applications: JobApplication[];
  onOpenDetails: (id: string) => void;
  onEditReason: (app: JobApplication) => void;
  onStatusChangeRequest: (app: JobApplication, newStatus: JobStatus) => void;
}

export const OnHoldView: React.FC<OnHoldViewProps> = ({
  applications,
  onOpenDetails,
  onEditReason,
  onStatusChangeRequest,
}) => {
  const onHoldApps = applications.filter((a) => a.status === 'On Hold');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-amber-950">On Hold Applications</h1>
            <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
              Applications where the hiring process has been postponed, paused, or delayed. Review logged reasons, amend explanations as company situations evolve, or resume candidates back into the active pipeline.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of On Hold Applications */}
      {onHoldApps.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No Applications Currently On Hold</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All your job applications are actively progressing or concluded. When an employer pauses recruitment, set their status to On Hold to track reasons here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {onHoldApps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl border border-amber-200 p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    On Hold
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Applied {formatDate(app.application_date)}
                  </span>
                </div>

                {/* Title & Company */}
                <h3
                  onClick={() => onOpenDetails(app.id)}
                  className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {app.job_position}
                </h3>
                <div className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{app.company_name}</span>
                  <span>·</span>
                  <span>{app.job_location || 'Remote'}</span>
                </div>

                {/* Reason Callout */}
                <div className="mt-4 p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-950">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-amber-800">
                      Reason For Hold
                    </span>
                    <button
                      onClick={() => onEditReason(app)}
                      className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Reason</span>
                    </button>
                  </div>
                  <p className="leading-relaxed">
                    {app.on_hold_reason || 'No specific reason entered.'}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => onOpenDetails(app.id)}
                  className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Full Details</span>
                </button>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-500">Resume To:</label>
                  <select
                    value={app.status}
                    onChange={(e) => onStatusChangeRequest(app, e.target.value as JobStatus)}
                    className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="On Hold">Keep On Hold</option>
                    <option value="Applied">Resume to Applied</option>
                    <option value="Interview">Resume to Interview</option>
                    <option value="Selected">Move to Selected</option>
                    <option value="Rejected">Move to Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
