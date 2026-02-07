import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  _id: string;
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  content: string;
  type: 'message' | 'club_invite';
  relatedClub?: mongoose.Types.ObjectId;
  relatedEvent?: mongoose.Types.ObjectId;
  isRead: boolean;
  isModerated: boolean;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ['message', 'club_invite'],
      default: 'message',
    },
    relatedClub: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
    },
    relatedEvent: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isModerated: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
