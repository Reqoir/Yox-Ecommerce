# Architecture

## Overview

YOX Ecommerce uses **Clean Architecture** on the backend and **Next.js App Router** on the frontend.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js)                      │
│   Pages → Components → TanStack Query → Axios → API         │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP/REST
┌──────────────────────────────▼──────────────────────────────┐
│                       SERVER (Express)                       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Presentation Layer (outermost)                       │    │
│  │  HTTP Controllers ─ Routes ─ Validators (Zod)        │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐    │
│  │ Application Layer                                    │    │
│  │  Use Cases (Interactors) ─ DTOs                      │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐    │
│  │ Domain Layer (innermost)                             │    │
│  │  Entities ─ Value Objects ─ Repository Interfaces    │    │
│  │  Domain Errors                                       │    │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Infrastructure Layer (implements Domain interfaces)  │    │
│  │  Mongoose Repos ─ Redis ─ Cloudinary ─ JWT           │    │
│  └──────────────────────┬──────────────────────────────┘    │
└─────────────────────────┼────────────────────────────────────┘
                          │
    ┌─────────────────────┴────────────────────┐
    │         MongoDB          Redis            │
    └──────────────────────────────────────────┘
```

---

## Dependency Rule

> Source code dependencies must point **inward only**.

```
Presentation → Application → Domain ← Infrastructure
```

- **Domain** knows nothing about outer layers.
- **Application** knows only Domain.
- **Infrastructure** implements Domain interfaces.
- **Presentation** calls Application use cases.

---

## Module Structure

Each feature module mirrors the same 4-layer structure:

```
modules/<name>/
  domain/
    entities/         ← Domain entity class
    repositories/     ← Repository interface (PORT)
    errors/           ← Module-specific domain errors
    value-objects/    ← Value objects
  application/
    use-cases/        ← Use case classes (IUseCase<TIn, TOut>)
    dtos/             ← Request/response DTO interfaces
  infrastructure/
    repositories/     ← Mongoose repository (ADAPTER)
  presentation/
    controllers/      ← Express request handlers
    routes/           ← Express Router
    validators/       ← Zod schemas for request validation
  index.ts            ← Module barrel (exports router)
```

---

## Shared

Cross-cutting concerns live in `src/shared/`:
- `logger/` — Pino logger singleton
- `utils/` — ApiResponse, ApiError, pagination, JWT, bcrypt, date, Zod helpers
- `constants/` — HTTP status codes, app constants
- `types/` — Common TypeScript types, Express augmentation

---

## Environment Flow

```
.env → env.ts (Zod validation) → Config files → Services
```

All environment access goes through `env.ts`. Never use `process.env` directly outside of `env.ts`.

---

## Key Decisions

| Decision | Rationale |
|---|---|
| Clean Architecture | Clear separation of concerns; framework-agnostic domain |
| Modular monolith | Easier to maintain for a 4-person team vs microservices |
| Mongoose | Familiar ODM, good TypeScript support |
| ioredis | Full-featured Redis client with TypeScript support |
| Pino | Fastest Node.js logger; structured JSON for production |
| Zod | Runtime type validation colocated with TypeScript types |
| TanStack Query | Server state management with caching and deduplication |
| Zustand | Lightweight client state (only UI state) |
