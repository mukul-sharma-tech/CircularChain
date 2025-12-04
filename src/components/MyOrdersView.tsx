"use client";

import { useOrders, Order } from "@/app/hooks/useOrders";
import { OrderCard } from "./OrderCard";
import { useState } from "react";
import SelectAgentModal from "./SelectAgentModal"; 

export const MyOrdersView = () => {
    const { orders, loading } = useOrders();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const handleOpenAssignModal = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    if (loading) return <p>Loading your orders...</p>;

    return (
        <>
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {orders.length === 0 ? <p>You have no orders.</p> :
                    orders.map(order => (
                        <OrderCard key={String(order.id)} order={order} onAssignAgent={handleOpenAssignModal} />
                    ))
                }
            </div>
            {isModalOpen && selectedOrder && (
                <SelectAgentModal order={selectedOrder} onClose={() => setIsModalOpen(false)} />
            )}
        </>
    );
};