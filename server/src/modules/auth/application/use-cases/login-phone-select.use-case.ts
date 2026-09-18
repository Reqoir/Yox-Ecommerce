/**
 * @file login-phone-select.use-case.ts
 * @layer Application › Use Cases
 * 
 * Finalizes authentication when a user selects their specific account
 * from multiple accounts associated with the same verified phone number.
 */

import { ApiError } from '@shared/utils/api-error.util';
import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../../roles/domain/repositories/role.repository.interface';
import { LoginPhoneSelectRequestDTO, SingleAccountLoginResponseDTO } from '../dtos/login-phone.dto';
import { verifyAccessToken, signAccessToken, signRefreshToken } from '@shared/utils/jwt.helper';

export class LoginPhoneSelectUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository
  ) {}

  public async execute(data: LoginPhoneSelectRequestDTO): Promise<SingleAccountLoginResponseDTO> {
    if (!data.selectionToken || !data.userId) {
      throw ApiError.badRequest('Selection token and account ID are required');
    }

    // 1. Verify selection token
    let payload: any;
    try {
      payload = verifyAccessToken(data.selectionToken);
    } catch {
      throw ApiError.unauthorized('Account selection session has expired. Please verify your mobile number again.');
    }

    if (payload.purpose !== 'phone_account_selection' || !Array.isArray(payload.candidateIds)) {
      throw ApiError.unauthorized('Invalid selection session. Please try again.');
    }

    // 2. Validate that the selected userId was part of the verified candidates
    if (!payload.candidateIds.includes(data.userId)) {
      throw ApiError.forbidden('Selected account does not match this verified mobile session');
    }

    // 3. Find the selected user
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throw ApiError.notFound('Selected account was not found');
    }

    if (!user.canLogin()) {
      throw ApiError.unauthorized('This account has been deactivated or suspended. Please contact support.');
    }

    // 4. Generate real authentication tokens
    const tokenPayload = {
      sub: user.id,
      email: user.email || '',
      role: user.roleId,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // 5. Fetch Role permissions
    const role = await this.roleRepository.findById(user.roleId);
    const permissions = role ? role.permissions : [];
    const roleName = role ? role.name.toUpperCase() : 'CUSTOMER';

    return {
      multipleAccounts: false,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email && !user.email.endsWith('@user.yox.internal') ? user.email : null,
        phone: user.phone ?? undefined,
        roleId: user.roleId,
        role: roleName,
        permissions,
      },
      accessToken,
      refreshToken,
    };
  }
}
