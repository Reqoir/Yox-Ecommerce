# YOX E-Commerce

YOX is a production-grade custom e-commerce platform for a men's fashion brand.

## Project Structure

This repository follows a monorepo-style structure containing both the frontend and backend applications.

- `/client`: Next.js 15 (App Router) frontend application.
- `/server`: Node.js & Express.js backend application.

## Tech Stack

**Frontend:**
- Next.js 15
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form & Zod
- TanStack Query
- Zustand

**Backend:**
- Node.js & Express.js
- TypeScript
- MongoDB & Mongoose
- JWT Authentication

## Branching Strategy & Git Workflow

- `main`: Production-ready code only. Never commit directly to this branch.
- `develop`: Staging/Testing code.
- `feature/*`: For all new features and bug fixes. Create these from `develop` and open a Pull Request when complete.

*Detailed setup instructions for client and server will be added within their respective directories.*
