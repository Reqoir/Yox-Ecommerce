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

const router = Router();

// --- Dependency Injection Setup ---
// 1. Repositories (Infrastructure)
const userRepository = new UserRepository();

// 2. Use Cases (Application)
const registerUseCase = new RegisterUserUseCase(userRepository);
const loginUseCase = new LoginUseCase(userRepository);

// 3. Controllers (Presentation)
const authController = new AuthController(registerUseCase, loginUseCase);
// ----------------------------------

// --- Routes Definition ---
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

export default router;
