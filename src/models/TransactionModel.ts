import mongoose, { Document, Model, Schema } from 'mongoose';

export type TransactionType =
  | 'ORDER_CREATED'
  | 'AGENT_ASSIGNED'
  | 'AGENT_CONFIRMED'
  | 'BUYER_CONFIRMED'
  | 'DELIVERY_STATUS_UPDATED'
  | 'ORDER_COMPLETED'
  | 'ORDER_REFUNDED'
  | 'LISTING_CREATED'
  | 'OFFER_MADE'
  | 'OFFER_ACCEPTED';

export interface ITransaction extends Document {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  from: string; // Wallet address
  to: string; // Contract address
  value: string; // ETH value as string
  gasUsed: string;
  gasPrice: string;
  status: boolean; // Success or failure
  type: TransactionType;
  orderId?: number; // Reference to order if applicable
  listingId?: number; // Reference to listing if applicable
  agentAddress?: string; // Agent wallet if applicable
  eventData?: mongoose.Schema.Types.Mixed; // Parsed event data
  rawData?: mongoose.Schema.Types.Mixed; // Raw transaction data
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema({
  transactionHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true
  },
  blockNumber: {
    type: Number,
    required: true,
    index: true
  },
  blockHash: {
    type: String,
    required: true,
    index: true
  },
  transactionIndex: {
    type: Number,
    required: true
  },
  from: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  to: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  value: {
    type: String,
    required: true,
    default: '0'
  },
  gasUsed: {
    type: String,
    required: true
  },
  gasPrice: {
    type: String,
    required: true
  },
  status: {
    type: Boolean,
    required: true,
    default: true
  },
  type: {
    type: String,
    enum: [
      'ORDER_CREATED',
      'AGENT_ASSIGNED',
      'AGENT_CONFIRMED',
      'BUYER_CONFIRMED',
      'DELIVERY_STATUS_UPDATED',
      'ORDER_COMPLETED',
      'ORDER_REFUNDED',
      'LISTING_CREATED',
      'OFFER_MADE',
      'OFFER_ACCEPTED'
    ],
    required: true,
    index: true
  },
  orderId: {
    type: Number,
    index: true
  },
  listingId: {
    type: Number,
    index: true
  },
  agentAddress: {
    type: String,
    lowercase: true,
    index: true
  },
  eventData: {
    type: Schema.Types.Mixed
  },
  rawData: {
    type: Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'transactions'
});

// Compound indexes for efficient queries
TransactionSchema.index({ from: 1, type: 1 });
TransactionSchema.index({ to: 1, type: 1 });
TransactionSchema.index({ orderId: 1, type: 1 });
TransactionSchema.index({ listingId: 1, type: 1 });
TransactionSchema.index({ timestamp: -1 });
TransactionSchema.index({ blockNumber: -1 });

// Prevent model overwrite in development
const Transaction: Model<ITransaction> = (mongoose.models && mongoose.models.Transaction) || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;