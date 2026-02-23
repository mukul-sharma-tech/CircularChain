// "use client";

// import { useContract } from "@/app/hooks/useContract";
// import { Order } from "@/app/hooks/useOrders";
// import { ethers } from "ethers";
// import { useState, useEffect } from "react";

// // Define the shape of the agent profile we expect from the API
// interface AgentProfile {
//     walletAddress: string;
//     name: string;
//     companyName: string;
// }

// const SelectAgentModal = ({ order, onClose }: { order: Order; onClose: () => void; }) => {
//     const { signedContract } = useContract();
//     const [availableAgents, setAvailableAgents] = useState<AgentProfile[]>([]);
//     const [loading, setLoading] = useState(true); // Set initial loading to true
//     const [error, setError] = useState('');

//     useEffect(() => {
//         const fetchAvailableAgents = async () => {
//             try {
//                 const response = await fetch('/api/agents/available');
//                 if (!response.ok) throw new Error("Failed to fetch agents.");
//                 const agents = await response.json();
//                 setAvailableAgents(agents);
//             } catch (err: any) {
//                 setError(err.message);
//             } finally {
//                 setLoading(false); // Stop loading once done
//             }
//         };
//         fetchAvailableAgents();
//     }, []);

//     // This function now takes the agent's address as an argument
//     const handleSendOffer = async (agentAddress: string) => {
//         if (!signedContract) {
//             alert("Please connect your wallet first.");
//             return;
//         }
//         setLoading(true); // Use loading state for individual button
//         try {
//             const tx = await signedContract.requestAgent(order.id, agentAddress);
//             await tx.wait();
//             alert("Offer sent to agent successfully!");
//             onClose();
//         } catch (error) {
//             console.error("Failed to send offer:", error);
//             alert("Failed to send offer.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
//             <div className="bg-gray-800 rounded-xl p-8 w-full max-w-lg">
//                 <h2 className="text-xl font-bold mb-4">Select an Available Agent for Order #{String(order.id)}</h2>

//                 {/* This is the new UI that displays the list */}
//                 <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
//                     {loading && <p>Fetching available agents...</p>}
//                     {error && <p className="text-red-500">{error}</p>}

//                     {!loading && availableAgents.length > 0 ? (
//                         availableAgents.map(agent => (
//                             <div key={agent.walletAddress} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
//                                 <div>
//                                     <p className="font-bold text-white">{agent.name} <span className="text-sm text-gray-400">({agent.companyName})</span></p>
//                                     <p className="text-xs text-gray-500 font-mono">{agent.walletAddress}</p>
//                                 </div>
//                                 <button
//                                     onClick={() => handleSendOffer(agent.walletAddress)}
//                                     disabled={loading}
//                                     className="bg-teal-500 text-gray-900 font-bold py-2 px-4 rounded-lg disabled:bg-gray-500"
//                                 >
//                                     Send Offer
//                                 </button>
//                             </div>
//                         ))
//                     ) : (
//                         !loading && <p className="text-gray-400 text-center py-8">No agents are currently available.</p>
//                     )}
//                 </div>

//                 <div className="flex justify-end mt-6">
//                     <button onClick={onClose} className="bg-gray-600 py-2 px-4 rounded-lg">Cancel</button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default SelectAgentModal;


"use client";
import { useContract } from "@/app/hooks/useContract";
import { Order } from "@/app/hooks/useOrders";
import { ethers } from "ethers";
import { useEffect, useState } from "react";


// The real, external API for generating compliance plans
const COMPLIANCE_API_URL = "http://localhost:5001/api/compliance-plan";

// <-- ADD THIS: Define a mock plan to use as a fallback -->
const MOCK_COMPLIANCE_PLAN = {
    waste_profile: { canonical_name: "Demo Waste", hazard_class: "N/A", packing_group: "III" },
    packaging: { type: "Drums", material: "Plastic", UN_specification: "DEMO-SPEC" },
    vehicle: { type: "Standard Truck", licensing_requirements: ["Standard License"] },
    jurisdiction_rules: { region_state: "N/A", manifest_requirements: false },
    geospatial: { origin_location: "Demo Origin", destination_location: "Demo Destination" },
    notes: "This is a fallback demo plan used because the primary compliance API failed.",
};


interface AgentProfile {
    walletAddress: string;
    name: string;
    companyName: string;
}

const SelectAgentModal = ({ order, onClose }: { order: Order; onClose: () => void; }) => {

    const { signedContract } = useContract();
    const [availableAgents, setAvailableAgents] = useState<AgentProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [wasteMaterial, setWasteMaterial] = useState(order.listingName);
    const [origin, setOrigin] = useState('Delhi');
    const [destination, setDestination] = useState('Gurgaon');
    const [useLocalAgent, setUseLocalAgent] = useState(false);
    const [localAgentWallet, setLocalAgentWallet] = useState('');
    const [localAgentContact, setLocalAgentContact] = useState('');

    useEffect(() => {
        const fetchAvailableAgents = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/agents/available');
                if (!response.ok) throw new Error("Failed to fetch agents.");
                const agents: AgentProfile[] = await response.json();
                setAvailableAgents(agents);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        };
        fetchAvailableAgents();
    }, []);

    const handleSendOffer = async (agentAddress: string) => {
        if (!wasteMaterial || !origin || !destination) {
            return alert("Please fill in all material and location details.");
        }
        if (!signedContract) return alert("Wallet not connected.");

        setLoading(true);

        try {
            let compliancePlan;

            try {
                const complianceRes = await fetch(COMPLIANCE_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ waste: wasteMaterial, location: `${origin} to ${destination}` })
                });

                if (!complianceRes.ok) {
                    throw new Error("API returned a non-OK status.");
                }
                
                compliancePlan = await complianceRes.json();

            } catch (err) {
                console.warn("Real compliance API failed. Using DEMO plan as a fallback.", err);
                compliancePlan = {
                    ...MOCK_COMPLIANCE_PLAN,
                    geospatial: { origin_location: origin, destination_location: destination },
                };
            }

            const offerRes = await fetch('/api/offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: Number(order.id),
                    agentWallet: agentAddress,
                    compliancePlan,
                    wasteMaterial,
                    originLocation: origin,
                    destinationLocation: destination,
                    isLocalAgent: false,
                })
            });
            if (!offerRes.ok) {
                const errorData = await offerRes.json();
                throw new Error(errorData.message || "Failed to save offer to the database.");
            }

            const tx = await signedContract.requestAgent(order.id, agentAddress, false);
            await tx.wait();

            alert("Offer sent to agent successfully!");
            onClose();

        } catch (error: unknown) {
            console.error("Failed to send offer:", error);
            const message = error instanceof Error ? error.message : String(error);
            alert(`Error: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignLocalAgent = async () => {
        if (!localAgentWallet || !ethers.isAddress(localAgentWallet)) {
            alert("Enter a valid wallet address for your local agent.");
            return;
        }
        if (!signedContract) {
            alert("Wallet not connected.");
            return;
        }

        setLoading(true);
        try {
            const tx = await signedContract.assignAgent(order.id, localAgentWallet, true);
            await tx.wait();
            alert("Local/Private agent assigned. Remember to settle logistics offline.");
            onClose();
        } catch (error: unknown) {
            console.error("Failed to assign local agent:", error);
            const message = error instanceof Error ? error.message : "Failed to assign local agent.";
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 w-full max-w-2xl">
                <h2 className="text-xl font-bold mb-4">Assign Logistics for Order #{String(order.id)}</h2>
                <p className="text-sm text-gray-400 mb-6">
                    Choose a platform agent to trigger the 5% smart-contract payout, or switch to Local/Private logistics to keep the extra spread and pay offline.
                </p>

                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setUseLocalAgent(false)}
                        className={`flex-1 py-2 rounded-lg font-semibold ${!useLocalAgent ? "bg-teal-500 text-black" : "bg-gray-700 text-gray-200"}`}
                    >
                        Platform Agent
                    </button>
                    <button
                        onClick={() => setUseLocalAgent(true)}
                        className={`flex-1 py-2 rounded-lg font-semibold ${useLocalAgent ? "bg-teal-500 text-black" : "bg-gray-700 text-gray-200"}`}
                    >
                        Local / Private Agent
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <input value={wasteMaterial} onChange={e => setWasteMaterial(e.target.value)} placeholder="Waste Material" className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 text-white" />
                    <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Origin Location" className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 text-white" />
                    <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destination Location" className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 text-white" />
                </div>

                {useLocalAgent ? (
                    <div className="space-y-4">
                        <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700">
                            <p className="text-sm text-gray-300 mb-3">Enter your private driver&apos;s wallet address (optional contact note helps your ops team).</p>
                            <input
                                value={localAgentWallet}
                                onChange={e => setLocalAgentWallet(e.target.value)}
                                placeholder="0x… Local Agent Wallet"
                                className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 text-white mb-3"
                            />
                            <input
                                value={localAgentContact}
                                onChange={e => setLocalAgentContact(e.target.value)}
                                placeholder="Email / Phone (optional)"
                                className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 text-white"
                            />
                        </div>
                        <button
                            onClick={handleAssignLocalAgent}
                            disabled={loading}
                            className="w-full bg-amber-500 text-black font-bold py-3 rounded-lg disabled:bg-gray-500"
                        >
                            {loading ? "Assigning..." : "Assign Local Agent (No Platform Fee)"}
                        </button>
                    </div>
                ) : (
                    <>
                        <h3 className="font-semibold mb-2">Select an Available Agent:</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {loading && <p>Loading...</p>}
                            {error && <p className="text-red-500">{error}</p>}
                            {!loading && availableAgents.length > 0 ? (
                                availableAgents.map(agent => (
                                    <div key={agent.walletAddress} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                                        <div>
                                            <p className="font-bold text-white">{agent.name} <span className="text-sm text-gray-400">({agent.companyName})</span></p>
                                            <p className="text-xs text-gray-500 font-mono">{agent.walletAddress}</p>
                                        </div>
                                        <button
                                            onClick={() => handleSendOffer(agent.walletAddress)}
                                            disabled={loading}
                                            className="bg-teal-500 text-gray-900 font-bold py-2 px-4 rounded-lg disabled:bg-gray-500"
                                        >
                                            Send Offer
                                        </button>
                                    </div>
                                ))
                            ) : (
                                !loading && <p className="text-gray-400 text-center py-8">No agents are currently available.</p>
                            )}
                        </div>
                    </>
                )}

                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="bg-gray-600 py-2 px-4 rounded-lg">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default SelectAgentModal;