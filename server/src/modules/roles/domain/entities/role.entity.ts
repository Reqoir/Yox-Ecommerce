/**
 * @file role.entity.ts
 * @layer Domain
 * 
 * Defines the Role entity for dynamic RBAC.
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export interface RoleProps extends EntityProps {
  name: string;
  description?: string | null;
  permissions: string[];
  isSystem: boolean; // System roles cannot be deleted
}

export class Role extends BaseEntity<RoleProps> {
  private constructor(props: RoleProps) {
    super(props);
  }

  get name(): string { return this._props.name; }
  get description(): string | null | undefined { return this._props.description; }
  get permissions(): string[] { return this._props.permissions; }
  get isSystem(): boolean { return this._props.isSystem; }

  /**
   * Factory method to create a new custom role
   */
  public static create(props: Pick<RoleProps, 'name' | 'description' | 'permissions'>): Role {
    return new Role({
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: props.name.toUpperCase().trim(),
      description: props.description || null,
      permissions: props.permissions || [],
      isSystem: false,
    });
  }

  /**
   * Factory method to reconstitute a role from DB
   */
  public static reconstitute(props: RoleProps): Role {
    return new Role(props);
  }

  /**
   * Add a permission to the role
   */
  public addPermission(permission: string): void {
    if (!this._props.permissions.includes(permission)) {
      this._props.permissions.push(permission);
      this._props.updatedAt = new Date();
    }
  }

  /**
   * Remove a permission
   */
  public removePermission(permission: string): void {
    this._props.permissions = this._props.permissions.filter(p => p !== permission);
    this._props.updatedAt = new Date();
  }

  /**
   * Check if role has a permission
   */
  public hasPermission(permission: string): boolean {
    return this._props.permissions.includes(permission);
  }
}
