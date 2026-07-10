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

export class AuthController {
  constructor(private readonly registerUseCase: RegisterUserUseCase) {}

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
}
