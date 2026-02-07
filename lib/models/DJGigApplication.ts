import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDJGigApplication extends Document {
  _id: string;
  dj: mongoose.Types.ObjectId;
  club: mongoose.Types.ObjectId;
  event?: mongoose.Types.ObjectId;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const DJGigApplicationSchema: Schema = new Schema(
  {
    dj: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    club: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
    },
    message: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const DJGigApplication: Model<IDJGigApplication> = mongoose.models.DJGigApplication || mongoose.model<IDJGigApplication>('DJGigApplication', DJGigApplicationSchema);

export default DJGigApplication;
