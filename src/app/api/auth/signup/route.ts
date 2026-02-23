import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, nonce } = body ?? {};

    if (!address || !nonce) {
      return NextResponse.json({ message: 'Address and nonce are required.' }, { status: 400 });
    }

    await dbConnect();

    // Upsert the user with the provided nonce so verify has a user record to check against
    const user = await User.findOneAndUpdate(
      { walletAddress: address.toLowerCase() },
      { walletAddress: address.toLowerCase(), nonce },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ walletAddress: user.walletAddress, role: user.role, nonce: user.nonce }, { status: 201 });

  } catch (error) {
    console.error('Signup failed:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
