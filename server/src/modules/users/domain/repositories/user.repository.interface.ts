/**
 * @file user.repository.interface.ts
 * @layer Domain
 * 
 * Defines the contract for User data access.
 * The implementation will be provided by the Infrastructure layer.
 */

import { IBaseRepository } from '@core/domain/repositories/base.repository.interface';
import { User } from '../entities/user.entity';

export interface IUserRepository extends IBaseRepository<User> {
  /**
   * Finds a user by their email address.
   * @param email The email to search for
   * @returns The User entity if found, null otherwise
   */
  findByEmail(email: string): Promise<User | null>;
  
  /**
   * Check if an email exists without loading the full entity
   * @param email The email to check
   * @returns boolean true if exists
   */
  existsByEmail(email: string): Promise<boolean>;
}
