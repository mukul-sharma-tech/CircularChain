import json
from jsonschema import validate, ValidationError
import google.generativeai as genai
import os
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.pydantic_v1 import BaseModel, Field

# Load environment variables from .env file in root directory
from pathlib import Path
load_dotenv(dotenv_path=Path('.') / '.env')
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)


class WasteProfile(BaseModel):
    canonical_name: str = Field(default="NA", description="Canonical name of the waste material")
    synonyms: list[str] = Field(default=[], description="List of common synonyms for the waste material")
    CAS: str = Field(default="unknown", description="Chemical Abstracts Service (CAS) registry number")
    UN_number: str = Field(default="NA", description="United Nations (UN) number for hazardous materials")
    hazard_class: str = Field(default="NA", description="Hazard class of the waste material")
    packing_group: str = Field(default="unknown", description="Packing group for the waste material")
    physical_state: str = Field(default="unknown", description="Physical state of the waste material (e.g., liquid, solid, gas)")
    flash_point: str = Field(default="unknown", description="Flash point of the waste material")
    reactivity: str = Field(default="unknown", description="Reactivity of the waste material")
    incompatibilities: list[str] = Field(default=[], description="List of materials incompatible with the waste")
    compatible_packaging: list[str] = Field(default=[], description="List of compatible packaging types")
    temperature_control: bool = Field(default=False, description="Whether temperature control is required for transport")
    absorbents_ok: bool = Field(default=False, description="Whether absorbents are suitable for spills")


class Packaging(BaseModel):
    type: str = Field(default="unknown", description="Type of packaging required (e.g., drums, bags, tanks)")
    material: str = Field(default="unknown", description="Material of the packaging (e.g., steel, plastic)")
    capacity_unit: str = Field(default="unknown", description="Unit of capacity (e.g., liters, kilograms)")
    capacity_value: float = Field(default=0.0, description="Value of the packaging capacity")
    UN_specification: str = Field(default="unknown", description="UN packaging specification code")
    liner_required: bool = Field(default=False, description="Whether a liner is required inside the packaging")
    closure_type: str = Field(default="unknown", description="Type of closure for the packaging (e.g., screw cap, bung)")


class Vehicle(BaseModel):
    type: str = Field(default="unknown", description="Type of vehicle required for transport (e.g., truck, rail car, ship)")
    tanker_type: str = Field(default="unknown", description="Specific type of tanker if applicable (e.g., DOT 407, IMO Type 1)")
    special_features: list[str] = Field(default=[], description="List of special features required for the vehicle (e.g., temperature control, specialized lining)")
    licensing_requirements: list[str] = Field(default=[], description="List of specific vehicle licensing or certifications required for transport")


class JurisdictionRules(BaseModel):
    country: str = Field(default="unknown", description="Country where the waste is being transported")
    region_state: str = Field(default="unknown", description="Region or state within the country")
    local_regulations: list[str] = Field(default=[], description="List of specific local regulations for waste transport")
    permitting_requirements: list[str] = Field(default=[], description="List of permits required for transport in this jurisdiction")
    manifest_requirements: bool = Field(default=False, description="Whether a waste manifest is required")
    reporting_requirements: list[str] = Field(default=[], description="List of specific reporting requirements")


class Compatibility(BaseModel):
     other_materials_in_vehicle: list[str] = Field(default=[], description="Other materials that can be transported in the same vehicle")
     storage_compatibility: list[str] = Field(default=[], description="Materials compatible for storage with this waste")


class Geospatial(BaseModel):
     origin_location: str = Field(default="unknown", description="Origin location of the waste")
     destination_location: str = Field(default="unknown", description="Destination location for the waste")
     route_constraints: list[str] = Field(default=[], description="Constraints or special considerations for the transport route (e.g., bridge weight limits, tunnels)")
     emergency_response_stations: list[str] = Field(default=[], description="Locations of emergency response stations along the route")


class CompliancePlan(BaseModel):
    waste_profile: WasteProfile
    packaging: Packaging
    vehicle: Vehicle
    jurisdiction_rules: JurisdictionRules
    compatibility: Compatibility
    geospatial: Geospatial

def get_structured_plan(waste, location):
    model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3, google_api_key=GOOGLE_API_KEY)
    prompt = ChatPromptTemplate.from_messages(
    [
    (
  "system",
  """
You are an expert compliance planner for hazardous and non-hazardous waste transport.

Your job is to generate a detailed JSON object that strictly follows this schema.
✅ Always follow the exact type for each field.
✅ If unsure, use 'unknown' (string), false (boolean), or [] (empty array).
✅ Never leave a required field blank.
✅ Be especially careful with string vs list confusion.

📘 FIELD TYPES (with examples):

1. waste_profile (object)
   - canonical_name: string ("Uranium Particles")
   - synonyms: list of strings (["U-238", "Depleted Uranium"])
   - CAS: string ("7440-61-1")
   - UN_number: string ("UN2912")
   - hazard_class: string ("7 (Radioactive)")
   - packing_group: string ("I")
   - physical_state: string ("Solid")
   - flash_point: string ("Not applicable")
   - reactivity: string ("Reacts with water")
   - incompatibilities: list of strings (["Water", "Oxidizers"])
   - compatible_packaging: list of strings (["Lead drums", "Shielded containers"])
   - temperature_control: boolean (true)
   - absorbents_ok: boolean (false)

2. packaging (object)
   - type: string ("drums")
   - material: string ("steel") ✅ [Don't use array or nested object]
   - capacity_unit: string ("liters")
   - capacity_value: float (55.0)
   - UN_specification: string ("1A1/Y1.8/300")
   - liner_required: boolean (true)
   - closure_type: string ("screw cap")

3. vehicle (object)
   - type: string ("truck")
   - tanker_type: string ("Radiation-shielded container")
   - special_features: list of strings (["Sealed", "Radiation shielding"])
   - licensing_requirements: list of strings (["HAZMAT", "Radioactive License"])

4. jurisdiction_rules (object)
   - country: string ("India")
   - region_state: string ("Jharkhand")
   - local_regulations: list of strings
   - permitting_requirements: list of strings
   - manifest_requirements: boolean
   - reporting_requirements: list of strings

5. compatibility (object)
   - other_materials_in_vehicle: list of strings
   - storage_compatibility: list of strings

6. geospatial (object)
   - origin_location: string ("Jamshedpur")
   - destination_location: string ("Hyderabad")
   - route_constraints: list of strings
   - emergency_response_stations: list of strings

🧠 Use industry knowledge to infer missing data when possible.
🧪 For example, Uranium Particles → Class 7 → Special packaging → Temperature controlled transport.
"""
)
,
        ("human", "Waste material: {waste}\nTransport location: {location}")
    ]
)


    runnable = prompt | model.with_structured_output(CompliancePlan)

    try:
        plan = runnable.invoke({"waste": waste, "location": location})
        return plan.dict()  # Return as dictionary for JSON dumping
    except Exception as e:
        print(f"An error occurred: {e}")
        return {}

if __name__ == "__main__":
    waste = "Sulphuric Acid"
    location = "Jamshedpur to Jharkhand, India"
    plan = get_structured_plan(waste, location)
    print(json.dumps(plan, indent=2))