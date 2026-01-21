<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Backend for Ziqola Academic Management System (AMS) - a multi-tenant SaaS platform for Indonesian schools.

Built with:

- **NestJS v11** - Progressive Node.js framework
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Primary database
- **Passport JWT** - Authentication strategy
- **Hybrid RBAC** - Role-based access control with configurable permissions

## Features

- ✅ **Multi-tenant architecture** with strict data isolation
- ✅ **Role-based access control (RBAC)** with 4 fixed roles
- ✅ **Permission-based authorization** with configurable permissions
- ✅ **JWT authentication** with secure token management
- ✅ **Prisma ORM** with comprehensive academic domain models
- ✅ **Global guards** for authentication and authorization
- ✅ **Audit logging** for sensitive operations

## Environment

Set the following environment variables (e.g., in a `.env` file or shell):

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ams
JWT_SECRET=change_me_in_prod
JWT_EXPIRES_IN=1d
PORT=3001
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=session-materials
```

For local Postgres, see docker compose at apps/backend/docker-compose.yml.

## Prisma

```bash
pnpm --filter backend prisma:format
pnpm --filter backend prisma:generate
# optional (requires DATABASE_URL)
pnpm --filter backend prisma:migrate -n "init"
```

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

````bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

## Auth Endpoints

- POST /auth/register
  - body: { tenantId, email, password, name, role }
  - returns: { user, accessToken }
- POST /auth/login
  - body: { tenantId, email, password }
  - returns: { user, accessToken }
- GET /auth/me
  - header: Authorization: Bearer <token>
  - returns: { user }

## RBAC (Role-Based Access Control)

The backend implements a comprehensive RBAC system with:

### Roles
- `PRINCIPAL` (Kepala Sekolah) - Academic oversight and approval
- `ADMIN_STAFF` (Tata Usaha) - Administrative operations
- `TEACHER` (Guru) - Teaching staff
- `STUDENT` (Siswa) - View-only academic access

### Key Features
- **Global guards** protect all endpoints by default
- **Role-based decorators** (`@Roles()`) for coarse-grained access
- **Permission-based decorators** (`@RequirePermissions()`) for fine-grained access
- **Public decorator** (`@Public()`) to bypass authentication
- **Tenant isolation** enforced at data access layer

### Quick Examples

```typescript
// Public endpoint
@Public()
@Post("login")
login() { ... }

// Role-based access
@Roles(Role.TEACHER)
@Get("my-classes")
getClasses() { ... }

// Permission-based access
@RequirePermissions(Permission.GRADE_INPUT)
@Post("grades")
createGrade() { ... }

// Access current user
@Get("profile")
getProfile(@User() user: JwtPayload) {
  return user; // { sub, tenantId, email, role }
}
````

### Documentation

- **Comprehensive guide**: [docs/rbac.md](./docs/rbac.md)
- **Quick reference**: [docs/RBAC-QUICK-REFERENCE.md](./docs/RBAC-QUICK-REFERENCE.md)
- **Example controller**: [src/examples/examples.controller.ts](./src/examples/examples.controller.ts)

# test coverage

$ pnpm run test:cov

````

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
````

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
