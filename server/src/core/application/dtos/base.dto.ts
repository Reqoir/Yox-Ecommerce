/**
 * @file base.dto.ts
 * @layer Application
 *
 * Base Data Transfer Object interfaces.
 * DTOs carry data between layers without exposing domain internals.
 *
 * Rules:
 * - DTOs are plain data structures — no methods, no business logic.
 * - They should be validated at the Presentation layer boundary (Zod schemas).
 */

/**
 * Marker interface for all DTOs.
 * Use this as a base for all request/response DTO interfaces.
 */
export interface IBaseDTO {}

/**
 * Base interface for response DTOs that include entity metadata.
 */
export interface IBaseResponseDTO extends IBaseDTO {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Base interface for command DTOs (create/update requests).
 */
export interface IBaseCommandDTO extends IBaseDTO {}
