// lib/session.ts
import type { SessionOptions } from "iron-session";

// This is the configuration for our session cookie
export const sessionOptions: SessionOptions = {
    password: process.env.SESSION_PASSWORD as string,
    cookieName: "circularchain-session",
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
    },
};

// This is where we specify the session data that we want to manage.
// By declaring it here, all calls to `getIronSession` will be correctly typed.
declare module "iron-session" {
    interface IronSessionData {
        user?: {
            walletAddress: string;
            role: string;
            isLoggedIn: boolean;
            isAvailable?: boolean; // <-- ADD THIS
        };
    }
}