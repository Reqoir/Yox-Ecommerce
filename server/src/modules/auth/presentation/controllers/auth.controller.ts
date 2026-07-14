/**
 * @file auth.controller.ts
 * @layer Presentation › Controllers
 * 
 * HTTP Controller for Authentication endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../../application/use-cases/register.use-case';
import { registerSchema } from '../validators/auth.validator';
import { validateRequest } from '@shared/utils/validation.helper';
import { ApiResponse } from '@shared/utils/api-response.util';
import { HttpStatus } from '@shared/constants/http-status.constants';

import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { loginSchema } from '../validators/auth.validator';
import { setAuthCookies } from '@shared/utils/cookie.helper';

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase
  ) {}

  /**
   * POST /api/v1/auth/register
   * Registers a new user.
   */
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Validate incoming request body
      const validBody = validateRequest(req, registerSchema, 'body');

      // 2. Execute Use Case
      const result = await this.registerUseCase.execute(validBody);

      // 3. Return response
      ApiResponse.success(
        res,
        result,
        'User registered successfully',
        HttpStatus.CREATED
      );
    } catch (error) {
      next(error); // Pass to global error handler
    }
  };

  /**
   * POST /api/v1/auth/login
   * Authenticates a user and sets cookies.
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validBody = validateRequest(req, loginSchema, 'body');

      const result = await this.loginUseCase.execute(validBody);

      // Set cookies securely
      setAuthCookies(res, result.accessToken, result.refreshToken);

      ApiResponse.success(
        res,
        { user: result.user },
        'Logged in successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/logout
   * Clears authentication cookies.
   */
  public logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Dynamic import to avoid circular dependencies or simply use regular import.
      // Since it's a utility, regular import is fine. Let's just use it directly.
      const { clearAuthCookies } = await import('@shared/utils/cookie.helper');
      clearAuthCookies(res);
      ApiResponse.success(res, null, 'Logged out successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}
