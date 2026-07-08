/**
 * @file http-status.constants.ts
 * @layer Shared › Constants
 *
 * HTTP status codes used across the application.
 * Using an enum prevents magic numbers and makes intent clear.
 */

export enum HttpStatus {
  // ── 2xx Success ──────────────────────────────────────────────────────────
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // ── 3xx Redirection ───────────────────────────────────────────────────────
  NOT_MODIFIED = 304,

  // ── 4xx Client Errors ────────────────────────────────────────────────────
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  GONE = 410,
  PAYLOAD_TOO_LARGE = 413,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // ── 5xx Server Errors ────────────────────────────────────────────────────
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}
