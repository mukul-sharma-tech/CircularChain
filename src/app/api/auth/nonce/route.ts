// app/api/auth/nonce/route.ts
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { NextRequest, NextResponse } from 'next/server';
import { generateNonce } from 'siwe';

export async function GET(req: NextRequest) {
  try {
    // Get the wallet address from the query parameters
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ message: 'Address is required.' }, { status: 400 });
    }
    
    await dbConnect();

    // Generate a new nonce
    const nonce = generateNonce();

    // Find user by wallet address and update their nonce, or create a new user if they don't exist
    await User.findOneAndUpdate(
      { walletAddress: address.toLowerCase() },
      { walletAddress: address.toLowerCase(), nonce },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    // Return the nonce as plain text
    return new Response(nonce, { status: 200, headers: { 'Content-Type': 'text/plain' } });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}