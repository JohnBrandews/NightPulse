import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  password?: string;
  name: string;
  role: 'user' | 'club' | 'promoter' | 'dj' | 'admin';
  gender?: 'male' | 'female' | 'other';
  lookingFor?: 'men' | 'women' | 'both';
  dateOfBirth?: Date;
  age?: number;
  ageVerified: boolean;
  idVerificationStatus: 'pending' | 'approved' | 'rejected' | 'not_required';
  idVerificationDoc?: string;
  city?: string;
  bio?: string;
  profileImage?: string;
  images?: string[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Club specific
  clubName?: string;
  clubAddress?: string;
  clubCity?: string;
  clubMusicType?: string[];
  clubDressCode?: string;
  clubCapacity?: number;
  // DJ specific
  djName?: string;
  djGenre?: string[];
  djMusicLinks?: string[];
  djBio?: string;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function(this: IUser) {
        return !this.provider;
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'club', 'promoter', 'dj', 'admin'],
      default: 'user',
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    lookingFor: {
      type: String,
      enum: ['men', 'women', 'both'],
    },
    dateOfBirth: {
      type: Date,
    },
    age: {
      type: Number,
    },
    ageVerified: {
      type: Boolean,
      default: false,
    },
    idVerificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'not_required'],
      default: 'not_required',
    },
    idVerificationDoc: {
      type: String,
    },
    city: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    profileImage: {
      type: String,
    },
    images: {
      type: [String],
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Club fields
    clubName: {
      type: String,
    },
    clubAddress: {
      type: String,
    },
    clubCity: {
      type: String,
    },
    clubMusicType: {
      type: [String],
      default: [],
    },
    clubDressCode: {
      type: String,
    },
    clubCapacity: {
      type: Number,
    },
    // DJ fields
    djName: {
      type: String,
    },
    djGenre: {
      type: [String],
      default: [],
    },
    djMusicLinks: {
      type: [String],
      default: [],
    },
    djBio: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate age from dateOfBirth before saving
UserSchema.pre('save', function(next) {
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.age = age;
  }
  next();
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
