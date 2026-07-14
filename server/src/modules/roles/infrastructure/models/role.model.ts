/**
 * @file role.model.ts
 * @layer Infrastructure › Models
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IRoleDocument extends Document {
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRoleDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: [{
      type: String,
      required: true,
    }],
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const RoleModel = mongoose.model<IRoleDocument>('Role', roleSchema);
