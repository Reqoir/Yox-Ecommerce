# Coding Standards

> All contributors must follow these standards. Enforced by ESLint + Prettier + Husky.

---

## General

- Write **TypeScript** everywhere — no `any` types unless unavoidable (add `// eslint-disable-line` with a comment)
- Use **functional style** for utilities; classes for services and repositories
- Keep functions small — single responsibility
- No `console.log` in committed code — use the Pino logger
- All async functions must handle errors (try/catch or propagate to the error handler)

---

## Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `user.entity.ts` |
| Classes | `PascalCase` | `UserRepository` |
| Interfaces | `IPascalCase` | `IUserRepository` |
| Types | `TPascalCase` | `TUserDTO` |
| Enums | `PascalCase` | `UserRole` |
| Functions | `camelCase` | `getUserById()` |
| Variables | `camelCase` | `totalCount` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_PAGE_LIMIT` |
| React components | `PascalCase` | `UserCard.tsx` |

---

## File Structure

- One class per file
- Barrel exports via `index.ts` at the module level
- Group imports: built-ins → external → internal → relative (enforced by ESLint `import/order`)

---

## Backend (Server)

- **Never** import from outer layers into inner layers (Domain → Application → Infrastructure → Presentation)
- **Never** use `process.env` directly — always go through `env.ts`
- All HTTP responses must use `ApiResponse.success()` or `ApiResponse.error()`
- All errors thrown in use cases / domain must be caught by the global `errorHandler` middleware
- Use `zod` schemas to validate all incoming HTTP data at the presentation boundary
- Repository methods return domain entities, NOT Mongoose documents

---

## Frontend (Client)

- Use **Server Components** by default; add `'use client'` only when needed
- API calls go through the centralised Axios instance in `src/lib/axios.ts`
- Server state managed by **TanStack Query** — no ad-hoc fetch in components
- Client (UI) state managed by **Zustand**
- Never store sensitive data in Zustand / localStorage

---

## Git

- Branch naming: `feat/<ticket>-short-description`, `fix/<ticket>-short-description`
- Commit messages follow **Conventional Commits** (enforced by commitlint)
- Open a PR for every change — no direct commits to `main`
- PR must be reviewed by at least 1 other team member
- Squash merge into `main`

---

## Testing (To Be Configured)

- Unit tests for use cases and domain logic
- Integration tests for repositories
- E2E tests for critical flows
- Target: ≥80% coverage on business logic

---

## Documentation

- Every public function / method must have a JSDoc comment
- Every new file must have a `@file` and `@layer` tag at the top
- Update `BUSINESS_RULES.md` when implementing domain logic
