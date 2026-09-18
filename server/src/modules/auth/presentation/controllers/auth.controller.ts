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
import { LoginPhoneUseCase } from '../../application/use-cases/login-phone.use-case';
import { LoginPhoneSelectUseCase } from '../../application/use-cases/login-phone-select.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ResetPasswordPhoneVerifyUseCase } from '../../application/use-cases/reset-password-phone-verify.use-case';
import { ResetPasswordPhoneConfirmUseCase } from '../../application/use-cases/reset-password-phone-confirm.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import {
  loginSchema,
  loginPhoneSchema,
  loginPhoneSelectSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resetPasswordPhoneVerifySchema,
  resetPasswordPhoneConfirmSchema,
  changePasswordSchema,
} from '../validators/auth.validator';
import { setAuthCookies, clearAuthCookies } from '@shared/utils/cookie.helper';
import { ApiError } from '@shared/utils/api-error.util';

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly loginPhoneUseCase: LoginPhoneUseCase,
    private readonly loginPhoneSelectUseCase: LoginPhoneSelectUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly resetPasswordPhoneVerifyUseCase: ResetPasswordPhoneVerifyUseCase,
    private readonly resetPasswordPhoneConfirmUseCase: ResetPasswordPhoneConfirmUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase
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

      // Set cookies securely so user is automatically authenticated
      setAuthCookies(res, result.accessToken, result.refreshToken);

      // 3. Return response
      ApiResponse.success(
        res,
        { user: result.user },
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
   * POST /api/v1/auth/login-phone
   * Authenticates a user via mobile number + MSG91 OTP.
   * If multiple accounts share the phone number, returns candidate accounts for selection.
   */
  public loginWithPhone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validBody = validateRequest(req, loginPhoneSchema, 'body');

      const result = await this.loginPhoneUseCase.execute(validBody);

      if (result.multipleAccounts) {
        ApiResponse.success(
          res,
          result,
          'Multiple accounts found for this mobile number',
          HttpStatus.OK
        );
        return;
      }

      // Single account: set cookies securely
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
   * POST /api/v1/auth/login-phone-select
   * Completes login when a user chooses an account from multiple accounts sharing a phone number.
   */
  public selectPhoneAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validBody = validateRequest(req, loginPhoneSelectSchema, 'body');

      const result = await this.loginPhoneSelectUseCase.execute(validBody);

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
      const refreshTokenCookie = req.cookies?.refresh_token || req.cookies?.refreshToken;

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
   * POST /api/v1/auth/reset-password-phone-verify
   * Verifies mobile OTP for password reset and returns candidate accounts if multiple exist.
   */
  public resetPasswordPhoneVerify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validBody = validateRequest(req, resetPasswordPhoneVerifySchema, 'body');
      const result = await this.resetPasswordPhoneVerifyUseCase.execute(validBody);

      ApiResponse.success(res, result, 'Mobile OTP verified successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/reset-password-phone-confirm
   * Resets password strictly for the specified userId using verified resetToken.
   */
  public resetPasswordPhoneConfirm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validBody = validateRequest(req, resetPasswordPhoneConfirmSchema, 'body');
      const result = await this.resetPasswordPhoneConfirmUseCase.execute(validBody);

      ApiResponse.success(res, null, result.message, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/change-password
   * Authenticated user changes their own password.
   */
  public changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const validBody = validateRequest(req, changePasswordSchema, 'body');
      const result = await this.changePasswordUseCase.execute(userId, validBody);

      ApiResponse.success(res, null, result.message, HttpStatus.OK);
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
