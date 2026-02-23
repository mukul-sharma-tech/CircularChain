import { sessionOptions, SessionData } from "@/lib/session";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (!session.user || session.user.role !== 'agent') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const agent = await User.findOne({ walletAddress: session.user.walletAddress });

        if (!agent) {
            return NextResponse.json({ message: "Agent not found" }, { status: 404 });
        }

        // Toggle the availability status
        agent.isAvailable = !agent.isAvailable;
        await agent.save();
        
        // Update the session
        session.user.isAvailable = agent.isAvailable;
        await session.save();

        return NextResponse.json({ isAvailable: agent.isAvailable });

    } catch {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}