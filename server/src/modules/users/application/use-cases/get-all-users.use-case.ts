import { IUserRepository } from '../../domain/repositories/user.repository.interface';

export class GetAllUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(query: any = {}) {
    const result = await this.userRepository.findAll(query);
    
    // Omit sensitive data
    const safeUsers = result.data.map(user => {
      const userJson = user.toJSON();
      delete (userJson as any).password;
      return userJson;
    });

    return {
      users: safeUsers,
      meta: result.meta
    };
  }
}
