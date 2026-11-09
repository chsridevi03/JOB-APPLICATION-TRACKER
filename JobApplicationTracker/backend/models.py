from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    companies = relationship("Company", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("ApplicationDocument", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("NotificationLog", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("NotificationPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    email_on_selected = Column(Boolean, default=True)
    email_on_rejected = Column(Boolean, default=True)
    email_interview_reminder = Column(Boolean, default=True)
    interview_reminder_days = Column(Integer, default=2)

    user = relationship("User", back_populates="preferences")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company_name = Column(String(150), nullable=False, index=True)
    website = Column(String(255), nullable=True)
    location = Column(String(150), nullable=True)
    contact_email = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="companies")
    applications = relationship("Application", back_populates="company", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    job_position = Column(String(150), nullable=False, index=True)
    application_date = Column(String(50), nullable=False)
    interview_date = Column(String(50), nullable=True)
    job_description = Column(Text, nullable=True)
    job_location = Column(String(150), nullable=True)
    job_type = Column(String(50), default="Full-time")  # Full-time, Part-time, Internship, Contract
    salary = Column(String(100), nullable=True)
    status = Column(String(50), default="Applied", index=True)  # Applied, Interview, Selected, Rejected, On Hold
    on_hold_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="applications")
    company = relationship("Company", back_populates="applications")
    history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan")
    documents = relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan")


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    previous_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="history")


class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doc_type = Column(String(50), default="resume")  # resume, cover_letter, portfolio, offer_letter, other
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/pdf")
    file_data = Column(Text, nullable=False)  # Base64 encoded or storage path
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="documents")
    application = relationship("Application", back_populates="documents")


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="SET NULL"), nullable=True)
    recipient_email = Column(String(150), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    trigger_type = Column(String(50), nullable=False)  # status_selected, status_rejected, interview_reminder, test
    sent_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="delivered")

    user = relationship("User", back_populates="notifications")
