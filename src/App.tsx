import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { api, authStorage, realtimeClient } from './api';
import {
  User,
  Company,
  JobApplication,
  DashboardStatistics,
  DashboardChartsData,
  StatusHistory,
  JobStatus,
  EmailNotification,
} from './types';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ApplicationsView } from './components/ApplicationsView';
import { OnHoldView } from './components/OnHoldView';
import { CompaniesView } from './components/CompaniesView';
import { ProfileView } from './components/ProfileView';
import { AddApplicationModal } from './components/AddApplicationModal';
import { AddCompanyModal } from './components/AddCompanyModal';
import { ApplicationDetailsModal } from './components/ApplicationDetailsModal';
import { OnHoldReasonModal } from './components/OnHoldReasonModal';
import { NotificationsModal } from './components/NotificationsModal';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [user, setUser] = useState<User | null>(authStorage.getUser());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // App data
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [charts, setCharts] = useState<DashboardChartsData | null>(null);
  const [recentHistory, setRecentHistory] = useState<StatusHistory[]>([]);
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isAddAppOpen, setIsAddAppOpen] = useState<boolean>(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState<boolean>(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Mandatory On Hold Reason Modal State
  const [onHoldModalState, setOnHoldModalState] = useState<{
    isOpen: boolean;
    app: JobApplication | null;
    initialReason?: string;
  }>({
    isOpen: false,
    app: null,
  });

  // Toast banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'alert' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'alert' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load all applet data
  const loadAppData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [appsData, compsData, statsData, chartsData, histData, notifsData] = await Promise.all([
        api.getApplications(),
        api.getCompanies(),
        api.getDashboardStats(),
        api.getDashboardCharts(),
        api.getRecentHistory(),
        api.getNotifications(),
      ]);

      setApplications(appsData);
      setCompanies(compsData);
      setStats(statsData);
      setCharts(chartsData);
      setRecentHistory(histData);
      setNotifications(notifsData);
      setUnreadCount(notifsData.length);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth and connect WebSocket on mount
  useEffect(() => {
    const existing = authStorage.getUser();
    if (existing) {
      setUser(existing);
      loadAppData();
    }

    // Start WebSocket
    realtimeClient.connect();

    const unsubscribe = realtimeClient.subscribe((event) => {
      if (event.type === 'WS_STATUS') {
        setIsConnected(event.payload.connected);
      } else if (event.type === 'APPLICATION_CREATED') {
        loadAppData();
        showToast(`New application added: ${event.payload?.job_position || 'Job'}`, 'success');
      } else if (event.type === 'APPLICATION_UPDATED') {
        loadAppData();
      } else if (event.type === 'STATUS_CHANGED') {
        loadAppData();
        if (event.payload?.new_status === 'Selected') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
          showToast(`🎉 Congratulations! Application moved to Selected!`, 'success');
        } else {
          showToast(`Application status updated to ${event.payload?.new_status}`, 'info');
        }
      } else if (event.type === 'COMPANY_CREATED' || event.type === 'COMPANY_UPDATED' || event.type === 'COMPANY_DELETED') {
        loadAppData();
      } else if (event.type === 'NOTIFICATION_NEW') {
        loadAppData();
        setUnreadCount((prev) => prev + 1);
        showToast(`✉️ Email Notification sent: ${event.payload?.subject || 'Alert'}`, 'info');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadAppData]);

  // Status Change Request Handler
  const handleStatusChangeRequest = (app: JobApplication, newStatus: JobStatus) => {
    if (newStatus === 'On Hold') {
      // Must prompt user with mandatory On Hold Reason Modal!
      setOnHoldModalState({
        isOpen: true,
        app,
        initialReason: app.on_hold_reason || '',
      });
    } else {
      // Normal transition
      api.updateStatus(app.id, newStatus)
        .then(() => {
          if (newStatus === 'Selected') {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
            });
            showToast(`🎉 Application for ${app.job_position} marked as Selected!`, 'success');
          } else {
            showToast(`Status changed to ${newStatus}`, 'info');
          }
          loadAppData();
        })
        .catch((err) => {
          alert(err.message || 'Failed to update status');
        });
    }
  };

  // Submit On Hold Reason
  const handleConfirmOnHoldReason = async (reason: string) => {
    if (!onHoldModalState.app) return;
    try {
      await api.updateStatus(onHoldModalState.app.id, 'On Hold', reason);
      showToast('Status updated to On Hold with reason recorded.', 'alert');
      await loadAppData();
    } catch (err: any) {
      throw err;
    }
  };

  // Delete Application
  const handleDeleteApplication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application record? This cannot be undone.')) {
      return;
    }
    try {
      await api.deleteApplication(id);
      showToast('Application deleted successfully.', 'info');
      loadAppData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete application');
    }
  };

  // Delete Company
  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company? Related applications will be updated.')) {
      return;
    }
    try {
      await api.deleteCompany(id);
      showToast('Company deleted successfully.', 'info');
      loadAppData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete company');
    }
  };

  const handleLogout = () => {
    authStorage.clearToken();
    setUser(null);
    setCurrentTab('landing');
    showToast('Signed out successfully.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-800'
                : toastMessage.type === 'alert'
                ? 'bg-amber-900 text-white border-amber-800'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      {user && currentTab !== 'landing' && (
        <Header
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenNewApplication={() => {
            setEditingApp(null);
            setIsAddAppOpen(true);
          }}
          onOpenNotifications={() => {
            setIsNotificationsOpen(true);
            setUnreadCount(0);
          }}
          isConnected={isConnected}
          user={user}
          unreadCount={unreadCount}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1">
        {(!user || currentTab === 'landing') ? (
          <LandingPage
            onGetStarted={() => {
              setAuthMode('register');
              setIsAuthOpen(true);
            }}
            onLogin={() => {
              setAuthMode('login');
              setIsAuthOpen(true);
            }}
            onDirectLogin={async (email, pass) => {
              try {
                const res = await api.login(email, pass);
                authStorage.setToken(res.token);
                authStorage.setUser(res.user);
                setUser(res.user);
                setCurrentTab('dashboard');
                loadAppData();
                showToast(`Signed in as ${res.user.name}`, 'success');
              } catch (err: any) {
                showToast(err.message || 'Access granted', 'info');
              }
            }}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-6 py-8">
            {currentTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                charts={charts}
                recentApplications={applications}
                recentHistory={recentHistory}
                onOpenApplication={(id) => {
                  setSelectedAppId(id);
                  setIsDetailsOpen(true);
                }}
                onNavigateToTab={setCurrentTab}
                onOpenNewApplication={() => {
                  setEditingApp(null);
                  setIsAddAppOpen(true);
                }}
              />
            )}

            {currentTab === 'applications' && (
              <ApplicationsView
                applications={applications}
                companies={companies}
                onOpenNewApplication={() => {
                  setEditingApp(null);
                  setIsAddAppOpen(true);
                }}
                onEditApplication={(app) => {
                  setEditingApp(app);
                  setIsAddAppOpen(true);
                }}
                onDeleteApplication={handleDeleteApplication}
                onOpenApplicationDetails={(id) => {
                  setSelectedAppId(id);
                  setIsDetailsOpen(true);
                }}
                onStatusChangeRequest={handleStatusChangeRequest}
              />
            )}

            {currentTab === 'on_hold' && (
              <OnHoldView
                applications={applications}
                onOpenDetails={(id) => {
                  setSelectedAppId(id);
                  setIsDetailsOpen(true);
                }}
                onEditReason={(app) => {
                  setOnHoldModalState({
                    isOpen: true,
                    app,
                    initialReason: app.on_hold_reason || '',
                  });
                }}
                onStatusChangeRequest={handleStatusChangeRequest}
              />
            )}

            {currentTab === 'companies' && (
              <CompaniesView
                companies={companies}
                onOpenAddCompany={() => {
                  setEditingCompany(null);
                  setIsAddCompanyOpen(true);
                }}
                onEditCompany={(comp) => {
                  setEditingCompany(comp);
                  setIsAddCompanyOpen(true);
                }}
                onDeleteCompany={handleDeleteCompany}
                onSelectCompanyApplications={(compCatId) => {
                  setCurrentTab('applications');
                }}
              />
            )}

            {currentTab === 'profile' && user && (
              <ProfileView
                user={user}
                onLogout={handleLogout}
                onUserUpdated={(updatedUser) => {
                  setUser(updatedUser);
                  authStorage.setUser(updatedUser);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer for App */}
      {user && currentTab !== 'landing' && (
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>JobTrack · Real-Time Full-Stack Job Application Tracker</span>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <button onClick={() => setCurrentTab('dashboard')} className="hover:text-slate-900">Dashboard</button>
              <button onClick={() => setCurrentTab('applications')} className="hover:text-slate-900">Applications</button>
              <button onClick={() => setCurrentTab('on_hold')} className="hover:text-slate-900">On Hold</button>
              <button onClick={() => setIsNotificationsOpen(true)} className="hover:text-slate-900">Email Outbox</button>
            </div>
          </div>
        </footer>
      )}

      {/* MODALS */}
      {/* 1. Add / Edit Application Modal */}
      <AddApplicationModal
        isOpen={isAddAppOpen}
        companies={companies}
        editApplication={editingApp}
        onClose={() => setIsAddAppOpen(false)}
        onSuccess={() => {
          loadAppData();
          showToast(editingApp ? 'Application updated successfully' : 'Application recorded successfully', 'success');
        }}
        onCompanyCreated={() => loadAppData()}
      />

      {/* 2. Add / Edit Company Modal */}
      <AddCompanyModal
        isOpen={isAddCompanyOpen}
        editCompany={editingCompany}
        onClose={() => setIsAddCompanyOpen(false)}
        onSuccess={() => {
          loadAppData();
          showToast(editingCompany ? 'Company updated successfully' : 'Company added successfully', 'success');
        }}
      />

      {/* 3. Application Details & Documents Modal */}
      <ApplicationDetailsModal
        isOpen={isDetailsOpen}
        applicationId={selectedAppId}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedAppId(null);
        }}
        onStatusChangeRequest={handleStatusChangeRequest}
        onApplicationUpdated={loadAppData}
      />

      {/* 4. Mandatory On Hold Reason Modal */}
      <OnHoldReasonModal
        isOpen={onHoldModalState.isOpen}
        jobPosition={onHoldModalState.app?.job_position || 'Position'}
        companyName={onHoldModalState.app?.company_name || 'Company'}
        initialReason={onHoldModalState.initialReason}
        onClose={() => setOnHoldModalState({ isOpen: false, app: null })}
        onSubmit={handleConfirmOnHoldReason}
      />

      {/* 5. Email Notification Outbox & Preview Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onOpenPreferences={() => {
          setIsNotificationsOpen(false);
          setCurrentTab('profile');
        }}
      />

      {/* 6. Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          setCurrentTab('dashboard');
          loadAppData();
          showToast(`Signed in as ${loggedUser.name}`, 'success');
        }}
      />
    </div>
  );
}
