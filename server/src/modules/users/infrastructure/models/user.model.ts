/**
 * @file user.model.ts
 * @layer Infrastructure › Models
 * 
 * Defines the Mongoose schema and model for the User entity.
 */

import { Schema, model, Document } from 'mongoose';
import { UserStatus } from '../../domain/entities/user.entity';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';

export interface IUserDocument extends Document {
  fullName: string;
  email: string;
  phone?: string | null;
  password: string; // Hashed password
  profileImage?: string | null;
  roleId: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  status: UserStatus;
  lastLogin?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
    roleId: {
      type: String,
      required: true,
      default: 'CUSTOMER_ROLE_ID', // Hardcoded as requested, to be replaced later
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'users',
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ status: 1 });

export const UserModel = model<IUserDocument>('User', userSchema);
