import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEvent extends Document {
  _id: string;
  club: mongoose.Types.ObjectId;
  promoter?: mongoose.Types.ObjectId;
  dj?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  eventType: 'regular' | 'special' | 'featured';
  coverCharge?: number;
  dressCode?: string;
  ageRestriction?: number;
  image?: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema = new Schema(
  {
    club: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    promoter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    dj: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      enum: ['regular', 'special', 'featured'],
      default: 'regular',
    },
    coverCharge: {
      type: Number,
    },
    dressCode: {
      type: String,
    },
    ageRestriction: {
      type: Number,
    },
    image: {
      type: String,
    },
    isFeatured: {
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

const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
