import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Upload,
  Download,
  Trash2,
  Calendar,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  History,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { JobApplication, ApplicationDocument, StatusHistory, JobStatus } from '../types';
import { api } from '../api';
import { getStatusColor, formatFileSize, formatDate } from '../utils';

interface ApplicationDetailsModalProps {
  applicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChangeRequest: (app: JobApplication, newStatus: JobStatus) => void;
  onApplicationUpdated: () => void;
}

export const ApplicationDetailsModal: React.FC<ApplicationDetailsModalProps> = ({
  applicationId,
  isOpen,
  onClose,
  onStatusChangeRequest,
  onApplicationUpdated,
}) => {
  const [app, setApp] = useState<(JobApplication & { documents: ApplicationDocument[] }) | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'history'>('details');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [uploadDocType, setUploadDocType] = useState<string>('resume');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!applicationId) return;
    try {
      setIsLoading(true);
      const [appData, histData] = await Promise.all([
        api.getApplication(applicationId),
        api.getApplicationHistory(applicationId),
      ]);
      setApp(appData);
      setHistory(histData);
    } catch (err) {
      console.error('Error fetching application details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && applicationId) {
      loadData();
    }
  }, [isOpen, applicationId]);

  if (!isOpen || !applicationId) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError('');

      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        await api.uploadDocument(applicationId, {
          doc_type: uploadDocType,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || 'application/pdf',
          file_data: base64String,
        });

        // Reload data
        await loadData();
        onApplicationUpdated();
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document');
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.deleteDocument(docId);
      await loadData();
      onApplicationUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  const statusColor = app ? getStatusColor(app.status) : getStatusColor('Applied');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">{app?.job_position || 'Application Details'}</h2>
              {app && (
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                  {app.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span className="font-medium text-slate-700">{app?.company_name}</span>
              <span>·</span>
              <span>Applied {formatDate(app?.application_date)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center border-b border-slate-200 px-6 gap-6 bg-white text-xs font-medium">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'details' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Job Specs
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'documents' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Attached Documents</span>
            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px]">
              {app?.documents?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Status Timeline</span>
            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px]">
              {history.length}
            </span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
              Loading application details...
            </div>
          ) : !app ? (
            <div className="text-center py-8 text-xs text-rose-500">Could not load application details.</div>
          ) : (
            <>
              {/* TAB 1: DETAILS */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Status Banner with quick change */}
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${statusColor.bg} ${statusColor.border}`}>
                    <div>
                      <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Current Application Status
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${statusColor.dot}`} />
                        <span className={`text-sm font-bold ${statusColor.text}`}>{app.status}</span>
                      </div>
                      {app.status === 'On Hold' && app.on_hold_reason && (
                        <p className="text-xs text-amber-900 mt-2 bg-amber-100/70 p-2 rounded-lg border border-amber-200">
                          <strong>Reason:</strong> {app.on_hold_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-xs font-medium text-slate-600">Update:</label>
                      <select
                        value={app.status}
                        onChange={(e) => onStatusChangeRequest(app, e.target.value as JobStatus)}
                        className="text-xs font-medium bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Applied">Applied (Blue)</option>
                        <option value="Interview">Interview (Purple)</option>
                        <option value="Selected">Selected (Green)</option>
                        <option value="Rejected">Rejected (Red)</option>
                        <option value="On Hold">On Hold (Orange)</option>
                      </select>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Location</span>
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.job_location || 'Not specified'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Job Type</span>
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.job_type}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Compensation</span>
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{app.salary || 'Undisclosed'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Interview Date</span>
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.interview_date ? formatDate(app.interview_date) : 'None scheduled'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Job Description */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                      Job Description & Notes
                    </h4>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {app.job_description || 'No description notes added for this job position.'}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-5">
                  <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl">
                    <h4 className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-blue-600" />
                      Attach Resumes & Application Documents
                    </h4>
                    <p className="text-xs text-blue-800 mb-3">
                      Associate specific resume versions, tailored cover letters, portfolio decks, or job offers directly with this application.
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={uploadDocType}
                        onChange={(e) => setUploadDocType(e.target.value)}
                        className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="resume">Resume / CV</option>
                        <option value="cover_letter">Cover Letter</option>
                        <option value="portfolio">Portfolio / Work Sample</option>
                        <option value="offer_letter">Offer Letter</option>
                        <option value="other">Other Attachment</option>
                      </select>

                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploading ? 'Uploading...' : 'Choose File to Upload'}</span>
                      </button>
                    </div>

                    {uploadError && (
                      <p className="text-xs text-rose-600 mt-2 font-medium">{uploadError}</p>
                    )}
                  </div>

                  {/* Documents List */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Associated Documents ({app.documents?.length || 0})
                    </h5>

                    {(!app.documents || app.documents.length === 0) ? (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                        No documents attached yet. Click above to attach your resume or cover letter.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {app.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-slate-900">{doc.file_name}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span className="capitalize font-medium text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                                    {doc.doc_type.replace('_', ' ')}
                                  </span>
                                  <span>·</span>
                                  <span className="font-mono">{formatFileSize(doc.file_size)}</span>
                                  <span>·</span>
                                  <span>Uploaded {formatDate(doc.uploaded_at)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <a
                                href={api.getDocumentDownloadUrl(doc.id)}
                                download={doc.file_name}
                                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Download File"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Document"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: STATUS TIMELINE */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Application Status History
                  </h5>

                  {history.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">No status transitions recorded yet.</div>
                  ) : (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {history.map((hist) => {
                        const histColor = getStatusColor(hist.new_status);
                        return (
                          <div key={hist.id} className="relative text-xs">
                            <span className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${histColor.dot}`} />
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className={`font-semibold px-2 py-0.5 rounded-full text-[11px] border ${histColor.bg} ${histColor.text} ${histColor.border}`}>
                                  {hist.new_status}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {formatDate(hist.changed_at)}
                                </span>
                              </div>
                              {hist.reason && (
                                <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                                  {hist.reason}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400 mt-1">
                                Changed from <span className="font-medium text-slate-600">{hist.previous_status}</span>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
