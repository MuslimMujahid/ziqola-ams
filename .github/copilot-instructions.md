# Ziqola AMS — AI Coding Agent Guide

Concise, codebase-specific guidance for working in this Turborepo monorepo.

Ziqola AMS is a multi-tenant academic management system. SaaS platform for Indonesian schools.

## Big Picture

- **Monorepo (Turborepo + pnpm):** Root scripts in [package.json](package.json) and pipelines in [turbo.json](turbo.json); workspaces in [pnpm-workspace.yaml](pnpm-workspace.yaml).
- **Frontend (Academic app):** TanStack Start SSR + Vite with file-based routes under [apps/academic/src/routes](apps/academic/src/routes). Entry in [apps/academic/src/router.tsx](apps/academic/src/router.tsx), shell in [apps/academic/src/routes/\_\_root.tsx](apps/academic/src/routes/__root.tsx). Generated route tree in [apps/academic/src/routeTree.gen.ts](apps/academic/src/routeTree.gen.ts) (do not edit).
- **Backend (NestJS v11):** Multi-tenant API with JWT auth + RBAC. Main module in [apps/backend/src/app.module.ts](apps/backend/src/app.module.ts); RBAC docs in [apps/backend/docs/RBAC-QUICK-REFERENCE.md](apps/backend/docs/RBAC-QUICK-REFERENCE.md).
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
- **Server-only boundaries:** Keep `*.server.ts` helpers server-only; do not import `@tanstack/react-start/server` from client-reachable modules (see [apps/academic/src/lib/services/server/auth.functions.ts](apps/academic/src/lib/services/server/auth.functions.ts)).
- **Auth flow:** Server helpers in [apps/academic/src/lib/services/server/auth.server.ts](apps/academic/src/lib/services/server/auth.server.ts) wrapped by server functions in [apps/academic/src/lib/services/server/auth.functions.ts](apps/academic/src/lib/services/server/auth.functions.ts); sessions in [apps/academic/src/lib/utils/session.ts](apps/academic/src/lib/utils/session.ts); route guards in [apps/academic/src/routes/\_authed.tsx](apps/academic/src/routes/_authed.tsx).
- **API clients:** Axios-only in [apps/academic/src/lib/services/api](apps/academic/src/lib/services/api); shared instances in [apps/academic/src/lib/services/api/api.ts](apps/academic/src/lib/services/api/api.ts) with query key factories and mutation invalidation meta.
- **Forms:** `@tanstack/react-form` + Zod per [.github/instructions/form.instructions.md](.github/instructions/form.instructions.md); example in [apps/academic/src/components/auth/login-form.tsx](apps/academic/src/components/auth/login-form.tsx).
- **UI and styling:** Tailwind v4 in [apps/academic/src/styles.css](apps/academic/src/styles.css); use `@/` alias and `@repo/ui` subpath exports (see [packages/ui](packages/ui)).

## Backend Conventions (NestJS)

- **Structure:** Module/controller/service/DTO pattern; keep controllers thin and use DI (see [apps/backend/src/app.module.ts](apps/backend/src/app.module.ts)).
- **Prisma:** Schema in [apps/backend/prisma/schema.prisma](apps/backend/prisma/schema.prisma); Prisma commands are in [apps/backend/README.md](apps/backend/README.md).
- **RBAC:** Use `@Public()`, `@Roles()`, `@RequirePermissions()` decorators (examples in [apps/backend/docs/RBAC-QUICK-REFERENCE.md](apps/backend/docs/RBAC-QUICK-REFERENCE.md)).

## Integrations

- **API testing:** Bruno collections in [docs/api/backend](docs/api/backend) with base URL http://localhost:5000.
- **Seed data:** CSV generator workflow in [packages/db/scripts/README.md](packages/db/scripts/README.md).
