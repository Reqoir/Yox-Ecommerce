/**
 * @file auth.routes.ts
 * @layer Presentation › Routes
 * 
 * Express routes for Authentication.
 * Handles Dependency Injection setup for the Auth module.
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { RegisterUserUseCase } from '../../application/use-cases/register.use-case';
import { UserRepository } from '../../../users/infrastructure/repositories/user.repository';

import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { RoleRepository } from '../../../roles/infrastructure/repositories/role.repository';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';

const router = Router();

// --- Dependency Injection Setup ---
// 1. Repositories (Infrastructure)
const userRepository = new UserRepository();
const roleRepository = new RoleRepository();

// 2. Use Cases (Application)
const registerUseCase = new RegisterUserUseCase(userRepository, roleRepository);
const loginUseCase = new LoginUseCase(userRepository, roleRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepository);
const getMeUseCase = new GetMeUseCase(userRepository, roleRepository);
const forgotPasswordUseCase = new ForgotPasswordUseCase(userRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(userRepository);

// 3. Controllers (Presentation)
const authController = new AuthController(
  registerUseCase,
  loginUseCase,
  refreshTokenUseCase,
  getMeUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase
);
// ----------------------------------

// --- Routes Definition ---
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);

export default router;
