import os
import sys
import logging
from datetime import date

# Set up path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db, get_db, Scan, Task, Telemetry
from app.ml.yolo_detector import YOLODetector
from app.ml.classifier import CropDiseaseClassifier
from app.ml.severity_estimator import SeverityEstimator
from app.agent.agri_agent import AgriculturalAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TestPipeline")

def run_integration_test():
    logger.info("Initializing database...")
    init_db()
    
    db = next(get_db())
    
    # 1. Clear database tables for fresh validation
    db.query(Scan).delete()
    db.query(Task).delete()
    db.query(Telemetry).delete()
    db.commit()
    logger.info("Cleared test database tables.")

    # 2. Add high-risk telemetry parameters
    # High humidity and high temperature to trigger chemical dosing adjustments
    test_telemetry = Telemetry(
        temperature=32.5, # Heat stress warning (>30C)
        humidity=88.0,
        soil_moisture=32.0, # Dry soil warning (<40%)
        solar_radiation=6.5,
        status_label="High Heat & Dry Soil"
    )
    db.add(test_telemetry)
    db.commit()
    logger.info("Logged stressed environmental telemetry to database.")

    # 3. Instantiate Models and Agents
    logger.info("Instantiating ML pipeline models and LangGraph Agent...")
    yolo = YOLODetector()
    classifier = CropDiseaseClassifier()
    severity = SeverityEstimator()
    agent = AgriculturalAgent()

    # We will test using the 'tomato_blight.jpg' context
    # This represents a leaf with Late Blight
    test_filename = "tomato_blight.jpg"
    logger.info(f"Piping leaf scan sample context: '{test_filename}' through detection models...")

    # A. Run BBox detector (simulating image input)
    # We pass a mock solid black image to test the CV fallback
    import numpy as np
    mock_image = np.zeros((300, 300, 3), dtype=np.uint8)
    # Draw a mock brown circle to represent a lesion
    import cv2
    cv2.circle(mock_image, (150, 150), 30, (20, 100, 120), -1) # Brown spot in BGR
    
    bboxes = yolo.detect(mock_image)
    logger.info(f"YOLO BBoxes detected: {bboxes}")

    # B. Run Pathogen Classification
    disease_name, confidence, crop_type = classifier.classify(mock_image, filename_context=test_filename)
    logger.info(f"Classifier output: Crop={crop_type}, Disease={disease_name}, Conf={confidence}")
    assert crop_type == "Tomato", "Crop classification failed"
    assert "Blight" in disease_name, "Disease pathogen classification failed"

    # C. Run Severity Estimation
    is_healthy = "healthy" in disease_name.lower()
    severity_pct, severity_lvl = severity.estimate(mock_image, is_healthy=is_healthy)
    logger.info(f"Severity Estimator output: {severity_pct}% ({severity_lvl})")
    assert severity_pct > 0, "Severity estimation failed"

    # D. Execute LangGraph safety dosage loop
    logger.info("Executing Agentic safety dosage reasoning graph...")
    agent_state = {
        "crop_type": crop_type,
        "disease_name": disease_name,
        "severity_percentage": severity_pct,
        "severity_level": severity_lvl,
        "temperature": test_telemetry.temperature,
        "humidity": test_telemetry.humidity,
        "soil_moisture": test_telemetry.soil_moisture
    }
    
    report = agent.run_agent(agent_state)
    logger.info(f"LangGraph compile report: {report}")
    
    # Assert safety warnings are active due to environmental stress (temperature & soil moisture)
    assert report["pesticide_name"] != "None", "Pesticide selector failed"
    assert "reduced" in report["pesticide_safety_instructions"].lower() or "warning" in report["pesticide_safety_instructions"].lower(), "Agent safety alert failed to trigger under stress telemetry"
    logger.info("SUCCESS: Safety dosage reductions verified successfully.")

    # E. Write to DB
    scan_log = Scan(
        crop_type=crop_type,
        disease_name=disease_name,
        severity_percentage=severity_pct,
        severity_level=severity_lvl,
        confidence=confidence,
        pesticide_name=report["pesticide_name"],
        pesticide_dosage=report["pesticide_dosage"],
        pesticide_safety_instructions=report["pesticide_safety_instructions"],
        cultural_care_instructions=report["cultural_care_instructions"],
    )
    db.add(scan_log)
    
    # Save a calendar task automatically
    treatment_task = Task(
        title=f"Spray {report['pesticide_name']}",
        description=f"Dosage: {report['pesticide_dosage']}. Safety: {report['pesticide_safety_instructions']}",
        type="chemical" if severity_lvl != "Low" else "organic",
        due_date=date.today()
      )
    db.add(treatment_task)
    db.commit()

    # Verify write
    assert db.query(Scan).count() == 1, "Failed database scan log validation"
    assert db.query(Task).count() == 1, "Failed database task auto-scheduling validation"
    logger.info("Database transactions committed and verified successfully.")
    
    print("\n==============================================")
    print("INTEGRATION TESTS PASSED SUCCESSFULLY! ✅")
    print(f"Crop: {scan_log.crop_type}")
    print(f"Pathogen: {scan_log.disease_name}")
    print(f"Severity: {scan_log.severity_percentage}% ({scan_log.severity_level})")
    print(f"Pesticide Recommendation: {scan_log.pesticide_name}")
    print(f"Calibrated Safe Dosage: {scan_log.pesticide_dosage}")
    print("==============================================\n")

if __name__ == "__main__":
    run_integration_test()
