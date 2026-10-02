import logging
from typing import Dict, Any, TypedDict, Optional

logger = logging.getLogger(__name__)

# Define State Structure
class AgentState(TypedDict):
    crop_type: str
    disease_name: str
    severity_percentage: float
    severity_level: str
    temperature: float
    humidity: float
    soil_moisture: float
    pesticide_name: str
    pesticide_dosage: str
    pesticide_safety_instructions: str
    cultural_care_instructions: str

# Standard Pesticide Database with base recommended dosages (ml per Liter of water)
PESTICIDE_DB = {
    "Tomato Late Blight": {
        "chemical": "Copper Oxychloride (Fungicide)",
        "base_dose": 2.5, # ml/L
        "organic": "Bacillus subtilis (Bio-fungicide) or Neem Oil",
        "organic_base_dose": 5.0, # ml/L
        "danger_threshold_temp": 30.0, # °C (Risk of leaf burn in high heat)
        "danger_threshold_moisture": 40.0, # % (Risk of stress if soil is dry)
    },
    "Apple Scab": {
        "chemical": "Myclobutanil (Systemic Fungicide)",
        "base_dose": 1.2,
        "organic": "Lime Sulfur or Wettable Sulfur",
        "organic_base_dose": 4.0,
        "danger_threshold_temp": 28.0,
        "danger_threshold_moisture": 35.0,
    },
    "Corn Common Rust": {
        "chemical": "Propiconazole (Triazole Fungicide)",
        "base_dose": 2.0,
        "organic": "Potassium Bicarbonate spray",
        "organic_base_dose": 6.0,
        "danger_threshold_temp": 32.0,
        "danger_threshold_moisture": 30.0,
    },
    "Grape Black Rot": {
        "chemical": "Mancozeb (Broad-spectrum Fungicide)",
        "base_dose": 3.0,
        "organic": "Copper Octanoate (Soap-based)",
        "organic_base_dose": 4.5,
        "danger_threshold_temp": 29.0,
        "danger_threshold_moisture": 45.0,
    },
    "Tomato Healthy": {
        "chemical": "None required",
        "base_dose": 0.0,
        "organic": "Compost Tea (Preventative)",
        "organic_base_dose": 0.0,
        "danger_threshold_temp": 99.0,
        "danger_threshold_moisture": 0.0,
    }
}

class AgriculturalAgent:
    def __init__(self):
        self.workflow = None
        self._setup_graph()

    def _setup_graph(self):
        try:
            from langgraph.graph import StateGraph, END
            
            # Initialize LangGraph StateGraph
            builder = StateGraph(AgentState)
            
            # Register nodes
            builder.add_node("dosing_agent", self.dosing_agent_node)
            builder.add_node("agronomist_reasoner", self.agronomist_node)
            builder.add_node("compiler", self.compiler_node)
            
            # Setup edges
            builder.set_entry_point("dosing_agent")
            builder.add_edge("dosing_agent", "agronomist_reasoner")
            builder.add_edge("agronomist_reasoner", "compiler")
            builder.add_edge("compiler", END)
            
            self.workflow = builder.compile()
            logger.info("LangGraph agent workflow compiled successfully.")
        except ImportError:
            logger.warning("langgraph package not installed. Using native python graph executor.")
            self.workflow = None

    # Node 1: Pesticide Selector & Calibrator
    def dosing_agent_node(self, state: AgentState) -> Dict[str, Any]:
        disease = state["disease_name"]
        temp = state.get("temperature", 25.0)
        moisture = state.get("soil_moisture", 50.0)
        severity_lvl = state["severity_level"]
        severity_pct = state["severity_percentage"]

        if disease not in PESTICIDE_DB:
            # Fallback for generic or unknown cases
            return {
                "pesticide_name": "General Bio-Fungicide",
                "pesticide_dosage": "2.0 ml/L (Standard)",
                "pesticide_safety_instructions": "Wear protective gear and apply in overcast skies."
            }

        db_entry = PESTICIDE_DB[disease]
        
        # If the plant is healthy, no pesticide is needed
        if disease == "Tomato Healthy":
            return {
                "pesticide_name": "No Chemical Treatment",
                "pesticide_dosage": "0 ml/L",
                "pesticide_safety_instructions": "Continue regular nutrient schedules. Ensure proper canopy aeration to maintain healthy indices."
            }

        # Select Pesticide Type based on Severity
        # For Low severity, recommend organic bio-pesticide to avoid chemical stress.
        # For Moderate/Severe, recommend chemical pesticide.
        pesticide_type = "organic" if severity_lvl == "Low" else "chemical"
        pesticide_name = db_entry[pesticide_type if pesticide_type == "organic" else "chemical"]
        base_dose = db_entry["organic_base_dose" if pesticide_type == "organic" else "base_dose"]

        # Calculate phytotoxicity risk multipliers based on environmental telemetry
        multiplier = 1.0
        warnings = []

        # 1. High Temperature Stress
        if temp > db_entry["danger_threshold_temp"]:
            # Reduce dose by 30% to prevent chemical burn (foliar phytotoxicity) in hot weather
            multiplier *= 0.70
            warnings.append(
                f"High temperature warning ({temp}°C > {db_entry['danger_threshold_temp']}°C). "
                "Pesticide dosage reduced by 30% to prevent leaf scorch. Spray ONLY during evening or early morning hours."
            )

        # 2. Water/Soil Moisture Stress (Dry soil makes leaves more sensitive)
        if moisture < db_entry["danger_threshold_moisture"]:
            # Reduce dose by 20% to prevent burning dehydrated leaf tissues
            multiplier *= 0.80
            warnings.append(
                f"Low soil moisture warning ({moisture}% < {db_entry['danger_threshold_moisture']}%). "
                "Dosage reduced by 20% to safeguard dehydrated plant tissue. Hydrate the crop root zone 2-4 hours prior to spraying."
            )

        # 3. Adjust dosage based on severity scale
        if severity_lvl == "Severe":
            # Max therapeutic dose (boost base slightly, keeping safe limits)
            multiplier *= 1.15
            warnings.append(
                f"Severe infection detected ({severity_pct}%). Calibrating therapeutic dose. "
                "Include a non-ionic surfactant/wetting agent to maximize leaf coverage."
            )
        elif severity_lvl == "Moderate":
            # Normal dose
            pass
        elif severity_lvl == "Low":
            # Micro-dose preventative
            multiplier *= 0.85

        final_dose = round(base_dose * multiplier, 2)
        
        # Format dosage output nicely
        dosage_str = f"{final_dose} ml per Liter of water"
        
        # Compile safety instructions
        safety_base = (
            "Safety Instructions: 1. Keep out of reach of children and livestock. "
            "2. Wear protective gloves, mask, and goggles during preparation. "
            "3. Do not apply under high wind velocity to prevent drift. "
        )
        if warnings:
            pesticide_safety_instructions = safety_base + "\nCRITICAL PROTOCOLS:\n* " + "\n* ".join(warnings)
        else:
            pesticide_safety_instructions = safety_base + "Environmental conditions are optimal. Safe to apply at calibrated therapeutic concentration."

        return {
            "pesticide_name": pesticide_name,
            "pesticide_dosage": dosage_str,
            "pesticide_safety_instructions": pesticide_safety_instructions
        }

    # Node 2: Agronomist Cultural Care Recommendations
    def agronomist_node(self, state: AgentState) -> Dict[str, Any]:
        disease = state["disease_name"]
        severity_lvl = state["severity_level"]
        humidity = state.get("humidity", 50.0)

        care_guidelines = []

        if disease == "Tomato Late Blight":
            care_guidelines.append("Prune all infected leaves and lower stems (up to 12 inches from ground) to stop fungal spores splashing up from soil.")
            care_guidelines.append("Switch from overhead sprinkler irrigation to ground-level drip-irrigation to maintain dry leaf surfaces.")
            if humidity > 80.0:
                care_guidelines.append(f"High relative humidity ({humidity}%) detected. Increase row spacing or ventilation in greenhouses to reduce canopy humidity.")
            care_guidelines.append("Do NOT compost infected plant residues. Burn or bury them deep to destroy oomycete spores.")

        elif disease == "Apple Scab":
            care_guidelines.append("Rake and destroy all fallen leaves around the base of the trees to break the overwintering fungal cycle.")
            care_guidelines.append("Perform selective canopy pruning to maximize sunlight penetration and increase air circulation.")
            care_guidelines.append("Apply a layer of organic mulch (3 inches deep) around the tree base, keeping it clear of the trunk, to cover soil-bound spores.")

        elif disease == "Corn Common Rust":
            care_guidelines.append("Check field drainage; waterlogged soils increase rust susceptibility.")
            care_guidelines.append("Ensure balanced nitrogen fertilization; excess nitrogen creates lush, vulnerable foliage.")
            care_guidelines.append("Plan to rotate the field with non-cereal crops (e.g. Soybeans) for the next planting cycle.")

        elif disease == "Grape Black Rot":
            care_guidelines.append("Strict sanitation: Prune and dispose of all mummified grapes and infected cane tissues immediately.")
            care_guidelines.append("Keep vineyard rows weeded and floor clean to minimize humidity trapped in the lower fruiting zones.")
            care_guidelines.append("Ensure trellis structure allows maximum canopy exposure to wind and direct sunlight.")

        else: # Tomato Healthy
            care_guidelines.append("Maintain the current soil irrigation and fertilization schedules.")
            care_guidelines.append("Perform field inspections every 5 days for early warning signs of spore formation.")

        cultural_care = "\n* ".join(care_guidelines)
        cultural_care_instructions = f"CULTURAL PRACTICES:\n* {cultural_care}"

        return {
            "cultural_care_instructions": cultural_care_instructions
        }

    # Node 3: Synthesizer & Compiler
    def compiler_node(self, state: AgentState) -> Dict[str, Any]:
        # Compile everything and format it
        return {
            "crop_type": state["crop_type"],
            "disease_name": state["disease_name"],
            "severity_percentage": state["severity_percentage"],
            "severity_level": state["severity_level"],
            "pesticide_name": state["pesticide_name"],
            "pesticide_dosage": state["pesticide_dosage"],
            "pesticide_safety_instructions": state["pesticide_safety_instructions"],
            "cultural_care_instructions": state["cultural_care_instructions"]
        }

    def run_agent(self, initial_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the agentic workflow. If LangGraph is compiled, runs it,
        otherwise simulates the nodes sequentially in standard Python.
        """
        # Ensure default keys exist in initial state
        state: AgentState = {
            "crop_type": initial_state.get("crop_type", "Unknown"),
            "disease_name": initial_state.get("disease_name", "Healthy Leaf"),
            "severity_percentage": initial_state.get("severity_percentage", 0.0),
            "severity_level": initial_state.get("severity_level", "Optimal"),
            "temperature": initial_state.get("temperature", 25.0),
            "humidity": initial_state.get("humidity", 50.0),
            "soil_moisture": initial_state.get("soil_moisture", 50.0),
            "pesticide_name": "",
            "pesticide_dosage": "",
            "pesticide_safety_instructions": "",
            "cultural_care_instructions": ""
        }

        if self.workflow is not None:
            try:
                # Run the LangGraph execution loop
                final_output = self.workflow.invoke(state)
                return final_output
            except Exception as e:
                logger.error(f"LangGraph execution error: {e}. Executing sequential python mode.")

        # Fallback sequential execution
        # Node 1: Dosing Agent
        dosing_res = self.dosing_agent_node(state)
        state.update(dosing_res)
        
        # Node 2: Agronomist
        agri_res = self.agronomist_node(state)
        state.update(agri_res)

        # Node 3: Compiler
        final_res = self.compiler_node(state)
        return final_res
