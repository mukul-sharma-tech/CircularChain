import { sessionOptions } from "@/lib/session";
import dbConnect from "@/lib/dbConnect";
import Offer from "@/models/OfferModel";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET handler for agents to fetch their pending offers
export async function GET(req: NextRequest) {
    const session = await getIronSession(await cookies(), sessionOptions);
    if (!session.user || session.user.role !== 'agent') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const offers = await Offer.find({ 
        agentWallet: session.user.walletAddress, 
        status: 'pending' 
    }).sort({ createdAt: -1 });

    return NextResponse.json(offers);
}

// POST handler for sellers to create an offer
export async function POST(req: NextRequest) {
    const session = await getIronSession(await cookies(), sessionOptions);
    if (!session.user || session.user.role !== 'seller') {
        console.log("Unauthorized access attempt to create offer." + session.user.role);
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    await dbConnect();
    const offerData = await req.json();
    const newOffer = new Offer({
        ...offerData,
        sellerWallet: session.user.walletAddress,
    });
    await newOffer.save();
    
    return NextResponse.json(newOffer, { status: 201 });
}


// PUT handler for agents to update an offer's status (e.g., to 'accepted')
export async function PUT(req: NextRequest) {
    const session = await getIronSession(await cookies(), sessionOptions);
    if (!session.user || session.user.role !== 'agent') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const { orderId, newStatus } = await req.json();

        if (!orderId || !newStatus) {
            return NextResponse.json({ message: "Missing orderId or newStatus" }, { status: 400 });
        }

        const updatedOffer = await Offer.findOneAndUpdate(
            { orderId: orderId, agentWallet: session.user.walletAddress },
            { status: newStatus },
            { new: true }
        );

        if (!updatedOffer) {
            return NextResponse.json({ message: "Offer not found or you are not authorized to update it." }, { status: 404 });
        }

        return NextResponse.json(updatedOffer);
    } catch (error) {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
