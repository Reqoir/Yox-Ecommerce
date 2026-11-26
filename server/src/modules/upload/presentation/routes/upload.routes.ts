import path from 'path';
import { NextFunction, Request, Response, Router } from 'express';
import multer, { MulterError } from 'multer';
import { UploadController } from '../controllers/upload.controller';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';
import { uploadLimiter } from '../../../../presentation/http/middleware/rate-limiter.middleware';
import { ApiError } from '../../../../shared/utils/api-error.util';
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIMES,
  MAX_UPLOAD_FILE_SIZE_BYTES,
  MAX_UPLOAD_FILES_COUNT,
} from '../../application/utils/upload-validation.util';

export const uploadRouter = Router();
const uploadController = new UploadController();

const uploadPermission = requirePermission([
  'manage_products',
  'manage_categories',
  'manage_brands',
  'manage_offers',
  'manage_content',
]);

// Use memory storage with strict size, file count, and extension/MIME filter
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_FILE_SIZE_BYTES,
    files: MAX_UPLOAD_FILES_COUNT,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(String(file.originalname || '')).toLowerCase();
    const mime = String(file.mimetype || '').toLowerCase() === 'image/jpg'
      ? 'image/jpeg'
      : String(file.mimetype || '').toLowerCase();

    if (!(ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext) || !ALLOWED_IMAGE_MIMES.has(mime)) {
      cb(new ApiError('Only JPEG, PNG, and WebP image files are allowed.', 400) as any);
      return;
    }
    cb(null, true);
  },
});

const handleMulterUpload = (middleware: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    middleware(req, res, (err: any) => {
      if (!err) {
        next();
        return;
      }
      if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          next(new ApiError('File size exceeds the maximum allowed limit of 5 MB.', 413));
          return;
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          next(ApiError.badRequest(`Maximum ${MAX_UPLOAD_FILES_COUNT} files allowed per request.`));
          return;
        }
        next(ApiError.badRequest(err.message));
        return;
      }
      next(err);
    });
  };
};

uploadRouter.post(
  '/image',
  requireAuth,
  uploadPermission,
  uploadLimiter,
  handleMulterUpload(upload.single('image')),
  uploadController.uploadImage
);
uploadRouter.post(
  '/images',
  requireAuth,
  uploadPermission,
  uploadLimiter,
  handleMulterUpload(upload.array('images', MAX_UPLOAD_FILES_COUNT)),
  uploadController.uploadImages
);
