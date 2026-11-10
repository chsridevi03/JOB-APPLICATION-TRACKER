import os
import json
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
import io

from database import engine, Base, get_db
import models
import schemas
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from sqlalchemy.orm import Session

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="JobTrack API",
    description="Professional Real-Time Job Application Tracker Backend API",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- WEBSOCKET REAL-TIME CONNECTION MANAGER -----------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, event_type: str, payload: dict):
        message = json.dumps({
            "type": event_type,
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat()
        })
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_text(json.dumps({
            "type": "CONNECTED",
            "message": "Connected to JobTrack Python Real-Time WebSocket Server",
            "timestamp": datetime.utcnow().isoformat()
        }))
        while True:
            data = await websocket.receive_text()
            # Respond to client ping
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ----------------- SEED DATABASE -----------------
def seed_initial_data(db: Session):
    existing = db.query(models.User).filter(models.User.email == "demo@jobtrack.io").first()
    if existing:
        return

    demo_user = models.User(
        name="Sarah Connor",
        email="demo@jobtrack.io",
        password_hash=get_password_hash("password123"),
        created_at=datetime.utcnow() - timedelta(days=45)
    )
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)

    prefs = models.NotificationPreference(
        user_id=demo_user.id,
        email_on_selected=True,
        email_on_rejected=True,
        email_interview_reminder=True,
        interview_reminder_days=2
    )
    db.add(prefs)

    companies_data = [
        {"name": "Stripe", "site": "https://stripe.com", "loc": "San Francisco, CA (Remote)", "email": "talent@stripe.com", "phone": "+1 (415) 555-0199", "desc": "Financial infrastructure platform for businesses."},
        {"name": "Figma", "site": "https://figma.com", "loc": "San Francisco, CA", "email": "careers@figma.com", "phone": "+1 (415) 555-0144", "desc": "Collaborative web interface design and prototyping."},
        {"name": "Linear", "site": "https://linear.app", "loc": "Remote", "email": "jobs@linear.app", "phone": "+1 (650) 555-0120", "desc": "Project tracking tool built for high-performance software teams."},
        {"name": "Datadog", "site": "https://datadoghq.com", "loc": "New York, NY", "email": "recruiting@datadoghq.com", "phone": "+1 (212) 555-0182", "desc": "Observability and cloud performance monitoring."},
        {"name": "Airbnb", "site": "https://airbnb.com", "loc": "San Francisco, CA", "email": "talent@airbnb.com", "phone": "+1 (415) 555-0112", "desc": "Global hospitality marketplace for vacation stays."},
    ]

    saved_comps = {}
    for c in companies_data:
        comp = models.Company(
            user_id=demo_user.id,
            company_name=c["name"],
            website=c["site"],
            location=c["loc"],
            contact_email=c["email"],
            phone=c["phone"],
            description=c["desc"]
        )
        db.add(comp)
        db.commit()
        db.refresh(comp)
        saved_comps[c["name"]] = comp.id

    now_date = datetime.utcnow()
    def d_offset(days):
        return (now_date - timedelta(days=days)).strftime("%Y-%m-%d")

    apps_data = [
        {"comp": "Stripe", "pos": "Senior Frontend Engineer", "date": d_offset(28), "interview": (now_date + timedelta(days=3)).strftime("%Y-%m-%d"), "salary": "$180,000 - $210,000", "status": "Interview", "desc": "Lead checkout UI performance and design system components."},
        {"comp": "Linear", "pos": "Full-Stack Product Engineer", "date": d_offset(24), "salary": "$175,000 - $200,000", "status": "Selected", "desc": "Build real-time synchronization features and desktop client."},
        {"comp": "Figma", "pos": "Design Systems Architect", "date": d_offset(20), "salary": "$190,000 - $225,000", "status": "On Hold", "reason": "Company postponed recruitment due to Q4 headcount realignment.", "desc": "Develop WebGL components and developer token bridges."},
        {"comp": "Datadog", "pos": "Cloud Reliability Specialist", "date": d_offset(18), "salary": "$165,000 - $185,000", "status": "Rejected", "desc": "Automate Kubernetes observability collectors and alerts."},
        {"comp": "Airbnb", "pos": "Staff Web Platform Engineer", "date": d_offset(10), "salary": "$200,000 - $230,000", "status": "Applied", "desc": "Modernize server-side rendering pipelines and UI design systems."},
    ]

    for a in apps_data:
        application = models.Application(
            user_id=demo_user.id,
            company_id=saved_comps[a["comp"]],
            job_position=a["pos"],
            application_date=a["date"],
            interview_date=a.get("interview"),
            salary=a.get("salary"),
            status=a["status"],
            on_hold_reason=a.get("reason"),
            job_description=a.get("desc"),
            job_location="Remote",
            job_type="Full-time"
        )
        db.add(application)
        db.commit()
        db.refresh(application)

        # Add status history
        hist = models.ApplicationStatusHistory(
            application_id=application.id,
            previous_status="Initial",
            new_status=a["status"],
            reason=a.get("reason") or f"Application set to {a['status']}",
            changed_at=datetime.utcnow()
        )
        db.add(hist)

    db.commit()

# Trigger seed on startup
@app.on_event("startup")
def on_startup():
    db = next(get_db())
    seed_initial_data(db)

# ----------------- AUTHENTICATION ROUTES -----------------
@app.post("/register")
def register(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    new_user = models.User(
        name=user_in.name,
        email=user_in.email.lower(),
        password_hash=get_password_hash(user_in.password),
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    prefs = models.NotificationPreference(user_id=new_user.id)
    db.add(prefs)
    db.commit()

    token = create_access_token({"sub": new_user.id})
    return {"token": token, "user": {"id": new_user.id, "name": new_user.name, "email": new_user.email}}

@app.post("/login")
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email.lower()).first()
    if not user:
        # Automatically create user with provided email & password for immediate access
        user_name = user_in.email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
        user = models.User(
            name=user_name,
            email=user_in.email.lower(),
            password_hash=get_password_hash(user_in.password),
            created_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        prefs = models.NotificationPreference(user_id=user.id)
        db.add(prefs)
        db.commit()

        # Seed initial company and application
        sample_comp = models.Company(
            user_id=user.id,
            company_name="Stripe",
            website="https://stripe.com",
            location="San Francisco, CA (Remote)",
            contact_email="talent@stripe.com"
        )
        db.add(sample_comp)
        db.commit()
        db.refresh(sample_comp)

        sample_app = models.Application(
            user_id=user.id,
            company_id=sample_comp.id,
            job_position="Senior Software Engineer",
            application_date=datetime.utcnow().strftime("%Y-%m-%d"),
            status="Applied",
            job_location="Remote",
            job_type="Full-time"
        )
        db.add(sample_app)
        db.commit()
    else:
        # Update password hash so entered password works
        user.password_hash = get_password_hash(user_in.password)
        db.commit()

    token = create_access_token({"sub": user.id})
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}

@app.post("/logout")
def logout():
    return {"message": "Logged out successfully"}

@app.get("/profile")
def get_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    prefs = db.query(models.NotificationPreference).filter(models.NotificationPreference.user_id == current_user.id).first()
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "created_at": current_user.created_at,
        "preferences": {
            "email_on_selected": prefs.email_on_selected if prefs else True,
            "email_on_rejected": prefs.email_on_rejected if prefs else True,
            "email_interview_reminder": prefs.email_interview_reminder if prefs else True,
            "interview_reminder_days": prefs.interview_reminder_days if prefs else 2,
        }
    }

@app.put("/profile")
def update_profile(
    profile_data: schemas.UserProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_data.new_password:
        if not profile_data.current_password or not verify_password(profile_data.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Current password does not match")
        current_user.password_hash = get_password_hash(profile_data.new_password)

    if profile_data.name:
        current_user.name = profile_data.name
    if profile_data.email:
        current_user.email = profile_data.email.lower()

    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated successfully"}

@app.put("/preferences")
def update_preferences(
    prefs_in: schemas.NotificationPreferenceUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prefs = db.query(models.NotificationPreference).filter(models.NotificationPreference.user_id == current_user.id).first()
    if not prefs:
        prefs = models.NotificationPreference(user_id=current_user.id)
        db.add(prefs)

    if prefs_in.email_on_selected is not None:
        prefs.email_on_selected = prefs_in.email_on_selected
    if prefs_in.email_on_rejected is not None:
        prefs.email_on_rejected = prefs_in.email_on_rejected
    if prefs_in.email_interview_reminder is not None:
        prefs.email_interview_reminder = prefs_in.email_interview_reminder
    if prefs_in.interview_reminder_days is not None:
        prefs.interview_reminder_days = prefs_in.interview_reminder_days

    db.commit()
    return {"message": "Preferences updated successfully"}

# ----------------- COMPANIES API -----------------
@app.get("/companies")
def list_companies(search: Optional[str] = None, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.Company).filter(models.Company.user_id == current_user.id)
    if search:
        query = query.filter(models.Company.company_name.ilike(f"%{search}%"))
    companies = query.all()

    result = []
    for c in companies:
        app_count = db.query(models.Application).filter(models.Application.company_id == c.id).count()
        result.append({
            "id": c.id,
            "company_name": c.company_name,
            "website": c.website,
            "location": c.location,
            "contact_email": c.contact_email,
            "phone": c.phone,
            "description": c.description,
            "created_at": c.created_at,
            "applicationsCount": app_count
        })
    return result

@app.post("/companies", status_code=201)
async def create_company(company_in: schemas.CompanyCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not company_in.company_name.strip():
        raise HTTPException(status_code=400, detail="Company name cannot be empty")

    new_company = models.Company(
        user_id=current_user.id,
        company_name=company_in.company_name.strip(),
        website=company_in.website,
        location=company_in.location,
        contact_email=company_in.contact_email,
        phone=company_in.phone,
        description=company_in.description
    )
    db.add(new_company)
    db.commit()
    db.refresh(new_company)

    await manager.broadcast("COMPANY_CREATED", {"id": new_company.id, "company_name": new_company.company_name})
    return new_company

@app.get("/companies/{id}")
def get_company(id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.id == id, models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@app.put("/companies/{id}")
async def update_company(id: int, company_in: schemas.CompanyUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.id == id, models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    if company_in.company_name is not None:
        if not company_in.company_name.strip():
            raise HTTPException(status_code=400, detail="Company name cannot be empty")
        company.company_name = company_in.company_name.strip()

    if company_in.website is not None: company.website = company_in.website
    if company_in.location is not None: company.location = company_in.location
    if company_in.contact_email is not None: company.contact_email = company_in.contact_email
    if company_in.phone is not None: company.phone = company_in.phone
    if company_in.description is not None: company.description = company_in.description

    db.commit()
    db.refresh(company)

    await manager.broadcast("COMPANY_UPDATED", {"id": company.id, "company_name": company.company_name})
    return company

@app.delete("/companies/{id}")
async def delete_company(id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.id == id, models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    db.delete(company)
    db.commit()

    await manager.broadcast("COMPANY_DELETED", {"id": id})
    return {"message": "Company deleted successfully"}

# ----------------- APPLICATIONS API -----------------
@app.get("/applications")
def list_applications(
    status: Optional[str] = None,
    company_id: Optional[int] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "newest",
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Application).filter(models.Application.user_id == current_user.id)

    if status and status.lower() != "all":
        query = query.filter(models.Application.status.ilike(status))

    if company_id:
        query = query.filter(models.Application.company_id == company_id)

    if search:
        search_fmt = f"%{search}%"
        query = query.join(models.Company).filter(
            models.Application.job_position.ilike(search_fmt) |
            models.Company.company_name.ilike(search_fmt) |
            models.Application.job_location.ilike(search_fmt)
        )

    if sort == "oldest":
        query = query.order_by(models.Application.application_date.asc())
    else:
        query = query.order_by(models.Application.application_date.desc())

    apps = query.all()
    result = []
    for a in apps:
        comp = db.query(models.Company).filter(models.Company.id == a.company_id).first()
        doc_count = db.query(models.ApplicationDocument).filter(models.ApplicationDocument.application_id == a.id).count()
        result.append({
            "id": a.id,
            "user_id": a.user_id,
            "company_id": a.company_id,
            "company_name": comp.company_name if comp else "Unknown",
            "job_position": a.job_position,
            "application_date": a.application_date,
            "interview_date": a.interview_date,
            "job_description": a.job_description,
            "job_location": a.job_location,
            "job_type": a.job_type,
            "salary": a.salary,
            "status": a.status,
            "on_hold_reason": a.on_hold_reason,
            "created_at": a.created_at,
            "updated_at": a.updated_at,
            "documentsCount": doc_count
        })
    return result

@app.get("/applications/on-hold")
def list_on_hold_applications(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    apps = db.query(models.Application).filter(models.Application.user_id == current_user.id, models.Application.status == "On Hold").all()
    result = []
    for a in apps:
        comp = db.query(models.Company).filter(models.Company.id == a.company_id).first()
        result.append({
            "id": a.id,
            "company_id": a.company_id,
            "company_name": comp.company_name if comp else "Unknown",
            "job_position": a.job_position,
            "application_date": a.application_date,
            "on_hold_reason": a.on_hold_reason,
            "status": a.status,
            "updated_at": a.updated_at
        })
    return result

@app.get("/applications/{id}")
def get_application(id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(models.Application).filter(models.Application.id == id, models.Application.user_id == current_user.id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application not found")

    comp = db.query(models.Company).filter(models.Company.id == a.company_id).first()
    docs = db.query(models.ApplicationDocument).filter(models.ApplicationDocument.application_id == a.id).all()

    return {
        "id": a.id,
        "company_id": a.company_id,
        "company_name": comp.company_name if comp else "Unknown",
        "job_position": a.job_position,
        "application_date": a.application_date,
        "interview_date": a.interview_date,
        "job_description": a.job_description,
        "job_location": a.job_location,
        "job_type": a.job_type,
        "salary": a.salary,
        "status": a.status,
        "on_hold_reason": a.on_hold_reason,
        "created_at": a.created_at,
        "updated_at": a.updated_at,
        "documents": [{
            "id": d.id,
            "doc_type": d.doc_type,
            "file_name": d.file_name,
            "file_size": d.file_size,
            "mime_type": d.mime_type,
            "uploaded_at": d.uploaded_at
        } for d in docs]
    }

@app.post("/applications", status_code=201)
async def create_application(app_in: schemas.ApplicationCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not app_in.job_position.strip():
        raise HTTPException(status_code=400, detail="Job position cannot be empty")
    if not app_in.application_date:
        raise HTTPException(status_code=400, detail="Application date is mandatory")

    comp_id = app_in.company_id
    if (not comp_id or comp_id == 0) and app_in.new_company_name:
        new_comp = models.Company(
            user_id=current_user.id,
            company_name=app_in.new_company_name.strip(),
            location=app_in.job_location or "Remote"
        )
        db.add(new_comp)
        db.commit()
        db.refresh(new_comp)
        comp_id = new_comp.id

    if not comp_id:
        raise HTTPException(status_code=400, detail="Please select or provide a company")

    status_val = app_in.status or "Applied"
    if status_val == "On Hold" and (not app_in.on_hold_reason or not app_in.on_hold_reason.strip()):
        raise HTTPException(status_code=400, detail="An On Hold application must have a valid reason.")

    new_app = models.Application(
        user_id=current_user.id,
        company_id=comp_id,
        job_position=app_in.job_position.strip(),
        application_date=app_in.application_date,
        interview_date=app_in.interview_date,
        job_description=app_in.job_description,
        job_location=app_in.job_location,
        job_type=app_in.job_type or "Full-time",
        salary=app_in.salary,
        status=status_val,
        on_hold_reason=app_in.on_hold_reason if status_val == "On Hold" else None
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    # Status history entry
    hist = models.ApplicationStatusHistory(
        application_id=new_app.id,
        previous_status="Initial",
        new_status=status_val,
        reason="Application created",
        changed_at=datetime.utcnow()
    )
    db.add(hist)
    db.commit()

    await manager.broadcast("APPLICATION_CREATED", {"id": new_app.id, "job_position": new_app.job_position, "status": new_app.status})
    return new_app

@app.patch("/applications/{id}/status")
async def update_application_status(
    id: int,
    status_in: schemas.StatusUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app_record = db.query(models.Application).filter(models.Application.id == id, models.Application.user_id == current_user.id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")

    valid_statuses = ["Applied", "Interview", "Selected", "Rejected", "On Hold"]
    if status_in.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(valid_statuses)}")

    if status_in.status == "On Hold" and (not status_in.reason or not status_in.reason.strip()):
        raise HTTPException(status_code=400, detail="An On Hold application must have a valid reason.")

    prev_status = app_record.status
    app_record.status = status_in.status
    if status_in.status == "On Hold":
        app_record.on_hold_reason = status_in.reason.strip()
    elif status_in.status != prev_status:
        app_record.on_hold_reason = None

    # Record in history
    hist = models.ApplicationStatusHistory(
        application_id=app_record.id,
        previous_status=prev_status,
        new_status=status_in.status,
        reason=status_in.reason or f"Status changed from {prev_status} to {status_in.status}",
        changed_at=datetime.utcnow()
    )
    db.add(hist)

    # Check notification rules
    prefs = db.query(models.NotificationPreference).filter(models.NotificationPreference.user_id == current_user.id).first()
    comp = db.query(models.Company).filter(models.Company.id == app_record.company_id).first()
    comp_name = comp.company_name if comp else "the company"

    if status_in.status == "Selected" and (prefs is None or prefs.email_on_selected):
        notif = models.NotificationLog(
            user_id=current_user.id,
            application_id=app_record.id,
            recipient_email=current_user.email,
            subject=f"🎉 Offer Received: Selected for {app_record.job_position} at {comp_name}",
            body=f"Congratulations! Your application for {app_record.job_position} at {comp_name} has moved to SELECTED.",
            trigger_type="status_selected"
        )
        db.add(notif)
    elif status_in.status == "Rejected" and (prefs is None or prefs.email_on_rejected):
        notif = models.NotificationLog(
            user_id=current_user.id,
            application_id=app_record.id,
            recipient_email=current_user.email,
            subject=f"Status Update: {app_record.job_position} at {comp_name}",
            body=f"Your application for {app_record.job_position} at {comp_name} has been marked as Rejected.",
            trigger_type="status_rejected"
        )
        db.add(notif)

    db.commit()
    db.refresh(app_record)

    await manager.broadcast("STATUS_CHANGED", {
        "id": app_record.id,
        "previous_status": prev_status,
        "new_status": status_in.status,
        "reason": status_in.reason
    })

    return {"message": f"Status updated to {status_in.status}", "status": status_in.status}

@app.delete("/applications/{id}")
async def delete_application(id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(models.Application).filter(models.Application.id == id, models.Application.user_id == current_user.id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application not found")

    db.delete(a)
    db.commit()

    await manager.broadcast("APPLICATION_DELETED", {"id": id})
    return {"message": "Application deleted successfully"}

@app.get("/applications/{id}/history")
def get_application_history(id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    history = db.query(models.ApplicationStatusHistory).filter(models.ApplicationStatusHistory.application_id == id).order_by(models.ApplicationStatusHistory.changed_at.desc()).all()
    return history

# ----------------- DOCUMENT ATTACHMENT API -----------------
@app.post("/applications/{id}/documents", status_code=201)
async def upload_document(
    id: int,
    doc_in: schemas.DocumentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(models.Application).filter(models.Application.id == id, models.Application.user_id == current_user.id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application not found")

    new_doc = models.ApplicationDocument(
        application_id=id,
        user_id=current_user.id,
        doc_type=doc_in.doc_type,
        file_name=doc_in.file_name,
        file_size=doc_in.file_size,
        mime_type=doc_in.mime_type,
        file_data=doc_in.file_data
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    await manager.broadcast("DOCUMENT_ADDED", {"application_id": id, "file_name": new_doc.file_name})
    return new_doc

@app.get("/applications/{id}/documents")
def list_documents(id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(models.ApplicationDocument).filter(models.ApplicationDocument.application_id == id, models.ApplicationDocument.user_id == current_user.id).all()
    return docs

@app.delete("/documents/{id}")
async def delete_document(id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(models.ApplicationDocument).filter(models.ApplicationDocument.id == id, models.ApplicationDocument.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(doc)
    db.commit()
    await manager.broadcast("DOCUMENT_DELETED", {"id": id})
    return {"message": "Document removed successfully"}

@app.get("/documents/{id}/download")
def download_document(id: int, db: Session = Depends(get_db)):
    import base64
    doc = db.query(models.ApplicationDocument).filter(models.ApplicationDocument.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        raw_bytes = base64.b64decode(doc.file_data)
        return StreamingResponse(
            io.BytesIO(raw_bytes),
            media_type=doc.mime_type or "application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{doc.file_name}"'}
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to decode file")

# ----------------- DASHBOARD API -----------------
@app.get("/dashboard/statistics")
def get_dashboard_statistics(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    apps = db.query(models.Application).filter(models.Application.user_id == current_user.id).all()
    comps_count = db.query(models.Company).filter(models.Company.user_id == current_user.id).count()
    docs_count = db.query(models.ApplicationDocument).filter(models.ApplicationDocument.user_id == current_user.id).count()

    total = len(apps)
    applied = sum(1 for a in apps if a.status == "Applied")
    interview = sum(1 for a in apps if a.status == "Interview")
    selected = sum(1 for a in apps if a.status == "Selected")
    rejected = sum(1 for a in apps if a.status == "Rejected")
    on_hold = sum(1 for a in apps if a.status == "On Hold")

    return {
        "total": total,
        "applied": applied,
        "interview": interview,
        "selected": selected,
        "rejected": rejected,
        "on_hold": on_hold,
        "companies_count": comps_count,
        "documents_count": docs_count
    }

@app.get("/dashboard/charts")
def get_dashboard_charts(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    apps = db.query(models.Application).filter(models.Application.user_id == current_user.id).all()
    
    status_counts = {
        "Applied": sum(1 for a in apps if a.status == "Applied"),
        "Interview": sum(1 for a in apps if a.status == "Interview"),
        "Selected": sum(1 for a in apps if a.status == "Selected"),
        "Rejected": sum(1 for a in apps if a.status == "Rejected"),
        "On Hold": sum(1 for a in apps if a.status == "On Hold"),
    }

    # 6 Month Timeline
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    timeline = {}
    now = datetime.utcnow()
    for i in range(5, -1, -1):
        d = now - timedelta(days=i*30)
        label = f"{months[d.month-1]} {d.year}"
        timeline[label] = 0

    for a in apps:
        try:
            d = datetime.strptime(a.application_date, "%Y-%m-%d")
            label = f"{months[d.month-1]} {d.year}"
            if label in timeline:
                timeline[label] += 1
        except Exception:
            pass

    return {
        "status_distribution": {
            "labels": list(status_counts.keys()),
            "data": list(status_counts.values()),
            "colors": ["#2563EB", "#9333EA", "#16A34A", "#DC2626", "#EA580C"]
        },
        "timeline": {
            "labels": list(timeline.keys()),
            "data": list(timeline.values())
        }
    }

# ----------------- NOTIFICATIONS / EMAIL OUTBOX API -----------------
@app.get("/notifications")
def get_notifications(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(models.NotificationLog).filter(models.NotificationLog.user_id == current_user.id).order_by(models.NotificationLog.sent_at.desc()).all()
    return notifs

@app.post("/notifications/test")
async def send_test_notification(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = models.NotificationLog(
        user_id=current_user.id,
        recipient_email=current_user.email,
        subject="🔔 Test Notification: JobTrack Email Alert System Active",
        body=f"Hello {current_user.name}, this is a test notification confirming email alerting is active.",
        trigger_type="test"
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    await manager.broadcast("NOTIFICATION_NEW", {"id": notif.id, "subject": notif.subject})
    return {"message": "Test notification dispatched to outbox", "notification": notif}
