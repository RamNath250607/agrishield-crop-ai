# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in the AgriShield Crop AI repository.

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Development Setup](#development-setup)
- [Development Commands](#development-commands)
- [Project Structure](#project-structure)
- [Key Components](#key-components)
- [Data Flow](#data-flow)
- [Common Development Tasks](#common-development-tasks)
- [API Endpoints](#api-endpoints)
- [Model Information](#model-information)

## 🌱 Project Overview

AgriShield Crop AI is a plant disease detection and treatment recommendation system that uses computer vision and machine learning to identify plant diseases from leaf images and provide appropriate pesticide recommendations with dosage levels.

The system implements a 6-step pipeline:
1. Save uploaded leaf image
2. YOLOv11 lesion detection (bounding boxes of diseased areas)
3. ResNet50/EfficientNet classification (crop type & disease name)
4. CNN + XGBoost severity assessment (percentage & level)
5. Retrieve environmental telemetry (temperature, humidity, soil moisture)
6. LangGraph agent workflow for pesticide dosage & cultural recommendations

## ⚙️ Development Setup

### Prerequisites
- Python 3.13+
- Required packages in `backend/requirements.txt`
- ML models in `backend/app/models/` (yolov11_lesion.pt, xgb_severity.json, resnet50_classifier.pth)

### Installation
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt
```

### Running the Application
```bash
# Start the API server
python -m uvicorn app.main:app --reload

# The API will be available at http://localhost:8000
```

### Running Tests
```bash
# Run API tests (requires running server)
python test_api.py

# Run pipeline integration test
python test_pipeline.py
```

## 📂 Project Structure

```
agri-shield-crop-ai/
├── backend/
│   ├── app/
│   │   ├── agent/           # Agricultural agent for pesticide recommendations
│   │   │   └── agri_agent.py
│   │   ├── ml/              # Machine learning models
│   │   │   ├── classifier.py          # Disease classification (ResNet50Net50/EfficientNet)
│   │   │   ├── severity_estimator.py  # Severity estimation (CNN + XGBoost)
│   │   │   ├── yolo_detector.py       # Lesion detection (YOLOv11)
│   │   │   └── pesticide_recommender.py # Pesticide database
│   │   ├── main.py          # FastAPI application (main pipeline)
│   │   ├── schemas.py       # API schemas/Pydantic models
│   │   └── database.py      # Database models (SQLAlchemy)
│   ├── static/              # Static file serving (uploaded images)
│   ├── test_api.py          # API testing script
│   ├── test_pipeline.py     # Pipeline integration test
│   └── requirements.txt     # Python dependencies
├── frontend/                # React/Vite frontend (not examined)
├── app.js, index.html, style.css  # Root level web files
└── CLAUDE.md                # This file
```

## 🔑 Key Components

### 1. Disease Detection Pipeline (`backend/app/main.py`)
The core `/api/scan` endpoint implements a 6-step processing pipeline:
- Image upload and storage
- YOLOv11 lesion detection (with OpenCV fallback)
- Crop/disease classification (ResNet50 with heuristic fallback)
- Severity estimation (CNN+XGBoost with color segmentation fallback)
- Environmental telemetry retrieval
- LangGraph agent for dosage calculation and cultural recommendations

### 2. Machine Learning Models (`backend/app/ml/`)

#### YOLODetector (`yolo_detector.py`)
- Detects disease lesions using YOLOv11
- Falls back to OpenCV HSV color segmentation for yellow/brown lesions
- Returns bounding boxes with confidence scores

#### CropDiseaseClassifier (`classifier.py`)
- Classifies crop type and disease using ResNet50
- Falls back to heuristic classification using HSV color analysis
- Supports: Tomato Late Blight, Apple Scab, Corn Common Rust, Grape Black Rot, Tomato Healthy

#### SeverityEstimator (`severity_estimator.py`)
- Estimates disease severity percentage using CNN + XGBoost
- Falls back to HSV color segmentation (lesion/leaf area ratio × 3.5 scaling)
- Returns severity percentage and level (Optimal <5%, Low 5-20%, Moderate 20-50%, Severe ≥50%)

#### PesticideRecommender (`pesticide_recommender.py`)
- Contains pesticide database with base dosages
- Provides chemical/organic options for each disease
- Includes environmental threshold adjustments

### 3. Agricultural Agent (`backend/app/agent/agri_agent.py`)
Implements a LangGraph workflow with three nodes:
- **dosing_agent**: Calculates pesticide dosage based on disease, severity, and environmental factors
- **agronomist_node**: Provides cultural care recommendations
- **compiler**: Formats final output

#### Dosage Calculation Logic:
1. Base dosage from PESTICIDE_DB based on disease type
2. Environmental adjustments:
   - High temperature (> threshold): ×0.70 (reduce 30%)
   - Low soil moisture (< threshold): ×0.80 (reduce 20%)
3. Severity adjustments:
   - Severe: ×1.15 (increase 15%)
   - Low: ×0.85 (reduce 15%)
   - Moderate: ×1.0 (no change)

### 4. Database Models (`backend/app/database.py`)
- **Scan**: Stores leaf scan results (disease, severity, treatment)
- **Task**: Stores treatment tasks (spraying, cultural practices)
- **Telemetry**: Stores environmental sensor data

## 🔄 Data Flow

1. **User uploads leaf image** via `/api/scan` endpoint
2. **Image processing pipeline**:
   - Image saved to `/static/uploads/`
   - YOLO detection → bounding boxes of lesions
   - Classification → crop type + disease name + confidence
   - Severity estimation → percentage + level
   - Telemetry fetch → temperature, humidity, soil moisture
3. **Agricultural agent processing**:
   - Dosing agent calculates pesticide dosage with environmental/severity adjustments
   - Agronomist node provides cultural care recommendations
   - Compiler formats final response
4. **Database storage**:
   - Scan record saved with all results
   - Treatment task created if pesticides recommended
5. **Response returned** to user with diagnosis and treatment plan

## 🛠️ Common Development Tasks

### Adding New Disease Types
1. Add disease entry to `PESTICIDE_DB` in `agri_agent.py` (lines 21-62)
2. Add cultural care guidelines in `agronomist_node` method (lines 186-224)
3. Update pesticide recommender database in `pesticide_recommender.py` (lines 14-172)
4. Update scientific name/pathogen mapping in `main.py` lines 141-152

### Modifying Dosage Calculations
1. Adjust base dosages in `PESTICIDE_DB` in `agri_agent.py`
2. Modify environmental threshold values in `dosing_agent_node` (lines 131, 140)
3. Adjust severity multipliers in `dosing_agent_node` (lines 151, 161)

### Updating ML Models
1. Retrain YOLOv11 model and save as `yolov11_lesion.pt`
2. Retrain severity estimation model and save as `xgb_severity.json`
3. Retrain classifier model and save as `resnet50_classifier.pth`
4. Update model paths in respective `__init__` methods if needed

## 🌐 API Endpoints

### POST `/api/scan`
- **Description**: Upload leaf image for disease analysis and treatment recommendations
- **Parameters**: `image` (file upload)
- **Returns**: Disease info, severity, pesticide recommendation, dosage, safety instructions

### GET `/api/scans`
- **Description**: Retrieve history of all leaf scans
- **Returns**: List of scan records ordered by date (newest first)

### GET `/api/telemetry`
- **Description**: Get current environmental sensor data
- **Returns**: Temperature, humidity, soil moisture, solar radiation, status label

### GET `/api/hotspots`
- **Description**: Get disease hotspots by field sector
- **Returns**: List of active disease locations with severity information

### GET `/api/tasks`
- **Description**: Retrieve treatment tasks
- **Returns**: List of tasks ordered by due date

### POST `/api/tasks`
- **Description**: Create new treatment task
- **Parameters**: `title`, `description`, `type`, `status`, `due_date`

### PUT `/api/tasks/{task_id}`
- **Description**: Update task status
- **Parameters**: `status`

### DELETE `/api/tasks/{task_id}`
- **Description**: Delete treatment task
- **Parameters**: `task_id` (path parameter)

## 📊 Model Information

### Supported Diseases/Crops
- Tomato Late Blight
- Apple Scab
- Corn Common Rust
- Grape Black Rot
- Tomato Healthy (no treatment)

### Environmental Adjustments
- **High Temperature**: Reduces dosage by 30% when temperature exceeds disease-specific threshold
- **Low Soil Moisture**: Reduces dosage by 20% when soil moisture falls below disease-specific threshold
- **Disease Severity**: 
  - Severe: Increases dosage by 15%
  - Moderate: No change
  - Low: Reduces dosage by 15%

### Severity Levels
- **Optimal**: <5% scaled severity
- **Low**: 5-20% scaled severity
- **Moderate**: 20-50% scaled severity
- **Severe**: ≥50% scaled severity

## 💡 Development Tips

### Debugging
1. **Model Files**: Ensure required ML models are present in `backend/app/models/`:
   - `yolov11_lesion.pt` (YOLOv11 weights)
   - `xgb_severity.json` (XGBoost severity model)
   - `resnet50_classifier.pth` (ResNet50 classifier weights)
   If missing, fallback implementations will be used (OpenCV, heuristic classification, color segmentation)

2. **Testing**: 
   - Run `test_pipeline.py` for end-to-end pipeline testing without needing a server
   - Run `test_api.py` after starting the server to test API endpoints
   - The test scripts create mock leaf images for testing

3. **Database**: 
   - Uses SQLite by default (`crop_db.db` in backend directory)
   - Initialized automatically on app startup
   - Pre-populated with sample telemetry and tasks

4. **Environment Variables**: 
   - No special environment variables required for basic operation
   - The app uses sensible defaults for all configuration

5. **Debugging**:
   - Check console logs for detailed processing information
   - ML model loading warnings will indicate if fallbacks are being used
   - Database operations are logged at INFO level

This guide should help you quickly understand and work with the AgriShield Crop AI codebase. The system is designed to be modular and extensible, making it straightforward to add new diseases, modify treatment logic, or enhance the ML components.
