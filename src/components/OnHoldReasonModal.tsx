import React, { useState } from 'react';
import { AlertCircle, X, Check } from 'lucide-react';

interface OnHoldReasonModalProps {
  isOpen: boolean;
  jobPosition: string;
  companyName: string;
  initialReason?: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  'Company postponed recruitment.',
  'Position temporarily unavailable.',
  'Waiting for HR response.',
  'Recruitment process delayed.',
  'Budget realignment for upcoming quarter.',
  'Hiring manager on leave.',
  'Other reason',
];

export const OnHoldReasonModal: React.FC<OnHoldReasonModalProps> = ({
  isOpen,
  jobPosition,
  companyName,
  initialReason = '',
  onClose,
  onSubmit,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(
    PRESET_REASONS.includes(initialReason) ? initialReason : initialReason ? 'Other reason' : ''
  );
  const [customReason, setCustomReason] = useState<string>(
    PRESET_REASONS.includes(initialReason) ? '' : initialReason
  );
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePresetSelect = (reason: string) => {
    setSelectedPreset(reason);
    if (reason !== 'Other reason') {
      setCustomReason('');
    }
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedPreset === 'Other reason' ? customReason.trim() : (selectedPreset || customReason).trim();

    if (!finalReason) {
      setError('Please provide a valid reason before marking this application as On Hold.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(finalReason);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update On Hold reason');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Reason for On Hold Status</h3>
              <p className="text-xs text-slate-500">
                {jobPosition} · {companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Please select or specify why this application is on hold. This reason will be recorded in the application history and displayed on your On Hold dashboard.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Common Reasons
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESET_REASONS.map((preset) => {
                const isSelected = selectedPreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`flex items-center justify-between px-3.5 py-2 text-xs rounded-lg text-left transition-all border ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-medium'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <span>{preset}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {(selectedPreset === 'Other reason' || !PRESET_REASONS.slice(0, -1).includes(selectedPreset)) && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Detailed Explanation <span className="text-amber-600">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setError('');
                }}
                rows={3}
                placeholder="e.g. Recruiter stated they are waiting for FY26 headcount approval..."
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Confirm On Hold Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
