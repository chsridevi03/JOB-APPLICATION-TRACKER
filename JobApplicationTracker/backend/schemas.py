from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class NotificationPreferenceUpdate(BaseModel):
    email_on_selected: Optional[bool] = None
    email_on_rejected: Optional[bool] = None
    email_interview_reminder: Optional[bool] = None
    interview_reminder_days: Optional[int] = Field(None, ge=1, le=14)

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- Company Schemas ---
class CompanyBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=150)
    website: Optional[str] = None
    location: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    description: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    description: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: int
    user_id: int
    created_at: datetime
    applications_count: Optional[int] = 0
    class Config:
        from_attributes = True

# --- Application Schemas ---
class ApplicationBase(BaseModel):
    company_id: Optional[int] = None
    new_company_name: Optional[str] = None
    job_position: str = Field(..., min_length=1, max_length=150)
    application_date: str
    interview_date: Optional[str] = None
    job_description: Optional[str] = None
    job_location: Optional[str] = "Remote"
    job_type: Optional[str] = "Full-time"
    salary: Optional[str] = None
    status: Optional[str] = "Applied"
    on_hold_reason: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    company_id: Optional[int] = None
    job_position: Optional[str] = None
    application_date: Optional[str] = None
    interview_date: Optional[str] = None
    job_description: Optional[str] = None
    job_location: Optional[str] = None
    job_type: Optional[str] = None
    salary: Optional[str] = None
    status: Optional[str] = None
    on_hold_reason: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str = Field(..., description="Applied, Interview, Selected, Rejected, On Hold")
    reason: Optional[str] = None

class StatusHistoryResponse(BaseModel):
    id: int
    application_id: int
    previous_status: str
    new_status: str
    reason: Optional[str]
    changed_at: datetime
    class Config:
        from_attributes = True

# --- Document Schemas ---
class DocumentCreate(BaseModel):
    doc_type: str = "resume"
    file_name: str
    file_size: int
    mime_type: str
    file_data: str  # Base64

class DocumentResponse(BaseModel):
    id: int
    application_id: int
    doc_type: str
    file_name: str
    file_size: int
    mime_type: str
    uploaded_at: datetime
    class Config:
        from_attributes = True

class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    company_id: int
    company_name: Optional[str] = None
    job_position: str
    application_date: str
    interview_date: Optional[str] = None
    job_description: Optional[str] = None
    job_location: Optional[str] = None
    job_type: str
    salary: Optional[str] = None
    status: str
    on_hold_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    documents: Optional[List[DocumentResponse]] = []
    class Config:
        from_attributes = True

# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    application_id: Optional[int] = None
    recipient_email: str
    subject: str
    body: str
    trigger_type: str
    sent_at: datetime
    status: str
    class Config:
        from_attributes = True

# --- Dashboard Schemas ---
class DashboardStatistics(BaseModel):
    total: int
    applied: int
    interview: int
    selected: int
    rejected: int
    on_hold: int
    companies_count: int
    documents_count: int

class DashboardCharts(BaseModel):
    status_distribution: dict
    timeline: dict
