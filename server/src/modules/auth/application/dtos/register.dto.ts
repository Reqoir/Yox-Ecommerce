/**
 * @file register.dto.ts
 * @layer Application › DTOs
 * 
 * Data Transfer Objects for the Register Use Case.
 */

export interface RegisterUserRequestDTO {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface RegisterUserResponseDTO {
  user: {
    id: string;
    fullName: string;
    email: string;
    roleId: string;
    permissions: string[];
    phone?: string;
    status: string;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}
