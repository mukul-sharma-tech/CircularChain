import { Transaction, ITransaction, TransactionType } from '../../models';
import dbConnect from '../dbConnect';

export class TransactionService {
  static async create(transactionData: Partial<ITransaction>): Promise<ITransaction> {
    await dbConnect();
    const transaction = new Transaction(transactionData);
    return transaction.save();
  }

  static async findByHash(transactionHash: string): Promise<ITransaction | null> {
    await dbConnect();
    return Transaction.findOne({ transactionHash: transactionHash.toLowerCase() });
  }

  static async findByOrder(orderId: number): Promise<ITransaction[]> {
    await dbConnect();
    return Transaction.find({ orderId }).sort({ timestamp: -1 });
  }

  static async findByListing(listingId: number): Promise<ITransaction[]> {
    await dbConnect();
    return Transaction.find({ listingId }).sort({ timestamp: -1 });
  }

  static async findByUser(walletAddress: string): Promise<ITransaction[]> {
    await dbConnect();
    const address = walletAddress.toLowerCase();
    return Transaction.find({
      $or: [
        { from: address },
        { to: address },
        { agentAddress: address }
      ]
    }).sort({ timestamp: -1 });
  }

  static async findByType(type: TransactionType): Promise<ITransaction[]> {
    await dbConnect();
    return Transaction.find({ type }).sort({ timestamp: -1 });
  }

  static async getRecent(limit: number = 10): Promise<ITransaction[]> {
    await dbConnect();
    return Transaction.find({})
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  static async getStats(): Promise<{
    total: number;
    successful: number;
    failed: number;
    byType: Record<TransactionType, number>;
  }> {
    await dbConnect();

    const [totalStats, typeStats] = await Promise.all([
      Transaction.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            successful: {
              $sum: { $cond: ['$status', 1, 0] }
            },
            failed: {
              $sum: { $cond: ['$status', 0, 1] }
            }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const byType: Record<TransactionType, number> = {
      'ORDER_CREATED': 0,
      'AGENT_ASSIGNED': 0,
      'AGENT_CONFIRMED': 0,
      'BUYER_CONFIRMED': 0,
      'DELIVERY_STATUS_UPDATED': 0,
      'ORDER_COMPLETED': 0,
      'ORDER_REFUNDED': 0,
      'LISTING_CREATED': 0,
      'OFFER_MADE': 0,
      'OFFER_ACCEPTED': 0
    };

    typeStats.forEach(stat => {
      byType[stat._id as TransactionType] = stat.count;
    });

    const stats = totalStats[0] || { total: 0, successful: 0, failed: 0 };

    return {
      ...stats,
      byType
    };
  }

  static async getVolume(): Promise<{
    totalVolume: string;
    averageGasPrice: string;
    totalGasUsed: string;
  }> {
    await dbConnect();

    const volumeStats = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalVolume: {
            $sum: { $toDouble: '$value' }
          },
          averageGasPrice: {
            $avg: { $toDouble: '$gasPrice' }
          },
          totalGasUsed: {
            $sum: { $toDouble: '$gasUsed' }
          }
        }
      }
    ]);

    const stats = volumeStats[0] || {
      totalVolume: 0,
      averageGasPrice: 0,
      totalGasUsed: 0
    };

    return {
      totalVolume: stats.totalVolume.toString(),
      averageGasPrice: stats.averageGasPrice.toString(),
      totalGasUsed: stats.totalGasUsed.toString()
    };
  }
}