import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Lock,
  Bell,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Save,
  Calendar,
} from 'lucide-react';
import { User, UserPreferences } from '../types';
import { api } from '../api';
import { formatDate } from '../utils';

interface ProfileViewProps {
  user: User;
  onLogout: () => void;
  onUserUpdated: (user: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onLogout,
  onUserUpdated,
}) => {
  // Profile info
  const [name, setName] = useState<string>(user.name);
  const [email, setEmail] = useState<string>(user.email);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [profileSuccess, setProfileSuccess] = useState<string>('');
  const [profileError, setProfileError] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // Notification preferences
  const prefs = user.preferences || {
    email_on_selected: true,
    email_on_rejected: true,
    email_interview_reminder: true,
    interview_reminder_days: 2,
  };

  const [emailOnSelected, setEmailOnSelected] = useState<boolean>(prefs.email_on_selected);
  const [emailOnRejected, setEmailOnRejected] = useState<boolean>(prefs.email_on_rejected);
  const [emailInterviewReminder, setEmailInterviewReminder] = useState<boolean>(prefs.email_interview_reminder);
  const [reminderDays, setReminderDays] = useState<number>(prefs.interview_reminder_days || 2);
  const [prefsSuccess, setPrefsSuccess] = useState<string>('');
  const [isSavingPrefs, setIsSavingPrefs] = useState<boolean>(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (newPassword && newPassword !== confirmPassword) {
      setProfileError('New password and confirmation do not match.');
      return;
    }

    try {
      setIsSavingProfile(true);
      const res = await api.updateProfile({
        name: name.trim(),
        email: email.trim(),
        new_password: newPassword || undefined,
        current_password: currentPassword || undefined,
      });
      setProfileSuccess('Profile updated successfully.');
      onUserUpdated(res.user);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSavingPrefs(true);
      setPrefsSuccess('');
      const updatedPrefs: UserPreferences = {
        email_on_selected: emailOnSelected,
        email_on_rejected: emailOnRejected,
        email_interview_reminder: emailInterviewReminder,
        interview_reminder_days: Number(reminderDays),
      };
      await api.updatePreferences(updatedPrefs);
      setPrefsSuccess('Notification preferences saved successfully.');
      onUserUpdated({ ...user, preferences: updatedPrefs });
      setTimeout(() => setPrefsSuccess(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save preferences');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Account & Notification Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your personal profile, credentials, and automated email alerts
          </p>
        </div>
        <button
          onClick={onLogout}
          className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">User Profile</h2>
              <span className="text-[11px] text-slate-400">
                Member since {formatDate(user.created_at)}
              </span>
            </div>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                Change Password (Optional)
              </span>

              <div className="space-y-1">
                <label className="text-slate-600">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Required only when changing password"
                  className="w-full rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-600">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600">Confirm New</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new"
                    className="w-full rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full mt-2 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingProfile ? 'Saving...' : 'Update Profile & Password'}</span>
            </button>
          </form>
        </div>

        {/* Notification Preferences Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Email Notification Preferences</h2>
                <span className="text-[11px] text-slate-400">
                  Configure automated dispatch triggers
                </span>
              </div>
            </div>

            {prefsSuccess && (
              <div className="p-3 my-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{prefsSuccess}</span>
              </div>
            )}

            <div className="space-y-4 mt-4 text-xs">
              {/* Trigger 1: Selected */}
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={emailOnSelected}
                  onChange={(e) => setEmailOnSelected(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-slate-800 block">Offer Extended ('Selected') Alert</span>
                  <span className="text-slate-500 text-[11px]">
                    Receive an immediate email alert when any application is marked as Selected.
                  </span>
                </div>
              </label>

              {/* Trigger 2: Rejected */}
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={emailOnRejected}
                  onChange={(e) => setEmailOnRejected(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-slate-800 block">Status Change to 'Rejected'</span>
                  <span className="text-slate-500 text-[11px]">
                    Receive an email update when an employer concludes or rejects an application.
                  </span>
                </div>
              </label>

              {/* Trigger 3: Interview Reminders */}
              <div className="p-3 rounded-lg border border-slate-200 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailInterviewReminder}
                    onChange={(e) => setEmailInterviewReminder(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Scheduled Interview Reminders</span>
                    <span className="text-slate-500 text-[11px]">
                      Receive automated advance reminders ahead of scheduled interviews.
                    </span>
                  </div>
                </label>

                {emailInterviewReminder && (
                  <div className="pl-7 flex items-center gap-2 pt-1 border-t border-slate-100">
                    <span className="text-slate-600">Send reminder:</span>
                    <select
                      value={reminderDays}
                      onChange={(e) => setReminderDays(Number(e.target.value))}
                      className="rounded border border-slate-300 px-2.5 py-1 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1 day before</option>
                      <option value={2}>2 days before</option>
                      <option value={3}>3 days before</option>
                      <option value={5}>5 days before</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSavePreferences}
            disabled={isSavingPrefs}
            className="w-full mt-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingPrefs ? 'Saving...' : 'Save Notification Preferences'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
