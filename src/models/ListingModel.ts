import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IListing extends Document {
  listingId: number; // Blockchain listing ID
  name: string;
  companyName: string;
  seller: string; // Wallet address
  sellerName?: string;
  sellerCompany?: string;
  pricePerUnit: string; // ETH price as string
  quantityAvailable: number;
  quantitySold: number;
  isActive: boolean;
  imageHashes: string[]; // IPFS hashes
  dataHash: string; // IPFS hash for metadata
  description?: string;
  category?: string;
  location?: string;
  materialType?: string;
  certifications?: string[];
  complianceInfo?: mongoose.Schema.Types.Mixed;
  transactionHash?: string;
  blockNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema: Schema<IListing> = new Schema({
  listingId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    index: true
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
  pricePerUnit: {
    type: String,
    required: true
  },
  quantityAvailable: {
    type: Number,
    required: true,
    min: 0
  },
  quantitySold: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  imageHashes: [{
    type: String,
    trim: true
  }],
  dataHash: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    index: true
  },
  location: {
    type: String,
    trim: true,
    index: true
  },
  materialType: {
    type: String,
    trim: true,
    index: true
  },
  certifications: [{
    type: String,
    trim: true
  }],
  complianceInfo: {
    type: Schema.Types.Mixed
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
  collection: 'listings'
});

// Compound indexes for efficient queries
ListingSchema.index({ seller: 1, isActive: 1 });
ListingSchema.index({ category: 1, isActive: 1 });
ListingSchema.index({ materialType: 1, isActive: 1 });
ListingSchema.index({ location: 1, isActive: 1 });
ListingSchema.index({ createdAt: -1 });
ListingSchema.index({ updatedAt: -1 });

// Virtual for remaining quantity
ListingSchema.virtual('quantityRemaining').get(function() {
  return this.quantityAvailable - this.quantitySold;
});

// Ensure virtual fields are serialized
ListingSchema.set('toJSON', { virtuals: true });
ListingSchema.set('toObject', { virtuals: true });

// Prevent model overwrite in development
const Listing: Model<IListing> = (mongoose.models && mongoose.models.Listing) || mongoose.model<IListing>('Listing', ListingSchema);

export default Listing;