"""Database connection and session management using SQLAlchemy."""
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base

# Base class for declarative models
Base = declarative_base()

# Database path - can be configured via environment variable
DB_PATH = os.getenv("DATABASE_URL", "sqlite:///src/db/database.sqlite")

# Convert relative path to absolute if needed
if DB_PATH.startswith("sqlite:///"):
    db_file = DB_PATH.replace("sqlite:///", "")
    if not Path(db_file).is_absolute():
        # Get absolute path relative to project root
        project_root = Path(__file__).parent.parent.parent
        db_file = project_root / db_file
        DB_PATH = f"sqlite:///{db_file}"

# Create engine
# For SQLite, we need check_same_thread=False for FastAPI
engine = create_engine(
    DB_PATH,
    connect_args={"check_same_thread": False} if "sqlite" in DB_PATH else {},
    echo=False  # Set to True for SQL query logging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """
    Dependency function for FastAPI to get database session.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables from Base metadata."""
    Base.metadata.create_all(bind=engine)
