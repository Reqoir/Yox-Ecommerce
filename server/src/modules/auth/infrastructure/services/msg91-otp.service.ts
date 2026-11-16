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
   * Redacts a phone number for secure diagnostic logging (e.g. 918086564212 -> 91****12).
   */
  private redactPhone(phone?: string | null): string {
    if (!phone) return '[NONE]';
    const clean = String(phone).replace(/\D/g, '');
    if (clean.length <= 4) return '***';
    return `${clean.slice(0, 2)}****${clean.slice(-2)}`;
  }

  /**
   * Sanitizes MSG91 provider response payload before logging to prevent
   * customer phone numbers or sensitive identifiers from appearing in production logs.
   */
  private sanitizeDataForLog(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const sanitized: Record<string, any> = Array.isArray(data) ? [...data] : { ...data };
    for (const key of Object.keys(sanitized)) {
      const val = sanitized[key];
      if (typeof val === 'string' && /\d{7,}/.test(val)) {
        sanitized[key] = this.redactPhone(val);
      } else if (val && typeof val === 'object') {
        sanitized[key] = this.sanitizeDataForLog(val);
      }
    }
    return sanitized;
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
        logger.warn({ status: response.status, data: this.sanitizeDataForLog(data) }, 'MSG91 verifyAccessToken rejected');
        throw new ValidationError(
          data?.message || 'Invalid or expired mobile verification code. Please request a new OTP.'
        );
      }

      // Check if MSG91 returned an error status or non-success indicator
      const isExplicitError = data.type === 'error' || data.hasError === true || data.status === 'fail' || data.status === 'error';
      if (isExplicitError) {
        logger.warn({ data: this.sanitizeDataForLog(data) }, 'MSG91 verification returned error status');
        throw new ValidationError(
          data.message || 'Mobile OTP verification failed. Please try again.'
        );
      }

      const isSuccess = data.type === 'success' || data.status === 'success' || (data.hasError === false && data.type !== 'error');
      if (!isSuccess) {
        logger.warn({ data: this.sanitizeDataForLog(data) }, 'MSG91 verification returned non-success status indicator');
        throw new ValidationError(
          data?.message || 'Mobile OTP verification failed. Please try again.'
        );
      }

      // Extract verified identifier from response
      // MSG91 verifyAccessToken returns { "message": "91XXXXXXXXXX", "type": "success" }
      // but other variants may place the identifier in mobile, phone, number, or identifier
      const candidates = [
        data.mobile,
        data.phone,
        data.number,
        data.identifier,
        data?.data?.mobile,
        data?.data?.phone,
        data?.data?.number,
        data?.data?.identifier,
        typeof data?.data === 'string' ? data.data : undefined,
        data?.data?.message,
        data.message,
      ];

      let verifiedIdentifier: string | undefined = undefined;

      for (const candidate of candidates) {
        if (candidate !== undefined && candidate !== null) {
          const str = String(candidate).trim();
          // Must contain at least 7 digits to represent a valid phone number (ITU-T E.164)
          const digitsOnly = str.replace(/\D/g, '');
          if (digitsOnly.length >= 7) {
            verifiedIdentifier = str;
            break;
          }
        }
      }

      // FAIL-CLOSED: The provider must explicitly return the verified phone identifier
      if (!verifiedIdentifier || String(verifiedIdentifier).trim() === '') {
        logger.warn({ data: this.sanitizeDataForLog(data) }, 'MSG91 verification rejected: response missing verified phone identifier');
        throw new ValidationError('Mobile OTP verification could not be validated with the provider.');
      }

      let normExpected = this.normalizePhone(expectedPhone);
      let normVerified = this.normalizePhone(String(verifiedIdentifier));

      // Handle leading zero if present in 11-digit numbers (e.g. 09876543210 -> 9876543210)
      if (normExpected.startsWith('0') && normExpected.length === 11) {
        normExpected = normExpected.slice(1);
      }
      if (normVerified.startsWith('0') && normVerified.length === 11) {
        normVerified = normVerified.slice(1);
      }

      // Canonicalize: prefix 10-digit Indian numbers with standard '91' country code
      const canonicalExpected = normExpected.length === 10 ? `91${normExpected}` : normExpected;
      const canonicalVerified = normVerified.length === 10 ? `91${normVerified}` : normVerified;

      // Strict full-digit comparison prevents cross-country collision (e.g. +1 vs +91)
      if (canonicalExpected !== canonicalVerified) {
        logger.warn(
          { expected: this.redactPhone(expectedPhone), verified: this.redactPhone(verifiedIdentifier) },
          'MSG91 verified number does not match registered phone number'
        );
        throw new ValidationError(
          'The verified mobile number does not match the registered mobile number.'
        );
      }

      logger.info({ phone: this.redactPhone(expectedPhone) }, 'Mobile OTP verification succeeded with MSG91');

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
