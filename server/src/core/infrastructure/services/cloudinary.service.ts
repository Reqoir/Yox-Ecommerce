/**
 * @file cloudinary.service.ts
 * @layer Infrastructure › Services
 *
 * Cloudinary service — wraps the Cloudinary SDK with typed, promise-based methods.
 */

import type { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

import { cloudinary } from '../config/cloudinary.config';
import { logger } from '../../../shared/logger/logger';

export interface CloudinaryUploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: Record<string, unknown>[];
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  tags?: string[];
}

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export class CloudinaryService {
  /**
   * Upload a file from a local path, URL, or base64 data URI.
   */
  async upload(
    source: string,
    options: CloudinaryUploadOptions = {},
  ): Promise<CloudinaryUploadResult> {
    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(source, {
        folder: options.folder,
        public_id: options.publicId,
        resource_type: options.resourceType ?? 'image',
        transformation: options.transformation,
        tags: options.tags,
        overwrite: true,
        invalidate: true,
      });

      logger.debug({ publicId: result.public_id }, 'Cloudinary: file uploaded');

      return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      };
    } catch (error) {
      const err = error as UploadApiErrorResponse;
      logger.error({ error: err.message }, 'Cloudinary: upload failed');
      throw new Error(`Cloudinary upload failed: ${err.message}`);
    }
  }

  /**
   * Delete a file by its public ID.
   */
  async delete(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<void> {
    try {
      // The Cloudinary SDK returns { result: 'ok' | 'not found' }
      const response = (await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      })) as { result: string };

      if (response.result !== 'ok') {
        throw new Error(`Delete result was '${response.result}' for publicId '${publicId}'`);
      }

      logger.debug({ publicId }, 'Cloudinary: file deleted');
    } catch (error) {
      const err = error as Error;
      logger.error({ error: err.message, publicId }, 'Cloudinary: delete failed');
      throw new Error(`Cloudinary delete failed: ${err.message}`);
    }
  }

  /**
   * Generate a URL for a given public ID.
   */
  getUrl(
    publicId: string,
    options: { width?: number; height?: number; crop?: string } = {},
  ): string {
    return cloudinary.url(publicId, {
      secure: true,
      ...options,
    });
  }
}

export const cloudinaryService = new CloudinaryService();
