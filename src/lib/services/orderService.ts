import { Order, IOrder } from '../../models';
import dbConnect from '../dbConnect';

export class OrderService {
  static async create(orderData: Partial<IOrder>): Promise<IOrder> {
    await dbConnect();
    const order = new Order(orderData);
    return order.save();
  }

  static async findById(orderId: number): Promise<IOrder | null> {
    await dbConnect();
    return Order.findOne({ orderId });
  }

  static async findByUser(walletAddress: string): Promise<IOrder[]> {
    await dbConnect();
    const address = walletAddress.toLowerCase();
    return Order.find({
      $or: [
        { buyer: address },
        { seller: address },
        { deliveryAgent: address }
      ]
    }).sort({ createdAt: -1 });
  }

  static async updateStatus(orderId: number, status: IOrder['status']): Promise<IOrder | null> {
    await dbConnect();
    return Order.findOneAndUpdate(
      { orderId },
      { status, updatedAt: new Date() },
      { new: true }
    );
  }

  static async updateDeliveryStatus(orderId: number, deliveryStatus: number): Promise<IOrder | null> {
    await dbConnect();
    return Order.findOneAndUpdate(
      { orderId },
      { deliveryStatus, updatedAt: new Date() },
      { new: true }
    );
  }

  static async updateConfirmation(orderId: number, type: 'agent' | 'buyer', confirmed: boolean): Promise<IOrder | null> {
    await dbConnect();
    const updateField = type === 'agent' ? 'agentConfirmed' : 'buyerConfirmed';
    return Order.findOneAndUpdate(
      { orderId },
      { [updateField]: confirmed, updatedAt: new Date() },
      { new: true }
    );
  }

  static async assignAgent(orderId: number, agentAddress: string, agentName?: string, agentCompany?: string): Promise<IOrder | null> {
    await dbConnect();
    return Order.findOneAndUpdate(
      { orderId },
      {
        deliveryAgent: agentAddress.toLowerCase(),
        agentName,
        agentCompany,
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async getAllActive(): Promise<IOrder[]> {
    await dbConnect();
    return Order.find({
      status: { $in: ['AWAITING_AGENT', 'AWAITING_DELIVERY'] }
    }).sort({ createdAt: -1 });
  }

  static async getStats(): Promise<{
    total: number;
    awaitingAgent: number;
    awaitingDelivery: number;
    completed: number;
    refunded: number;
  }> {
    await dbConnect();
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: 0,
      awaitingAgent: 0,
      awaitingDelivery: 0,
      completed: 0,
      refunded: 0
    };

    stats.forEach(stat => {
      result.total += stat.count;
      switch (stat._id) {
        case 'AWAITING_AGENT':
          result.awaitingAgent = stat.count;
          break;
        case 'AWAITING_DELIVERY':
          result.awaitingDelivery = stat.count;
          break;
        case 'COMPLETE':
          result.completed = stat.count;
          break;
        case 'REFUNDED':
          result.refunded = stat.count;
          break;
      }
    });

    return result;
  }
}