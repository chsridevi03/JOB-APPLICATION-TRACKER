export type JobStatus = 'Applied' | 'Interview' | 'Selected' | 'Rejected' | 'On Hold';
export type JobType = 'Full-time' | 'Part-time' | 'Internship' | 'Contract';

export interface UserPreferences {
  email_on_selected: boolean;
  email_on_rejected: boolean;
  email_interview_reminder: boolean;
  interview_reminder_days: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  preferences?: UserPreferences;
}

export interface Company {
  id: string;
  user_id: string;
  company_name: string;
  website?: string;
  location?: string;
  contact_email?: string;
  phone?: string;
  description?: string;
  created_at: string;
  applicationsCount?: number;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  doc_type: 'resume' | 'cover_letter' | 'portfolio' | 'offer_letter' | 'other';
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  file_data?: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  company_id: string;
  company_name?: string;
  job_position: string;
  application_date: string;
  interview_date?: string;
  job_description?: string;
  job_location?: string;
  job_type: JobType;
  salary?: string;
  status: JobStatus;
  on_hold_reason?: string;
  created_at: string;
  updated_at: string;
  documentsCount?: number;
  documents?: ApplicationDocument[];
}

export interface StatusHistory {
  id: string;
  application_id: string;
  previous_status: JobStatus | 'Initial';
  new_status: JobStatus;
  reason?: string;
  changed_at: string;
  job_position?: string;
  company_name?: string;
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

export interface DashboardStatistics {
  total: number;
  applied: number;
  interview: number;
  selected: number;
  rejected: number;
  onHold: number;
  on_hold?: number;
  companiesCount: number;
  documentsCount: number;
}

export interface DashboardChartsData {
  statusDistribution: {
    labels: string[];
    data: number[];
    colors: string[];
  };
  timeline: {
    labels: string[];
    data: number[];
  };
}
