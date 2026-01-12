# Ziqola AMS — AI Coding Agent Guide

Concise, codebase-specific guidance for working in this Turborepo monorepo.

Ziqola AMS is a multi-tenant academic management system.

## Big Picture

- **Monorepo (Turborepo + pnpm):** Root scripts in [package.json](package.json) and pipelines in [turbo.json](turbo.json); workspaces in [pnpm-workspace.yaml](pnpm-workspace.yaml).
- **Frontend (Academic app):** TanStack Start SSR + Vite with file-based routes under [apps/academic/src/routes](apps/academic/src/routes). Entry in [apps/academic/src/router.tsx](apps/academic/src/router.tsx), shell in [apps/academic/src/routes/\_\_root.tsx](apps/academic/src/routes/__root.tsx). Generated route tree in [apps/academic/src/routeTree.gen.ts](apps/academic/src/routeTree.gen.ts) (do not edit).
- **Backend (NestJS v11):** Multi-tenant API with JWT auth + RBAC. Main module in [apps/backend/src/app.module.ts](apps/backend/src/app.module.ts); RBAC docs in [apps/backend/docs/rbac.md](apps/backend/docs/rbac.md).
- **Database:** Prisma schema in [apps/backend/prisma/schema.prisma](apps/backend/prisma/schema.prisma); local Postgres via [docker-compose.yml](docker-compose.yml) or [apps/backend/docker-compose.yml](apps/backend/docker-compose.yml).
- **Shared packages:** `@repo/ui` in [packages/ui](packages/ui), `@repo/db` in [packages/db](packages/db), lint/tsconfig in [packages/eslint-config](packages/eslint-config) and [packages/typescript-config](packages/typescript-config).

## Developer Workflows

- Root: `pnpm dev | build | lint | check-types` via Turbo.
- Academic: `pnpm --filter academic dev | build | test | lint | format | check` (see [apps/academic/README.md](apps/academic/README.md)).
- Backend: `pnpm --filter backend dev | start | prod | test | test:e2e | debug` (see [apps/backend/README.md](apps/backend/README.md)).
- Database: `pnpm db:generate | db:push | db:migrate | db:studio` (root scripts in [package.json](package.json)).

## Frontend Conventions (Academic)

- **Routing:** File-based routes in [apps/academic/src/routes](apps/academic/src/routes); never edit [apps/academic/src/routeTree.gen.ts](apps/academic/src/routeTree.gen.ts).
- **SSR data:** Use route loaders for SSR-critical data; React Query for frequently changing client state. Query setup in [apps/academic/src/integrations/tanstack-query](apps/academic/src/integrations/tanstack-query).
- **Auth (server-side):** Server functions in [apps/academic/src/lib/services/server/auth.functions.ts](apps/academic/src/lib/services/server/auth.functions.ts) wrap server-only helpers in [apps/academic/src/lib/services/server/auth.server.ts](apps/academic/src/lib/services/server/auth.server.ts). Use session helper [apps/academic/src/lib/utils/session.ts](apps/academic/src/lib/utils/session.ts). Protect routes via `beforeLoad` in [apps/academic/src/routes/\_authed.tsx](apps/academic/src/routes/_authed.tsx) and redirect away from login in [apps/academic/src/routes/auth/login.tsx](apps/academic/src/routes/auth/login.tsx).
- **API clients:** Axios instances in [apps/academic/src/lib/services/api/api.ts](apps/academic/src/lib/services/api/api.ts): `clientApi` uses Zustand auth store; `serverApi` for server functions.
- **Forms:** `@tanstack/react-form` + Zod per [.github/instructions/form.instructions.md](.github/instructions/form.instructions.md); see [apps/academic/src/components/auth/login-form.tsx](apps/academic/src/components/auth/login-form.tsx).
- **Styling:** Tailwind v4 with globals in [apps/academic/src/styles.css](apps/academic/src/styles.css).
- **Imports:** Use `@/` alias (configured in [apps/academic/tsconfig.json](apps/academic/tsconfig.json)).
- **UI components:** Use `@repo/ui/<component>` subpath exports (see [packages/ui/package.json](packages/ui/package.json)).

## Backend Conventions (NestJS)

- **Auth/RBAC decorators:** Use `@Public()`, `@Roles()`, `@RequirePermissions()` (examples in [apps/backend/docs/RBAC-QUICK-REFERENCE.md](apps/backend/docs/RBAC-QUICK-REFERENCE.md)).
- **Environment:** Required env vars in [apps/backend/README.md](apps/backend/README.md).

## Integration/Docs

- **API testing:** Bruno collections in [docs/api/backend](docs/api/backend) with base URL http://localhost:5000.
- **Postgres:** See [README.md](README.md) for Docker Compose and connection string.
