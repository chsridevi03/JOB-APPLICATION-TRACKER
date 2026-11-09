import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Default to MySQL as requested, with automatic fallback to SQLite for immediate testing
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "password")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DB = os.getenv("MYSQL_DB", "jobtrack_db")

MYSQL_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
DATABASE_URL = os.getenv("DATABASE_URL", MYSQL_URL)

try:
    if "mysql" in DATABASE_URL:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)
    else:
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
except Exception:
    # Fallback to local SQLite if MySQL server is not currently reachable
    DATABASE_URL = "sqlite:///./jobtrack.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
