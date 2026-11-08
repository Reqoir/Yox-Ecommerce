import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import { ApiError } from '@shared/utils/api-error.util';
import { AuditLogService } from '../../../audit-logs/application/services/audit-log.service';
import { AuditAction } from '../../../audit-logs/domain/entities/audit-log.entity';

export interface UpdateStaffDTO {
  userId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  actor: {
    id: string;
    email: string;
    role?: string;
    permissions?: string[];
  };
}

export class UpdateStaffUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository
  ) {}

  public async execute(dto: UpdateStaffDTO) {
    const targetUser = await this.userRepository.findById(dto.userId);
    if (!targetUser) {
      throw ApiError.notFound('Staff member not found');
    }

    // 1. Absolute immunity for the Store Owner: cannot be edited from staff management
    if (targetUser.email && targetUser.email.toLowerCase() === 'admin@yox.com') {
      throw ApiError.forbidden(
        'The primary Store Owner account credentials cannot be modified from the staff management console. Please update your account via My Account settings.'
      );
    }

    // 2. Identify if actor is the Super Admin (Store Owner)
    const actorEmail = (dto.actor.email || '').toLowerCase();
    const actorRole = (dto.actor.role || '').toUpperCase();
    const actorPermissions = dto.actor.permissions || [];
    const isActorSuperAdmin =
      actorEmail === 'admin@yox.com' ||
      actorRole === 'SUPER_ADMIN' ||
      actorPermissions.includes('*');

    const cleanFullName = dto.fullName !== undefined ? dto.fullName.trim() : undefined;
    const cleanEmail = dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined;
    const cleanPhone = dto.phone !== undefined ? dto.phone.replace(/\D/g, '') : undefined;

    // 3. Strict Credential Protection:
    // If work email or contact phone is being changed, only the Super Admin is authorized!
    const isEmailChanging =
      cleanEmail !== undefined && cleanEmail !== (targetUser.email?.toLowerCase() || '');
    const isPhoneChanging =
      cleanPhone !== undefined && cleanPhone !== (targetUser.phone?.replace(/\D/g, '') || '');

    if ((isEmailChanging || isPhoneChanging) && !isActorSuperAdmin) {
      throw ApiError.forbidden(
        'Only the Store Owner (Super Admin) has authorization to change staff official work email or contact phone number.'
      );
    }

    // 4. Duplicate checks for email
    if (isEmailChanging && cleanEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        throw ApiError.badRequest('Invalid work email address format');
      }
      const existingUser = await this.userRepository.findByEmail(cleanEmail);
      if (existingUser && existingUser.id !== targetUser.id) {
        throw ApiError.conflict(`A user with work email "${cleanEmail}" already exists.`);
      }
    }

    // 5. Duplicate checks for phone
    if (isPhoneChanging && cleanPhone) {
      if (cleanPhone.length !== 10) {
        throw ApiError.badRequest('Contact phone number must be exactly 10 digits');
      }
      const existingWithPhone = await this.userRepository.findByPhone(cleanPhone);
      if (existingWithPhone && existingWithPhone.id !== targetUser.id) {
        throw ApiError.conflict(`A user with contact phone "${cleanPhone}" already exists.`);
      }
    }

    // 6. Role check if role is changing
    if (dto.roleId && dto.roleId !== targetUser.roleId) {
      const newRole = await this.roleRepository.findById(dto.roleId);
      if (!newRole) {
        throw ApiError.notFound('Selected role not found');
      }
      // Non-super-admins cannot assign wildcard or super admin role
      if (!isActorSuperAdmin && (newRole.permissions.includes('*') || newRole.name.toUpperCase().includes('ADMIN'))) {
        throw ApiError.forbidden('Only the Store Owner can assign administrative roles.');
      }
      targetUser.updateRole(dto.roleId);
    }

    // 7. Update profile properties
    targetUser.updateProfile({
      fullName: cleanFullName !== undefined ? cleanFullName : targetUser.fullName,
      email: cleanEmail !== undefined ? cleanEmail : targetUser.email,
      phone: cleanPhone !== undefined ? cleanPhone : targetUser.phone,
      isEmailVerified: cleanEmail ? true : targetUser.isEmailVerified,
      isPhoneVerified: cleanPhone ? true : targetUser.isPhoneVerified,
    });

    const updated = await this.userRepository.update(targetUser.id, targetUser);
    if (!updated) {
      throw ApiError.internal('Failed to update staff member');
    }

    // 8. Record audit log
    try {
      await AuditLogService.getInstance()?.record({
        actorId: dto.actor.id,
        actorRole: isActorSuperAdmin ? 'ADMIN' : 'STAFF',
        actorEmail: dto.actor.email,
        action: AuditAction.USER_UPDATED,
        resourceType: 'STAFF',
        resourceId: targetUser.id,
        description: `Updated staff member ${targetUser.fullName} (${targetUser.email})`,
        after: {
          fullName: targetUser.fullName,
          email: targetUser.email,
          phone: targetUser.phone,
          roleId: targetUser.roleId,
          emailChanged: isEmailChanging,
          phoneChanged: isPhoneChanging,
        },
      });
    } catch (auditErr: any) {
      console.warn('Audit log recording failed:', auditErr.message);
    }

    const result = updated.toJSON();
    delete (result as any).password;
    return result;
  }
}

