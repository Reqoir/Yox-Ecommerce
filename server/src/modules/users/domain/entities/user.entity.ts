/**
 * @file user.entity.ts
 * @layer Domain
 * 
 * Defines the core User business entity and its rules.
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';
import { hashPassword } from '@shared/utils/password.helper';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface UserProps extends EntityProps {
  fullName: string;
  email: string;
  phone?: string | null;
  password: string;
  profileImage?: string | null;
  roleId: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  status: UserStatus;
  lastLogin?: Date | null;
  deletedAt?: Date | null;
}

export class User extends BaseEntity<UserProps> {
  private constructor(props: UserProps) {
    super(props);
  }

  // Getters for properties that other layers might need to read
  get fullName(): string { return this._props.fullName; }
  get email(): string { return this._props.email; }
  get password(): string { return this._props.password; }
  get roleId(): string { return this._props.roleId; }
  get status(): UserStatus { return this._props.status; }
  get isEmailVerified(): boolean { return this._props.isEmailVerified; }
  
  get phone(): string | null | undefined { return this._props.phone; }
  get profileImage(): string | null | undefined { return this._props.profileImage; }
  get isPhoneVerified(): boolean { return this._props.isPhoneVerified; }
  get lastLogin(): Date | null | undefined { return this._props.lastLogin; }
  get deletedAt(): Date | null | undefined { return this._props.deletedAt; }

  /**
   * Factory method to create a NEW user (from registration).
   * Enforces business rules (e.g. setting defaults).
   */
  public static async create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt' | 'isEmailVerified' | 'isPhoneVerified' | 'status'>): Promise<User> {
    // Hash password immediately upon creation
    const hashedPassword = await hashPassword(props.password);

    return new User({
      id: '', // Empty because it will be set by DB upon save
      createdAt: new Date(),
      updatedAt: new Date(),
      fullName: props.fullName,
      email: props.email.toLowerCase().trim(),
      password: hashedPassword,
      phone: props.phone || null,
      profileImage: props.profileImage || null,
      roleId: props.roleId,
      isEmailVerified: false,
      isPhoneVerified: false,
      status: UserStatus.ACTIVE,
      lastLogin: null,
      deletedAt: null,
    });
  }

  /**
   * Factory method to reconstitute an existing user FROM the database.
   * Does NOT re-hash the password.
   */
  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  /**
   * Checks if the user is allowed to log in.
   */
  public canLogin(): boolean {
    return this._props.status === UserStatus.ACTIVE && !this._props.deletedAt;
  }

  /**
   * Updates user profile fields safely.
   */
  public updateProfile(data: { fullName?: string; phone?: string; profileImage?: string }): void {
    if (data.fullName) this._props.fullName = data.fullName;
    if (data.phone !== undefined) this._props.phone = data.phone;
    if (data.profileImage !== undefined) this._props.profileImage = data.profileImage;
    
    this._props.updatedAt = new Date();
  }

  /**
   * Updates user role safely.
   */
  public updateRole(roleId: string): void {
    this._props.roleId = roleId;
    this._props.updatedAt = new Date();
  }

  /**
   * Updates user status safely (e.g. banning or suspending a user).
   */
  public updateStatus(status: UserStatus): void {
    this._props.status = status;
    this._props.updatedAt = new Date();
  }

  /**
   * Updates the user's password.
   * Note: The password MUST be pre-hashed before calling this.
   */
  public updatePassword(hashedPassword: string): void {
    this._props.password = hashedPassword;
    this._props.updatedAt = new Date();
  }

  /**
   * Soft deletes / deactivates the user account.
   */
  public deactivate(): void {
    this._props.status = UserStatus.INACTIVE;
    this._props.deletedAt = new Date();
    this._props.updatedAt = new Date();
  }
}
