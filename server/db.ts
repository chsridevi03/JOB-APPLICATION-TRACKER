import fs from 'fs';
import path from 'path';

export type JobStatus = 'Applied' | 'Interview' | 'Selected' | 'Rejected' | 'On Hold';
export type JobType = 'Full-time' | 'Part-time' | 'Internship' | 'Contract';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
  preferences: {
    email_on_selected: boolean;
    email_on_rejected: boolean;
    email_interview_reminder: boolean;
    interview_reminder_days: number;
  };
}

export interface Company {
  id: string;
  user_id: string;
  company_name: string;
  website: string;
  location: string;
  contact_email: string;
  phone: string;
  description: string;
  created_at: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  company_id: string;
  company_name?: string;
  job_position: string;
  application_date: string;
  interview_date?: string;
  job_description: string;
  job_location: string;
  job_type: JobType;
  salary: string;
  status: JobStatus;
  on_hold_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface StatusHistory {
  id: string;
  application_id: string;
  previous_status: JobStatus | 'Initial';
  new_status: JobStatus;
  reason?: string;
  changed_at: string;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  user_id: string;
  doc_type: 'resume' | 'cover_letter' | 'portfolio' | 'offer_letter' | 'other';
  file_name: string;
  file_size: number;
  mime_type: string;
  file_data: string; // base64 encoded
  uploaded_at: string;
}

export interface EmailNotification {
  id: string;
  user_id: string;
  application_id?: string;
  recipient_email: string;
  subject: string;
  body: string;
  trigger_type: 'status_selected' | 'status_rejected' | 'interview_reminder' | 'test';
  sent_at: string;
  status: 'delivered' | 'pending';
}

interface DatabaseSchema {
  users: User[];
  companies: Company[];
  applications: JobApplication[];
  status_history: StatusHistory[];
  documents: ApplicationDocument[];
  notifications: EmailNotification[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function getInitialData(): DatabaseSchema {
  const now = new Date();
  const dateStr = (offsetDays: number) => {
    const d = new Date(now.getTime() - offsetDays * 86400000);
    return d.toISOString().split('T')[0];
  };
  const futureDateStr = (days: number) => {
    const d = new Date(now.getTime() + days * 86400000);
    return d.toISOString().split('T')[0];
  };

  const defaultUser: User = {
    id: 'usr_demo_101',
    name: 'Sarah Connor',
    email: 'demo@jobtrack.io',
    password_hash: 'password123', // In demo, plain check or hashed
    created_at: dateStr(45),
    preferences: {
      email_on_selected: true,
      email_on_rejected: true,
      email_interview_reminder: true,
      interview_reminder_days: 2,
    },
  };

  const companies: Company[] = [
    {
      id: 'cmp_stripe',
      user_id: 'usr_demo_101',
      company_name: 'Stripe',
      website: 'https://stripe.com',
      location: 'San Francisco, CA (Remote)',
      contact_email: 'talent@stripe.com',
      phone: '+1 (415) 555-0199',
      description: 'Financial infrastructure platform for businesses and developers worldwide.',
      created_at: dateStr(40),
    },
    {
      id: 'cmp_figma',
      user_id: 'usr_demo_101',
      company_name: 'Figma',
      website: 'https://figma.com',
      location: 'San Francisco, CA',
      contact_email: 'careers@figma.com',
      phone: '+1 (415) 555-0144',
      description: 'Collaborative web application for interface design and prototyping.',
      created_at: dateStr(35),
    },
    {
      id: 'cmp_linear',
      user_id: 'usr_demo_101',
      company_name: 'Linear',
      website: 'https://linear.app',
      location: 'Remote (Worldwide)',
      contact_email: 'jobs@linear.app',
      phone: '+1 (650) 555-0120',
      description: 'Issue tracking and project management tool built for high-performance software teams.',
      created_at: dateStr(30),
    },
    {
      id: 'cmp_datadog',
      user_id: 'usr_demo_101',
      company_name: 'Datadog',
      website: 'https://datadoghq.com',
      location: 'New York, NY',
      contact_email: 'recruiting@datadoghq.com',
      phone: '+1 (212) 555-0182',
      description: 'Cloud monitoring and observability service for security and performance analytics.',
      created_at: dateStr(25),
    },
    {
      id: 'cmp_airbnb',
      user_id: 'usr_demo_101',
      company_name: 'Airbnb',
      website: 'https://airbnb.com',
      location: 'San Francisco, CA',
      contact_email: 'talent@airbnb.com',
      phone: '+1 (415) 555-0112',
      description: 'Global online marketplace for short-term homestays and vacation experiences.',
      created_at: dateStr(20),
    },
    {
      id: 'cmp_notion',
      user_id: 'usr_demo_101',
      company_name: 'Notion',
      website: 'https://notion.so',
      location: 'San Francisco, CA (Hybrid)',
      contact_email: 'recruiting@notion.so',
      phone: '+1 (415) 555-0188',
      description: 'All-in-one connected workspace for notes, docs, and knowledge management.',
      created_at: dateStr(15),
    },
  ];

  const applications: JobApplication[] = [
    {
      id: 'app_001',
      user_id: 'usr_demo_101',
      company_id: 'cmp_stripe',
      job_position: 'Senior Frontend Engineer',
      application_date: dateStr(28),
      interview_date: futureDateStr(3),
      job_description: 'Lead checkout UI performance and design system components in React and TypeScript.',
      job_location: 'San Francisco, CA (Remote)',
      job_type: 'Full-time',
      salary: '$180,000 - $210,000',
      status: 'Interview',
      created_at: dateStr(28),
      updated_at: dateStr(4),
    },
    {
      id: 'app_002',
      user_id: 'usr_demo_101',
      company_id: 'cmp_linear',
      job_position: 'Full-Stack Product Engineer',
      application_date: dateStr(24),
      job_description: 'Build real-time synchronization features, offline caching, and desktop client modules.',
      job_location: 'Remote',
      job_type: 'Full-time',
      salary: '$175,000 - $200,000',
      status: 'Selected',
      created_at: dateStr(24),
      updated_at: dateStr(2),
    },
    {
      id: 'app_003',
      user_id: 'usr_demo_101',
      company_id: 'cmp_figma',
      job_position: 'Design Systems Architect',
      application_date: dateStr(20),
      job_description: 'Develop WebGL and canvas-based components and developer token bridges.',
      job_location: 'San Francisco, CA',
      job_type: 'Full-time',
      salary: '$190,000 - $225,000',
      status: 'On Hold',
      on_hold_reason: 'Company postponed recruitment due to Q4 headcount realignment.',
      created_at: dateStr(20),
      updated_at: dateStr(5),
    },
    {
      id: 'app_004',
      user_id: 'usr_demo_101',
      company_id: 'cmp_datadog',
      job_position: 'Cloud Reliability Specialist',
      application_date: dateStr(18),
      job_description: 'Automate Kubernetes observability collectors and alerts for enterprise clusters.',
      job_location: 'New York, NY',
      job_type: 'Full-time',
      salary: '$165,000 - $185,000',
      status: 'Rejected',
      created_at: dateStr(18),
      updated_at: dateStr(8),
    },
    {
      id: 'app_005',
      user_id: 'usr_demo_101',
      company_id: 'cmp_airbnb',
      job_position: 'Staff Web Platform Engineer',
      application_date: dateStr(10),
      job_description: 'Modernize server-side rendering pipelines and design accessible UI components.',
      job_location: 'San Francisco, CA',
      job_type: 'Full-time',
      salary: '$200,000 - $230,000',
      status: 'Applied',
      created_at: dateStr(10),
      updated_at: dateStr(10),
    },
    {
      id: 'app_006',
      user_id: 'usr_demo_101',
      company_id: 'cmp_notion',
      job_position: 'Frontend Specialist (Blocks & AI)',
      application_date: dateStr(6),
      interview_date: futureDateStr(1),
      job_description: 'Craft rich text editing primitives and seamless collaborative widgets.',
      job_location: 'San Francisco, CA (Hybrid)',
      job_type: 'Full-time',
      salary: '$170,000 - $195,000',
      status: 'Interview',
      created_at: dateStr(6),
      updated_at: dateStr(1),
    },
    {
      id: 'app_007',
      user_id: 'usr_demo_101',
      company_id: 'cmp_stripe',
      job_position: 'Developer Relations Engineer',
      application_date: dateStr(14),
      job_description: 'Build SDK tutorials, interactive developer playgrounds, and sample apps.',
      job_location: 'Remote',
      job_type: 'Contract',
      salary: '$110/hour',
      status: 'On Hold',
      on_hold_reason: 'Waiting for HR response regarding budget approval for 2026 contractor pool.',
      created_at: dateStr(14),
      updated_at: dateStr(3),
    },
  ];

  const status_history: StatusHistory[] = [
    {
      id: 'hist_001',
      application_id: 'app_001',
      previous_status: 'Initial',
      new_status: 'Applied',
      reason: 'Application submitted via Stripe careers portal.',
      changed_at: dateStr(28),
    },
    {
      id: 'hist_002',
      application_id: 'app_001',
      previous_status: 'Applied',
      new_status: 'Interview',
      reason: 'Recruiter phone screen passed, scheduled technical architecture round.',
      changed_at: dateStr(4),
    },
    {
      id: 'hist_003',
      application_id: 'app_002',
      previous_status: 'Initial',
      new_status: 'Applied',
      reason: 'Referred by engineer teammate.',
      changed_at: dateStr(24),
    },
    {
      id: 'hist_004',
      application_id: 'app_002',
      previous_status: 'Applied',
      new_status: 'Interview',
      reason: 'Completed live coding & systems interview.',
      changed_at: dateStr(12),
    },
    {
      id: 'hist_005',
      application_id: 'app_002',
      previous_status: 'Interview',
      new_status: 'Selected',
      reason: 'Formal written offer received! Compensation approved.',
      changed_at: dateStr(2),
    },
    {
      id: 'hist_006',
      application_id: 'app_003',
      previous_status: 'Initial',
      new_status: 'Applied',
      reason: 'Applied with custom design token portfolio.',
      changed_at: dateStr(20),
    },
    {
      id: 'hist_007',
      application_id: 'app_003',
      previous_status: 'Applied',
      new_status: 'On Hold',
      reason: 'Company postponed recruitment due to Q4 headcount realignment.',
      changed_at: dateStr(5),
    },
    {
      id: 'hist_008',
      application_id: 'app_004',
      previous_status: 'Initial',
      new_status: 'Applied',
      reason: 'Application submitted online.',
      changed_at: dateStr(18),
    },
    {
      id: 'hist_009',
      application_id: 'app_004',
      previous_status: 'Applied',
      new_status: 'Rejected',
      reason: 'Position filled by an internal candidate.',
      changed_at: dateStr(8),
    },
  ];

  // Sample resume document
  const samplePdfBase64 = 'JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iag==';

  const documents: ApplicationDocument[] = [
    {
      id: 'doc_001',
      application_id: 'app_001',
      user_id: 'usr_demo_101',
      doc_type: 'resume',
      file_name: 'Sarah_Connor_Senior_Frontend_Resume_2026.pdf',
      file_size: 142500,
      mime_type: 'application/pdf',
      file_data: samplePdfBase64,
      uploaded_at: dateStr(28),
    },
    {
      id: 'doc_002',
      application_id: 'app_001',
      user_id: 'usr_demo_101',
      doc_type: 'cover_letter',
      file_name: 'Stripe_Cover_Letter_Tailored.pdf',
      file_size: 68400,
      mime_type: 'application/pdf',
      file_data: samplePdfBase64,
      uploaded_at: dateStr(28),
    },
    {
      id: 'doc_003',
      application_id: 'app_002',
      user_id: 'usr_demo_101',
      doc_type: 'offer_letter',
      file_name: 'Linear_Official_Offer_Letter.pdf',
      file_size: 215000,
      mime_type: 'application/pdf',
      file_data: samplePdfBase64,
      uploaded_at: dateStr(2),
    },
  ];

  const notifications: EmailNotification[] = [
    {
      id: 'notif_001',
      user_id: 'usr_demo_101',
      application_id: 'app_002',
      recipient_email: 'demo@jobtrack.io',
      subject: '🎉 Congratulations! Offer Received from Linear',
      body: 'Great news! Your application for Full-Stack Product Engineer at Linear has been marked as Selected. Review your offer letter and congratulations on your accomplishment!',
      trigger_type: 'status_selected',
      sent_at: dateStr(2),
      status: 'delivered',
    },
    {
      id: 'notif_002',
      user_id: 'usr_demo_101',
      application_id: 'app_004',
      recipient_email: 'demo@jobtrack.io',
      subject: 'Status Update: Application with Datadog',
      body: 'Your application for Cloud Reliability Specialist at Datadog has been updated to Rejected. Keep your momentum going—new opportunities are added daily.',
      trigger_type: 'status_rejected',
      sent_at: dateStr(8),
      status: 'delivered',
    },
    {
      id: 'notif_003',
      user_id: 'usr_demo_101',
      application_id: 'app_001',
      recipient_email: 'demo@jobtrack.io',
      subject: '⏰ Interview Reminder: Stripe Senior Frontend Engineer in 3 days',
      body: 'Friendly reminder that your technical architecture interview with Stripe is coming up in 3 days. Review your system design notes and resume.',
      trigger_type: 'interview_reminder',
      sent_at: dateStr(0),
      status: 'delivered',
    },
  ];

  return {
    users: [defaultUser],
    companies,
    applications,
    status_history,
    documents,
    notifications,
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error loading database file, initializing defaults:', err);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  private save() {
    this.saveData(this.data);
  }

  // Users
  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  createUser(name: string, email: string, password_hash: string): User {
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      email,
      password_hash,
      created_at: new Date().toISOString().split('T')[0],
      preferences: {
        email_on_selected: true,
        email_on_rejected: true,
        email_interview_reminder: true,
        interview_reminder_days: 2,
      },
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  // Companies
  getCompanies(userId: string): Company[] {
    return this.data.companies.filter((c) => c.user_id === userId);
  }

  getCompanyById(userId: string, id: string): Company | undefined {
    return this.data.companies.find((c) => c.id === id && c.user_id === userId);
  }

  createCompany(userId: string, company: Omit<Company, 'id' | 'user_id' | 'created_at'>): Company {
    const newCompany: Company = {
      id: `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      ...company,
      created_at: new Date().toISOString().split('T')[0],
    };
    this.data.companies.push(newCompany);
    this.save();
    return newCompany;
  }

  updateCompany(userId: string, id: string, updates: Partial<Company>): Company | undefined {
    const company = this.getCompanyById(userId, id);
    if (!company) return undefined;
    Object.assign(company, updates);
    this.save();
    return company;
  }

  deleteCompany(userId: string, id: string): boolean {
    const index = this.data.companies.findIndex((c) => c.id === id && c.user_id === userId);
    if (index === -1) return false;
    this.data.companies.splice(index, 1);
    this.save();
    return true;
  }

  // Applications
  getApplications(userId: string): (JobApplication & { company?: Company; documentsCount: number })[] {
    const userApps = this.data.applications.filter((a) => a.user_id === userId);
    const companies = this.getCompanies(userId);
    const compMap = new Map(companies.map((c) => [c.id, c]));

    return userApps.map((app) => {
      const comp = compMap.get(app.company_id);
      const docsCount = this.data.documents.filter((d) => d.application_id === app.id).length;
      return {
        ...app,
        company_name: comp ? comp.company_name : app.company_name || 'Unknown Company',
        company: comp,
        documentsCount: docsCount,
      };
    });
  }

  getApplicationById(userId: string, id: string): (JobApplication & { company?: Company; documents: ApplicationDocument[] }) | undefined {
    const app = this.data.applications.find((a) => a.id === id && a.user_id === userId);
    if (!app) return undefined;
    const company = this.getCompanyById(userId, app.company_id);
    const docs = this.data.documents.filter((d) => d.application_id === app.id);
    return {
      ...app,
      company_name: company ? company.company_name : app.company_name || 'Unknown Company',
      company,
      documents: docs,
    };
  }

  createApplication(
    userId: string,
    appData: Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): JobApplication {
    const now = new Date().toISOString();
    const newApp: JobApplication = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      ...appData,
      created_at: now.split('T')[0],
      updated_at: now.split('T')[0],
    };

    this.data.applications.push(newApp);

    // Record initial status in history
    this.addStatusHistory(newApp.id, 'Initial', newApp.status, 'Application recorded');
    this.save();
    return newApp;
  }

  updateApplication(userId: string, id: string, updates: Partial<JobApplication>): JobApplication | undefined {
    const app = this.data.applications.find((a) => a.id === id && a.user_id === userId);
    if (!app) return undefined;

    const oldStatus = app.status;
    const newStatus = updates.status;

    Object.assign(app, updates, {
      updated_at: new Date().toISOString().split('T')[0],
    });

    if (newStatus && newStatus !== oldStatus) {
      const reason = newStatus === 'On Hold' ? updates.on_hold_reason || 'Status changed to On Hold' : `Status changed to ${newStatus}`;
      this.addStatusHistory(app.id, oldStatus, newStatus, reason);
    }

    this.save();
    return app;
  }

  deleteApplication(userId: string, id: string): boolean {
    const index = this.data.applications.findIndex((a) => a.id === id && a.user_id === userId);
    if (index === -1) return false;
    const appId = this.data.applications[index].id;
    this.data.applications.splice(index, 1);
    // Cleanup related history and docs
    this.data.status_history = this.data.status_history.filter((h) => h.application_id !== appId);
    this.data.documents = this.data.documents.filter((d) => d.application_id !== appId);
    this.save();
    return true;
  }

  // Status History
  addStatusHistory(applicationId: string, prev: JobStatus | 'Initial', next: JobStatus, reason?: string): StatusHistory {
    const historyItem: StatusHistory = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      application_id: applicationId,
      previous_status: prev,
      new_status: next,
      reason: reason || `Transitioned from ${prev} to ${next}`,
      changed_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.data.status_history.unshift(historyItem);
    this.save();
    return historyItem;
  }

  getStatusHistory(applicationId: string): StatusHistory[] {
    return this.data.status_history.filter((h) => h.application_id === applicationId);
  }

  getAllUserStatusHistory(userId: string): (StatusHistory & { job_position: string; company_name: string })[] {
    const userApps = this.getApplications(userId);
    const appMap = new Map(userApps.map((a) => [a.id, a]));
    const appIds = new Set(userApps.map((a) => a.id));

    return this.data.status_history
      .filter((h) => appIds.has(h.application_id))
      .map((h) => {
        const app = appMap.get(h.application_id);
        return {
          ...h,
          job_position: app?.job_position || 'Position',
          company_name: app?.company_name || 'Company',
        };
      });
  }

  // Documents
  getDocuments(applicationId: string): ApplicationDocument[] {
    return this.data.documents.filter((d) => d.application_id === applicationId);
  }

  getDocumentById(docId: string): ApplicationDocument | undefined {
    return this.data.documents.find((d) => d.id === docId);
  }

  addDocument(doc: Omit<ApplicationDocument, 'id' | 'uploaded_at'>): ApplicationDocument {
    const newDoc: ApplicationDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...doc,
      uploaded_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.data.documents.push(newDoc);
    this.save();
    return newDoc;
  }

  deleteDocument(docId: string, userId: string): boolean {
    const index = this.data.documents.findIndex((d) => d.id === docId && d.user_id === userId);
    if (index === -1) return false;
    this.data.documents.splice(index, 1);
    this.save();
    return true;
  }

  // Notifications
  getNotifications(userId: string): EmailNotification[] {
    return this.data.notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
  }

  addNotification(notif: Omit<EmailNotification, 'id' | 'sent_at' | 'status'>): EmailNotification {
    const newNotif: EmailNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...notif,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'delivered',
    };
    this.data.notifications.unshift(newNotif);
    this.save();
    return newNotif;
  }

  // Dashboard calculations
  getDashboardStats(userId: string) {
    const apps = this.getApplications(userId);
    const total = apps.length;
    const applied = apps.filter((a) => a.status === 'Applied').length;
    const interview = apps.filter((a) => a.status === 'Interview').length;
    const selected = apps.filter((a) => a.status === 'Selected').length;
    const rejected = apps.filter((a) => a.status === 'Rejected').length;
    const onHold = apps.filter((a) => a.status === 'On Hold').length;

    const companies = this.getCompanies(userId);
    const docsCount = this.data.documents.filter((d) => d.user_id === userId).length;

    return {
      total,
      applied,
      interview,
      selected,
      rejected,
      onHold,
      companiesCount: companies.length,
      documentsCount: docsCount,
    };
  }

  getDashboardCharts(userId: string) {
    const apps = this.getApplications(userId);

    // Status breakdown
    const statusCounts = {
      Applied: apps.filter((a) => a.status === 'Applied').length,
      Interview: apps.filter((a) => a.status === 'Interview').length,
      Selected: apps.filter((a) => a.status === 'Selected').length,
      Rejected: apps.filter((a) => a.status === 'Rejected').length,
      'On Hold': apps.filter((a) => a.status === 'On Hold').length,
    };

    // Timeline over last 6 months
    const monthsMap: Record<string, number> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthsMap[key] = 0;
    }

    apps.forEach((app) => {
      const d = new Date(app.application_date);
      if (!isNaN(d.getTime())) {
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        if (monthsMap[key] !== undefined) {
          monthsMap[key]++;
        }
      }
    });

    return {
      statusDistribution: {
        labels: Object.keys(statusCounts),
        data: Object.values(statusCounts),
        colors: ['#2563EB', '#9333EA', '#16A34A', '#DC2626', '#EA580C'],
      },
      timeline: {
        labels: Object.keys(monthsMap),
        data: Object.values(monthsMap),
      },
    };
  }
}

export const db = new Database();
