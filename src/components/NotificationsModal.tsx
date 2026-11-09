import React, { useState, useEffect } from 'react';
import { X, Mail, Send, CheckCircle2, AlertCircle, Clock, Calendar, Sparkles } from 'lucide-react';
import { EmailNotification } from '../types';
import { api } from '../api';
import { formatDate } from '../utils';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreferences: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onOpenPreferences,
}) => {
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<EmailNotification | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string>('');

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await api.getNotifications();
      setNotifications(data);
      if (data.length > 0 && !selectedNotif) {
        setSelectedNotif(data[0]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendTest = async () => {
    try {
      setIsSendingTest(true);
      setTestSuccessMessage('');
      const res = await api.sendTestNotification();
      setTestSuccessMessage('Test email alert dispatched successfully to outbox!');
      await loadNotifications();
      setSelectedNotif(res.notification);
      setTimeout(() => setTestSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch test notification');
    } finally {
      setIsSendingTest(false);
    }
  };

  const getBadgeForTrigger = (trigger: string) => {
    switch (trigger) {
      case 'status_selected':
        return { label: 'Offer / Selected', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'status_rejected':
        return { label: 'Rejection Notice', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'interview_reminder':
        return { label: 'Interview Reminder', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: 'System Alert', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Email Notification Outbox & Logs</h2>
              <p className="text-xs text-slate-500">
                Automated email alerts for offers, rejections, and upcoming interview dates
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingTest ? 'Sending...' : 'Send Test Alert'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {testSuccessMessage && (
          <div className="bg-emerald-50 px-6 py-2 border-b border-emerald-100 text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{testSuccessMessage}</span>
          </div>
        )}

        {/* Master / Detail split view */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Email List */}
          <div className="w-2/5 border-r border-slate-200 overflow-y-auto bg-slate-50/50 p-3 space-y-2">
            <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-500 font-medium">
              <span>Dispatched Emails ({notifications.length})</span>
              <button
                onClick={onOpenPreferences}
                className="text-blue-600 hover:text-blue-800 text-[11px]"
              >
                Preferences
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-10 text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">No emails dispatched yet.</div>
            ) : (
              notifications.map((n) => {
                const isSelected = selectedNotif?.id === n.id;
                const badge = getBadgeForTrigger(n.trigger_type);
                return (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNotif(n)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? 'bg-white border-blue-500 shadow-xs'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(n.sent_at)}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 truncate mb-1">{n.subject}</div>
                    <p className="text-slate-500 text-[11px] line-clamp-2">{n.body}</p>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Rendered Email Preview */}
          <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col">
            {selectedNotif ? (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      Status: {selectedNotif.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Timestamp: {selectedNotif.sent_at}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{selectedNotif.subject}</h3>
                  <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                    <span className="font-medium text-slate-700">To:</span>
                    <span>{selectedNotif.recipient_email}</span>
                    <span>·</span>
                    <span className="font-medium text-slate-700">From:</span>
                    <span>JobTrack Automated Delivery &lt;notifications@jobtrack.io&gt;</span>
                  </div>
                </div>

                {/* Email Body Card */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 text-xs text-slate-800 leading-relaxed">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-200 text-slate-900 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>JobTrack Alert Dispatcher</span>
                  </div>

                  <div className="whitespace-pre-line text-xs font-normal text-slate-700">
                    {selectedNotif.body}
                  </div>

                  <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400">
                    You received this email because notification alerts are enabled in your JobTrack account preferences.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Select an email from the left list to preview contents.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Real-time delivery hooks connected to application status pipeline.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
