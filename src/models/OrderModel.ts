import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOrder extends Document {
  orderId: number; // Blockchain order ID
  listingId: number; // Blockchain listing ID
  listingName: string;
  seller: string; // Wallet address
  sellerName?: string;
  sellerCompany?: string;
  buyer: string; // Wallet address
  buyerName?: string;
  buyerCompany?: string;
  deliveryAgent?: string; // Wallet address
  agentName?: string;
  agentCompany?: string;
  quantity: number;
  totalAmount: string; // ETH amount as string
  paymentMethod: 'ETH' | 'FIAT';
  isLocalAgent: boolean;
  status: 'AWAITING_AGENT' | 'AWAITING_DELIVERY' | 'COMPLETE' | 'REFUNDED';
  agentConfirmed: boolean;
  buyerConfirmed: boolean;
  deliveryStatus: number; // 0: NotStarted, 1: PickedUp, 2: InTransit, 3: Weighment, 4: Delivered
  transactionHash?: string;
  blockNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema<IOrder> = new Schema({
  orderId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  listingId: {
    type: Number,
    required: true,
    index: true
  },
  listingName: {
    type: String,
    required: true,
    trim: true
  },
  seller: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  sellerName: {
    type: String,
    trim: true
  },
  sellerCompany: {
    type: String,
    trim: true
  },
  buyer: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  buyerName: {
    type: String,
    trim: true
  },
  buyerCompany: {
    type: String,
    trim: true
  },
  deliveryAgent: {
    type: String,
    lowercase: true,
    index: true
  },
  agentName: {
    type: String,
    trim: true
  },
  agentCompany: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  totalAmount: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['ETH', 'FIAT'],
    default: 'ETH'
  },
  isLocalAgent: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['AWAITING_AGENT', 'AWAITING_DELIVERY', 'COMPLETE', 'REFUNDED'],
    default: 'AWAITING_AGENT',
    index: true
  },
  agentConfirmed: {
    type: Boolean,
    default: false
  },
  buyerConfirmed: {
    type: Boolean,
    default: false
  },
  deliveryStatus: {
    type: Number,
    default: 0,
    min: 0,
    max: 4
  },
  transactionHash: {
    type: String,
    index: true
  },
  blockNumber: {
    type: Number,
    index: true
  }
}, {
  timestamps: true,
  collection: 'orders'
});

// Compound indexes for efficient queries
OrderSchema.index({ buyer: 1, status: 1 });
OrderSchema.index({ seller: 1, status: 1 });
OrderSchema.index({ deliveryAgent: 1, status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ updatedAt: -1 });

// Prevent model overwrite in development
const Order: Model<IOrder> = (mongoose.models && mongoose.models.Order) || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;