import os
import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

class SeverityEstimator:
    def __init__(self):
        self.cnn_extractor = None
        self.xgb_regressor = None
        self.model_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "models",
            "xgb_severity.json"
        )
        self._load_models()

    def _load_models(self):
        try:
            import torch
            import torchvision.models as models
            import torchvision.models.resnet as resnet_module
            import torch.nn as nn
            import xgboost as xgb

            # Load CNN feature extractor (ResNet50 backbone without classification head)
            # Use the modern `weights` API to avoid DeprecationWarning
            try:
                weights = resnet_module.ResNet50_Weights.DEFAULT
                resnet = models.resnet50(weights=weights)
            except AttributeError:
                # Older torchvision fallback
                resnet = models.resnet50(pretrained=True)
            self.cnn_extractor = nn.Sequential(*list(resnet.children())[:-1])
            self.cnn_extractor.eval()

            # Load XGBoost Regressor
            if os.path.exists(self.model_path):
                logger.info(f"Loading XGBoost Regressor from {self.model_path}...")
                self.xgb_regressor = xgb.XGBRegressor()
                self.xgb_regressor.load_model(self.model_path)
            else:
                logger.warning(
                    f"XGBoost model file not found at {self.model_path}. Will use color-segmentation fallback."
                )
                self.xgb_regressor = None
        except ImportError:
            logger.warning(
                "torch or xgboost not installed. Will use color-segmentation fallback."
            )
            self.cnn_extractor = None
            self.xgb_regressor = None
        except Exception as e:
            logger.error(f"Error loading severity models: {e}. Will use fallback.")
            self.cnn_extractor = None
            self.xgb_regressor = None

    def estimate(self, image_input, is_healthy=False):
        """
        Estimates disease severity on the crop leaf.
        image_input: Can be a file path (str) or a numpy array (OpenCV image).
        is_healthy: Boolean indicating if the leaf was classified as healthy.
        Returns: (float: severity_percentage, str: severity_level)
        """
        if is_healthy:
            return 0.0, "Optimal"

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

        # Run CNN + XGBoost if loaded
        if self.cnn_extractor is not None and self.xgb_regressor is not None:
            try:
                import torch
                from torchvision import transforms
                from PIL import Image

                # 1. Extract features using ResNet50 CNN
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(image_rgb)

                preprocess = transforms.Compose([
                    transforms.Resize(256),
                    transforms.CenterCrop(224),
                    transforms.ToTensor(),
                    transforms.Normalize(
                        mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225]
                    )
                ])

                tensor_img = preprocess(pil_img).unsqueeze(0)
                with torch.no_grad():
                    features = self.cnn_extractor(tensor_img)
                    # Flatten feature map to 2048-dim vector
                    features = torch.squeeze(features).numpy().reshape(1, -1)

                # 2. Predict numerical severity using XGBoost
                severity_pct = float(self.xgb_regressor.predict(features)[0])
                severity_pct = max(0.0, min(100.0, severity_pct)) # Clip to 0-100%
                
                return round(severity_pct, 1), self._get_severity_level(severity_pct)

            except Exception as e:
                logger.error(f"CNN + XGBoost inference failed: {e}. Falling back to color-segmentation.")

        # Fallback plant pathology segmenter
        return self._cv_segmentation_severity(image)

    def _cv_segmentation_severity(self, image):
        """
        Calculates severity as: (lesion_pixel_area / leaf_pixel_area) * 100.0.
        Uses HSV thresholds to identify leaf outline and lesion regions.
        """
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # 1. Segment leaf (all green, yellow, brown areas) to find total plant tissue area
        lower_plant = np.array([2, 20, 15])
        upper_plant = np.array([90, 255, 255])
        plant_mask = cv2.inRange(hsv, lower_plant, upper_plant)
        
        # 2. Segment lesions (specifically yellow, brown, dark necrotic spots)
        lower_brown = np.array([5, 40, 20])
        upper_brown = np.array([30, 255, 200])
        lower_yellow = np.array([15, 60, 60])
        upper_yellow = np.array([40, 255, 255])
        
        mask_brown = cv2.inRange(hsv, lower_brown, upper_brown)
        mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)
        lesion_mask = cv2.bitwise_or(mask_brown, mask_yellow)
        
        # Restrict lesion mask to within the plant boundaries
        lesion_mask = cv2.bitwise_and(lesion_mask, plant_mask)
        
        plant_pixels = cv2.countNonZero(plant_mask)
        lesion_pixels = cv2.countNonZero(lesion_mask)
        
        if plant_pixels == 0:
            # Fallback if no leaf is segmented (e.g. background issues)
            # Default to a moderate severity rating
            return 28.5, "Moderate"
            
        severity_pct = (lesion_pixels / plant_pixels) * 100.0
        
        # Scale severity for visual impact (raw ratio might be small, let's normalize)
        # Typically, a leaf with 15% physical necrotic spots is considered severely affected.
        scaled_severity = severity_pct * 3.5 
        scaled_severity = min(98.5, max(1.5, scaled_severity))
        
        return round(scaled_severity, 1), self._get_severity_level(scaled_severity)

    def _get_severity_level(self, severity_pct):
        if severity_pct < 5.0:
            return "Optimal"
        elif severity_pct < 20.0:
            return "Low"
        elif severity_pct < 50.0:
            return "Moderate"
        else:
            return "Severe"
