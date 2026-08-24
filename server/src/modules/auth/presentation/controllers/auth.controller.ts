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
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator';
import { setAuthCookies, clearAuthCookies } from '@shared/utils/cookie.helper';
import { ApiError } from '@shared/utils/api-error.util';

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase
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
   * POST /api/v1/auth/refresh
   * Refreshes the access token using a valid refresh token cookie.
   */
  public refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshTokenCookie = req.cookies?.refresh_token;

      if (!refreshTokenCookie) {
        throw ApiError.unauthorized('No refresh token provided');
      }

      // Execute use case (will throw ApiError if invalid)
      const result = await this.refreshTokenUseCase.execute(refreshTokenCookie);

      // Set new cookies securely
      setAuthCookies(res, result.accessToken, result.refreshToken);

      ApiResponse.success(
        res,
        null,
        'Token refreshed successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/auth/me
   * Fetches the current authenticated user's profile.
   */
  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const result = await this.getMeUseCase.execute(userId);

      ApiResponse.success(
        res,
        result,
        'Profile fetched successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/forgot-password
   */
  public forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = validateRequest(req, forgotPasswordSchema, 'body') as { email: string };
      const result = await this.forgotPasswordUseCase.execute(data.email);

      ApiResponse.success(res, null, result.message, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/reset-password
   */
  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = validateRequest(req, resetPasswordSchema, 'body') as { password: string; token: string };
      await this.resetPasswordUseCase.execute(data);

      ApiResponse.success(res, null, 'Password reset successfully', HttpStatus.OK);
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
      clearAuthCookies(res);
      ApiResponse.success(res, null, 'Logged out successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}
