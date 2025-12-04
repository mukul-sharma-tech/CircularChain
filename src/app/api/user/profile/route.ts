import { sessionOptions, SessionData } from "@/lib/session";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    // 1. Check if user is logged in
    if (!session.user || !session.user.isLoggedIn) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, companyName, role, addressText } = body;

        // 2. Basic validation
        if (!name || !companyName || !role || !addressText) {
            return NextResponse.json({ message: "All fields are required" }, { status: 400 });
        }
        if (!['user', 'agent'].includes(role)) {
            return NextResponse.json({ message: "Invalid role selected" }, { status: 400 });
        }

        await dbConnect();

        // 3. Find and update the user in the database
        const updatedUser = await User.findOneAndUpdate(
            { walletAddress: session.user.walletAddress },
            { name, companyName, role, addressText },
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // 4. Update the session with the new role and return
        session.user = {
            ...session.user,
            role: updatedUser.role,
            name: updatedUser.name,
            companyName: updatedUser.companyName,
            addressText: updatedUser.addressText,
        };
        await session.save();

        return NextResponse.json(session.user);

    } catch (error) {
        console.error("Profile update failed:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}