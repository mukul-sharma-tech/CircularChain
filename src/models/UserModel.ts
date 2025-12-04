// models/UserModel.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface to define the properties of a User document
export interface IUser extends Document {
  walletAddress: string;
  name?: string;
  companyName?: string;
  addressText?: string;
  role: 'user' | 'agent' | 'admin' | 'pending';
  nonce: string;
  isAvailable?: boolean; // <-- ADD THIS FIELD (optional)

}

const UserSchema: Schema<IUser> = new Schema({
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required.'],
    unique: true,
    lowercase: true,
  },
  name: {
    type: String,
    trim: true,
  },
  companyName: {
    type: String,
    trim: true,
  },
  addressText: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'agent', 'admin', 'pending'],
    default: 'pending',
  },
  nonce: {
    type: String,
    required: true,
  },
  isAvailable: { // <-- ADD THIS FIELD DEFINITION
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Prevent model overwrite in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;