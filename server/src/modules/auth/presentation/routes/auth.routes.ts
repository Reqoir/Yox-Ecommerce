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
import { LoginPhoneUseCase } from '../../application/use-cases/login-phone.use-case';
import { LoginPhoneSelectUseCase } from '../../application/use-cases/login-phone-select.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ResetPasswordPhoneVerifyUseCase } from '../../application/use-cases/reset-password-phone-verify.use-case';
import { ResetPasswordPhoneConfirmUseCase } from '../../application/use-cases/reset-password-phone-confirm.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { RoleRepository } from '../../../roles/infrastructure/repositories/role.repository';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { authLimiter } from '../../../../presentation/http/middleware/rate-limiter.middleware';

const router = Router();

// --- Dependency Injection Setup ---
// 1. Repositories (Infrastructure)
const userRepository = new UserRepository();
const roleRepository = new RoleRepository();

// 2. Use Cases (Application)
const registerUseCase = new RegisterUserUseCase(userRepository, roleRepository);
const loginUseCase = new LoginUseCase(userRepository, roleRepository);
const loginPhoneUseCase = new LoginPhoneUseCase(userRepository, roleRepository);
const loginPhoneSelectUseCase = new LoginPhoneSelectUseCase(userRepository, roleRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepository);
const getMeUseCase = new GetMeUseCase(userRepository, roleRepository);
const forgotPasswordUseCase = new ForgotPasswordUseCase(userRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(userRepository);
const resetPasswordPhoneVerifyUseCase = new ResetPasswordPhoneVerifyUseCase(userRepository);
const resetPasswordPhoneConfirmUseCase = new ResetPasswordPhoneConfirmUseCase(userRepository);
const changePasswordUseCase = new ChangePasswordUseCase(userRepository);

// 3. Controllers (Presentation)
const authController = new AuthController(
  registerUseCase,
  loginUseCase,
  loginPhoneUseCase,
  loginPhoneSelectUseCase,
  refreshTokenUseCase,
  getMeUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase,
  resetPasswordPhoneVerifyUseCase,
  resetPasswordPhoneConfirmUseCase,
  changePasswordUseCase
);
// ----------------------------------

// --- Routes Definition ---
// Apply authLimiter to guard against brute-force and credential stuffing
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/login-phone', authLimiter, authController.loginWithPhone);
router.post('/login-phone-select', authLimiter, authController.selectPhoneAccount);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/reset-password-phone-verify', authLimiter, authController.resetPasswordPhoneVerify);
router.post('/reset-password-phone-confirm', authLimiter, authController.resetPasswordPhoneConfirm);
router.post('/change-password', requireAuth, authLimiter, authController.changePassword);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);

export default router;
