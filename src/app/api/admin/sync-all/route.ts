import { NextResponse } from 'next/server';
import { ethers, Contract } from 'ethers';
import { contractABI, contractAddress } from '@/lib/constants';
import dbConnect from '@/lib/dbConnect';
import Listing from '@/models/ListingModel';

export async function POST() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contract = new Contract(contractAddress, contractABI, provider) as any;

    await dbConnect();

    // Get the next listing ID to know how many listings exist
    const nextListingId = await contract.nextListingId();
    const totalListings = Number(nextListingId) - 1;

    console.log(`Syncing ${totalListings} listings...`);

    let synced = 0;
    let failed = 0;

    for (let i = 1; i <= totalListings; i++) {
      try {
        const listingOnChain = await contract.listings(i);

        console.log(`Listing ${i} raw data:`, {
          id: listingOnChain.id?.toString(),
          name: listingOnChain.name,
          companyName: listingOnChain.companyName,
          isActive: listingOnChain.isActive
        });

        // Skip inactive listings
        if (!listingOnChain.isActive) {
          console.log(`Skipping inactive listing ${i}`);
          continue;
        }

        // Try to fetch images
        let imageHashes: string[] = [];
        try {
          const contractWithImages = contract as unknown as { getListingImages?: (id: number) => Promise<unknown[]> };
          if (contractWithImages.getListingImages) {
            const imgs = await contractWithImages.getListingImages(i);
            if (Array.isArray(imgs)) imageHashes = imgs.map(String);
          }
        } catch (err) {
          console.warn(`Could not fetch images for listing ${i}:`, err);
        }

        const listingData = {
          listingId: i, // Use the loop index as the ID
          name: listingOnChain.name || 'Unknown',
          companyName: listingOnChain.companyName || 'Unknown Company',
          seller: String(listingOnChain.seller).toLowerCase(),
          pricePerUnit: listingOnChain.pricePerUnit.toString(),
          quantityAvailable: Number(listingOnChain.quantityAvailable),
          isActive: listingOnChain.isActive,
          dataHash: listingOnChain.dataHash || '',
          imageHashes,
          updatedAt: new Date()
        };

        console.log(`Saving listing ${i}:`, listingData);

        await Listing.findOneAndUpdate(
          { listingId: i },
          listingData,
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
          }
        );

        synced++;
        console.log(`✅ Synced listing ${i}: ${listingOnChain.name}`);
      } catch (err) {
        failed++;
        console.error(`❌ Failed to sync listing ${i}:`, err);
      }
    }

    return NextResponse.json({
      message: 'Sync completed',
      total: totalListings,
      synced,
      failed
    });

  } catch (error) {
    console.error('Sync all failed:', error);
    return NextResponse.json(
      { message: 'Sync failed', error: String(error) },
      { status: 500 }
    );
  }
}
