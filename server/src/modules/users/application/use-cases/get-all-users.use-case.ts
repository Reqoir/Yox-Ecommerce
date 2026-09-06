import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { RoleModel } from '../../../roles/infrastructure/models/role.model';

export class GetAllUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(query: any = {}) {
    const enrichedQuery = { ...query };

    // Support userType filtering: 'customer' vs 'staff'
    if (enrichedQuery.userType) {
      const customerRole = await RoleModel.findOne({ name: 'CUSTOMER' }).lean();
      const customerId = customerRole?._id?.toString();

      if (enrichedQuery.userType === 'customer') {
        enrichedQuery.customerRoleIds = [customerId, 'CUSTOMER_ROLE_ID', null, ''];
      } else if (enrichedQuery.userType === 'staff') {
        enrichedQuery.excludeRoleIds = [customerId, 'CUSTOMER_ROLE_ID', null, ''];
      }
    }

    const result = await this.userRepository.findAll(enrichedQuery);
    const roles = await RoleModel.find({}).lean();
    const roleMap = new Map(roles.map((r) => [r._id.toString(), r.name]));

    // Omit sensitive data and inject roleName
    const safeUsers = result.data.map((user) => {
      const userJson = user.toJSON();
      delete (userJson as any).password;
      (userJson as any).roleName =
        roleMap.get(user.roleId) ||
        (user.roleId === 'CUSTOMER_ROLE_ID' || !user.roleId ? 'CUSTOMER' : 'Customer');
      return userJson;
    });

    return {
      users: safeUsers,
      meta: result.meta,
    };
  }
}
