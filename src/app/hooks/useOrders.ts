"use client";

import { useAuth } from "../../../context/AuthContext";
import { useEffect, useState } from "react";
import { useContract } from "./useContract";
import { ethers } from "ethers";

// (The Order and OrderStatus types at the top of the file remain the same)
export type OrderStatus = 'AWAITING_AGENT' | 'AWAITING_DELIVERY' | 'COMPLETE' | 'REFUNDED' | 'UNKNOWN';

export interface Order {
  id: bigint;
  listingId: bigint;
  listingName: string;
  seller: string;
  quantity: bigint;
  totalAmount: bigint;
  buyer: string;
  buyerName: string;
  buyerCompany: string;
  deliveryAgent: string;
  agentConfirmed: boolean;
  buyerConfirmed: boolean;
  status: OrderStatus;
  paymentMethod: 'ETH' | 'FIAT';
  isLocalAgent: boolean;
  hasPendingOfferForAgent?: boolean;
}

const getOrderStatus = (status: number): OrderStatus => {
    switch (status) {
        case 0: return 'AWAITING_AGENT';
        case 1: return 'AWAITING_DELIVERY';
        case 2: return 'COMPLETE';
        case 3: return 'REFUNDED';
        default: return 'UNKNOWN';
    }
};


export const useOrders = () => {
    const { user } = useAuth();
    const { readOnlyContract } = useContract();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!readOnlyContract || !user.walletAddress) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const nextOrderId = await readOnlyContract.nextOrderId();
                const listingsMap = new Map<bigint, { name: string; seller: string }>();

                const nextListingId = await readOnlyContract.nextListingId();
                for (let i = 1; i < Number(nextListingId); i++) {
                    const listing = await readOnlyContract.listings(i);
                    listingsMap.set(listing.id, { name: listing.name, seller: listing.seller });
                }

                const userOrders: Order[] = [];
                const userAddress = user.walletAddress.toLowerCase();

                for (let i = 1; i < Number(nextOrderId); i++) {
                    const orderData = await readOnlyContract.orders(i);
                    const listingInfo = listingsMap.get(orderData.listingId);

                    if (listingInfo) {
                        const isBuyer = orderData.buyer.toLowerCase() === userAddress;
                        const isSeller = listingInfo.seller.toLowerCase() === userAddress;
                        const isAgent = orderData.deliveryAgent.toLowerCase() === userAddress && orderData.deliveryAgent !== ethers.ZeroAddress;
                        
                        // --- NEW LOGIC START ---
                        let isOfferPendingForMe = false;
                        // If the user is an agent and an order is awaiting assignment, check if an offer was made to them.
                        if (user.role === 'agent' && Number(orderData.status) === 0) {
                            isOfferPendingForMe = await readOnlyContract.agentOfferPending(orderData.id, user.walletAddress);
                        }
                        // --- NEW LOGIC END ---

                        // Add order if user is the buyer, seller, assigned agent, OR has a pending offer.
                                if (isBuyer || isSeller || isAgent || isOfferPendingForMe) {
                            userOrders.push({
                                id: orderData.id,
                                listingId: orderData.listingId,
                                listingName: listingInfo.name,
                                seller: listingInfo.seller,
                                quantity: orderData.quantity,
                                totalAmount: orderData.totalAmount,
                                buyer: orderData.buyer,
                                buyerName: orderData.buyerName,
                                buyerCompany: orderData.buyerCompany,
                                deliveryAgent: orderData.deliveryAgent,
                                agentConfirmed: orderData.agentConfirmed,
                                buyerConfirmed: orderData.buyerConfirmed,
                                status: getOrderStatus(Number(orderData.status)),
                                paymentMethod: Number(orderData.paymentMethod) === 0 ? 'ETH' : 'FIAT',
                                        isLocalAgent: orderData.isLocalAgent,
                                        hasPendingOfferForAgent: isOfferPendingForMe,
                            });
                        }
                    }
                }
                setOrders(userOrders.reverse());
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [readOnlyContract, user.walletAddress, user.role]); // Added user.role to dependency array

    return { orders, loading };
};