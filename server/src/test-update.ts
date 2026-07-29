import 'dotenv/config';
import { connect, disconnect } from 'mongoose';
import { UserRepository } from './modules/users/infrastructure/repositories/user.repository';
import { UpdateUserStatusUseCase } from './modules/users/application/use-cases/update-user-status.use-case';
import { UserStatus } from './modules/users/domain/entities/user.entity';

async function test() {
  const MONGODB_URI = 'mongodb+srv://reqoirtechnologies_db_user:MIrSCnUbuIjkx4yJ@cluster0.eml8ivi.mongodb.net/?appName=Cluster0';
  await connect(MONGODB_URI);

  const userRepository = new UserRepository();
  const useCase = new UpdateUserStatusUseCase(userRepository);

  try {
    const users = await userRepository.findAll({ limit: 1 });
    const user = users.data[0];
    if (!user) {
      console.log('No user found');
      return;
    }
    console.log('user.toJSON() ->', user.toJSON());
    console.log('Found user:', user.id);
    const result = await useCase.execute({ userId: user.id, status: UserStatus.INACTIVE });
    console.log('Update success:', result);
  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    await disconnect();
  }
}

test();
