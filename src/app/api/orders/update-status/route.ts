import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const { orderId, deliveryStatus } = await request.json();

    if (!orderId || typeof deliveryStatus !== 'number') {
      return NextResponse.json(
        { error: 'Invalid orderId or deliveryStatus' },
        { status: 400 }
      );
    }

    const updatedOrder = await OrderService.updateDeliveryStatus(orderId, deliveryStatus);

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}