import { NextFunction, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { ApiResponse } from '../../../../shared/utils/api-response.util';
import { ApiError } from '../../../../shared/utils/api-error.util';
import {
  buildCloudinaryUploadOptions,
  validateUploadedImageFile,
} from '../../application/utils/upload-validation.util';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class UploadController {
  public uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = (req as any).file;
      if (!file) {
        throw ApiError.badRequest('No image file provided.');
      }

      const { verifiedMimeType } = validateUploadedImageFile(file);
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${verifiedMimeType};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, buildCloudinaryUploadOptions());

      ApiResponse.success(res, { url: result.secure_url }, 'Image uploaded successfully.');
    } catch (error: any) {
      if (error instanceof ApiError) {
        next(error);
        return;
      }
      next(ApiError.internal('Failed to upload image.'));
    }
  };

  public uploadImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = (req as any).files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw ApiError.badRequest('No image files provided.');
      }

      // Validate all files up-front before dispatching any external Cloudinary upload
      const validatedFiles = files.map((file) => ({
        file,
        ...validateUploadedImageFile(file),
      }));

      const uploadOptions = buildCloudinaryUploadOptions();
      const uploadPromises = validatedFiles.map(async ({ file, verifiedMimeType }) => {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${verifiedMimeType};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, uploadOptions);
        return result.secure_url;
      });

      const urls = await Promise.all(uploadPromises);
      ApiResponse.success(res, { urls }, 'Images uploaded successfully.');
    } catch (error: any) {
      if (error instanceof ApiError) {
        next(error);
        return;
      }
      next(ApiError.internal('Failed to upload images.'));
    }
  };
}
