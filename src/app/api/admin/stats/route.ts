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
                return {
                    orderId: args.orderId.toString(),
                    feeAmount: args.feeAmount.toString(), // <-- FIX #1: Convert feeAmount to string
                    timestamp: block?.timestamp,
                    blockNumber: event.blockNumber,
                    seller: args.seller,
                    buyer: args.buyer,
                };
            })
        );
        
        const sortedHistory = commissionHistory.sort((a, b) => b.timestamp - a.timestamp);

        return NextResponse.json({
            totalEarnings: totalFees.toString(), // <-- FIX #2: Convert totalEarnings to string
            commissionHistory: sortedHistory,
        });

    } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}