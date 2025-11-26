import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOffer extends Document {
  orderId: number;
  sellerWallet: string;
  agentWallet: string;
  status: 'pending' | 'accepted' | 'rejected';
  compliancePlan: mongoose.Schema.Types.Mixed;
  wasteMaterial: string;
  originLocation: string;
  destinationLocation: string;
}

const OfferSchema: Schema<IOffer> = new Schema({
  orderId: { type: Number, required: true },
  sellerWallet: { type: String, required: true, lowercase: true },
  agentWallet: { type: String, required: true, lowercase: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  compliancePlan: { type: Schema.Types.Mixed, required: true },
  wasteMaterial: { type: String, required: true },
  originLocation: { type: String, required: true },
  destinationLocation: { type: String, required: true },
}, { timestamps: true });

const OfferModel: Model<IOffer> = mongoose.models.Offer || mongoose.model<IOffer>('Offer', OfferSchema);

export default OfferModel;