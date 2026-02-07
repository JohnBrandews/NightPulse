import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBooking extends Document {
  _id: string;
  user: mongoose.Types.ObjectId;
  club: mongoose.Types.ObjectId;
  event?: mongoose.Types.ObjectId;
  bookingType: 'table' | 'booth' | 'general' | 'dj_gig';
  date: Date;
  time: string;
  numberOfGuests: number;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  tableNumber?: string;
  totalAmount?: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    user: {
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
    bookingType: {
      type: String,
      enum: ['table', 'booth', 'general', 'dj_gig'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    specialRequests: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    tableNumber: {
      type: String,
    },
    totalAmount: {
      type: Number,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
