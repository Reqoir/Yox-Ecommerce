/**
 * @file base.schema.ts
 * @layer Infrastructure › Database › Mongoose
 *
 * Base Mongoose schema options shared by all model schemas.
 * Applies consistent options: timestamps, _id→id virtual, toJSON/toObject transforms.
 */

import { type SchemaOptions } from 'mongoose';

export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,

  toJSON: {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret: Record<string, unknown>) {
      ret['id'] = String(ret['_id']);
      delete (ret as Record<string, unknown> & { _id?: unknown })['_id'];
      return ret;
    },
  },

  toObject: {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret: Record<string, unknown>) {
      ret['id'] = String(ret['_id']);
      delete (ret as Record<string, unknown> & { _id?: unknown })['_id'];
      return ret;
    },
  },
};
