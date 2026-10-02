import logging

from classifier import CropDiseaseClassifier
from severity_estimator import SeverityEstimator
from yolo_detector import YOLODetector
from pesticide_recommender import PesticideRecommender

logger = logging.getLogger(__name__)


class CropDiagnosisPipeline:
    """
    End-to-end pipeline:
      1. Classify the disease on the leaf image
      2. Detect individual lesions/spots (bounding boxes)
      3. Estimate overall severity (% affected + level)
      4. Recommend a pesticide/fungicide treatment with dosage
         appropriate to the diagnosed disease and severity.
    """

    def __init__(self):
        self.classifier = CropDiseaseClassifier()
        self.detector = YOLODetector()
        self.severity_estimator = SeverityEstimator()
        self.recommender = PesticideRecommender()

    def diagnose(self, image_input, filename_context=None):
        """
        image_input: file path (str) or numpy array (OpenCV BGR image)
        filename_context: optional filename hint used by the classifier's
                           heuristic fallback matcher (ignored by the DL path).
        Returns a full diagnosis report as a dict:
        {
            "crop_type": str,
            "disease": str,
            "confidence": float,
            "is_healthy": bool,
            "lesion_detections": [ {x, y, w, h, confidence, label}, ... ],
            "lesion_count": int,
            "severity_percentage": float,
            "severity_level": str,       # Optimal | Low | Moderate | Severe
            "treatment": {
                "disease": str,
                "severity_level": str,
                "pathogen": str | None,
                "recommendations": [ {product, type, dosage}, ... ],
                "cultural_practices": [str, ...],
                "safety_notes": [str, ...],
                "message": str,
            },
        }
        """
        # 1. Classify disease
        disease_name, confidence, crop_type = self.classifier.classify(
            image_input, filename_context=filename_context
        )
        is_healthy = "Healthy" in disease_name

        # 2. Detect individual lesions
        detections = self.detector.detect(image_input)

        # 3. Estimate severity (skipped/forced to 0 when classified healthy)
        severity_pct, severity_level = self.severity_estimator.estimate(
            image_input, is_healthy=is_healthy
        )

        # 4. Recommend treatment based on disease + severity
        treatment = self.recommender.recommend(disease_name, severity_level)

        report = {
            "crop_type": crop_type,
            "disease": disease_name,
            "confidence": confidence,
            "is_healthy": is_healthy,
            "lesion_detections": detections,
            "lesion_count": len(detections),
            "severity_percentage": severity_pct,
            "severity_level": severity_level,
            "treatment": treatment,
        }

        logger.info(
            f"Diagnosis complete: {disease_name} ({confidence * 100:.1f}% conf), "
            f"severity={severity_level} ({severity_pct}%), "
            f"{len(detections)} lesion(s) detected."
        )
        return report


if __name__ == "__main__":
    import sys
    import json

    logging.basicConfig(level=logging.INFO)

    if len(sys.argv) < 2:
        print("Usage: python crop_diagnosis.py <path_to_leaf_image>")
        sys.exit(1)

    pipeline = CropDiagnosisPipeline()
    result = pipeline.diagnose(sys.argv[1])
    print(json.dumps(result, indent=2))
