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

const router = Router();

// --- Dependency Injection Setup ---
// 1. Repositories (Infrastructure)
const userRepository = new UserRepository();

// 2. Use Cases (Application)
const registerUseCase = new RegisterUserUseCase(userRepository);

// 3. Controllers (Presentation)
const authController = new AuthController(registerUseCase);
// ----------------------------------

// --- Routes Definition ---
router.post('/register', authController.register);

export default router;
