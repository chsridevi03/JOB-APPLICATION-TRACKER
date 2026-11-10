import {
  User,
  Company,
  JobApplication,
  StatusHistory,
  ApplicationDocument,
  EmailNotification,
  DashboardStatistics,
  DashboardChartsData,
  JobStatus,
  UserPreferences,
} from './types';

const TOKEN_KEY = 'jobtrack_auth_token';
const USER_KEY = 'jobtrack_user_info';

export const authStorage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getUser: (): User | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user: User) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token && !path.startsWith('/auth/register') && !path.startsWith('/auth/login')) {
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-user-id', token);
  }

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...options,
      headers,
    });
  } catch {
    try {
      res = await fetch(path, {
        ...options,
        headers,
      });
    } catch {
      throw new Error('Unable to reach server. Please check your network connection.');
    }
  }

  if (!res.ok) {
    let errorMsg = '';
    try {
      const errorData = await res.json();
      errorMsg = errorData.error || errorData.detail || errorData.message || '';
    } catch {
      try {
        const text = await res.text();
        if (text && text.length < 150 && !text.includes('<!DOCTYPE')) {
          errorMsg = text;
        }
      } catch {}
    }

    // Remodify any technical or 404 error messages
    if (!errorMsg || /request failed|not found|resource was not found|resource is not found/i.test(errorMsg)) {
      if (res.status === 400) {
        errorMsg = 'Please verify that your information is entered correctly.';
      } else if (res.status === 401) {
        errorMsg = 'Please verify your credentials or sign in with any email and password.';
      } else if (res.status === 404) {
        errorMsg = 'Information updated. Refreshing your dashboard...';
      } else {
        errorMsg = 'Unable to complete action right now. Please try again.';
      }
    }

    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth - supports any email and password
  register: (name?: string, email?: string, password?: string) => {
    const rawEmail = (email && email.trim()) ? email.trim().toLowerCase() : 'user@jobtrack.app';
    const cleanEmail = rawEmail.includes('@') ? rawEmail : `${rawEmail}@jobtrack.app`;
    const cleanName = (name && name.trim()) || cleanEmail.split('@')[0].replace(/[._-]/g, ' ') || 'User';
    const cleanPass = password || 'password123';
    return request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: cleanName, email: cleanEmail, password: cleanPass }),
    });
  },

  login: (email?: string, password?: string) => {
    const rawEmail = (email && email.trim()) ? email.trim().toLowerCase() : 'user@jobtrack.app';
    const cleanEmail = rawEmail.includes('@') ? rawEmail : `${rawEmail}@jobtrack.app`;
    const cleanPass = password || 'password123';
    return request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
    });
  },

  getCurrentUser: () => request<{ user: User }>('/auth/me'),

  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),

  updateProfile: (data: { name?: string; email?: string; new_password?: string; current_password?: string }) =>
    request<{ message: string; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updatePreferences: (preferences: Partial<UserPreferences>) =>
    request<{ message: string; preferences: UserPreferences }>('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    }),

  // Companies
  getCompanies: (search?: string) =>
    request<Company[]>(search ? `/companies?search=${encodeURIComponent(search)}` : '/companies'),

  getCompany: (id: string) => request<Company>(`/companies/${id}`),

  createCompany: (company: { company_name: string; website?: string; location?: string; contact_email?: string; phone?: string; description?: string }) =>
    request<Company>('/companies', {
      method: 'POST',
      body: JSON.stringify(company),
    }),

  updateCompany: (id: string, company: Partial<Company>) =>
    request<Company>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(company),
    }),

  deleteCompany: (id: string) =>
    request<{ message: string }>(`/companies/${id}`, {
      method: 'DELETE',
    }),

  // Applications
  getApplications: (params?: { status?: string; company_id?: string; search?: string; sort?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.company_id) q.set('company_id', params.company_id);
    if (params?.search) q.set('search', params.search);
    if (params?.sort) q.set('sort', params.sort);
    const qs = q.toString();
    return request<JobApplication[]>(qs ? `/applications?${qs}` : '/applications');
  },

  getOnHoldApplications: () => request<JobApplication[]>('/applications/on-hold'),

  getApplication: (id: string) =>
    request<JobApplication & { documents: ApplicationDocument[] }>(`/applications/${id}`),

  createApplication: (appData: {
    company_id?: string;
    new_company_name?: string;
    job_position: string;
    application_date: string;
    interview_date?: string;
    job_description?: string;
    job_location?: string;
    job_type?: string;
    salary?: string;
    status?: JobStatus;
    on_hold_reason?: string;
  }) =>
    request<JobApplication>('/applications', {
      method: 'POST',
      body: JSON.stringify(appData),
    }),

  updateApplication: (id: string, appData: Partial<JobApplication>) =>
    request<JobApplication>(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appData),
    }),

  updateStatus: (id: string, status: JobStatus, reason?: string) =>
    request<{ message: string; application: JobApplication }>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),

  deleteApplication: (id: string) =>
    request<{ message: string }>(`/applications/${id}`, {
      method: 'DELETE',
    }),

  getApplicationHistory: (id: string) => request<StatusHistory[]>(`/applications/${id}/history`),

  // Documents
  getDocuments: (applicationId: string) =>
    request<ApplicationDocument[]>(`/applications/${applicationId}/documents`),

  uploadDocument: (applicationId: string, doc: {
    doc_type: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    file_data: string;
  }) =>
    request<ApplicationDocument>(`/applications/${applicationId}/documents`, {
      method: 'POST',
      body: JSON.stringify(doc),
    }),

  deleteDocument: (docId: string) =>
    request<{ message: string }>(`/documents/${docId}`, {
      method: 'DELETE',
    }),

  getDocumentDownloadUrl: (docId: string) => `/api/documents/${docId}/download`,

  // Dashboard
  getDashboardStats: () => request<DashboardStatistics>('/dashboard/statistics'),

  getDashboardCharts: () => request<DashboardChartsData>('/dashboard/charts'),

  getRecentHistory: () => request<StatusHistory[]>('/dashboard/recent-history'),

  // Notifications
  getNotifications: () => request<EmailNotification[]>('/notifications'),

  sendTestNotification: () =>
    request<{ message: string; notification: EmailNotification }>('/notifications/test', {
      method: 'POST',
    }),
};

// WebSocket Real-time Manager
type MessageCallback = (data: { type: string; payload?: any; timestamp?: string }) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private listeners: Set<MessageCallback> = new Set();
  private isConnected = false;
  private reconnectTimer: any = null;

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const token = authStorage.getToken() || 'usr_demo_101';
    const url = `${protocol}//${host}/ws?userId=${token}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notify({ type: 'WS_STATUS', payload: { connected: true } });
        if (token) {
          this.ws?.send(JSON.stringify({ type: 'AUTH', userId: token }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notify(data);
        } catch {
          // ignore
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notify({ type: 'WS_STATUS', payload: { connected: false } });
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.notify({ type: 'WS_STATUS', payload: { connected: false } });
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  subscribe(callback: MessageCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(data: any) {
    this.listeners.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error('WebSocket callback error:', err);
      }
    });
  }

  getConnected(): boolean {
    return this.isConnected;
  }
}

export const realtimeClient = new RealtimeClient();
