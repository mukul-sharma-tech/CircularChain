// import { NextRequest, NextResponse } from 'next/server';
// import { ethers, Contract } from 'ethers';
// import { contractABI, contractAddress } from '@/lib/constants';
// import dbConnect from '@/lib/dbConnect';
// import Listing from '@/models/ListingModel';
// import Order from '@/models/OrderModel';

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { type, id } = body ?? {};

//     if (!type || typeof id !== 'number') {
//       return NextResponse.json({ message: 'type and numeric id are required' }, { status: 400 });
//     }

//     const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
//     const contract = new Contract(contractAddress, contractABI, provider);

//     await dbConnect();

//     if (type === 'listing') {
//       const listingOnChain = await contract.listings(id).catch((e) => { throw new Error('Unable to fetch listing from chain'); });
//       const updated = await Listing.findOneAndUpdate(
//         { listingId: id },
//         {
//           listingId: id,
//           name: listingOnChain.name,
//           companyName: '',
//           seller: String(listingOnChain.seller).toLowerCase(),
//           pricePerUnit: String(listingOnChain.pricePerUnit),
//           quantityAvailable: Number(listingOnChain.quantity),
//           quantitySold: Number(listingOnChain.quantitySold || 0),
//           isActive: true,
//           dataHash: listingOnChain.dataHash || '',
//           updatedAt: new Date()
//         },
//         { upsert: true, new: true, setDefaultsOnInsert: true }
//       );

//       return NextResponse.json({ message: 'Listing synced', listing: updated });
//     }

//     if (type === 'order') {
//       const orderOnChain = await contract.orders(id).catch((e) => { throw new Error('Unable to fetch order from chain'); });
//       const listingOnChain = await contract.listings(Number(orderOnChain.listingId)).catch(() => null);

//       const updated = await Order.findOneAndUpdate(
//         { orderId: id },
//         {
//           orderId: id,
//           listingId: Number(orderOnChain.listingId),
//           listingName: listingOnChain?.name ?? '',
//           seller: listingOnChain?.seller ? String(listingOnChain.seller).toLowerCase() : '',
//           buyer: String(orderOnChain.buyer).toLowerCase(),
//           quantity: Number(orderOnChain.quantity),
//           totalAmount: String(orderOnChain.totalAmount),
//           paymentMethod: Number(orderOnChain.paymentMethod) === 0 ? 'ETH' : 'FIAT',
//           updatedAt: new Date()
//         },
//         { upsert: true, new: true, setDefaultsOnInsert: true }
//       );

//       return NextResponse.json({ message: 'Order synced', order: updated });
//     }

//     return NextResponse.json({ message: 'Unknown type' }, { status: 400 });

//   } catch (error) {
//     console.error('Refresh sync failed:', error);
//     return NextResponse.json({ message: 'Refresh sync failed' }, { status: 500 });
//   }
// }



import { NextRequest, NextResponse } from 'next/server';
import { ethers, Contract } from 'ethers';
import { contractABI, contractAddress } from '@/lib/constants';
import dbConnect from '@/lib/dbConnect';
import Listing from '@/models/ListingModel';
import Order from '@/models/OrderModel';

const ORDER_STATUS_MAP: Record<number, string> = {
  0: 'AWAITING_AGENT',
  1: 'AGENT_ASSIGNED',
  2: 'IN_TRANSIT',
  3: 'DELIVERED',
  4: 'COMPLETED',
  5: 'CANCELLED',
};


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, id } = body ?? {};

        // ✅ Safe ID parsing
        const numericId = Number(id);
        if (!type || Number.isNaN(numericId)) {
            return NextResponse.json(
                { message: 'type and valid id are required' },
                { status: 400 }
            );
        }

        // ✅ Provider + Contract
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const contract = new Contract(contractAddress, contractABI, provider) as any;

        // ✅ DB connection
        await dbConnect();

        /* =====================================================
           LISTING SYNC — MATCHES Solidity Listing struct
        ====================================================== */
        if (type === 'listing') {
            const listingOnChain = await contract.listings(numericId);

            console.log(`Syncing listing ${numericId}:`, {
                id: listingOnChain.id?.toString(),
                name: listingOnChain.name,
                companyName: listingOnChain.companyName
            });

            // Try to fetch the images via the helper (public mapping getters often omit arrays)
            let imageHashes: string[] = [];
            try {
                const contractWithImages = contract as unknown as { getListingImages?: (id: number) => Promise<unknown[]> };
                if (contractWithImages.getListingImages) {
                    const imgs = await contractWithImages.getListingImages(numericId);
                    if (Array.isArray(imgs)) imageHashes = imgs.map(String);
                }
            } catch (err) {
                console.warn('Could not fetch listing images via getListingImages:', err);
                // Do not attempt to access listingOnChain.imageHashes directly (may trigger decoding errors)
            }

            const listingData = {
                listingId: numericId, // Use the passed ID
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

            console.log('Saving listing data:', listingData);

            const updated = await Listing.findOneAndUpdate(
                { listingId: numericId },
                listingData,
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );

            console.log('Saved listing:', updated);

            return NextResponse.json({
                message: 'Listing synced successfully',
                listing: updated
            });
        }

        /* =====================================================
           ORDER SYNC — MATCHES Solidity Order struct
        ====================================================== */
        // if (type === 'order') {
        //     const orderOnChain = await contract.orders(numericId);

        //     const listingOnChain = await contract
        //         .listings(Number(orderOnChain.listingId))
        //         .catch(() => null);

        //     const updated = await Order.findOneAndUpdate(
        //         { orderId: numericId },
        //         {
        //             orderId: Number(orderOnChain.id),
        //             listingId: Number(orderOnChain.listingId),

        //             listingName: listingOnChain?.name ?? '',

        //             seller: listingOnChain?.seller
        //                 ? String(listingOnChain.seller).toLowerCase()
        //                 : '',

        //             buyer: String(orderOnChain.buyer).toLowerCase(),

        //             quantity: Number(orderOnChain.quantity),
        //             totalAmount: orderOnChain.totalAmount.toString(),

        //             paymentMethod:
        //                 Number(orderOnChain.paymentMethod) === 0 ? 'ETH' : 'FIAT',

        //             status: Number(orderOnChain.status),

        //             updatedAt: new Date()
        //         },
        //         {
        //             upsert: true,
        //             new: true,
        //             setDefaultsOnInsert: true
        //         }
        //     );

        //     return NextResponse.json({
        //         message: 'Order synced successfully',
        //         order: updated
        //     });
        // }
if (type === 'order') {
  console.log('🟢 ORDER SYNC:', numericId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawOrder = await contract.orders(numericId) as any;

  const [
    orderId,
    listingId,
    quantity,
    totalAmount,
    buyer,
    buyerName,
    buyerCompany,
    deliveryAgent,
    agentConfirmed,
    buyerConfirmed,
    status,
    paymentMethod,
    isLocalAgent,
    deliveryStatus
  ] = rawOrder;

  // ✅ MAP STATUS SAFELY
  const mappedStatus =
    ORDER_STATUS_MAP[Number(status)] ?? 'AWAITING_AGENT';

  let listingName = 'Unknown Listing';
  let seller = '0x0000000000000000000000000000000000000000';

  try {
    const listing = await contract.listings(Number(listingId));
    listingName = listing.name || listingName;
    seller = String(listing.seller).toLowerCase();
  } catch {
    console.warn('⚠ Listing fetch failed, using fallback values');
  }

  try {
    const saved = await Order.findOneAndUpdate(
      { orderId: Number(orderId) },
      {
        orderId: Number(orderId),
        listingId: Number(listingId),
        listingName,
        seller,

        buyer: String(buyer).toLowerCase(),
        buyerName: buyerName || '',
        buyerCompany: buyerCompany || '',

        quantity: Number(quantity),
        totalAmount: totalAmount.toString(),

        paymentMethod: Number(paymentMethod) === 0 ? 'ETH' : 'FIAT',
        status: mappedStatus, // ✅ FIXED

        deliveryAgent:
          deliveryAgent && deliveryAgent !== ethers.ZeroAddress
            ? String(deliveryAgent).toLowerCase()
            : undefined,

        agentConfirmed,
        buyerConfirmed,
        isLocalAgent,
        deliveryStatus: Number(deliveryStatus)
      },
      {
        upsert: true,
        new: true,
        runValidators: true // 🔥 NOW VALIDATES CORRECTLY
      }
    );

    console.log('✅ ORDER SAVED:', saved.orderId);

    return NextResponse.json({
      message: 'Order synced successfully',
      order: saved
    });
  } catch (mongoErr) {
    console.error('❌ MONGO SAVE FAILED:', mongoErr);

    return NextResponse.json(
      {
        message: 'Order failed to save in DB',
        error: String(mongoErr)
      },
      { status: 500 }
    );
  }
}
        return NextResponse.json(
            { message: 'Unknown sync type' },
            { status: 400 }
        );

    } catch (error) {
        console.error('❌ Refresh sync failed:', error);
        return NextResponse.json(
            {
                message: 'Refresh sync failed',
                error: String(error)
            },
            { status: 500 }
        );
    }
}
