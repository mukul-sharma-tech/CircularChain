"use client";
import { useEffect, useState } from "react";
import CompliancePlanModal from "./CompliancePlanModal";
import { useContract } from "@/app/hooks/useContract";

import { IOffer } from "@/models/OfferModel";

export const AgentOffers = () => {
    const [offers, setOffers] = useState<IOffer[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
    const { signedContract } = useContract();

    useEffect(() => {
        const fetchOffers = async () => {
            const res = await fetch('/api/offers');
            if (res.ok) setOffers(await res.json());
        };
        fetchOffers();
    }, []);

    const handleAccept = async (orderId: number) => {
        if (!signedContract) return alert("Wallet not connected.");
        try {
            // Step 1: Confirm the on-chain transaction
            const tx = await signedContract.acceptAgentOffer(BigInt(orderId));
            await tx.wait();
            alert("On-chain offer accepted!");

            // --- THIS IS THE NEW PART ---
            // Step 2: Update the off-chain status in our database
            await fetch('/api/offers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderId, newStatus: 'accepted' })
            });
            // --- END OF NEW PART ---

            // Step 3: Remove the offer from the pending list in the UI
            setOffers(prev => prev.filter(o => o.orderId !== orderId));
        } catch (error) {
            console.error(error);
            alert("Failed to accept offer.");
        }
    };

    if (offers.length === 0) {
        return <p className="text-gray-400">You have no pending offers.</p>;
    }

    return (
        <div className="space-y-4">
            {offers.map(offer => (
                <div key={offer._id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="font-bold">Offer for Order #{offer.orderId}</h4>
                    <p className="text-sm text-gray-300">{offer.wasteMaterial}</p>
                    <p className="text-xs text-gray-400">{offer.originLocation} to {offer.destinationLocation}</p>
                    <div className="mt-4 flex gap-4 items-center">
                        <button onClick={() => setSelectedPlan(offer.compliancePlan)} className="text-sm font-semibold text-teal-400 hover:underline">View Compliance Plan</button>
                        <button onClick={() => handleAccept(offer.orderId)} className="text-sm font-semibold bg-green-600 px-3 py-1 rounded text-white">Accept On-Chain</button>
                    </div>
                </div>
            ))}
            {selectedPlan && <CompliancePlanModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
        </div>
    );
};