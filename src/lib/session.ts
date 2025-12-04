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