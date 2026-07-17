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
      if (!req.file) {
        ApiResponse.error(res, 'No image file provided.', 400);
        return;
      }

      // Convert buffer to base64 for Cloudinary
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

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
}
