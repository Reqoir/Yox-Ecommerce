# Database

## Overview

YOX Ecommerce uses two databases:
- **MongoDB** — primary data store (Mongoose ODM)
- **Redis** — caching, sessions, rate limiting, job queues

---

## MongoDB

### Connection
Managed by `src/core/infrastructure/database/mongoose/connection.ts`.
URI configured in `MONGODB_URI` env var.

### Schema Guidelines

All schemas must:
1. Use `baseSchemaOptions` from `src/core/infrastructure/database/mongoose/base.schema.ts`
2. Have the `timestamps: true` option enabled
3. Transform `_id → id` in `toJSON` / `toObject`

```typescript
// Example
import { Schema, model } from 'mongoose';
import { baseSchemaOptions } from '@core/infrastructure/database/mongoose/base.schema';

const userSchema = new Schema({ ... }, baseSchemaOptions);
export const UserModel = model('User', userSchema);
```

### Collections

<!-- To be filled as modules are implemented -->

| Collection | Module | Description |
|---|---|---|
| `users` | users | App users |
| `products` | products | Product catalogue |
| `orders` | orders | Customer orders |
| `payments` | payments | Payment records |
| `inventories` | inventory | Stock tracking |

### Indexing Strategy

- Always index fields used in `find()` queries
- Use compound indexes for multi-field queries
- Use text indexes for search fields
- Document all indexes in the schema file with a comment

---

## Redis

### Connection
Managed by `src/core/infrastructure/database/redis/connection.ts`.
Use `redisService` from `src/core/infrastructure/services/redis.service.ts`.

### Key Naming Convention

```
{scope}:{entityType}:{identifier}
```

Examples:
- `session:user:abc123`
- `cache:product:xyz789`
- `blacklist:token:tokenHash`
- `ratelimit:ip:192.168.1.1`

All Redis key patterns are defined in `src/shared/constants/app.constants.ts`.

### TTL Strategy

| Use Case | TTL |
|---|---|
| Access token blacklist | Same as token expiry |
| Session cache | 7 days |
| Product cache | 5 minutes |
| Rate limit window | Configured via env |

---

## Migrations

<!-- Migration strategy TBD — document here when tooling is chosen -->
