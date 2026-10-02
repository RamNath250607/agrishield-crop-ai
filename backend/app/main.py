import os
import shutil
import random
import logging
from datetime import datetime, date
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.database import get_db, init_db, Scan, Task, Telemetry
from app.schemas import ScanResponse, TaskCreate, TaskUpdate, TaskResponse, TelemetryResponse
from app.ml.yolo_detector import YOLODetector
from app.ml.classifier import CropDiseaseClassifier
from app.ml.severity_estimator import SeverityEstimator
from app.agent.agri_agent import AgriculturalAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI App
app = FastAPI(
    title="AgriShield Crop AI - Backend Service",
    description="Disease Detection, Classification, Severity Estimation, and Agentic Dosing API.",
    version="1.0.0"
)

# Configure CORS for React Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows connections from Vite server (typically localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup directories for storing uploaded scanned images
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static folder so uploaded images can be fetched via URL
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

# Instantiate ML & Agent Singletons
yolo_detector = YOLODetector()
disease_classifier = CropDiseaseClassifier()
severity_estimator = SeverityEstimator()
agri_agent = AgriculturalAgent()

# Initialize Database on Startup
@app.on_event("startup")
def startup_event():
    init_db()
    
    # Pre-populate some telemetry data if empty
    db = next(get_db())
    if db.query(Telemetry).count() == 0:
        logger.info("Pre-populating initial telemetry database records...")
        initial_telemetry = Telemetry(
            temperature=24.5,
            humidity=84.0,
            soil_moisture=38.0,
            solar_radiation=5.2,
            status_label="High Humidity"
        )
        db.add(initial_telemetry)
        
        # Pre-populate sample treatment planner tasks
        initial_tasks = [
            Task(
                title="Rake apple leaves",
                description="Rake and destroy fallen apple leaves under Sectors S1-S3 to prevent Apple Scab spores overwintering.",
                type="cultural",
                status="pending",
                due_date=date.today()
            ),
            Task(
                title="Prepare drip line Sector A2",
                description="Transition Tomato Sector A2 from overhead spraying to drip irrigation.",
                type="cultural",
                status="pending",
                due_date=date.today()
            )
        ]
        db.add_all(initial_tasks)
        db.commit()

# Core Endpoint: Crop Leaf Image Scan & Multi-Model Diagnosis Pipeline
@app.post("/api/scan", response_model=ScanResponse)
async def scan_crop_leaf(
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # 1. Save uploaded image to disk
        filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{image.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
            
        logger.info(f"Saved uploaded leaf scan to {file_path}")

        # 2. Run YOLOv11 Disease Detection (bounding boxes of lesions)
        bboxes = yolo_detector.detect(file_path)
        
        # 3. Run ResNet50/EfficientNet Classification (identify crop and disease name)
        disease_name, confidence, crop_type = disease_classifier.classify(file_path, image.filename)
        
        # Check if classified as healthy
        is_healthy = "healthy" in disease_name.lower()
        
        # 4. Run CNN + XGBoost Severity Assessment
        severity_pct, severity_lvl = severity_estimator.estimate(file_path, is_healthy=is_healthy)

        # 5. Fetch latest sensor telemetry from the field (or generate live readings if none)
        latest_telemetry = db.query(Telemetry).order_by(Telemetry.recorded_at.desc()).first()
        temp = latest_telemetry.temperature if latest_telemetry else 25.0
        humidity = latest_telemetry.humidity if latest_telemetry else 60.0
        moisture = latest_telemetry.soil_moisture if latest_telemetry else 50.0

        # 6. Run LangGraph Agent Workflow
        # Calibrates pesticide doses & writes cultural guidelines safeguarding against phytotoxicity
        agent_input = {
            "crop_type": crop_type,
            "disease_name": disease_name,
            "severity_percentage": severity_pct,
            "severity_level": severity_lvl,
            "temperature": temp,
            "humidity": humidity,
            "soil_moisture": moisture
        }
        
        agent_report = agri_agent.run_agent(agent_input)

        # 7. Write scan record to DB
        scan_record = Scan(
            crop_type=crop_type,
            disease_name=disease_name,
            scientific_name="Phytophthora infestans" if "blight" in disease_name.lower() else (
                "Venturia inaequalis" if "scab" in disease_name.lower() else (
                    "Puccinia sorghi" if "rust" in disease_name.lower() else (
                        "Guignardia bidwellii" if "rot" in disease_name.lower() else "Solanum lycopersicum"
                    )
                )
            ),
            pathogen_type="Oomycete (Fungal-like)" if "blight" in disease_name.lower() else (
                "Ascomycete Fungus" if "scab" in disease_name.lower() or "rot" in disease_name.lower() else (
                    "Basidiomycete Fungus" if "rust" in disease_name.lower() else "None"
                )
            ),
            severity_percentage=severity_pct,
            severity_level=severity_lvl,
            confidence=confidence,
            bounding_boxes=bboxes,
            pesticide_name=agent_report["pesticide_name"],
            pesticide_dosage=agent_report["pesticide_dosage"],
            pesticide_safety_instructions=agent_report["pesticide_safety_instructions"],
            cultural_care_instructions=agent_report["cultural_care_instructions"],
            image_path=f"/static/uploads/{filename}"
        )

        db.add(scan_record)
        
        # 8. Create a matching scheduled calendar task automatically if treatment is required
        if not is_healthy and agent_report["pesticide_name"] != "None required":
            treatment_task = Task(
                title=f"Spray {agent_report['pesticide_name']} - {crop_type}",
                description=(
                    f"Calibrated therapeutic application to treat {disease_name}.\n"
                    f"Dosage: {agent_report['pesticide_dosage']}.\n"
                    f"Instructions: {agent_report['pesticide_safety_instructions']}"
                ),
                type="chemical" if severity_lvl != "Low" else "organic",
                status="pending",
                due_date=date.today()
            )
            db.add(treatment_task)

        db.commit()
        db.refresh(scan_record)
        logger.info(f"Database diagnosis logged under Scan ID: {scan_record.id}")

        return scan_record

    except Exception as e:
        logger.error(f"Scan pipeline failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# History Route: Get all leaf scans
@app.get("/api/scans", response_model=list[ScanResponse])
def get_scans_history(db: Session = Depends(get_db)):
    return db.query(Scan).order_by(Scan.created_at.desc()).all()

# Live Telemetry Route: Returns simulated real-time telemetry metrics
@app.get("/api/telemetry", response_model=TelemetryResponse)
def get_sensor_telemetry(db: Session = Depends(get_db)):
    # Retrieve the last logged reading
    last_t = db.query(Telemetry).order_by(Telemetry.recorded_at.desc()).first()
    
    # Introduce small random variations to simulate live field telemetry
    temp_delta = random.uniform(-0.5, 0.5)
    hum_delta = random.uniform(-1.0, 1.0)
    moist_delta = random.uniform(-1.5, 1.5)
    rad_delta = random.uniform(-0.2, 0.2)

    new_temp = round(max(10.0, min(45.0, (last_t.temperature if last_t else 24.5) + temp_delta)), 1)
    new_hum = round(max(20.0, min(100.0, (last_t.humidity if last_t else 84.0) + hum_delta)), 1)
    new_moist = round(max(5.0, min(100.0, (last_t.soil_moisture if last_t else 38.0) + moist_delta)), 1)
    new_rad = round(max(0.0, min(12.0, (last_t.solar_radiation if last_t else 5.2) + rad_delta)), 1)

    # Determine status labels
    if new_hum > 80.0:
        label = "High Humidity"
    elif new_moist < 40.0:
        label = "Dry Soil"
    elif new_temp > 32.0:
        label = "High Heat Warning"
    else:
        label = "Optimal"

    # Always commit the telemetry entry so that the ORM object has a valid
    # `id` and `recorded_at` (auto-generated by the DB).  The 15% gate was
    # causing 500s because the unsaved object lacked those fields, which
    # TelemetryResponse requires.  Rows accumulate slowly anyway.
    telemetry_entry = Telemetry(
        temperature=new_temp,
        humidity=new_hum,
        soil_moisture=new_moist,
        solar_radiation=new_rad,
        status_label=label
    )
    db.add(telemetry_entry)
    db.commit()
    db.refresh(telemetry_entry)

    return telemetry_entry

# Treatment Planner: Task endpoints
@app.get("/api/tasks", response_model=list[TaskResponse])
def get_treatment_tasks(db: Session = Depends(get_db)):
    return db.query(Task).order_by(Task.due_date.asc(), Task.id.desc()).all()

@app.post("/api/tasks", response_model=TaskResponse)
def create_treatment_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(
        title=task_in.title,
        description=task_in.description,
        type=task_in.type,
        status=task_in.status,
        due_date=task_in.due_date
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.put("/api/tasks/{task_id}", response_model=TaskResponse)
def update_task_status(task_id: int, task_up: TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db_task.status = task_up.status
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_treatment_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
    return None

# Geotargeting Hotspots Route: Returns coordinate sectors with active infections
@app.get("/api/hotspots")
def get_field_hotspots(db: Session = Depends(get_db)):
    """
    Scans recent crop database logs and generates visual coordinates representing
    the intensity of disease presence mapping back to sectors (A1, S1, E1, etc.).
    """
    scans = db.query(Scan).filter(Scan.severity_level != "Optimal").order_by(Scan.created_at.desc()).limit(15).all()
    
    sectors = {
        "Tomato": ["Sector A1 (North)", "Sector A2 (North)", "Sector B3 (North)"],
        "Apple": ["Sector S1 (Orchard)", "Sector S3 (Orchard)", "Sector S6 (Orchard)"],
        "Corn": ["Sector E1 (East)", "Sector E4 (East)", "Sector E7 (East)"],
        "Grape": ["Sector G2 (West)", "Sector G5 (West)"]
    }
    
    hotspots = []
    for s in scans:
        if s.crop_type in sectors:
            target_sector = random.choice(sectors[s.crop_type])
            hotspots.append({
                "id": s.id,
                "crop": s.crop_type,
                "disease": s.disease_name,
                "severity": s.severity_level,
                "percentage": s.severity_percentage,
                "sector": target_sector,
                "date": s.created_at.strftime('%Y-%m-%d %H:%M')
            })
            
    # Mock fallback hotspots if DB history is clean
    if not hotspots:
        hotspots = [
            {"id": 1, "crop": "Tomato", "disease": "Late Blight", "severity": "Severe", "percentage": 85.5, "sector": "Sector A2 (North)", "date": "Active Peak"},
            {"id": 2, "crop": "Apple", "disease": "Apple Scab", "severity": "Moderate", "percentage": 34.2, "sector": "Sector S3 (Orchard)", "date": "Active Peak"},
            {"id": 3, "crop": "Grape", "disease": "Black Rot", "severity": "Severe", "percentage": 68.1, "sector": "Sector G2 (West)", "date": "Active Peak"}
        ]
        
    return hotspots
