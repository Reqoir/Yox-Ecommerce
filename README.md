# YOX Ecommerce

> A modern, scalable e-commerce platform built with Next.js and Express using Clean Architecture.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| **State** | TanStack Query, Zustand |
| **Backend** | Express.js, TypeScript, Clean Architecture |
| **Database** | MongoDB (Mongoose), Redis (ioredis) |
| **Auth** | JWT (access + refresh tokens) |
| **Uploads** | Cloudinary |
| **Logging** | Pino |
| **Validation** | Zod |

---

## Project Structure

```
YOX-Ecommerce/
├── client/          ← Next.js 14 App Router frontend
├── server/          ← Express API (Clean Architecture)
├── docs/            ← Documentation templates
├── scripts/         ← Dev scripts
├── .github/         ← PR / Issue templates
└── .vscode/         ← VS Code workspace config
```

---

## Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- Redis (local or cloud)

### 1. Clone & Install

```bash
git clone <repo-url>
cd YOX-Ecommerce
bash scripts/setup.sh
```

### 2. Configure Environment

```bash
cp server/.env.example server/.env
# Fill in your values
```

### 3. Start Development

```bash
bash scripts/dev.sh
# OR individually:
cd server && npm run dev    # http://localhost:5000
cd client && npm run dev   # http://localhost:3000
```

---

## Team

This project is maintained by a team of 4 developers.
See [CODING_STANDARDS.md](./CODING_STANDARDS.md) before contributing.

## Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and layer rules |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Code style guide |
| [AI_RULES.md](./AI_RULES.md) | Rules for AI-assisted development |
| [DATABASE.md](./DATABASE.md) | Database schema guidelines |
| [API.md](./API.md) | API conventions and contracts |
| [BUSINESS_RULES.md](./BUSINESS_RULES.md) | Domain business rules |

## License

UNLICENSED — Private project.
