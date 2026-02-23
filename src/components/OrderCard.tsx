"use client";

import { useAuth } from "../../context/AuthContext";
import { useContract } from "@/app/hooks/useContract";
import { Order } from "@/app/hooks/useOrders";
import { ethers } from "ethers";

interface OrderCardProps {
    order: Order;
    onAssignAgent: (order: Order) => void;
    // Optional callback to allow parent to refetch orders after state changes
    onRefetch?: () => void;
}

export const OrderCard = ({ order, onAssignAgent, onRefetch }: OrderCardProps) => {
    const { user } = useAuth();
    const { signedContract } = useContract();

    // The handler functions (handleConfirm, handleAcceptOffer) remain exactly the same.
    const handleConfirm = async (funcName: 'buyerConfirmDelivery' | 'agentConfirmDelivery') => {
        if (!signedContract) return alert("Wallet not connected.");
        try {
            const tx = await signedContract[funcName](order.id);
            await tx.wait();

            // Update MongoDB via API
            const type = funcName === 'buyerConfirmDelivery' ? 'buyer' : 'agent';
            const response = await fetch('/api/orders/update-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: Number(order.id), type, confirmed: true })
            });

            if (!response.ok) {
                console.warn('Failed to update MongoDB, but blockchain transaction succeeded');
            }

            alert("Confirmation successful! The order list will refresh.");
            // Add a small delay to ensure blockchain state is updated
            setTimeout(() => onRefetch?.(), 2000);
        } catch (error) {
            console.error("Confirmation failed:", error);
            alert("Confirmation failed.");
        }
    };

    const handleAcceptOffer = async () => {
        if (!signedContract) return alert("Wallet not connected.");
        try {
            const tx = await signedContract.acceptAgentOffer(order.id);
            await tx.wait();
            alert("Offer accepted! You are now assigned to this order.");
            setTimeout(() => onRefetch?.(), 2000);
        } catch (error) {
            console.error("Failed to accept offer:", error);
            alert("Failed to accept offer.");
        }
    };

    const isUser = (role: 'buyer' | 'seller' | 'agent') => {
        if (!user.walletAddress) return false;
        const address = user.walletAddress.toLowerCase();
        if (role === 'buyer') return address === order.buyer.toLowerCase();
        if (role === 'seller') return address === order.seller.toLowerCase();
        if (role === 'agent') return address === order.deliveryAgent.toLowerCase();
        return false;
    };

    const isBuyer = isUser('buyer');
    const isSeller = isUser('seller');
    const isAssignedAgent = isUser('agent');

    const getStatusColor = () => {
        switch (order.status) {
            case 'AWAITING_AGENT': return 'bg-cyan-500 text-cyan-900';
            case 'AWAITING_DELIVERY': return 'bg-yellow-500 text-yellow-900';
            case 'COMPLETE': return 'bg-green-500 text-green-900';
            case 'REFUNDED': return 'bg-red-500 text-red-900';
            default: return 'bg-gray-500 text-gray-900';
        }
    };

    return (
        <div className="glass-card p-6 rounded-3xl flex flex-col justify-between hover:border-teal-500/30 transition-all">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg text-white">Order #{String(order.id)}</h4>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>{order.status}</span>
                </div>
                <p className="text-md text-gray-300 truncate">{String(order.quantity)} x {order.listingName}</p>
                <p className="text-teal-400 font-semibold text-lg my-2">{ethers.formatEther(order.totalAmount)} ETH</p>
                <p className="text-sm text-gray-400">
                    Buyer: {order.buyerName || order.buyer.slice(0, 6)} · {order.buyerCompany || 'Unverified Company'}
                </p>
                <p className="text-xs text-gray-500 uppercase mt-1">
                    Payment: {order.paymentMethod} · {order.isLocalAgent ? "Local/Private Logistics" : "Platform Agent"}
                </p>

                {/* --- NEW SECTION START --- */}
                {/* This section shows the detailed confirmation status for deliveries */}
                {order.status === 'AWAITING_DELIVERY' && (
                    <div className="text-xs space-y-1 my-3 p-3 bg-gray-900/50 rounded-md border border-gray-700">
                        <p className={`flex items-center font-semibold ${order.agentConfirmed ? "text-green-400" : "text-gray-400"}`}>
                            {order.agentConfirmed ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                            )}
                            Agent Confirmed
                        </p>
                        <p className={`flex items-center font-semibold ${order.buyerConfirmed ? "text-green-400" : "text-gray-400"}`}>
                            {order.buyerConfirmed ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                            )}
                            Buyer Confirmed
                        </p>
                        {typeof order.deliveryStatus !== 'undefined' && (
                            <p className="text-xs text-gray-400 mt-1">Delivery Progress: <span className="text-sm font-semibold text-white">{['NotStarted', 'PickedUp', 'InTransit', 'Weighment', 'Delivered'][order.deliveryStatus || 0]}</span></p>
                        )}
                    </div>
                )}
                {/* --- NEW SECTION END --- */}

            </div>
            <div className="mt-4 space-y-2">
                {isSeller && order.status === 'AWAITING_AGENT' && (
                    <button onClick={() => onAssignAgent(order)} className="w-full bg-teal-500 text-gray-900 font-bold py-2 rounded-lg">Assign Agent</button>
                )}
                {isBuyer && order.status === 'AWAITING_DELIVERY' && !order.buyerConfirmed && (
                    <button onClick={() => handleConfirm('buyerConfirmDelivery')} className="w-full bg-blue-500 text-white font-bold py-2 rounded-lg">Confirm Delivery</button>
                )}
                {user.role === 'agent' && order.status === 'AWAITING_AGENT' && order.hasPendingOfferForAgent && (
                    <button onClick={handleAcceptOffer} className="w-full bg-green-500 text-white font-bold py-2 rounded-lg">Accept Offer</button>
                )}
                {user.role === 'agent' && isAssignedAgent && order.status === 'AWAITING_DELIVERY' && !order.agentConfirmed && (
                    <button onClick={() => handleConfirm('agentConfirmDelivery')} className="w-full bg-purple-500 text-white font-bold py-2 rounded-lg">Confirm Pickup/Delivery</button>
                )}

                {/* Delivery status update for assigned agent */}
                {user.role === 'agent' && isAssignedAgent && order.status === 'AWAITING_DELIVERY' && (
                    <div className="mt-2">
                        <label className="text-xs text-gray-400">Update Delivery Status</label>
                        <div className="flex gap-2 mt-1">
                            <select id={`ds-${String(order.id)}`} className="p-2 bg-gray-800 rounded text-sm">
                                <option value="1">PickedUp</option>
                                <option value="2">InTransit</option>
                                <option value="3">Weighment</option>
                            </select>
                            <button onClick={async () => {
                                const sel = document.getElementById(`ds-${String(order.id)}`) as HTMLSelectElement | null;
                                if (!sel) return;
                                const val = Number(sel.value);
                                try {
                                    if (!signedContract) return alert("Connect wallet");
                                    const tx = await signedContract.updateDeliveryStatus(order.id, val);
                                    await tx.wait();

                                    // Update MongoDB via API
                                    const response = await fetch('/api/orders/update-status', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ orderId: Number(order.id), deliveryStatus: val })
                                    });

                                    if (!response.ok) {
                                        console.warn('Failed to update MongoDB, but blockchain transaction succeeded');
                                    }

                                    alert('Delivery status updated');
                                    setTimeout(() => onRefetch?.(), 2000);
                                } catch (err) {
                                    console.error(err);
                                    alert('Failed to update status');
                                }
                            }} className="bg-gray-700 text-white px-3 py-2 rounded">Update</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};