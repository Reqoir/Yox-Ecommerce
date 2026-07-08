# AI Development Rules

> Rules for using AI assistants (Copilot, Claude, Gemini, etc.) in this codebase.

---

## Core Principle

AI is a tool, not a decision-maker. Every AI-generated change must be reviewed and understood by the developer who commits it.

---

## What AI CAN Do

- Scaffold boilerplate (following the existing patterns in this repo)
- Write unit tests for existing logic
- Suggest refactors within an existing file
- Generate documentation / JSDoc comments
- Help debug errors with context provided

---

## What AI MUST NOT Do

- Generate authentication logic without explicit task approval
- Generate payment handling code without explicit task approval
- Add new environment variables without updating `.env.example`
- Introduce new npm packages without team discussion
- Bypass the Clean Architecture dependency rule
- Add `any` types without a comment explaining why
- Use `process.env` directly (must go through `env.ts`)

---

## Prompting Guidelines

When prompting an AI for this project, always include:

1. The **layer** you're working in (Domain / Application / Infrastructure / Presentation)
2. The **module** name (auth, users, products, etc.)
3. The **task** description (e.g., "Create the User entity in the Domain layer")
4. A reminder: "Follow the Clean Architecture dependency rule"

---

## Review Checklist for AI-Generated Code

- [ ] No `any` types introduced
- [ ] Dependency rule respected (no outer-layer imports in inner layers)
- [ ] All env access goes through `env.ts`
- [ ] Responses use `ApiResponse`
- [ ] Errors use `ApiError`, `DomainError`, or `ApplicationError` appropriately
- [ ] No business logic in Infrastructure or Presentation layers
- [ ] Tests included or planned
