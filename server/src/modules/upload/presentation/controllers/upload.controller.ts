import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { ApiResponse } from '../../../../shared/utils/api-response.util';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class UploadController {
  public uploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = (req as any).file;
      if (!file) {
        ApiResponse.error(res, 'No image file provided.', 400);
        return;
      }

      // Convert buffer to base64 for Cloudinary
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'yox_ecommerce_products',
        resource_type: 'auto',
      });

      ApiResponse.success(res, { url: result.secure_url }, 'Image uploaded successfully.');
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      ApiResponse.error(res, 'Failed to upload image.', 500, [{ message: error.message || 'Unknown error' }]);
    }
  };

  public uploadImages = async (req: Request, res: Response): Promise<void> => {
    try {
      const files = (req as any).files as Express.Multer.File[];
      if (!files || files.length === 0) {
        ApiResponse.error(res, 'No image files provided.', 400);
        return;
      }

      const uploadPromises = files.map(async (file) => {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'yox_ecommerce_products',
          resource_type: 'auto',
        });
        return result.secure_url;
      });

      const urls = await Promise.all(uploadPromises);
      ApiResponse.success(res, { urls }, 'Images uploaded successfully.');
    } catch (error: any) {
      console.error('Cloudinary bulk upload error:', error);
      ApiResponse.error(res, 'Failed to upload images.', 500, [{ message: error.message || 'Unknown error' }]);
    }
  };
}
