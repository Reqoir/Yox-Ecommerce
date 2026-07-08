# API Documentation

## Overview

Base URL: `http://localhost:5000/api/v1`

All endpoints return JSON in the following shape:

### Success Response
```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "meta": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity (validation failed) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Pagination

All list endpoints support:

| Query Param | Default | Description |
|---|---|---|
| `page` | 1 | Page number |
| `limit` | 10 | Items per page (max 100) |
| `sort` | `createdAt` | Sort field |
| `order` | `desc` | `asc` or `desc` |
| `search` | — | Full-text search |

Paginated responses include a `meta` object:
```json
{
  "currentPage": 1,
  "totalPages": 10,
  "totalItems": 100,
  "itemsPerPage": 10,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

---

## Available Endpoints

### Health Check
```
GET /api/v1/health
```
Returns service status and dependency health.

---

<!-- Module endpoints will be documented here as modules are implemented -->

### Auth
`[Not yet implemented]`

### Users
`[Not yet implemented]`

### Products
`[Not yet implemented]`

### Orders
`[Not yet implemented]`

### Payments
`[Not yet implemented]`

---

## Versioning

API version is set via the `API_VERSION` env var (default: `v1`).
When breaking changes are introduced, a new version (`v2`) will be added.

## Rate Limiting

Default: 100 requests per 15 minutes per IP.
Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` env vars.
