# agrishield-crop-ai
Agrishield Crop AI helps farmers identify diseases in plants by simply using images of leaves. It not only detects what disease is present but also evaluates how serious the infection is. Based on this, it suggests the most suitable treatment and how much to use. The system is designed to support better crop care and reduce losses. Overall, it aims to make plant health monitoring easier and more accessible in real-world farming.

# Project Overview

AgriShield Crop AI is a plant disease detection and treatment recommendation system that implements a 6-step pipeline:
1. Save uploaded leaf image
2. YOLOv11 lesion detection (bounding boxes of diseased areas)
3. ResNet50/EfficientNet classification (crop type & disease name)
4. CNN + XGBoost severity assessment (percentage & level)
5. Retrieve environmental telemetry (temperature, humidity, soil moisture)
6. LangGraph agent workflow for pesticide dosage & cultural recommendations

The system identifies plant diseases from leaf images and provides appropriate pesticide recommendations with dosage levels based on disease type, severity, and environmental factors.

# Prerequisites

- Python 3.13+
- Node.js (for frontend development)
- Required packages in backend/requirements.txt
- ML models in backend/app/models/:
  - yolov11_lesion.pt (YOLOv11 weights for lesion detection)
  - xgb_severity.json (XGBoost severity model)
  - resnet50_classifier.pth (ResNet5ick classifier weights)

# Setup

Backend Setup

Navigate to backend directory
cd backend

Install dependencies
pip install -r requirements.txt

Frontend Setup

Navigate to frontend directory
cd frontend

Install dependencies
npm install

Model Setup

The required ML models should be placed in backend/app/models/:
- yolov11_lesion.pt - YOLOv11 model for lesion detection
- xgb_severity.json - XGBoost model for severity estimation
- resnet50_classifier.pth - ResNet50 model for disease classification

If these models are missing, the system will fall back to heuristic/OpenCV-based implementations.

# Running the Application

Backend (API Server)

From backend directory
python -m uvicorn app.main:app --reload
The API will be available at http://localhost:8000

Frontend (Vite Dev Server)

From frontend directory
npm run dev
The frontend will be available at http://localhost:5173

Running Tests

Run API tests (requires running server)
cd backend
python test_api.py

Run pipeline integration test
python test_pipeline.py

#Using the Application

1. Access the Application: Open your browser to http://localhost:5173 (frontend) which communicates with http://localhost:8000 (backend)
2. Upload Leaf Image: Use the upload interface to submit a leaf image for analysis
3. View Results: The system will process the image through the 6-step pipeline and display:
  - Detected disease lesions (bounding boxes)
  - Identified crop type and disease name
  - Severity percentage and level (Optimal/Low/Moderate/Severe)
  - Environmental telemetry data (temperature, humidity, soil moisture)
  - Pesticide recommendations with dosage levels
  - Cultural care recommendations
4. View History: Access previous scans through the history interface
5. Manage Tasks: View and manage treatment tasks generated from scan results


# Key Components

1. Disease Detection Pipeline (backend/app/main.py)

The core /api/scan endpoint implements a 6-step processing pipeline:
- Image upload and storage to /static/uploads/
- YOLOv11 lesion detection (with OpenCV fallback for yellow/brown lesions)
- Crop/disease classification (ResNet50 with heuristic fallback)
- Severity estimation (CNN+XGBoost with color segmentation fallback)
- Environmental telemetry retrieval
- LangGraph agent workflow for dosage calculation and cultural recommendations

2. Machine Learning Models (backend/app/ml/)

YOLODetector (yolo_detector.py)

- Detects disease lesions using YOLOv11
- Falls back to OpenCV HSV color segmentation for yellow/brown lesions
- Returns bounding boxes with confidence scores

CropDiseaseClassifier (classifier.py)

- Classifies crop type and disease using ResNet50
- Falls back to heuristic classification using HSV color analysis
- Supports: Tomato Late Blight, Apple Scab, Corn Common Rust, Grape Black Rot, Tomato Healthy

SeverityEstimator (severity_estimator.py)

- Estimates disease severity percentage using CNN + XGBoost
- Falls back to HSV color segmentation (lesion/leaf area ratio × 3.5 scaling)
- Returns severity percentage and level (Optimal <5%, Low 5-20%, Moderate 20-50%, Severe ≥50%)

PesticideRecommender (pesticide_recommender.py)

- Contains pesticide database with base dosages
- Provides chemical/organic options for each disease
- Includes environmental threshold adjustments

3. Agricultural Agent (backend/app/agent/agri_agent.py)

Implements a LangGraph workflow with three nodes:
- dosing_agent: Calculates pesticide dosage based on disease, severity, and environmental factors
- agronomist_node: Provides cultural care recommendations
- compiler: Formats final output

Dosage Calculation Logic:

1. Base dosage from PESTICIDE_DB based on disease type
2. Environmental adjustments:
  - High temperature (> threshold): ×0.70 (reduce 30%)
  - Low soil moisture (< threshold): ×0.80 (reduce 20%)
3. Severity adjustments:
  - Severe: ×1.15 (increase 15%)
  - Low: ×0.85 (reduce 15%)
  - Moderate: ×1.0 (no change)

4. Database Models (backend/app/database.py)

- Scan: Stores leaf scan results (disease, severity, treatment)
- Task: Stores treatment tasks (spraying, cultural practices)
- Telemetry: Stores environmental sensor data

