// import { sessionOptions } from "@/lib/session";
// import { getIronSession } from "iron-session";
// import { cookies } from "next/headers";
// import { NextRequest, NextResponse } from "next/server";
// import { ethers, Contract } from "ethers";
// import { contractABI, contractAddress } from "@/lib/constants";

// export async function GET(req: NextRequest) { // <-- Fix #1: Added req: NextRequest
//     const session = await getIronSession(await cookies(), sessionOptions);

//     if (!session.user || session.user.role !== 'admin') {
//         return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//     }

//     try {
//         const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
//         const contract = new Contract(contractAddress, contractABI, provider);

//         const totalFees = await contract.totalFeesCollected();

//         // --- FIX #2: Query a smaller block range ---
//         const latestBlock = await provider.getBlockNumber();
//         const fromBlock = Math.max(0, latestBlock - 10); // A safe range for free plans

//         const deliveryCompletedFilter = contract.filters.DeliveryCompleted();
//         const events = await contract.queryFilter(deliveryCompletedFilter, fromBlock, 'latest');
//         // --- END OF FIX #2 ---

//         const commissionHistory = await Promise.all(
//             events.map(async (event) => {
//                 const block = await provider.getBlock(event.blockNumber);
//                 const args = event.args as any;
//                 return {
//                     orderId: args.orderId.toString(),
//                     feeAmount: args.feeAmount,
//                     timestamp: block?.timestamp,
//                     blockNumber: event.blockNumber,
//                     seller: args.seller,
//                     buyer: args.buyer,
//                 };
//             })
//         );
        
//         const sortedHistory = commissionHistory.sort((a, b) => b.timestamp - a.timestamp);

//         return NextResponse.json({
//             totalEarnings: totalFees,
//             commissionHistory: sortedHistory,
//         });

//     } catch (error) {
//         console.error("Failed to fetch admin stats:", error);
//         return NextResponse.json({ message: "Internal server error" }, { status: 500 });
//     }
// }

import { sessionOptions } from "@/lib/session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ethers, Contract } from "ethers";
import { contractABI, contractAddress } from "@/lib/constants";

export async function GET(req: NextRequest) {
    const session = await getIronSession(await cookies(), sessionOptions);

    if (!session.user || session.user.role !== 'admin') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const contract = new Contract(contractAddress, contractABI, provider);

        const totalFees = await contract.totalFeesCollected();

        // Query a smaller, recent block range to stay within free API limits.
        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - 8); // A safe range for free plans.

        const deliveryCompletedFilter = contract.filters.DeliveryCompleted();
        const events = await contract.queryFilter(deliveryCompletedFilter, fromBlock, 'latest'); 

        const commissionHistory = await Promise.all(
            events.map(async (event) => {
                const block = await provider.getBlock(event.blockNumber);
                const args = event.args as any;
                const orderId = Number(args.orderId);
                const order = await contract.orders(orderId);
                const listing = await contract.listings(order.listingId);
                return {
                    orderId: orderId.toString(),
                    seller: listing.seller,
                    buyer: order.buyer,
                    sellerPayoutWei: args.sellerPayout.toString(),
                    adminFeeWei: args.adminFee.toString(),
                    agentFeeWei: args.agentFee.toString(),
                    timestamp: block?.timestamp ?? 0,
                    blockNumber: event.blockNumber,
                    paymentMethod: Number(order.paymentMethod) === 0 ? 'ETH' : 'FIAT',
                    isLocalAgent: order.isLocalAgent,
                };
            })
        );
        
        const sortedHistory = commissionHistory.sort((a, b) => b.timestamp - a.timestamp);

        return NextResponse.json({
            totalEarningsWei: totalFees.toString(),
            commissionHistory: sortedHistory,
        });

    } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}