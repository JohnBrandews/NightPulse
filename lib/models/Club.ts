import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClub extends Document {
  _id: string;
  owner: mongoose.Types.ObjectId;
  name: string;
  address: string;
  city: string;
  musicType: string[];
  dressCode: string;
  capacity: number;
  description: string;
  images: string[];
  logo?: string;
  website?: string;
  phone?: string;
  email?: string;
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  events: mongoose.Types.ObjectId[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClubSchema: Schema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    musicType: {
      type: [String],
      required: true,
    },
    dressCode: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    images: {
      type: [String],
      default: [],
    },
    logo: {
      type: String,
    },
    website: {
      type: String,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    openingHours: {
      type: Map,
      of: {
        open: String,
        close: String,
        isOpen: Boolean,
      },
      default: {},
    },
    events: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Club: Model<IClub> = mongoose.models.Club || mongoose.model<IClub>('Club', ClubSchema);

export default Club;
