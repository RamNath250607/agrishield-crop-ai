# AgriShield Crop AI - Production Deployment Guide

## Overview
This guide outlines the steps to deploy the AgriShield Crop AI system in production, including training the machine learning models using the provided datasets.

## System Components
1. **Backend API** (FastAPI) - Main application server
2. **ML Models** - Plant disease detection and treatment recommendation
3. **Database** - Stores scan results, treatment tasks, and telemetry
4. **Agricultural Agent** (LangGraph) - Provides pesticide dosage and cultural recommendations

## Prerequisites
- Python 3.8+
- Git
- Internet connection (for initial dependency download)

## Installation Steps

### 1. Clone Repository (if not already done)
```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Directory Structure Verification
Ensure the following directories exist:
- `backend/app/ml/models/` - For trained models
- `backend/app/ml/datasets/` - Contains Apple, Corn, Tomato datasets
- `backend/static/uploads/` - For uploaded plant images
- `backend/app/ml/training/` - Training scripts

### 4. Train the Disease Classification Model
The system includes a pre-built trainer for the disease classification model using the provided datasets.

```bash
# Navigate to training directory
cd backend/app/ml/training

# Start training (this will take some time depending on your hardware)
python train_classifier.py
```

**Expected Training Time**: 
- CPU: 2-4 hours
- GPU: 20-40 minutes

**Training Data Used**:
- Apple Scab: 2,016 images
- Corn Common Rust: 1,306 images  
- Tomato Late Blight: 1,000 images
- Tomato Healthy: 1,000 images
- **Total**: 5,322 images

**Note**: The Grape Black Rot class is not included in the provided datasets and will need to be sourced separately.

### 5. Verify Model Training
After training completes, verify that the model file was created:
```
backend/app/ml/models/resnet50_classifier.pth
```

### 6. Set Up Database
The application supports both PostgreSQL and SQLite:

**Option A: PostgreSQL (Recommended for Production)**
1. Install and start PostgreSQL
2. Create database: `createdb agrishield`
3. Update database connection in `backend/app/database.py` if needed
4. The application will automatically create tables on startup

**Option B: SQLite (Default for Development/Testing)**
- No setup required - the application will use `crop_db.db` file

### 7. Start the Application
```bash
# From backend directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 8. Verify Deployment
Access the API documentation at: `http://localhost:8000/docs`

Test the main endpoint:
```bash
curl -X POST "http://localhost:8000/api/scan" \
  -F "file=@path/to/plant_leaf.jpg"
```

## Model Information

### Disease Classification Model
- **Architecture**: ResNet50 (transfer learning)
- **Input Size**: 224x224 RGB images
- **Output Classes**: 
  1. Tomato Late Blight
  2. Apple Scab  
  3. Corn Common Rust
  4. Grape Black Rot (requires separate dataset)
  5. Tomato Healthy
- **Training Data**: 5,322 images from provided datasets
- **Save Location**: `backend/app/ml/models/resnet50_classifier.pth`

### Other Models (Fallback Mode)
Currently using rule-based fallbacks:
- **Lesion Detection**: OpenCV color segmentation (YOLOv11 weights needed for production)
- **Severity Estimation**: Color segmentation + heuristic scaling (XGBoost model needed for production)

To replace fallbacks with trained models:
1. Place YOLOv11 weights at: `backend/app/ml/models/yolov11_lesion.pt`
2. Place XGBoost model at: `backend/app/ml/models/xgb_severity.json`

## Environment Variables
Configure the following in `.env` file or system environment:

```
# Database (PostgreSQL example)
DATABASE_URL=postgresql://username:password@localhost:5432/agrishield

# API Settings
API_HOST=0.0.0.0
API_PORT=8000

# Model Paths (optional - defaults used if not set)
YOLO_MODEL_PATH=./app/ml/models/yolov11_lesion.pt
CLASSIFIER_MODEL_PATH=./app/ml/models/resnet50_classifier.pth
SEVERITY_MODEL_PATH=./app/ml/models/xgb_severity.json
```

## Maintenance

### Model Retraining
To retrain the classification model with new data:
1. Add new images to appropriate dataset folders
2. Re-run: `python backend/app/ml/training/train_classifier.py`
3. Restart the application to load new weights

### Monitoring
- Check logs: `journalctl -u agrishield-api` (if running as service)
- Monitor disk space for uploaded images in `backend/static/uploads/`
- Database backups recommended for production

## Troubleshooting

### Common Issues
1. **CUDA Out of Memory**: Reduce `BATCH_SIZE` in training script
2. **Model Loading Errors**: Verify model files exist in correct location
3. **Database Connection Failures**: Check PostgreSQL service and credentials
4. **Permission Issues**: Ensure write access to `backend/` directory

### Performance Optimization
1. Enable GPU acceleration if available
2. Consider using a reverse proxy (NGINX) for production
3. Implement caching for frequent queries
4. Use CDN for static assets if serving globally

## Security Considerations
1. Validate and sanitize all file uploads
2. Implement rate limiting on API endpoints
3. Use HTTPS in production
4. Regularly update dependencies
5. Store database credentials securely

## Contact
For issues or questions regarding deployment, refer to the project documentation or contact the development team.
