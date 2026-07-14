/**
 * @file role.repository.interface.ts
 * @layer Domain
 */

import { IBaseRepository } from '@core/domain/repositories/base.repository.interface';
import { Role } from '../entities/role.entity';

export interface IRoleRepository extends IBaseRepository<Role> {
  findByName(name: string): Promise<Role | null>;
}
