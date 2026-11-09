import React, { useState, useEffect } from 'react';
import { X, Briefcase, PlusCircle, AlertCircle } from 'lucide-react';
import { Company, JobApplication, JobStatus, JobType } from '../types';
import { api } from '../api';

interface AddApplicationModalProps {
  isOpen: boolean;
  companies: Company[];
  editApplication?: JobApplication | null;
  onClose: () => void;
  onSuccess: (app: JobApplication) => void;
  onCompanyCreated?: (comp: Company) => void;
}

const PRESET_ON_HOLD_REASONS = [
  'Company postponed recruitment.',
  'Position temporarily unavailable.',
  'Waiting for HR response.',
  'Recruitment process delayed.',
  'Budget realignment for upcoming quarter.',
];

export const AddApplicationModal: React.FC<AddApplicationModalProps> = ({
  isOpen,
  companies,
  editApplication,
  onClose,
  onSuccess,
  onCompanyCreated,
}) => {
  const [companyId, setCompanyId] = useState<string>('');
  const [isAddingNewCompany, setIsAddingNewCompany] = useState<boolean>(false);
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [jobPosition, setJobPosition] = useState<string>('');
  const [applicationDate, setApplicationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [jobLocation, setJobLocation] = useState<string>('Remote');
  const [jobType, setJobType] = useState<JobType>('Full-time');
  const [salary, setSalary] = useState<string>('');
  const [status, setStatus] = useState<JobStatus>('Applied');
  const [onHoldReason, setOnHoldReason] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (editApplication) {
      setCompanyId(editApplication.company_id);
      setIsAddingNewCompany(false);
      setNewCompanyName('');
      setJobPosition(editApplication.job_position);
      setApplicationDate(editApplication.application_date);
      setInterviewDate(editApplication.interview_date || '');
      setJobLocation(editApplication.job_location || 'Remote');
      setJobType(editApplication.job_type || 'Full-time');
      setSalary(editApplication.salary || '');
      setStatus(editApplication.status);
      setOnHoldReason(editApplication.on_hold_reason || '');
      setJobDescription(editApplication.job_description || '');
    } else {
      setCompanyId(companies[0]?.id || '');
      setIsAddingNewCompany(false);
      setNewCompanyName('');
      setJobPosition('');
      setApplicationDate(new Date().toISOString().split('T')[0]);
      setInterviewDate('');
      setJobLocation('Remote');
      setJobType('Full-time');
      setSalary('');
      setStatus('Applied');
      setOnHoldReason('');
      setJobDescription('');
    }
    setError('');
  }, [editApplication, isOpen, companies]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobPosition.trim()) {
      setError('Job Position cannot be empty.');
      return;
    }
    if (!applicationDate) {
      setError('Application date is mandatory.');
      return;
    }
    if (isAddingNewCompany && !newCompanyName.trim()) {
      setError('Please provide a name for the new company.');
      return;
    }
    if (!isAddingNewCompany && !companyId) {
      setError('Please select an existing company or add a new one.');
      return;
    }
    if (status === 'On Hold' && !onHoldReason.trim()) {
      setError('An On Hold application must have a valid reason.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (editApplication) {
        const updated = await api.updateApplication(editApplication.id, {
          company_id: isAddingNewCompany ? undefined : companyId,
          job_position: jobPosition.trim(),
          application_date: applicationDate,
          interview_date: interviewDate || undefined,
          job_location: jobLocation.trim(),
          job_type: jobType,
          salary: salary.trim(),
          status,
          on_hold_reason: status === 'On Hold' ? onHoldReason.trim() : undefined,
          job_description: jobDescription.trim(),
        });
        onSuccess(updated);
      } else {
        const created = await api.createApplication({
          company_id: isAddingNewCompany ? undefined : companyId,
          new_company_name: isAddingNewCompany ? newCompanyName.trim() : undefined,
          job_position: jobPosition.trim(),
          application_date: applicationDate,
          interview_date: interviewDate || undefined,
          job_location: jobLocation.trim(),
          job_type: jobType,
          salary: salary.trim(),
          status,
          on_hold_reason: status === 'On Hold' ? onHoldReason.trim() : undefined,
          job_description: jobDescription.trim(),
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editApplication ? 'Edit Job Application' : 'Add New Job Application'}
              </h2>
              <p className="text-xs text-slate-500">Record application details, status, and timeline</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Company Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Company <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsAddingNewCompany(!isAddingNewCompany)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isAddingNewCompany ? 'Select Existing Company' : 'Add New Company'}</span>
              </button>
            </div>

            {isAddingNewCompany ? (
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="e.g. OpenAI, Stripe, Google"
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            ) : (
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} {c.location ? `(${c.location})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Job Position */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Job Position <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={jobPosition}
              onChange={(e) => setJobPosition(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Application Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Scheduled Interview (Optional)
              </label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Location, Job Type, Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Job Location</label>
              <input
                type="text"
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
                placeholder="e.g. Remote / New York"
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Job Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Salary / Range</label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. $140,000 - $160,000"
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Application Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Application Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
              className="w-full text-xs font-medium rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="Applied">Applied (Blue)</option>
              <option value="Interview">Interview (Purple)</option>
              <option value="Selected">Selected (Green)</option>
              <option value="Rejected">Rejected (Red)</option>
              <option value="On Hold">On Hold (Orange)</option>
            </select>
          </div>

          {/* If On Hold is selected, mandatory On Hold Reason field */}
          {status === 'On Hold' && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <label className="text-xs font-bold text-amber-900 block">
                On Hold Reason <span className="text-rose-600">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PRESET_ON_HOLD_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setOnHoldReason(preset)}
                    className="text-[11px] px-2.5 py-1 bg-white hover:bg-amber-100/70 border border-amber-300 rounded text-amber-900 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                value={onHoldReason}
                onChange={(e) => setOnHoldReason(e.target.value)}
                rows={2}
                placeholder="Provide reason why this application is currently on hold..."
                className="w-full text-xs rounded-lg border border-amber-300 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          )}

          {/* Job Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Job Description & Notes</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={3}
              placeholder="Paste requirements, job link, recruiter contact notes..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editApplication ? 'Save Changes' : 'Create Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
