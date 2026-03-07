# Ziqola AMS

Ziqola AMS (Academic Management System) is a monorepo managed with **pnpm workspaces** and **Turborepo**.

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (>= 18)
- [pnpm](https://pnpm.io/) (>= 9)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Environment Setup

The deployment scripts will **automatically** create the necessary `.env` files from `.env.example` if they are missing. However, you can also do it manually:

```bash
# Root environment
cp .env.example .env

# Database package environment
cp .env.example packages/db/.env
```

### 2. Infrastructure (PostgreSQL & MinIO)

Ensure Docker is running, then start the infrastructure:

```bash
docker compose up -d
```

### 3. Build & Database Setup

Install dependencies and prepare the shared database package:

```bash
# Install dependencies
pnpm install

# Build the database shared package
pnpm --filter @repo/db build

# Synchronize database schema (Development)
pnpm --filter @repo/db db:push

# Seed the database (Initial data)
pnpm --filter @repo/db db:seed
```

## 🚀 Development

To start the development servers for all applications:

```bash
pnpm dev
```

The main applications will be available at:
- Academic Frontend: [http://localhost:5173](http://localhost:5173) (Vite)
- Marketing/Web: [http://localhost:3000](http://localhost:3000) (Next.js)

## 🏗️ Build

To build all apps and packages:

```bash
pnpm build
```

## 📦 Deployment Scripts

We provide handy scripts to automate the deployment process in the `scripts/` directory.

### Development Environment (Local/Staging)

Synchronizes the database schema using `db:push` (non-destructive).

- **Linux/macOS/Git Bash**:
  ```bash
  ./scripts/deploy-dev.sh [--seed]
  ```
- **Windows (Command Prompt)**:
  ```cmd
  scripts\deploy-dev.bat [--seed]
  ```

### Production Environment

Runs database migrations using `db:migrate` (transactional).

- **Linux/macOS**:
  ```bash
  ./scripts/deploy-prod.sh
  ```

## 🗄️ Services

- **PostgreSQL**: `localhost:5432`
- **Adminer (DB UI)**: [http://localhost:8080](http://localhost:8080)
- **MinIO (Object Storage)**: `localhost:9000` (Console: `localhost:9001`)

---

## 🏗️ Architecture

| Layer | Stack | Location |
|---|---|---|
| Backend API | NestJS + Prisma + PostgreSQL | `apps/backend` |
| Academic | React (Vite) + TanStack Router | `apps/academic` |
| Web | Next.js | `apps/web` |
| Shared DB | Prisma schema + generated client | `packages/db` |
| Shared UI | Component library (`@repo/ui`) | `packages/ui` |
