/**
 * @file msg91-otp.service.ts
 * @layer Infrastructure › Services
 * 
 * Integrates with MSG91 OTP Widget Verification API to validate
 * access tokens issued after mobile OTP verification.
 */

import { env } from '@config/env';
import { ValidationError } from '@core/application/errors/application.error';
import { logger } from '@shared/logger/logger';

export interface IMsg91VerificationResult {
  verified: boolean;
  identifier?: string;
  rawResponse?: any;
}

export class Msg91OtpService {
  private static instance: Msg91OtpService;
  private readonly verifyUrl = 'https://api.msg91.com/api/v5/widget/verifyAccessToken';

  private constructor() {}

  public static getInstance(): Msg91OtpService {
    if (!Msg91OtpService.instance) {
      Msg91OtpService.instance = new Msg91OtpService();
    }
    return Msg91OtpService.instance;
  }

  /**
   * Normalizes a phone number to digits only, stripping pluses, spaces, and hyphens.
   */
  public normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  /**
   * Verifies the access-token received from the client MSG91 OTP widget.
   * Confirms the token is valid, unexpired, and matches the user's mobile number.
   * 
   * @param verificationToken The access token returned by window.verifyOtp()
   * @param expectedPhone The user's phone number entered during registration
   */
  public async verifyToken(verificationToken: string, expectedPhone: string): Promise<IMsg91VerificationResult> {
    if (!verificationToken || !verificationToken.trim()) {
      throw new ValidationError('Mobile verification token is required');
    }

    if (!expectedPhone || !expectedPhone.trim()) {
      throw new ValidationError('Mobile number is required for verification');
    }

    const authKey = env.MSG91_AUTH_KEY;
    if (!authKey) {
      logger.error('MSG91_AUTH_KEY is not configured on the server');
      throw new Error('Server OTP verification service is not configured');
    }

    try {
      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'access-token': verificationToken.trim(),
        }),
      });

      const data: any = await response.json().catch(() => null);

      if (!response.ok || !data) {
        logger.warn({ status: response.status, data }, 'MSG91 verifyAccessToken rejected');
        throw new ValidationError(
          data?.message || 'Invalid or expired mobile verification code. Please request a new OTP.'
        );
      }

      // Check if MSG91 returned an error object
      if (data.type === 'error' || data.hasError === true || data.status === 'fail') {
        logger.warn({ data }, 'MSG91 verification returned error status');
        throw new ValidationError(
          data.message || 'Mobile OTP verification failed. Please try again.'
        );
      }

      // Extract verified identifier from response
      const verifiedIdentifier = 
        data.mobile || 
        data.identifier || 
        data.number || 
        data.phone || 
        data?.data?.mobile || 
        data?.data?.identifier;

      if (verifiedIdentifier) {
        const normExpected = this.normalizePhone(expectedPhone);
        const normVerified = this.normalizePhone(String(verifiedIdentifier));

        // Ensure match: compare last 10 digits or entire normalized number
        const last10Expected = normExpected.slice(-10);
        const last10Verified = normVerified.slice(-10);

        if (last10Expected !== last10Verified) {
          logger.warn(
            { expected: expectedPhone, verified: verifiedIdentifier },
            'MSG91 verified number does not match registered phone number'
          );
          throw new ValidationError(
            'The verified mobile number does not match the registered mobile number.'
          );
        }
      }

      logger.info({ phone: expectedPhone }, 'Mobile OTP verification succeeded with MSG91');

      return {
        verified: true,
        identifier: verifiedIdentifier,
        rawResponse: data,
      };
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error({ err: error.message }, 'Unexpected error in Msg91OtpService.verifyToken');
      throw new ValidationError('Failed to verify mobile OTP. Please try again.');
    }
  }
}

export const msg91OtpService = Msg91OtpService.getInstance();
