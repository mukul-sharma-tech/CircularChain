import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Listing from '@/models/ListingModel';

export async function GET() {
  try {
    await dbConnect();
    
    const listings = await Listing.find({}).limit(20);
    
    return NextResponse.json({
      count: listings.length,
      listings: listings.map(l => ({
        listingId: l.listingId,
        name: l.name,
        companyName: l.companyName,
        isActive: l.isActive,
        quantityAvailable: l.quantityAvailable
      }))
    });
  } catch (error) {
    console.error('Check DB failed:', error);
    return NextResponse.json(
      { message: 'Check failed', error: String(error) },
      { status: 500 }
    );
  }
}
