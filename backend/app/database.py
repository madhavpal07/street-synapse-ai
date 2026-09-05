"""
database.py

SQLAlchemy-based SQLite database setup for the Smart City Incident
Detection System (SIH 2026).

This module defines:
    1. The database engine and session factory.
    2. The `Incident` ORM model, mapped to the `incidents` table.
    3. A helper function to initialize (create) the database/tables.

Usage:
    Run this file directly to create `smart_city.db` with the
    `incidents` table:

        python -m backend.app.database

    Or import `init_db()` / `SessionLocal` / `Incident` from your
    FastAPI / Flask app to use the same database elsewhere.
"""

import os
from datetime import datetime

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    DateTime,
)
from sqlalchemy.orm import declarative_base, sessionmaker

# ---------------------------------------------------------------------------
# 1. Database configuration
# ---------------------------------------------------------------------------

# Directory in which this file lives -> backend/app/
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# The SQLite file will be created at backend/app/smart_city.db
# You can override this by setting the DATABASE_URL environment variable,
# which makes it trivial to swap SQLite for Postgres/MySQL later
# (e.g. "postgresql://user:pass@host/dbname") without touching the model code.
DEFAULT_SQLITE_PATH = os.path.join(BASE_DIR, "smart_city.db")
DATABASE_URL = os.environ.get(
    "DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}"
)

# `connect_args` is required ONLY for SQLite because, by default, SQLite
# only allows the thread that created a connection to use it. FastAPI/Flask
# apps handle requests on different threads, so we relax that restriction.
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,  # Set to True temporarily if you want to see raw SQL logs
)

# SessionLocal is a factory for creating new Session objects.
# Each request/unit-of-work in your backend should get its own session.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class that all ORM models inherit from.
Base = declarative_base()

# ---------------------------------------------------------------------------
# 2. Incident model -> "incidents" table
# ---------------------------------------------------------------------------


class Incident(Base):
    """
    ORM model representing a single detected civic incident
    (pothole, garbage pile, waterlogging, faulty streetlight, etc.)
    reported by a vehicle-mounted detection unit.
    """

    __tablename__ = "incidents"

    # Primary key - auto-incrementing unique identifier for each incident
    incident_id = Column(Integer, primary_key=True, autoincrement=True, index=True)

    # Type of incident detected. Application-level values expected:
    # "pothole", "garbage", "water_log", "streetlight"
    type = Column(String(50), nullable=False, index=True)

    # File system path (or cloud storage key/URL) of the captured image
    image_path = Column(String(255), nullable=False)

    # GPS coordinates of the detection
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Model confidence score for the detection, typically in the range 0.0-1.0
    confidence = Column(Float, nullable=False)

    # Identifier of the vehicle (e.g. municipal van, patrol car) that
    # captured the incident
    vehicle_id = Column(String(50), nullable=False, index=True)

    # Timestamp of when the incident was detected.
    # Defaults to the current UTC time if not explicitly provided.
    detection_time = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Current status of the municipal ticket raised for this incident.
    # Application-level values expected: "Open", "In Progress", "Resolved"
    ticket_status = Column(String(20), nullable=False, default="Open")

    def __repr__(self):
        return (
            f"<Incident(id={self.incident_id}, type='{self.type}', "
            f"status='{self.ticket_status}', vehicle='{self.vehicle_id}')>"
        )

    def to_dict(self):
        """Convenience method to serialize an Incident row to a dict,
        useful when returning JSON from API endpoints."""
        return {
            "incident_id": self.incident_id,
            "type": self.type,
            "image_path": self.image_path,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "confidence": self.confidence,
            "vehicle_id": self.vehicle_id,
            "detection_time": self.detection_time.isoformat()
            if self.detection_time
            else None,
            "ticket_status": self.ticket_status,
        }


# ---------------------------------------------------------------------------
# 3. Helper functions
# ---------------------------------------------------------------------------


def init_db():
    """
    Create all tables defined by Base's subclasses (currently just
    `incidents`) if they do not already exist.

    Safe to call multiple times - SQLAlchemy will not recreate or
    overwrite existing tables.
    """
    Base.metadata.create_all(bind=engine)
    print(f"[database.py] Database initialized at: {DATABASE_URL}")


def get_db():
    """
    FastAPI-style dependency generator.

    Yields a database session and guarantees it is closed afterwards,
    even if an exception occurs while handling the request.

    Example (FastAPI):

        from fastapi import Depends
        from backend.app.database import get_db

        @app.get("/incidents")
        def list_incidents(db: Session = Depends(get_db)):
            return db.query(Incident).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# 4. Allow running this file directly to bootstrap the DB
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    init_db()