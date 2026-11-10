import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, JobStatus } from './server/db.js';
import { realtime } from './server/realtime.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to extract authenticated user (supports Authorization bearer or session header)
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  const userHeader = req.headers['x-user-id'] as string;
  if (userHeader) {
    const user = db.getUserById(userHeader);
    if (user) return user;
  }
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = db.getUserById(token);
    if (user) return user;
  }
  return undefined;
}

// Attach realtime
realtime.init(server);

// ----------------- AUTH ROUTES -----------------
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  let user = db.getUserByEmail(email);
  if (user) {
    // If account exists, update and authenticate
    db.updateUser(user.id, { name, password_hash: password });
    return res.json({
      token: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        preferences: user.preferences,
      },
    });
  }

  user = db.createUser(name, email, password);
  db.seedUserData(user.id);
  return res.status(201).json({
    token: user.id,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      preferences: user.preferences,
    },
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Allow login for any email and password:
  // If user does not exist, automatically create account and seed starter workspace
  let user = db.getUserByEmail(email);
  if (!user) {
    const defaultName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    user = db.createUser(defaultName, email, password);
    db.seedUserData(user.id);
  } else {
    // Update password hash so user always has valid access
    user.password_hash = password;
    db.updateUser(user.id, { password_hash: password });
    if (db.getApplications(user.id).length === 0) {
      db.seedUserData(user.id);
    }
  }

  return res.json({
    token: user.id,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      preferences: user.preferences,
    },
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      preferences: user.preferences,
    },
  });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  return res.json({ message: 'Logged out successfully' });
});

app.put('/api/auth/profile', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { name, email, new_password, current_password } = req.body;

  if (new_password) {
    if (user.password_hash !== current_password) {
      return res.status(400).json({ error: 'Current password does not match' });
    }
    user.password_hash = new_password;
  }

  if (name) user.name = name;
  if (email) user.email = email;

  db.updateUser(user.id, user);
  return res.json({
    message: 'Profile updated successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
    },
  });
});

app.put('/api/auth/preferences', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { preferences } = req.body;
  if (!preferences) return res.status(400).json({ error: 'Preferences payload required' });

  user.preferences = { ...user.preferences, ...preferences };
  db.updateUser(user.id, { preferences: user.preferences });

  return res.json({
    message: 'Notification preferences updated',
    preferences: user.preferences,
  });
});

// ----------------- COMPANIES ROUTES -----------------
app.get('/api/companies', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const search = (req.query.search as string || '').toLowerCase();
  let companies = db.getCompanies(user.id);

  if (search) {
    companies = companies.filter((c) => c.company_name.toLowerCase().includes(search));
  }

  const apps = db.getApplications(user.id);
  const enriched = companies.map((c) => ({
    ...c,
    applicationsCount: apps.filter((a) => a.company_id === c.id).length,
  }));

  return res.json(enriched);
});

app.get('/api/companies/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const company = db.getCompanyById(user.id, req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });
  return res.json(company);
});

app.post('/api/companies', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { company_name, website, location, contact_email, phone, description } = req.body;
  if (!company_name || !company_name.trim()) {
    return res.status(400).json({ error: 'Company name cannot be empty' });
  }

  const newCompany = db.createCompany(user.id, {
    company_name: company_name.trim(),
    website: website || '',
    location: location || '',
    contact_email: contact_email || '',
    phone: phone || '',
    description: description || '',
  });

  realtime.broadcast('COMPANY_CREATED', newCompany, user.id);
  return res.status(201).json(newCompany);
});

app.put('/api/companies/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { company_name, website, location, contact_email, phone, description } = req.body;
  if (company_name !== undefined && !company_name.trim()) {
    return res.status(400).json({ error: 'Company name cannot be empty' });
  }

  const updated = db.updateCompany(user.id, req.params.id, {
    ...(company_name ? { company_name: company_name.trim() } : {}),
    ...(website !== undefined ? { website } : {}),
    ...(location !== undefined ? { location } : {}),
    ...(contact_email !== undefined ? { contact_email } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(description !== undefined ? { description } : {}),
  });

  if (!updated) return res.status(404).json({ error: 'Company not found' });

  realtime.broadcast('COMPANY_UPDATED', updated, user.id);
  return res.json(updated);
});

app.delete('/api/companies/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const success = db.deleteCompany(user.id, req.params.id);
  if (!success) return res.status(404).json({ error: 'Company not found' });

  realtime.broadcast('COMPANY_DELETED', { id: req.params.id }, user.id);
  return res.json({ message: 'Company deleted successfully' });
});

// ----------------- APPLICATIONS ROUTES -----------------
app.get('/api/applications', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  let apps = db.getApplications(user.id);

  // Filters
  const status = req.query.status as string;
  const companyId = req.query.company_id as string;
  const search = (req.query.search as string || '').toLowerCase();
  const sort = req.query.sort as string; // 'newest' | 'oldest'

  if (status && status !== 'all') {
    apps = apps.filter((a) => a.status.toLowerCase() === status.toLowerCase());
  }
  if (companyId && companyId !== 'all') {
    apps = apps.filter((a) => a.company_id === companyId);
  }
  if (search) {
    apps = apps.filter(
      (a) =>
        a.job_position.toLowerCase().includes(search) ||
        (a.company_name && a.company_name.toLowerCase().includes(search)) ||
        (a.job_location && a.job_location.toLowerCase().includes(search))
    );
  }

  if (sort === 'oldest') {
    apps.sort((a, b) => new Date(a.application_date).getTime() - new Date(b.application_date).getTime());
  } else {
    // Default newest
    apps.sort((a, b) => new Date(b.application_date).getTime() - new Date(a.application_date).getTime());
  }

  return res.json(apps);
});

app.get('/api/applications/on-hold', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const apps = db.getApplications(user.id).filter((a) => a.status === 'On Hold');
  return res.json(apps);
});

app.get('/api/applications/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const appItem = db.getApplicationById(user.id, req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Application not found' });
  return res.json(appItem);
});

app.post('/api/applications', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const {
    company_id,
    new_company_name,
    job_position,
    application_date,
    interview_date,
    job_description,
    job_location,
    job_type,
    salary,
    status,
    on_hold_reason,
  } = req.body;

  if (!job_position || !job_position.trim()) {
    return res.status(400).json({ error: 'Job position cannot be empty' });
  }
  if (!application_date) {
    return res.status(400).json({ error: 'Application date is mandatory' });
  }

  let finalCompanyId = company_id;
  // If user typed a new company directly
  if ((!finalCompanyId || finalCompanyId === 'new') && new_company_name) {
    const createdComp = db.createCompany(user.id, {
      company_name: new_company_name.trim(),
      website: '',
      location: job_location || '',
      contact_email: '',
      phone: '',
      description: '',
    });
    finalCompanyId = createdComp.id;
    realtime.broadcast('COMPANY_CREATED', createdComp, user.id);
  }

  if (!finalCompanyId) {
    return res.status(400).json({ error: 'Company selection or company name is required' });
  }

  const validStatuses: JobStatus[] = ['Applied', 'Interview', 'Selected', 'Rejected', 'On Hold'];
  const finalStatus: JobStatus = validStatuses.includes(status) ? status : 'Applied';

  if (finalStatus === 'On Hold' && (!on_hold_reason || !on_hold_reason.trim())) {
    return res.status(400).json({ error: 'A valid reason is required when setting status to On Hold' });
  }

  const newApp = db.createApplication(user.id, {
    company_id: finalCompanyId,
    job_position: job_position.trim(),
    application_date,
    interview_date: interview_date || undefined,
    job_description: job_description || '',
    job_location: job_location || 'Remote',
    job_type: job_type || 'Full-time',
    salary: salary || '',
    status: finalStatus,
    on_hold_reason: finalStatus === 'On Hold' ? on_hold_reason.trim() : undefined,
  });

  const fullApp = db.getApplicationById(user.id, newApp.id);
  realtime.broadcast('APPLICATION_CREATED', fullApp, user.id);

  // Check email notifications
  if (finalStatus === 'Selected' || finalStatus === 'Rejected' || finalStatus === 'Interview') {
    realtime.handleStatusChangeNotifications(user.id, newApp, 'Initial', finalStatus);
  }

  return res.status(201).json(fullApp);
});

app.put('/api/applications/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const existing = db.getApplicationById(user.id, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Application not found' });

  const {
    company_id,
    job_position,
    application_date,
    interview_date,
    job_description,
    job_location,
    job_type,
    salary,
    status,
    on_hold_reason,
  } = req.body;

  if (job_position !== undefined && !job_position.trim()) {
    return res.status(400).json({ error: 'Job position cannot be empty' });
  }

  if (status === 'On Hold' && (!on_hold_reason || !on_hold_reason.trim())) {
    return res.status(400).json({ error: 'A valid reason is required when setting status to On Hold' });
  }

  const prevStatus = existing.status;
  const updated = db.updateApplication(user.id, req.params.id, {
    ...(company_id ? { company_id } : {}),
    ...(job_position ? { job_position: job_position.trim() } : {}),
    ...(application_date ? { application_date } : {}),
    ...(interview_date !== undefined ? { interview_date } : {}),
    ...(job_description !== undefined ? { job_description } : {}),
    ...(job_location !== undefined ? { job_location } : {}),
    ...(job_type ? { job_type } : {}),
    ...(salary !== undefined ? { salary } : {}),
    ...(status ? { status } : {}),
    ...(status === 'On Hold' ? { on_hold_reason: on_hold_reason.trim() } : {}),
  });

  if (!updated) return res.status(404).json({ error: 'Application not found' });

  const fullApp = db.getApplicationById(user.id, updated.id);
  realtime.broadcast('APPLICATION_UPDATED', fullApp, user.id);

  if (status && status !== prevStatus) {
    realtime.handleStatusChangeNotifications(user.id, updated, prevStatus, status);
  }

  return res.json(fullApp);
});

app.patch('/api/applications/:id/status', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { status, reason } = req.body;
  const validStatuses: JobStatus[] = ['Applied', 'Interview', 'Selected', 'Rejected', 'On Hold'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  if (status === 'On Hold' && (!reason || !reason.trim())) {
    return res.status(400).json({ error: 'An On Hold application must have a valid reason.' });
  }

  const existing = db.getApplicationById(user.id, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Application not found' });

  const prevStatus = existing.status;
  const updated = db.updateApplication(user.id, req.params.id, {
    status,
    on_hold_reason: status === 'On Hold' ? reason.trim() : (status !== prevStatus ? undefined : existing.on_hold_reason),
  });

  if (!updated) return res.status(404).json({ error: 'Update failed' });

  // Trigger notification if changed to Selected / Rejected / Interview
  if (status !== prevStatus) {
    realtime.handleStatusChangeNotifications(user.id, updated, prevStatus, status);
  }

  const fullApp = db.getApplicationById(user.id, updated.id);
  realtime.broadcast('STATUS_CHANGED', {
    application_id: updated.id,
    previous_status: prevStatus,
    new_status: status,
    reason,
    application: fullApp,
  }, user.id);

  return res.json({
    message: `Status updated to ${status}`,
    application: fullApp,
  });
});

app.delete('/api/applications/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const success = db.deleteApplication(user.id, req.params.id);
  if (!success) return res.status(404).json({ error: 'Application not found' });

  realtime.broadcast('APPLICATION_DELETED', { id: req.params.id }, user.id);
  return res.json({ message: 'Application deleted successfully' });
});

app.get('/api/applications/:id/history', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const history = db.getStatusHistory(req.params.id);
  return res.json(history);
});

// ----------------- DOCUMENTS ROUTES -----------------
app.get('/api/applications/:id/documents', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const docs = db.getDocuments(req.params.id).map((d) => ({
    id: d.id,
    application_id: d.application_id,
    doc_type: d.doc_type,
    file_name: d.file_name,
    file_size: d.file_size,
    mime_type: d.mime_type,
    uploaded_at: d.uploaded_at,
  }));
  return res.json(docs);
});

app.post('/api/applications/:id/documents', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { doc_type, file_name, file_size, mime_type, file_data } = req.body;
  if (!file_name || !file_data) {
    return res.status(400).json({ error: 'File name and file content are required' });
  }

  const app = db.getApplicationById(user.id, req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });

  const doc = db.addDocument({
    application_id: req.params.id,
    user_id: user.id,
    doc_type: doc_type || 'resume',
    file_name: file_name.replace(/[^\w.-]/g, '_'),
    file_size: file_size || 1024,
    mime_type: mime_type || 'application/pdf',
    file_data,
  });

  realtime.broadcast('DOCUMENT_ADDED', { application_id: req.params.id, doc_id: doc.id }, user.id);

  return res.status(201).json({
    id: doc.id,
    application_id: doc.application_id,
    doc_type: doc.doc_type,
    file_name: doc.file_name,
    file_size: doc.file_size,
    mime_type: doc.mime_type,
    uploaded_at: doc.uploaded_at,
  });
});

app.delete('/api/documents/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const success = db.deleteDocument(req.params.id, user.id);
  if (!success) return res.status(404).json({ error: 'Document not found' });

  realtime.broadcast('DOCUMENT_DELETED', { doc_id: req.params.id }, user.id);
  return res.json({ message: 'Document deleted successfully' });
});

app.get('/api/documents/:id/download', (req: Request, res: Response) => {
  const doc = db.getDocumentById(req.params.id);
  if (!doc) return res.status(404).send('Document not found');

  const fileBuffer = Buffer.from(doc.file_data, 'base64');
  res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.file_name)}"`);
  return res.send(fileBuffer);
});

// ----------------- DASHBOARD & STATS -----------------
app.get('/api/dashboard/statistics', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const stats = db.getDashboardStats(user.id);
  return res.json(stats);
});

app.get('/api/dashboard/charts', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const charts = db.getDashboardCharts(user.id);
  return res.json(charts);
});

app.get('/api/dashboard/recent-history', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const history = db.getAllUserStatusHistory(user.id).slice(0, 10);
  return res.json(history);
});

// ----------------- NOTIFICATIONS / EMAIL OUTBOX -----------------
app.get('/api/notifications', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const notifs = db.getNotifications(user.id);
  return res.json(notifs);
});

app.post('/api/notifications/test', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const notif = db.addNotification({
    user_id: user.id,
    recipient_email: user.email,
    subject: '🔔 Test Notification: JobTrack Email Delivery Active',
    body: `Hello ${user.name},\n\nThis is a test notification confirming your JobTrack email alerting system is properly configured. You will receive automated alerts when application statuses change to Selected or Rejected, and reminders ahead of scheduled interviews.`,
    trigger_type: 'test',
  });

  realtime.broadcast('NOTIFICATION_NEW', notif, user.id);
  return res.json({ message: 'Test email dispatched to outbox', notification: notif });
});

// Vite Middleware integration for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`JobTrack Full-Stack server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
