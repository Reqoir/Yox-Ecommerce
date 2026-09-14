import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/upload.controller';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { uploadLimiter } from '../../../../presentation/http/middleware/rate-limiter.middleware';

export const uploadRouter = Router();
const uploadController = new UploadController();

// Use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

uploadRouter.post('/image', requireAuth, uploadLimiter, upload.single('image'), uploadController.uploadImage);
uploadRouter.post('/images', requireAuth, uploadLimiter, upload.array('images', 10), uploadController.uploadImages);
