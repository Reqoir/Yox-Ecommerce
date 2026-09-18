/**
 * @file update-profile.dto.ts
 * @layer Application › DTOs
 */

export interface UpdateProfileRequestDTO {
  fullName?: string;
  email?: string;
  phone?: string;
  verificationToken?: string;
  profileImage?: string;
}
