import "iron-session";

declare module "iron-session" {
    interface IronSessionData {
        user?: {
            walletAddress: string;
            role: string;
            isLoggedIn: boolean;
            name?: string;
            companyName?: string;
            addressText?: string;
            isAvailable?: boolean;
        };
    }
}
