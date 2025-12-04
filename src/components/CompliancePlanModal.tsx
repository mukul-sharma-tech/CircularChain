"use client";

const CompliancePlanModal = ({
  plan,
  onClose,
}: {
  plan: Record<string, unknown> | null;
  onClose: () => void;
}) => {
  // Helper to render each step/section nicely
  const renderPlan = () => {
    if (!plan || Object.keys(plan).length === 0) return <p className="text-gray-400">No plan details available.</p>;

    return Object.entries(plan).map(([key, value]) => (
      <div key={key} className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h4 className="font-semibold text-teal-400 mb-2 capitalize">{key.replace(/_/g, " ")}</h4>

        {value && typeof value === "object" && !Array.isArray(value) ? (
          <ul className="list-disc list-inside text-gray-300">
            {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) => (
              <li key={subKey}>
                <span className="font-medium">{subKey.replace(/_/g, " ")}:</span>{" "}
                {String(subValue)}
              </li>
            ))}
          </ul>
        ) : Array.isArray(value) ? (
          <ul className="list-disc list-inside text-gray-300">
            {value.map((item, index) => (
              <li key={index}>{typeof item === "object" ? JSON.stringify(item) : item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-300">{String(value)}</p>
        )}
      </div>
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Compliance Plan</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-4">
          {renderPlan()}
        </div>
      </div>
    </div>
  );
};

export default CompliancePlanModal;
