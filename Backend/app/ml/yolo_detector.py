import os
import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

class YOLODetector:
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "models",
            "yolov11_lesion.pt"
        )
        self._load_model()

    def _load_model(self):
        try:
            # Check if ultralytics is installed
            from ultralytics import YOLO
            if os.path.exists(self.model_path):
                logger.info(f"Loading YOLOv11 model from {self.model_path}...")
                self.model = YOLO(self.model_path)
            else:
                logger.warning(
                    f"YOLOv11 weights not found at {self.model_path}. Will use OpenCV CV-fallback mode."
                )
        except ImportError:
            logger.warning("ultralytics package not installed. Will use OpenCV CV-fallback mode.")
        except Exception as e:
            logger.error(f"Error loading YOLOv11 model: {e}. Will use OpenCV CV-fallback mode.")

    def detect(self, image_input):
        """
        Detects disease lesions on the crop leaf.
        image_input: Can be a file path (str) or a numpy array (OpenCV image).
        Returns: list of dicts [{"x": float, "y": float, "w": float, "h": float, "confidence": float, "label": str}]
        """
        # Load image if input is a path
        if isinstance(image_input, str):
            try:
                # Read using numpy to prevent path encoding/space issues in OpenCV on Windows
                with open(image_input, "rb") as f:
                    chunk = f.read()
                arr = np.frombuffer(chunk, dtype=np.uint8)
                image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            except Exception as e:
                logger.error(f"Failed to load image safely from path {image_input}: {e}")
                image = None
            
            if image is None:
                raise ValueError(f"Could not load image from path: {image_input}")
        else:
            image = image_input.copy()

        h, w, _ = image.shape

        # Use YOLO model if loaded
        if self.model is not None:
            try:
                results = self.model(image)
                detections = []
                for result in results:
                    boxes = result.boxes
                    for box in boxes:
                        # Extract xywh normalized coordinates
                        xywh = box.xywh[0].tolist() # x_center, y_center, width, height
                        conf = float(box.conf[0].item())
                        cls_id = int(box.cls[0].item())
                        label = result.names[cls_id]
                        
                        # Convert to top-left x, y, width, height in pixels
                        x_center, y_center, box_w, box_h = xywh
                        x_top_left = max(0, x_center - box_w / 2)
                        y_top_left = max(0, y_center - box_h / 2)

                        detections.append({
                            "x": round(float(x_top_left), 1),
                            "y": round(float(y_top_left), 1),
                            "w": round(float(box_w), 1),
                            "h": round(float(box_h), 1),
                            "confidence": round(conf, 4),
                            "label": label
                        })
                return detections
            except Exception as e:
                logger.error(f"YOLO inference failed: {e}. Falling back to OpenCV detection.")

        # Fallback OpenCV leaf lesion detection
        return self._cv_fallback_detect(image)

    def _cv_fallback_detect(self, image):
        """
        OpenCV fallback: converts image to HSV, filters for yellow/brown/black lesions,
        finds contours, and returns bounding boxes.
        """
        h, w, _ = image.shape
        # Convert to HSV color space
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

        # Lesions are usually brown/yellow/necrotic. 
        # Define ranges for brown/yellow/dark necrotic spots
        lower_brown = np.array([5, 40, 20])
        upper_brown = np.array([30, 255, 200])

        lower_yellow = np.array([15, 60, 60])
        upper_yellow = np.array([40, 255, 255])

        mask_brown = cv2.inRange(hsv, lower_brown, upper_brown)
        mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)
        mask = cv2.bitwise_or(mask_brown, mask_yellow)

        # Smooth and clean up mask
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

        # Find contours of lesions
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        detections = []
        # Filter small contours to avoid noise
        min_area = (h * w) * 0.001  # At least 0.1% of the image size
        max_area = (h * w) * 0.40   # Less than 40% of the image size (to avoid segmenting the whole leaf)

        for i, cnt in enumerate(contours):
            area = cv2.contourArea(cnt)
            if min_area < area < max_area:
                x, y, box_w, box_h = cv2.boundingRect(cnt)
                
                # Assign confidence based on size/solidity of contour
                hull = cv2.convexHull(cnt)
                hull_area = cv2.contourArea(hull)
                solidity = float(area) / hull_area if hull_area > 0 else 0
                conf = 0.70 + (solidity * 0.25) # Mock confidence between 70% and 95%
                
                detections.append({
                    "x": int(x),
                    "y": int(y),
                    "w": int(box_w),
                    "h": int(box_h),
                    "confidence": round(conf, 3),
                    "label": "Lesion/Spot"
                })

        # If no lesions are found, return empty list (Healthy Leaf)
        return sorted(detections, key=lambda d: d['w'] * d['h'], reverse=True)[:5] # Return top 5 largest lesions
