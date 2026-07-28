/**
 * @file address.model.ts
 * @layer Infrastructure › Models
 */

import { Schema, model, Document, Types } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';

export interface IAddressDocument extends Document {
  userId: string; // Keep as string or Types.ObjectId depending on how User represents ID
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddressDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    street: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    ...(baseSchemaOptions as any),
    collection: 'addresses',
  }
);

// We need an index to ensure querying a user's addresses is fast
addressSchema.index({ userId: 1, isDefault: -1 });

export const AddressModel = model<IAddressDocument>('Address', addressSchema);
