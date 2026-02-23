import { sessionOptions, SessionData } from "@/lib/session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ethers, Contract } from "ethers";
import { contractABI, contractAddress } from "@/lib/constants";
import Listing from '@/models/ListingModel';
import Order from '@/models/OrderModel';
import dbConnect from '@/lib/dbConnect';

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fromBlock: fromBlockParam } = await req.json().catch(() => ({}));

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new Contract(contractAddress, contractABI, provider);

    const latestBlock = await provider.getBlockNumber();
    const fromBlock = typeof fromBlockParam === 'number' ? fromBlockParam : Math.max(0, latestBlock - 12000);

    // Connect to DB once
    await dbConnect();

    // Sync listings
    const listingFilter = contract.filters.ListingCreated();
    const listingEvents = await contract.queryFilter(listingFilter, fromBlock, 'latest');

    let listingsUpserted = 0;
    for (const event of listingEvents) {
      const eventLog = event as ethers.EventLog;
      if (!eventLog.args) continue;
      const args = eventLog.args as unknown as { id: bigint; name: string; pricePerUnit: bigint; quantity: bigint; seller: string; dataHash: string };
      const listingId = Number(args.id);

      const existing = await Listing.findOneAndUpdate(
        { listingId },
        {
          listingId,
          name: args.name,
          companyName: '',
          seller: args.seller.toLowerCase(),
          pricePerUnit: args.pricePerUnit.toString(),
          quantityAvailable: Number(args.quantity),
          quantitySold: 0,
          isActive: true,
          dataHash: args.dataHash,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          updatedAt: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (existing) listingsUpserted++;
    }

    // Sync orders
    const orderFilter = contract.filters.OrderCreated();
    const orderEvents = await contract.queryFilter(orderFilter, fromBlock, 'latest');

    let ordersUpserted = 0;
    for (const event of orderEvents) {
      const eventLog = event as ethers.EventLog;
      if (!eventLog.args) continue;
      const args = eventLog.args as unknown as { orderId: bigint; listingId: bigint; quantity: bigint; buyer: string; totalAmount: bigint; paymentMethod: bigint };
      const orderId = Number(args.orderId);
      const listingId = Number(args.listingId);

      // Try to fetch listing details from contract so we can set listingName and seller
      const listingOnChain = await contract.listings(listingId).catch(() => null);

      const listingName = listingOnChain?.name ?? '';
      const seller = listingOnChain?.seller ? String(listingOnChain.seller).toLowerCase() : '';

      const existingOrder = await Order.findOneAndUpdate(
        { orderId },
        {
          orderId,
          listingId,
          listingName,
          seller,
          buyer: args.buyer.toLowerCase(),
          quantity: Number(args.quantity),
          totalAmount: args.totalAmount.toString(),
          paymentMethod: Number(args.paymentMethod) === 0 ? 'ETH' : 'FIAT',
          isLocalAgent: false,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          updatedAt: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (existingOrder) ordersUpserted++;
    }

    return NextResponse.json({ message: 'Sync complete', listingsUpserted, ordersUpserted, fromBlock, toBlock: latestBlock });

  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json({ message: 'Sync failed' }, { status: 500 });
  }
}
