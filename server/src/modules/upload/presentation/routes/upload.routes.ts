import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/upload.controller';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';

export const uploadRouter = Router();
const uploadController = new UploadController();

// Use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

uploadRouter.post('/image', requireAuth, upload.single('image'), uploadController.uploadImage);
