/**
 * @file login-phone.dto.ts
 * @layer Application › DTOs
 * 
 * Data Transfer Objects for Phone + OTP Login & Account Selection.
 */

export interface LoginPhoneRequestDTO {
  phone: string;
  verificationToken: string;
}

export interface CandidateAccountDTO {
  id: string;
  fullName: string;
  email: string | null;
  maskedEmail: string;
  createdAt?: Date;
}

export interface SingleAccountLoginResponseDTO {
  multipleAccounts: false;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phone?: string;
    roleId: string;
    role: string;
    permissions: string[];
  };
  accessToken: string;
  refreshToken: string;
}

export interface MultipleAccountsPromptResponseDTO {
  multipleAccounts: true;
  selectionToken: string;
  accounts: CandidateAccountDTO[];
}

export type LoginPhoneResponseDTO = SingleAccountLoginResponseDTO | MultipleAccountsPromptResponseDTO;

export interface LoginPhoneSelectRequestDTO {
  selectionToken: string;
  userId: string;
}
