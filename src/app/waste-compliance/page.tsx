"use client";
import { useState } from "react";

// Type definitions
interface WasteProfile {
  canonical_name: string;
  CAS: string;
  UN_number: string;
  hazard_class: string;
  physical_state: string;
  packing_group: string;
  flash_point: string;
  reactivity: string;
  synonyms: string[];
  incompatibilities: string[];
  compatible_packaging: string[];
  temperature_control: boolean;
  absorbents_ok: boolean;
}

interface Packaging {
  type: string;
  material: string;
  capacity_value: number;
  capacity_unit: string;
  UN_specification: string;
  closure_type: string;
  liner_required: boolean;
}

interface Vehicle {
  type: string;
  tanker_type: string;
  special_features: string[];
  licensing_requirements: string[];
}

interface JurisdictionRules {
  country: string;
  region_state: string;
  local_regulations: string[];
  permitting_requirements: string[];
  reporting_requirements: string[];
  manifest_requirements: boolean;
}

interface Compatibility {
  other_materials_in_vehicle: string[];
  storage_compatibility: string[];
}

interface Geospatial {
  origin_location: string;
  destination_location: string;
  route_constraints: string[];
  emergency_response_stations: string[];
}

interface CompliancePlan {
  waste_profile: WasteProfile;
  packaging: Packaging;
  vehicle: Vehicle;
  jurisdiction_rules: JurisdictionRules;
  compatibility: Compatibility;
  geospatial: Geospatial;
}

interface ExamplePlan {
  waste: string;
  location: string;
}

type ApiErrorResponse = {
  error: string;
};

type ApiSuccessResponse = CompliancePlan;

type ApiResponse = ApiErrorResponse | ApiSuccessResponse;

export default function WasteCompliancePage() {
  const [waste, setWaste] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [compliancePlan, setCompliancePlan] = useState<CompliancePlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const API_BASE = "http://localhost:5001";

  const generateCompliancePlan = async (): Promise<void> => {
    if (!waste.trim() || !location.trim()) {
      setError("Please enter both waste material and location");
      return;
    }

    setIsLoading(true);
    setError("");
    setCompliancePlan(null);

    try {
      const response = await fetch(`${API_BASE}/api/compliance-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          waste: waste.trim(),
          location: location.trim(),
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        const errorMsg = 'error' in data ? data.error : "Failed to generate compliance plan";
        throw new Error(errorMsg);
      }

      if ('error' in data) {
        throw new Error(data.error);
      }

      setCompliancePlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const examplePlans: ExamplePlan[] = [
    { waste: "Sulphuric Acid", location: "Jamshedpur to Jharkhand, India" },
    { waste: "Used Lithium Batteries", location: "Bangalore to Chennai, India" },
    { waste: "Medical Waste", location: "Mumbai to Gujarat, India" },
    { waste: "Electronic Waste", location: "Delhi to Rajasthan, India" },
  ];

  return (
    <div className="bg-transparent text-foreground">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="glass-panel p-8 rounded-3xl">
            <h2 className="text-2xl font-black mb-1 text-gradient flex items-center">
              Compliance Architect
            </h2>
            <p className="text-muted mb-8 text-sm font-medium opacity-80 uppercase tracking-widest">Regulatory Intelligence System</p>


            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">
                  Waste Material
                </label>
                <input
                  type="text"
                  value={waste}
                  onChange={(e) => setWaste(e.target.value)}
                  placeholder="e.g., Sulphuric Acid, Used Batteries, Medical Waste"
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-teal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Transport Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Mumbai to Gujarat, India"
                  className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                onClick={generateCompliancePlan}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-accent-teal to-accent-cyan hover:opacity-90 text-background font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Generating Plan...
                  </span>
                ) : (
                  <span>
                    <i className="fas fa-file-contract mr-2"></i>
                    Generate Compliance Plan
                  </span>
                )}
              </button>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-accent-teal">
                <i className="fas fa-lightbulb mr-2"></i>Example Plans:
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {examplePlans.map((example, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setWaste(example.waste);
                      setLocation(example.location);
                    }}
                    className="bg-background/40 hover:bg-background/70 border border-border rounded-lg p-3 text-sm cursor-pointer transition-colors duration-200"
                  >
                    <div className="font-medium text-foreground">{example.waste}</div>
                    <div className="text-muted text-xs">{example.location}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="glass-panel p-8 rounded-3xl">
            <h2 className="text-2xl font-black mb-1 text-gradient flex items-center">
              Compliance Roadmap
            </h2>
            <p className="text-muted mb-8 text-sm font-medium opacity-80 uppercase tracking-widest leading-none">AI Generated Documentation</p>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="relative w-16 h-16 mb-8">
                  <div className="absolute inset-0 border-4 border-teal-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-muted font-medium animate-pulse">Analyzing Regulations...</p>
              </div>
            ) : compliancePlan ? (
              <div className="overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                <CompliancePlanView plan={compliancePlan} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-muted grayscale opacity-40">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-bold uppercase tracking-widest">Awaiting Input Parameters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CompliancePlanViewProps {
  plan: CompliancePlan;
}

function CompliancePlanView({ plan }: CompliancePlanViewProps) {
  return (
    <div className="space-y-6">
      {/* Waste Profile */}
      <Section title="Waste Profile" icon="flask">
        <DetailItem label="Canonical Name" value={plan.waste_profile.canonical_name} />
        <DetailItem label="CAS Number" value={plan.waste_profile.CAS} />
        <DetailItem label="UN Number" value={plan.waste_profile.UN_number} />
        <DetailItem label="Hazard Class" value={plan.waste_profile.hazard_class} />
        <DetailItem label="Physical State" value={plan.waste_profile.physical_state} />
        <DetailItem label="Packing Group" value={plan.waste_profile.packing_group} />
        <DetailItem label="Flash Point" value={plan.waste_profile.flash_point} />
        <DetailItem label="Reactivity" value={plan.waste_profile.reactivity} />
        <ListDetail label="Synonyms" items={plan.waste_profile.synonyms} />
        <ListDetail label="Incompatibilities" items={plan.waste_profile.incompatibilities} />
        <ListDetail label="Compatible Packaging" items={plan.waste_profile.compatible_packaging} />
        <BooleanDetail label="Temperature Control" value={plan.waste_profile.temperature_control} />
        <BooleanDetail label="Absorbents OK" value={plan.waste_profile.absorbents_ok} />
      </Section>

      {/* Packaging */}
      <Section title="Packaging" icon="box">
        <DetailItem label="Type" value={plan.packaging.type} />
        <DetailItem label="Material" value={plan.packaging.material} />
        <DetailItem label="Capacity" value={`${plan.packaging.capacity_value} ${plan.packaging.capacity_unit}`} />
        <DetailItem label="UN Specification" value={plan.packaging.UN_specification} />
        <DetailItem label="Closure Type" value={plan.packaging.closure_type} />
        <BooleanDetail label="Liner Required" value={plan.packaging.liner_required} />
      </Section>

      {/* Vehicle */}
      <Section title="Vehicle" icon="truck">
        <DetailItem label="Type" value={plan.vehicle.type} />
        <DetailItem label="Tanker Type" value={plan.vehicle.tanker_type} />
        <ListDetail label="Special Features" items={plan.vehicle.special_features} />
        <ListDetail label="Licensing Requirements" items={plan.vehicle.licensing_requirements} />
      </Section>

      {/* Jurisdiction Rules */}
      <Section title="Jurisdiction Rules" icon="landmark">
        <DetailItem label="Country" value={plan.jurisdiction_rules.country} />
        <DetailItem label="Region/State" value={plan.jurisdiction_rules.region_state} />
        <ListDetail label="Local Regulations" items={plan.jurisdiction_rules.local_regulations} />
        <ListDetail label="Permitting Requirements" items={plan.jurisdiction_rules.permitting_requirements} />
        <ListDetail label="Reporting Requirements" items={plan.jurisdiction_rules.reporting_requirements} />
        <BooleanDetail label="Manifest Required" value={plan.jurisdiction_rules.manifest_requirements} />
      </Section>

      {/* Compatibility */}
      <Section title="Compatibility" icon="exchange-alt">
        <ListDetail label="Other Materials in Vehicle" items={plan.compatibility.other_materials_in_vehicle} />
        <ListDetail label="Storage Compatibility" items={plan.compatibility.storage_compatibility} />
      </Section>

      {/* Geospatial */}
      <Section title="Geospatial" icon="map-marker-alt">
        <DetailItem label="Origin" value={plan.geospatial.origin_location} />
        <DetailItem label="Destination" value={plan.geospatial.destination_location} />
        <ListDetail label="Route Constraints" items={plan.geospatial.route_constraints} />
        <ListDetail label="Emergency Response Stations" items={plan.geospatial.emergency_response_stations} />
      </Section>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <div className="bg-card/50 p-4 rounded-lg border border-border">
      <h3 className="font-semibold text-accent-teal mb-3 flex items-center">
        <i className={`fas fa-${icon} mr-2`}></i>
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

interface DetailItemProps {
  label: string;
  value: string | number;
}

function DetailItem({ label, value }: DetailItemProps) {
  if (!value || value === "unknown" || value === "NA") return null;

  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

interface ListDetailProps {
  label: string;
  items: string[];
}

function ListDetail({ label, items }: ListDetailProps) {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <div className="text-muted mb-1">{label}:</div>
      <div className="flex flex-wrap gap-1">
        {items.map((item, index) => (
          <span key={index} className="bg-accent-teal/10 text-accent-teal px-2 py-1 rounded text-xs border border-accent-teal/20">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

interface BooleanDetailProps {
  label: string;
  value: boolean | undefined | null;
}

function BooleanDetail({ label, value }: BooleanDetailProps) {
  if (value === undefined || value === null) return null;

  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}:</span>
      <span className={value ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
        {value ? "Yes" : "No"}
      </span>
    </div>
  );
}