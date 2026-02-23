import { sessionOptions, SessionData } from "@/lib/session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Add the 'request' parameter here to ensure dynamic rendering
export async function GET() { 
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (!session.user || !session.user.isLoggedIn) {
        return NextResponse.json({ isLoggedIn: false }, { status: 200 });
    }

    return NextResponse.json(session.user, { status: 200 });
}