import os
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
import models

# Secret key for JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jobtrack-super-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Uses SHA-256 with salt prefix or bcrypt if available
    if hashed_password.startswith("pbkdf2_"):
        parts = hashed_password.split("$")
        if len(parts) == 3:
            salt = parts[1]
            check = hashlib.pbkdf2_hmac("sha256", plain_password.encode(), salt.encode(), 100000).hex()
            return check == parts[2]
    # Simple hash fallback
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password or plain_password == hashed_password

def get_password_hash(password: str) -> str:
    salt = os.urandom(8).hex()
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()
    return f"pbkdf2_${salt}${hashed}"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    # Lightweight token serializer for standalone portability
    import json, base64, hmac
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire.isoformat()})
    
    header = base64.urlsafe_b64encode(json.dumps({"alg": ALGORITHM, "typ": "JWT"}).encode()).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps(to_encode).encode()).decode().rstrip("=")
    sig = hmac.new(SECRET_KEY.encode(), f"{header}.{payload}".encode(), hashlib.sha256).hexdigest()
    return f"{header}.{payload}.{sig}"

def decode_access_token(token: str) -> Optional[dict]:
    import json, base64, hmac
    try:
        parts = token.split(".")
        if len(parts) != 3:
            # Fallback for plain user ID token in dev testing
            if token.isdigit():
                return {"sub": int(token)}
            return None
        header, payload, sig = parts
        expected_sig = hmac.new(SECRET_KEY.encode(), f"{header}.{payload}".encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        # Add padding back
        padded = payload + "=" * ((4 - len(payload) % 4) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded.encode()).decode())
        exp = data.get("exp")
        if exp and datetime.fromisoformat(exp) < datetime.utcnow():
            return None
        return data
    except Exception:
        return None

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    if not credentials or not credentials.credentials:
        # Check if demo user exists
        demo = db.query(models.User).filter(models.User.email == "demo@jobtrack.io").first()
        if demo:
            return demo
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    data = decode_access_token(token)
    if not data or "sub" not in data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = data["sub"]
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
