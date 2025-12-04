import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await dbConnect();

        const availableAgents = await User.find({
            role: 'agent',
            isAvailable: true,
        }).select('name companyName walletAddress'); // Only send public data

        return NextResponse.json(availableAgents);

    } catch (_error) {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}