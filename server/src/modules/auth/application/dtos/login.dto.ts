/**
 * @file login.dto.ts
 * @layer Application › DTOs
 *
 * Data Transfer Objects for the Login Use Case.
 */

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  user: {
    id: string;
    fullName: string;
    email: string;
    roleId: string;
  };
  accessToken: string;
  refreshToken: string;
}
