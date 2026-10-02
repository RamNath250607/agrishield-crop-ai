import os
import logging
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, JSON, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Fallback path for SQLite in the workspace
SQLITE_DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
    "crop_db.db"
)
SQLITE_URL = f"sqlite:///{SQLITE_DB_PATH}"

# Fetch DATABASE_URL from env or default to standard PostgreSQL path
postgres_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/crop_db")

engine = None
SessionLocal = None

try:
    logger.info(f"Attempting connection to PostgreSQL database...")
    # Attempt to create PostgreSQL engine with a short connection timeout (3 seconds)
    engine = create_engine(
        postgres_url, 
        connect_args={"connect_timeout": 3} if "postgresql" in postgres_url else {}
    )
    # Test connection
    with engine.connect() as conn:
        logger.info("Successfully connected to PostgreSQL database!")
except Exception as e:
    logger.warning(
        f"PostgreSQL connection failed: {e}. Falling back to SQLite database at {SQLITE_URL}"
    )
    # SQLite connection fallback
    engine = create_engine(
        SQLITE_URL, 
        connect_args={"check_same_thread": False} if "sqlite" in SQLITE_URL else {}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    crop_type = Column(String(50), nullable=False)
    disease_name = Column(String(100), nullable=False)
    scientific_name = Column(String(100))
    pathogen_type = Column(String(50))
    severity_percentage = Column(Float, nullable=False)
    severity_level = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    bounding_boxes = Column(JSON) # Stores list of dicts: [{"x":x, "y":y, "w":w, "h":h, "label":label}]
    pesticide_name = Column(String(100))
    pesticide_dosage = Column(String(100))
    pesticide_safety_instructions = Column(Text)
    cultural_care_instructions = Column(Text)
    image_path = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(String(50)) # chemical, organic, cultural
    status = Column(String(50), default="pending") # pending, completed
    due_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    temperature = Column(Float)
    humidity = Column(Float)
    soil_moisture = Column(Float)
    solar_radiation = Column(Float)
    status_label = Column(String(50)) # e.g. "High Humidity", "Optimal", "Dry Soil"
    recorded_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
