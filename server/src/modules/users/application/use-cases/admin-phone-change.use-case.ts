/**
 * @file admin-phone-change.use-case.ts
 * @layer Application › Use Cases
 * @description Secure multi-stage use case for primary administrator mobile number changes.
 * Enforces:
 *  1. Only primary System Admin (admin@yox.com) authorization
 *  2. Password re-authentication before initiation
 *  3. Verification of currently registered phone number via OTP
 *  4. Strict state sequencing (existing phone verified BEFORE new phone can be entered)
 *  5. Separate OTP verification of the new phone number
 *  6. Database update ONLY after both OTP verifications succeed
 *  7. Complete unlinking of old phone number
 *  8. Replay protection, expiration, attempt limits, resend cooldowns, and concurrency locking
 *  9. Masked security audit logging for all successes, failures, and transitions
 * 10. Fail-closed: No bypass of existing phone verification
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import { comparePassword } from '@shared/utils/password.helper';
import { msg91OtpService } from '../../../auth/infrastructure/services/msg91-otp.service';
import { AuditLogService } from '../../../audit-logs/application/services/audit-log.service';
import { signAccessToken, signRefreshToken } from '@shared/utils/jwt.helper';
import {
  AdminPhoneChangeSessionStore,
  adminPhoneChangeSessionStore,
  AdminPhoneChangeSession,
} from '../services/admin-phone-change-session.store';

export const PRIMARY_ADMIN_EMAIL = 'admin@yox.com';

export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return 'None';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length <= 4) return '***';
  return `${clean.slice(0, 2)}****${clean.slice(-2)}`;
}

export function canonicalizePhone(phone: string): string {
  const norm = phone.replace(/\D/g, '');
  if (norm.startsWith('0') && norm.length === 11) {
    return `91${norm.slice(1)}`;
  }
  return norm.length === 10 ? `91${norm}` : norm;
}

export class AdminPhoneChangeUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionStore: AdminPhoneChangeSessionStore = adminPhoneChangeSessionStore,
    private readonly roleRepository?: IRoleRepository
  ) {}

  /**
   * Internal guard to enforce that only the primary System Admin can invoke this workflow.
   */
  private assertPrimaryAdmin(actor: { id: string; email?: string | null }): void {
    const email = (actor.email || '').toLowerCase().trim();
    if (email !== PRIMARY_ADMIN_EMAIL) {
      throw ApiError.forbidden(
        'Only the primary System Administrator (admin@yox.com) is authorized to change the administrator registered mobile number.'
      );
    }
  }

  /**
   * Helper to safely record audit logs without leaking unmasked phone numbers or credentials.
   */
  private async recordAuditLog(params: {
    actorId: string;
    actorEmail: string;
    action: string;
    description: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    const auditService = AuditLogService.getInstance();
    if (auditService) {
      auditService
        .record({
          actorId: params.actorId,
          actorEmail: params.actorEmail,
          actorRole: 'ADMIN',
          action: params.action,
          resourceType: 'User',
          resourceId: params.actorId,
          description: params.description,
          before: params.before,
          after: params.after,
          ipAddress: params.ip,
          userAgent: params.userAgent,
        })
        .catch(() => {});
    }
  }

  /**
   * STAGE 1: INITIATE & PASSWORD CONFIRMATION
   * Validates password, ensures current phone exists, acquires concurrency lock,
   * creates an OTP verification session for the existing phone.
   */
  public async initiate(dto: {
    actor: { id: string; email?: string | null };
    password?: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{
    sessionId: string;
    maskedCurrentPhone: string;
    step: 'VERIFY_CURRENT_PHONE';
    expiresInSeconds: number;
    cooldownSeconds: number;
  }> {
    this.assertPrimaryAdmin(dto.actor);

    if (!dto.password || typeof dto.password !== 'string' || !dto.password.trim()) {
      await this.recordAuditLog({
        actorId: dto.actor.id,
        actorEmail: dto.actor.email || PRIMARY_ADMIN_EMAIL,
        action: 'ADMIN_PHONE_CHANGE_FAILED',
        description: 'Initiate phone change rejected: Password confirmation missing',
        ip: dto.ip,
        userAgent: dto.userAgent,
      });
      throw ApiError.badRequest('Administrator password confirmation is mandatory to change your registered mobile number.');
    }

    const adminUser = await this.userRepository.findById(dto.actor.id);
    if (!adminUser) {
      throw ApiError.notFound('Administrator account not found');
    }

    // Authenticate password
    const isPasswordValid = await comparePassword(dto.password, adminUser.password);
    if (!isPasswordValid) {
      await this.recordAuditLog({
        actorId: dto.actor.id,
        actorEmail: adminUser.email,
        action: 'ADMIN_PHONE_CHANGE_FAILED',
        description: 'Initiate phone change rejected: Invalid password confirmation',
        ip: dto.ip,
        userAgent: dto.userAgent,
      });
      throw ApiError.unauthorized('Invalid administrator password. Password confirmation failed.');
    }

    // Existing phone must exist
    const currentPhone = adminUser.phone ? adminUser.phone.trim() : '';
    if (!currentPhone) {
      await this.recordAuditLog({
        actorId: dto.actor.id,
        actorEmail: adminUser.email,
        action: 'ADMIN_PHONE_CHANGE_FAILED',
        description: 'Initiate phone change rejected: No registered phone found on administrator account',
        ip: dto.ip,
        userAgent: dto.userAgent,
      });
      throw ApiError.badRequest(
        'No currently registered mobile phone number was found on your account. ' +
          'Bypassing existing-number verification is prohibited. Please use the offline Account Recovery Protocol.'
      );
    }

    const sessionId = this.sessionStore.generateSessionId();

    // Acquire concurrency lock
    const lockAcquired = await this.sessionStore.acquireLock(adminUser.id, sessionId);
    if (!lockAcquired) {
      await this.recordAuditLog({
        actorId: dto.actor.id,
        actorEmail: adminUser.email,
        action: 'ADMIN_PHONE_CHANGE_FAILED',
        description: 'Initiate phone change rejected: Concurrent change session already active',
        ip: dto.ip,
        userAgent: dto.userAgent,
      });
      throw ApiError.conflict(
        'A phone number change session is already active for this administrator account. Please complete or cancel the existing session.'
      );
    }

    const now = Date.now();
    const session: AdminPhoneChangeSession = {
      sessionId,
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      currentPhone,
      state: 'PASSWORD_CONFIRMED_CURRENT_PHONE_OTP_PENDING',
      currentPhoneVerified: false,
      newPhoneVerified: false,
      failedAttempts: 0,
      lastOtpSentAt: now,
      createdAt: now,
      expiresAt: now + AdminPhoneChangeSessionStore.SESSION_TTL_SECONDS * 1000,
    };

    await this.sessionStore.createSession(session);

    await this.recordAuditLog({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: 'ADMIN_PHONE_CHANGE_INITIATED',
      description: `Administrator phone change workflow initiated. Current phone OTP pending: ${maskPhoneNumber(currentPhone)}`,
      before: { currentPhone: maskPhoneNumber(currentPhone) },
      ip: dto.ip,
      userAgent: dto.userAgent,
    });

    return {
      sessionId,
      maskedCurrentPhone: maskPhoneNumber(currentPhone),
      step: 'VERIFY_CURRENT_PHONE',
      expiresInSeconds: AdminPhoneChangeSessionStore.SESSION_TTL_SECONDS,
      cooldownSeconds: AdminPhoneChangeSessionStore.RESEND_COOLDOWN_SECONDS,
    };
  }

  /**
   * STAGE 2: VERIFY CURRENT PHONE OTP
   * Validates OTP for the currently registered number with MSG91 and replay protection.
   * State transitions to CURRENT_PHONE_VERIFIED_NEW_PHONE_PENDING.
   */
  public async verifyCurrentPhone(dto: {
    actor: { id: string; email?: string | null };
    sessionId: string;
    verificationToken: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{
    success: boolean;
    step: 'ENTER_NEW_PHONE';
    message: string;
  }> {
    this.assertPrimaryAdmin(dto.actor);

    if (!dto.sessionId || !dto.sessionId.trim()) {
      throw ApiError.badRequest('Session ID is required.');
    }

    if (!dto.verificationToken || !dto.verificationToken.trim()) {
      throw ApiError.badRequest('Verification code is required.');
    }

    const session = await this.sessionStore.getSession(dto.sessionId);
    if (!session || session.adminId !== dto.actor.id) {
      throw ApiError.badRequest('Phone change session has expired or is invalid. Please start again.');
    }

    if (session.state !== 'PASSWORD_CONFIRMED_CURRENT_PHONE_OTP_PENDING') {
      if (session.currentPhoneVerified) {
        return {
          success: true,
          step: 'ENTER_NEW_PHONE',
          message: 'Existing mobile number already verified.',
        };
      }
      throw ApiError.badRequest('Invalid session state for existing phone verification.');
    }

    // Replay attack prevention: Token cannot be consumed twice
    const tokenNotReplayed = await this.sessionStore.consumeToken(dto.verificationToken);
    if (!tokenNotReplayed) {
      await this.recordAuditLog({
        actorId: session.adminId,
        actorEmail: session.adminEmail,
        action: 'ADMIN_PHONE_CHANGE_FAILED',
        description: 'Existing phone OTP verification rejected: Replay attack detected on verification token',
        ip: dto.ip,
        userAgent: dto.userAgent,
      });
      throw ApiError.badRequest('This verification code has already been consumed. Please request a fresh OTP.');
    }

    // Attempt limit check
    if (session.failedAttempts >= AdminPhoneChangeSessionStore.MAX_FAILED_ATTEMPTS) {
      await this.sessionStore.destroySession(session.sessionId, session.adminId);
      await this.recordAuditLog({
        actorId: session.adminId,
        actorEmail: session.adminEmail,
        action: 'ADMIN_PHONE_CHANGE_FAILED',
        description: 'Session terminated: Maximum OTP verification attempts exceeded on current phone',
        ip: dto.ip,
        userAgent: dto.userAgent,
      });
      throw ApiError.badRequest('Too many failed verification attempts. This session has been terminated for security.');
    }

    // Verify OTP with MSG91 against the current registered phone
    try {
      await msg91OtpService.verifyToken(dto.verificationToken, session.currentPhone);
    } catch (err: any) {
      session.failedAttempts += 1;
      await this.sessionStore.updateSession(session);

      await this.recordAuditLog({
        actorId: session.adminId,
        actorEmail: session.adminEmail,
        action: 'ADMIN_PHONE_CHANGE_FAILED',
        description: `Current phone OTP verification failed (Attempt ${session.failedAttempts}/${AdminPhoneChangeSessionStore.MAX_FAILED_ATTEMPTS}): ${err.message}`,
        ip: dto.ip,
        userAgent: dto.userAgent,
      });

      throw ApiError.badRequest(err.message || 'Invalid or expired OTP for current mobile number.');
    }

    // Verification succeeded
    session.currentPhoneVerified = true;
    session.state = 'CURRENT_PHONE_VERIFIED_NEW_PHONE_PENDING';
    session.failedAttempts = 0; // reset for next step
    session.lastOtpSentAt = 0; // reset cooldown so first OTP for new phone can be dispatched immediately
    await this.sessionStore.updateSession(session);

    await this.recordAuditLog({
      actorId: session.adminId,
      actorEmail: session.adminEmail,
      action: 'ADMIN_PHONE_CHANGE_CURRENT_VERIFIED',
      description: `Existing registered phone number successfully verified: ${maskPhoneNumber(session.currentPhone)}`,
      before: { currentPhone: maskPhoneNumber(session.currentPhone) },
      ip: dto.ip,
      userAgent: dto.userAgent,
    });

    return {
      success: true,
      step: 'ENTER_NEW_PHONE',
      message: 'Current mobile number verified successfully. You may now enter your new mobile number.',
    };
  }

  /**
   * STAGE 3: REQUEST NEW PHONE OTP
   * Enforces that current phone has been verified first.
   * Validates format, difference from old phone, uniqueness across all users, and resend cooldown.
   * State transitions to NEW_PHONE_OTP_PENDING.
   */
  public async requestNewPhone(dto: {
    actor: { id: string; email?: string | null };
    sessionId: string;
    newPhone: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{
    success: boolean;
    step: 'VERIFY_NEW_PHONE';
    maskedNewPhone: string;
    cooldownSeconds: number;
  }> {
    this.assertPrimaryAdmin(dto.actor);

    if (!dto.sessionId || !dto.sessionId.trim()) {
      throw ApiError.badRequest('Session ID is required.');
    }

    if (!dto.newPhone || typeof dto.newPhone !== 'string' || !dto.newPhone.trim()) {
      throw ApiError.badRequest('New mobile number is required.');
    }

    const session = await this.sessionStore.getSession(dto.sessionId);
    if (!session || session.adminId !== dto.actor.id) {
      throw ApiError.badRequest('Phone change session has expired or is invalid. Please start again.');
    }

    // Requirement 5: Only after successful verification of the existing number, allow new number entry.
    if (!session.currentPhoneVerified || session.state === 'PASSWORD_CONFIRMED_CURRENT_PHONE_OTP_PENDING') {
      await this.recordAuditLog({
        actorId: session.adminId,
        actorEmail: session.adminEmail,
        action: 'ADMIN_PHONE_CHANGE_FAILED',
        description: 'New phone entry rejected: Attempted to submit new phone before verifying current phone',
        ip: dto.ip,
        userAgent: dto.userAgent,
      });
      throw ApiError.forbidden('Verification of your current registered mobile number is required before entering a new phone number.');
    }

    const cleanNew = dto.newPhone.replace(/\D/g, '');
    if (cleanNew.length < 10) {
      throw ApiError.badRequest('Please enter a valid 10-digit mobile number.');
    }

    const canonicalNew = canonicalizePhone(cleanNew);
    const canonicalCurrent = canonicalizePhone(session.currentPhone);

    if (canonicalNew === canonicalCurrent) {
      throw ApiError.badRequest('New mobile number must be different from your current registered phone number.');
    }

    // Phone uniqueness check in MongoDB across all accounts
    const existingUser = await this.userRepository.findByPhone(cleanNew);
    if (existingUser && existingUser.id !== session.adminId) {
      await this.recordAuditLog({
        actorId: session.adminId,
        actorEmail: session.adminEmail,
        action: 'ADMIN_PHONE_CHANGE_FAILED',
        description: `New phone request rejected: Phone ${maskPhoneNumber(cleanNew)} is already registered to another account`,
        ip: dto.ip,
        userAgent: dto.userAgent,
      });
      throw ApiError.conflict('This mobile phone number is already registered to another account.');
    }

    // Resend cooldown check
    const now = Date.now();
    const timeSinceLastOtp = now - session.lastOtpSentAt;
    const cooldownMs = AdminPhoneChangeSessionStore.RESEND_COOLDOWN_SECONDS * 1000;
    if (timeSinceLastOtp < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - timeSinceLastOtp) / 1000);
      throw ApiError.tooManyRequests(`Please wait ${waitSeconds} seconds before requesting a new OTP code.`);
    }

    // Advance session
    session.newPhone = cleanNew;
    session.state = 'NEW_PHONE_OTP_PENDING';
    session.lastOtpSentAt = now;
    session.failedAttempts = 0; // fresh attempts for new phone OTP
    await this.sessionStore.updateSession(session);

    await this.recordAuditLog({
      actorId: session.adminId,
      actorEmail: session.adminEmail,
      action: 'ADMIN_PHONE_CHANGE_NEW_REQUESTED',
      description: `New phone OTP requested for ${maskPhoneNumber(cleanNew)}`,
      after: { newPhone: maskPhoneNumber(cleanNew) },
      ip: dto.ip,
      userAgent: dto.userAgent,
    });

    return {
      success: true,
      step: 'VERIFY_NEW_PHONE',
      maskedNewPhone: maskPhoneNumber(cleanNew),
      cooldownSeconds: AdminPhoneChangeSessionStore.RESEND_COOLDOWN_SECONDS,
    };
  }

  /**
   * STAGE 4: VERIFY NEW PHONE OTP & ATOMICALLY COMMIT UPDATE
   * Validates OTP for new phone, checks replay, updates database only after both OTPs succeeded,
   * unlinks old phone, releases lock, destroys session, and records audit log.
   */
  public async verifyNewPhone(dto: {
    actor: { id: string; email?: string | null };
    sessionId: string;
    verificationToken: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{
    success: boolean;
    message: string;
    phone: string;
    accessToken?: string;
    refreshToken?: string;
  }> {
    this.assertPrimaryAdmin(dto.actor);

    if (!dto.sessionId || !dto.sessionId.trim()) {
      throw ApiError.badRequest('Session ID is required.');
    }

    if (!dto.verificationToken || !dto.verificationToken.trim()) {
      throw ApiError.badRequest('Verification code is required.');
    }

    const session = await this.sessionStore.getSession(dto.sessionId);
    if (!session || session.adminId !== dto.actor.id) {
      throw ApiError.badRequest('Phone change session has expired or is invalid. Please start again.');
    }

    // Requirements 4 & 7: Update database ONLY after BOTH OTP verifications succeed!
    if (!session.currentPhoneVerified) {
      await this.sessionStore.destroySession(session.sessionId, session.adminId);
      throw ApiError.forbidden('Existing phone number verification was not satisfied. Database update aborted.');
    }

    if (!session.newPhone || session.state !== 'NEW_PHONE_OTP_PENDING') {
      throw ApiError.badRequest('New phone verification is not currently pending for this session.');
    }

    // Replay attack prevention
    const tokenNotReplayed = await this.sessionStore.consumeToken(dto.verificationToken);
    if (!tokenNotReplayed) {
      await this.recordAuditLog({
        actorId: session.adminId,
        actorEmail: session.adminEmail,
        action: 'ADMIN_PHONE_CHANGE_FAILED',
        description: 'New phone OTP verification rejected: Replay attack detected on verification token',
        ip: dto.ip,
        userAgent: dto.userAgent,
      });
      throw ApiError.badRequest('This verification code has already been consumed. Please request a fresh OTP.');
    }

    // Attempt limit check
    if (session.failedAttempts >= AdminPhoneChangeSessionStore.MAX_FAILED_ATTEMPTS) {
      await this.sessionStore.destroySession(session.sessionId, session.adminId);
      await this.recordAuditLog({
        actorId: session.adminId,
        actorEmail: session.adminEmail,
        action: 'ADMIN_PHONE_CHANGE_FAILED',
        description: 'Session terminated: Maximum OTP verification attempts exceeded on new phone',
        ip: dto.ip,
        userAgent: dto.userAgent,
      });
      throw ApiError.badRequest('Too many failed verification attempts. This session has been terminated for security.');
    }

    // Verify OTP with MSG91 against the new phone
    try {
      await msg91OtpService.verifyToken(dto.verificationToken, session.newPhone);
    } catch (err: any) {
      session.failedAttempts += 1;
      await this.sessionStore.updateSession(session);

      await this.recordAuditLog({
        actorId: session.adminId,
        actorEmail: session.adminEmail,
        action: 'ADMIN_PHONE_CHANGE_FAILED',
        description: `New phone OTP verification failed (Attempt ${session.failedAttempts}/${AdminPhoneChangeSessionStore.MAX_FAILED_ATTEMPTS}): ${err.message}`,
        ip: dto.ip,
        userAgent: dto.userAgent,
      });

      throw ApiError.badRequest(err.message || 'Invalid or expired OTP for new mobile number.');
    }

    // Final database uniqueness check to prevent concurrent race conditions
    const duplicateCheck = await this.userRepository.findByPhone(session.newPhone);
    if (duplicateCheck && duplicateCheck.id !== session.adminId) {
      await this.sessionStore.destroySession(session.sessionId, session.adminId);
      throw ApiError.conflict('This mobile phone number is already registered to another account.');
    }

    const adminUser = await this.userRepository.findById(session.adminId);
    if (!adminUser) {
      await this.sessionStore.destroySession(session.sessionId, session.adminId);
      throw ApiError.notFound('Administrator account not found in database.');
    }

    const oldPhone = adminUser.phone;
    const newPhone = session.newPhone;

    // ATOMIC DATABASE UPDATE & SESSION REVOCATION
    // 1. Invalidate all previous/stolen administrator sessions across other devices
    adminUser.incrementTokenVersion();

    // 2. Update phone attribute and mark verified
    adminUser.updateProfile({
      phone: newPhone,
      isPhoneVerified: true,
    });

    const updatedUser = await this.userRepository.update(adminUser.id, adminUser);
    if (!updatedUser) {
      throw ApiError.internal('Failed to persist updated administrator phone number to database.');
    }

    // 3. Resolve role name for new session credentials
    let roleName = 'Admin';
    if (this.roleRepository && adminUser.roleId) {
      try {
        const r = await this.roleRepository.findById(adminUser.roleId);
        if (r) roleName = r.name;
      } catch {}
    }

    // 4. Issue fresh JWT credentials with new tokenVersion so current administrator session remains active
    const accessToken = signAccessToken({
      sub: adminUser.id,
      email: adminUser.email,
      role: roleName,
      tokenVersion: adminUser.tokenVersion,
    });
    const refreshToken = signRefreshToken({
      sub: adminUser.id,
      tokenVersion: adminUser.tokenVersion,
    });

    // 5. Terminate session and release concurrency lock
    await this.sessionStore.destroySession(session.sessionId, session.adminId);

    // Record audit log
    await this.recordAuditLog({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: 'ADMIN_PHONE_CHANGE_COMPLETED',
      description: `Administrator registered mobile number successfully updated from ${maskPhoneNumber(oldPhone)} to ${maskPhoneNumber(newPhone)}. Old number completely unlinked and all previous device sessions revoked.`,
      before: { phone: maskPhoneNumber(oldPhone) },
      after: { phone: maskPhoneNumber(newPhone) },
      ip: dto.ip,
      userAgent: dto.userAgent,
    });

    return {
      success: true,
      message: 'Administrator mobile number successfully updated and verified.',
      phone: newPhone,
      accessToken,
      refreshToken,
    };
  }

  /**
   * CANCEL ACTIVE SESSION
   * Explicitly cancels the active session and releases the concurrency lock.
   */
  public async cancel(dto: {
    actor: { id: string; email?: string | null };
    sessionId: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{ success: boolean; message: string }> {
    this.assertPrimaryAdmin(dto.actor);

    const session = await this.sessionStore.getSession(dto.sessionId);
    if (session && session.adminId === dto.actor.id) {
      await this.sessionStore.destroySession(session.sessionId, session.adminId);

      await this.recordAuditLog({
        actorId: session.adminId,
        actorEmail: session.adminEmail,
        action: 'ADMIN_PHONE_CHANGE_CANCELLED',
        description: 'Administrator phone change session cancelled by user',
        ip: dto.ip,
        userAgent: dto.userAgent,
      });
    }

    return {
      success: true,
      message: 'Phone change session cancelled.',
    };
  }

  /**
   * RECOVERY PROTOCOL INFORMATION
   * Returns guidance when the existing registered phone is lost or unavailable.
   * Confirms that automated bypass is prohibited.
   */
  public getRecoveryInfo(): {
    allowed: boolean;
    policy: string;
    steps: string[];
  } {
    return {
      allowed: false,
      policy: 'Automated bypass of existing-number verification is strictly prohibited to prevent account takeover.',
      steps: [
        'If you no longer have access to your registered mobile phone, offline multi-factor recovery is required.',
        '1. Access the production server console directly with root SSH authorization.',
        '2. Verify administrative physical identity and authorization keys.',
        '3. Execute the dedicated offline administrator phone transfer script located at server/scripts/migrate-admin-phone.ts.',
        '4. All offline recovery actions are permanently recorded in system audit logs.',
      ],
    };
  }
}
