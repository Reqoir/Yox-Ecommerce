/**
 * @file cloudinary.config.ts
 * @layer Infrastructure › Config
 *
 * Initialises the Cloudinary SDK with credentials from env.
 * Call initCloudinary() once during application bootstrap.
 */

import { v2 as cloudinary } from 'cloudinary';

import { env } from './env';

export const initCloudinary = (): void => {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

export { cloudinary };
