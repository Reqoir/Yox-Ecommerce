/**
 * @file user.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';

const router = Router();

const userRepository = new UserRepository();
const getProfileUseCase = new GetProfileUseCase(userRepository);
const updateProfileUseCase = new UpdateProfileUseCase(userRepository);
const userController = new UserController(getProfileUseCase, updateProfileUseCase);

// Apply auth middleware to all user routes
router.use(requireAuth);

router.get('/me', userController.getProfile);
router.patch('/me', userController.updateProfile);

export default router;
