// lib/session.ts
import type { SessionOptions } from "iron-session";

// Shared session user/data types for iron-session
export type SessionUser = {
    walletAddress: string;
    role: string;
    isLoggedIn: boolean;
    name?: string;
    companyName?: string;
    addressText?: string;
    isAvailable?: boolean;
};

export type SessionData = {
    user?: SessionUser;
};

// This is the configuration for our session cookie
export const sessionOptions: SessionOptions = {
    password: process.env.SESSION_PASSWORD as string,
    cookieName: "circularchain-session",
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
    },
};