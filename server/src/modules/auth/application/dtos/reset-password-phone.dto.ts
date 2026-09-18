/**
 * @file reset-password-phone.dto.ts
 * @layer Application › DTOs
 * 
 * DTOs for resetting password using mobile number & MSG91 OTP.
 * Supports multi-account selection so only the chosen account's password is changed.
 */

export interface ResetPasswordPhoneVerifyRequestDTO {
  phone: string;
  verificationToken: string;
}

export interface CandidateAccountInfo {
  id: string;
  fullName: string;
  email: string | null;
  maskedEmail: string;
  createdAt?: Date;
}

export interface ResetPasswordPhoneVerifyResponseDTO {
  multipleAccounts: boolean;
  resetToken: string;
  accounts?: CandidateAccountInfo[];
  user?: CandidateAccountInfo;
}

export interface ResetPasswordPhoneConfirmRequestDTO {
  resetToken: string;
  userId: string;
  newPassword: string;
}

export interface ResetPasswordPhoneResponseDTO {
  message: string;
}
