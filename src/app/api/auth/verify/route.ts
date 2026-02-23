// import { sessionOptions } from '@/lib/session';
// import dbConnect from '@/lib/dbConnect';
// import User from '@/models/UserModel';
// import { getIronSession } from 'iron-session';
// import { cookies } from 'next/headers';
// import { NextRequest, NextResponse } from 'next/server';
// import { SiweMessage } from 'siwe';

// export async function POST(req: NextRequest) {
//   const session = await getIronSession(cookies(), sessionOptions);

//   try {
//     const { message, signature } = await req.json();

//     await dbConnect();
//     const user = await User.findOne({ walletAddress: message.address.toLowerCase() });

//     if (!user) {
//       return NextResponse.json({ message: 'User not found. Cannot verify.' }, { status: 404 });
//     }

//     // Create a new SiweMessage object from the received message
//     const siweMessage = new SiweMessage(message);

//     // Verify the signature and nonce
//     const fields = await siweMessage.verify({
//       signature,
//       nonce: user.nonce, // Use the nonce from your database
//     });

//     // The nonce in the signed message must match the one in our database.
//     if (fields.data.nonce !== user.nonce) {
//       return NextResponse.json({ message: 'Invalid nonce.' }, { status: 422 });
//     }

//     // Update nonce to prevent replay attacks and save the user
//     user.nonce = Math.random().toString(36).substring(2);
//     await user.save();

//     // Create the session
//     session.user = {
//       walletAddress: user.walletAddress,
//       role: user.role,
//       isLoggedIn: true,
//       isAvailable: user.isAvailable, // <-- ADD THIS
//     };
//     await session.save();

//     return NextResponse.json(session.user);

//   } catch (error) {
//     console.error(error);
//     session.destroy();
//     return NextResponse.json({ message: (error as Error).message || 'Authentication failed' }, { status: 500 });
//   }
// }


import { sessionOptions, SessionData } from "@/lib/session";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  try {
    const { message, signature } = await req.json();

    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });

    await dbConnect();
    const user = await User.findOne({ walletAddress: fields.data.address.toLowerCase() });

    // If there's no user for this address, return a clear 404 so the client can show an appropriate message
    if (!user) {
        console.warn(`Verify failed: no user found for address ${fields.data.address.toLowerCase()}`);
        return NextResponse.json({ message: 'User not found. Cannot verify.' }, { status: 404 });
    }

    // If the nonces don't match, indicate an invalid nonce
    if (user.nonce !== fields.data.nonce) {
        console.warn(`Verify failed: nonce mismatch for ${fields.data.address.toLowerCase()}`);
        return NextResponse.json({ message: 'Invalid nonce.' }, { status: 422 });
    }

    // --- NEW ADMIN ROLE LOGIC START ---
    const adminWallets = (process.env.ADMIN_WALLETS || '').toLowerCase().split(',');
    const userAddress = fields.data.address.toLowerCase();
    
    // Check if the user is an admin
    if (adminWallets.includes(userAddress)) {
        // If their role isn't already 'admin', update it in the database
        if (user.role !== 'admin') {
            user.role = 'admin';
        }
    }
    // --- NEW ADMIN ROLE LOGIC END ---

    // Update nonce to prevent replay attacks and save any role changes
    user.nonce = Math.random().toString(36).substring(2);
    await user.save();
    
    // Create the session with the correct role (will be 'admin' if they are an admin)
    session.user = {
        walletAddress: user.walletAddress,
        role: user.role,
        isLoggedIn: true,
        name: user.name,
        companyName: user.companyName,
        addressText: user.addressText,
        isAvailable: user.isAvailable,
    };
    await session.save();

    return NextResponse.json(session.user);
    
  } catch (error) {
    console.error(error);
    session.destroy();
    return NextResponse.json({ message: (error as Error).message || 'Authentication failed' }, { status: 500 });
  }
}