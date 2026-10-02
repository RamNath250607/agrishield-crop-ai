import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pesticide / fungicide recommendation database.
#
# NOTE: The dosage figures below are general, commonly-cited label-rate
# ranges for these active ingredients (used widely in agricultural extension
# guidance). Exact rates vary by manufacturer, formulation, and local
# regulation, so this is guidance to accompany — not replace — the product
# label and local agronomist advice.
# ---------------------------------------------------------------------------
PESTICIDE_DB = {
    "Tomato Late Blight": {
        "pathogen": "Phytophthora infestans (oomycete)",
        "options": [
            {
                "product": "Mancozeb 75% WP",
                "type": "Contact (protectant) fungicide",
                "dosage": {
                    "Low": "2.0 g/L water, spray every 10-14 days",
                    "Moderate": "2.5 g/L water, spray every 7-10 days",
                    "Severe": "2.5-3.0 g/L water, spray every 5-7 days",
                },
            },
            {
                "product": "Chlorothalonil 75% WP",
                "type": "Contact (protectant) fungicide",
                "dosage": {
                    "Low": "1.5-2.0 g/L water, every 10-14 days",
                    "Moderate": "2.0 g/L water, every 7-10 days",
                    "Severe": "2.0-2.5 g/L water, every 5-7 days",
                },
            },
            {
                "product": "Cymoxanil 8% + Mancozeb 64% WP",
                "type": "Systemic + contact combination",
                "dosage": {
                    "Low": "2.0 g/L water, every 10 days",
                    "Moderate": "2.5-3.0 g/L water, every 7 days",
                    "Severe": "3.0 g/L water, every 5-7 days (rotate with a different mode of action)",
                },
            },
        ],
        "cultural_practices": [
            "Remove and destroy infected foliage/fruit; avoid overhead irrigation",
            "Improve air circulation via plant spacing and staking/pruning",
            "Rotate fungicide chemistry groups to prevent resistance build-up",
        ],
    },
    "Apple Scab": {
        "pathogen": "Venturia inaequalis (fungus)",
        "options": [
            {
                "product": "Myclobutanil 10% WP",
                "type": "Systemic (DMI) fungicide",
                "dosage": {
                    "Low": "0.5 g/L water, every 10-14 days",
                    "Moderate": "0.75-1.0 g/L water, every 7-10 days",
                    "Severe": "1.0 g/L water, every 7 days",
                },
            },
            {
                "product": "Captan 50% WP",
                "type": "Contact (protectant) fungicide",
                "dosage": {
                    "Low": "2.0 g/L water, every 10-14 days",
                    "Moderate": "2.5 g/L water, every 7-10 days",
                    "Severe": "3.0 g/L water, every 5-7 days",
                },
            },
            {
                "product": "Wettable Sulfur 80% WP",
                "type": "Contact fungicide (preventive)",
                "dosage": {
                    "Low": "2.5-3.0 g/L water, every 10-14 days",
                    "Moderate": "3.0 g/L water, every 7-10 days",
                    "Severe": "Pair with a systemic partner; sulfur alone is weak on established lesions",
                },
            },
        ],
        "cultural_practices": [
            "Rake and destroy fallen leaves in autumn to cut overwintering spore load",
            "Prune for better canopy airflow and light penetration",
            "Favor scab-resistant cultivars for new plantings",
        ],
    },
    "Corn Common Rust": {
        "pathogen": "Puccinia sorghi (fungus)",
        "options": [
            {
                "product": "Propiconazole 25% EC",
                "type": "Systemic (DMI) fungicide",
                "dosage": {
                    "Low": "1.0 ml/L water, single preventive spray",
                    "Moderate": "1.0-1.5 ml/L water, every 10-14 days",
                    "Severe": "1.5 ml/L water, every 7-10 days",
                },
            },
            {
                "product": "Azoxystrobin 23% SC",
                "type": "Systemic (strobilurin) fungicide",
                "dosage": {
                    "Low": "1.0 ml/L water, every 14 days",
                    "Moderate": "1.0-1.5 ml/L water, every 10 days",
                    "Severe": "1.5 ml/L water, every 7-10 days (rotate mode of action)",
                },
            },
            {
                "product": "Pyraclostrobin 20% WG",
                "type": "Systemic (strobilurin) fungicide",
                "dosage": {
                    "Low": "0.5 g/L water, every 14 days",
                    "Moderate": "0.75 g/L water, every 10 days",
                    "Severe": "1.0 g/L water, every 7 days",
                },
            },
        ],
        "cultural_practices": [
            "Plant rust-resistant hybrids where available",
            "Avoid overly dense planting to reduce leaf-surface moisture",
            "Scout early in the season; rust spreads fast under humid conditions",
        ],
    },
    "Grape Black Rot": {
        "pathogen": "Guignardia bidwellii (fungus)",
        "options": [
            {
                "product": "Myclobutanil 10% WP",
                "type": "Systemic (DMI) fungicide",
                "dosage": {
                    "Low": "0.5 g/L water, every 10-14 days",
                    "Moderate": "0.75-1.0 g/L water, every 7-10 days",
                    "Severe": "1.0 g/L water, every 7 days",
                },
            },
            {
                "product": "Mancozeb 75% WP",
                "type": "Contact (protectant) fungicide",
                "dosage": {
                    "Low": "2.0 g/L water, every 10-14 days",
                    "Moderate": "2.5 g/L water, every 7-10 days",
                    "Severe": "2.5-3.0 g/L water, every 5-7 days",
                },
            },
            {
                "product": "Captan 50% WP",
                "type": "Contact (protectant) fungicide",
                "dosage": {
                    "Low": "2.0 g/L water, every 10-14 days",
                    "Moderate": "2.5 g/L water, every 7-10 days",
                    "Severe": "3.0 g/L water, every 5-7 days",
                },
            },
        ],
        "cultural_practices": [
            "Remove mummified berries and infected canes during dormant pruning",
            "Improve canopy airflow via shoot thinning/canopy management",
            "Begin protectant sprays at bud break in high-pressure regions",
        ],
    },
    "Tomato Healthy": {
        "pathogen": None,
        "options": [],
        "cultural_practices": [
            "No treatment required; continue routine monitoring",
            "Maintain balanced fertilization and consistent watering",
            "Scout weekly for early signs of pests or disease",
        ],
    },
}

DEFAULT_SAFETY_NOTES = [
    "Always read and follow the label of the exact product/formulation you are using; rates vary by manufacturer.",
    "Observe the pre-harvest interval (PHI) and re-entry interval (REI) printed on the label.",
    "Wear appropriate PPE (gloves, mask, eye protection) during mixing and application.",
    "Rotate fungicide groups/modes of action across the season to reduce resistance risk.",
    "This is general guidance only; confirm with a local agricultural extension officer or licensed agronomist before large-scale application.",
]


class PesticideRecommender:
    """
    Maps a diagnosed disease + severity level to a set of recommended
    pesticide/fungicide options with indicative dosage guidance.
    """

    def recommend(self, disease_name, severity_level="Moderate"):
        """
        disease_name: str, one of the classifier CLASSES
        severity_level: str, one of "Optimal", "Low", "Moderate", "Severe"
        Returns: dict with pathogen info, recommended options (dosage
                 scaled to the given severity), cultural practices, and
                 safety notes.
        """
        entry = PESTICIDE_DB.get(disease_name)

        if entry is None:
            logger.warning(f"No pesticide entry found for disease '{disease_name}'.")
            return {
                "disease": disease_name,
                "severity_level": severity_level,
                "pathogen": None,
                "recommendations": [],
                "cultural_practices": [],
                "safety_notes": DEFAULT_SAFETY_NOTES,
                "message": "No specific recommendation available for this disease.",
            }

        # Healthy plant / Optimal severity -> no chemical treatment needed
        if disease_name == "Tomato Healthy" or severity_level == "Optimal":
            return {
                "disease": disease_name,
                "severity_level": severity_level,
                "pathogen": entry["pathogen"],
                "recommendations": [],
                "cultural_practices": entry["cultural_practices"],
                "safety_notes": [],
                "message": "Plant appears healthy. No pesticide treatment is necessary.",
            }

        # Normalize severity to a key present in the dosage tables
        normalized_level = severity_level if severity_level in ("Low", "Moderate", "Severe") else "Moderate"

        recommendations = []
        for option in entry["options"]:
            dosage = option["dosage"].get(normalized_level, option["dosage"].get("Moderate"))
            recommendations.append({
                "product": option["product"],
                "type": option["type"],
                "dosage": dosage,
            })

        return {
            "disease": disease_name,
            "severity_level": normalized_level,
            "pathogen": entry["pathogen"],
            "recommendations": recommendations,
            "cultural_practices": entry["cultural_practices"],
            "safety_notes": DEFAULT_SAFETY_NOTES,
            "message": f"{len(recommendations)} treatment option(s) found for {disease_name} at {normalized_level} severity.",
        }
