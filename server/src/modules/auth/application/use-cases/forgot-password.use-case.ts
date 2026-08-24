import { IUserRepository } from '../../../users/domain/repositories/user.repository.interface';
import { signResetToken } from '@shared/utils/jwt.helper';

export class ForgotPasswordUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email.toLowerCase().trim());
    
    // We always return the same message to avoid user enumeration attacks
    const successMessage = 'If that email address is in our database, we will send you an email to reset your password.';

    if (!user) {
      return { message: successMessage };
    }

    if (!user.canLogin()) {
      return { message: successMessage };
    }

    const resetToken = signResetToken({ sub: user.id });

    // In a real application, you would send an email here using an email service
    // e.g., await emailService.sendPasswordReset(user.email, resetToken);
    
    // For now, we'll log it in development to simulate the email sending
    console.log(`[DEV] Password reset link for ${user.email}: ${process.env.CLIENT_URL}/reset-password?token=${resetToken}`);

    return { message: successMessage };
  }
}
