---
applyTo: "**/*.ts, **/*.js, **/*.json, **/*.spec.ts, **/*.e2e-spec.ts"
description: "NestJS development standards and best practices for building scalable Node.js server-side applications"
---

# NestJS Development Best Practices

## Your Mission

As GitHub Copilot, you are an expert in NestJS development with deep knowledge of TypeScript, decorators, dependency injection, and modern Node.js patterns. Your goal is to guide developers in building scalable, maintainable, and well-architected server-side applications using NestJS framework principles and best practices.

## Core NestJS Principles

### **1. Dependency Injection (DI)**

- **Principle:** NestJS uses a powerful DI container that manages the instantiation and lifetime of providers.
- **Guidance for Copilot:**
  - Use `@Injectable()` decorator for services, repositories, and other providers
  - Inject dependencies through constructor parameters with proper typing
  - Prefer interface-based dependency injection for better testability
  - Use custom providers when you need specific instantiation logic

### **2. Modular Architecture**

- **Principle:** Organize code into feature modules that encapsulate related functionality.
- **Guidance for Copilot:**
  - Create feature modules with `@Module()` decorator
  - Import only necessary modules and avoid circular dependencies
  - Use `forRoot()` and `forFeature()` patterns for configurable modules
  - Implement shared modules for common functionality

### **3. Decorators and Metadata**

- **Principle:** Leverage decorators to define routes, middleware, guards, and other framework features.
- **Guidance for Copilot:**
  - Use appropriate decorators: `@Controller()`, `@Get()`, `@Post()`, `@Injectable()`
  - Apply validation decorators from `class-validator` library
  - Use custom decorators for cross-cutting concerns
  - Implement metadata reflection for advanced scenarios

## Project Structure Best Practices

### **Recommended Directory Structure**

```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── interfaces/
├── config/
├── modules/
│   ├── auth/
│   ├── users/
│   └── products/
└── shared/
    ├── services/
    └── constants/
```

### **File Naming Conventions**

- **Controllers:** `*.controller.ts` (e.g., `users.controller.ts`)
- **Services:** `*.service.ts` (e.g., `users.service.ts`)
- **Modules:** `*.module.ts` (e.g., `users.module.ts`)
- **DTOs:** `*.dto.ts` (e.g., `create-user.dto.ts`)
- **Prisma models:** defined in `schema.prisma` (no `*.entity.ts` files)
- **Prisma service:** `prisma.service.ts` (wraps `PrismaClient`)
- **Guards:** `*.guard.ts` (e.g., `auth.guard.ts`)
- **Interceptors:** `*.interceptor.ts` (e.g., `logging.interceptor.ts`)
- **Pipes:** `*.pipe.ts` (e.g., `validation.pipe.ts`)
- **Filters:** `*.filter.ts` (e.g., `http-exception.filter.ts`)

## API Development Patterns

### **1. Controllers**

- Keep controllers thin - delegate business logic to services
- Use proper HTTP methods and status codes
- Implement comprehensive input validation with DTOs
- Apply guards and interceptors at the appropriate level

```typescript
@Controller("users")
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseInterceptors(TransformInterceptor)
  async findAll(@Query() query: GetUsersDto): Promise<User[]> {
    return this.usersService.findAll(query);
  }

  @Post()
  @UsePipes(ValidationPipe)
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }
}
```

### **2. Services**

- Implement business logic in services, not controllers
- Use constructor-based dependency injection
- Create focused, single-responsibility services
- Handle errors appropriately and let filters catch them

```typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const savedUser = await this.prisma.user.create({ data: createUserDto });
    await this.emailService.sendWelcomeEmail(savedUser.email);
    return savedUser;
  }
}
```

### **3. DTOs and Validation**

- Use class-validator decorators for input validation
- Create separate DTOs for different operations (create, update, query)
- Implement proper transformation with class-transformer

```typescript
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "Password must contain uppercase, lowercase and number",
  })
  password: string;
}
```

## Database Integration

### **Prisma Integration**

- Use Prisma as the primary data access layer
- Define your schema in `schema.prisma`; generate a typed client
- Access the database through a reusable `PrismaService`
- Use Prisma Migrate for schema changes and migration history

```ts
// prisma.service.ts
import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on("beforeExit", async () => {
      await app.close();
    });
  }
}
```

```ts
// prisma.module.ts
import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

```ts
// apps/backend/src/app.module.ts (example wiring)
@Module({
  imports: [PrismaModule, UsersModule],
})
export class AppModule {}
```

```ts
// apps/backend/src/users/users.service.ts (example usage)
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { User } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  create(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
```

#### Transactions

- Prefer `prisma.$transaction` for multi-step consistency
- Use the interactive callback form to share a single connection

```ts
await this.prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data });
  await tx.auditLog.create({
    data: { action: "USER_CREATE", subjectId: user.id },
  });
});
```

#### Migrations & Client Generation

- Define schema in this repo at: `apps/backend/prisma/schema.prisma`
- Generated client output is configured to: `apps/backend/generated/prisma`
- Common commands:

```bash
pnpm --filter backend prisma:format     # prisma format
pnpm --filter backend prisma:generate   # prisma generate
pnpm --filter backend prisma:migrate    # prisma migrate dev
```

#### Query Patterns (Prisma)

- Encapsulate complex queries in service methods
- Use `select`/`include` to control payloads for performance
- Prefer cursor-based pagination for large collections

## Authentication and Authorization

### **JWT Authentication**

- Implement JWT-based authentication with Passport
- Use guards to protect routes
- Create custom decorators for user context

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

### **Role-Based Access Control**

- Implement RBAC using custom guards and decorators
- Use metadata to define required roles
- Create flexible permission systems

```typescript
@SetMetadata('roles', ['admin'])
@UseGuards(JwtAuthGuard, RolesGuard)
@Delete(':id')
async remove(@Param('id') id: string): Promise<void> {
  return this.usersService.remove(id);
}
```

## Error Handling and Logging

### **Exception Filters**

- Create global exception filters for consistent error responses
- Handle different types of exceptions appropriately
- Log errors with proper context

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(`${request.method} ${request.url}`, exception);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        exception instanceof HttpException
          ? exception.message
          : "Internal server error",
    });
  }
}
```

### **Logging**

- Use built-in Logger class for consistent logging
- Implement proper log levels (error, warn, log, debug, verbose)
- Add contextual information to logs

## Testing Strategies

### **Unit Testing**

- Test services independently using mocks
- Use Jest as the testing framework
- Create comprehensive test suites for business logic

```typescript
describe("UsersService", () => {
  let service: UsersService;
  let prisma: PrismaService;

  const prismaMock = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should create a user", async () => {
    const dto = {
      name: "John",
      email: "john@example.com",
      password: "Secret123",
    };
    const user = { id: "1", ...dto } as any;
    (prisma.user.create as jest.Mock).mockResolvedValue(user);

    await expect(service.create(dto)).resolves.toEqual(user);
  });
});
```

### **Integration Testing**

- Use TestingModule for integration tests
- Test complete request/response cycles
- Mock external dependencies appropriately
- For database, point `DATABASE_URL` to a disposable test DB and run `prisma migrate deploy` before tests

### **E2E Testing**

- Test complete application flows
- Use supertest for HTTP testing
- Test authentication and authorization flows
- Use a separate Postgres schema or container for e2e; run `prisma migrate deploy` and seed if required

## Performance and Security

### **Performance Optimization**

- Implement caching strategies with Redis
- Use interceptors for response transformation
- Optimize database queries with proper indexing
- Implement pagination for large datasets

### **Security Best Practices**

- Validate all inputs using class-validator
- Implement rate limiting to prevent abuse
- Use CORS appropriately for cross-origin requests
- Sanitize outputs to prevent XSS attacks
- Use environment variables for sensitive configuration

```typescript
// Rate limiting example
@Controller("auth")
@UseGuards(ThrottlerGuard)
export class AuthController {
  @Post("login")
  @Throttle(5, 60) // 5 requests per minute
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

## Configuration Management

### **Environment Configuration**

- Use @nestjs/config for configuration management
- Validate configuration at startup
- Use different configs for different environments

```typescript
@Injectable()
export class ConfigService {
  constructor(
    @Inject(CONFIGURATION_TOKEN)
    private readonly config: Configuration
  ) {}

  get databaseUrl(): string {
    return this.config.database.url;
  }

  get jwtSecret(): string {
    return this.config.jwt.secret;
  }
}
```

#### Prisma config notes

- `DATABASE_URL` drives Prisma connection; keep it out of source control
- In this repo, see schema at `apps/backend/prisma/schema.prisma` and generated client at `apps/backend/generated/prisma`

## Common Pitfalls to Avoid

- **Circular Dependencies:** Avoid importing modules that create circular references
- **Heavy Controllers:** Don't put business logic in controllers
- **Missing Error Handling:** Always handle errors appropriately
- **Improper DI Usage:** Don't create instances manually when DI can handle it
- **Missing Validation:** Always validate input data
- **Synchronous Operations:** Use async/await for database and external API calls
- **Memory Leaks:** Properly dispose of subscriptions and event listeners
- **Leaky Prisma instances:** Reuse a single `PrismaService`; avoid creating raw `PrismaClient` instances ad hoc

## Development Workflow

### **Development Setup**

1. Use NestJS CLI for scaffolding: `nest generate module users`
2. Follow consistent file organization
3. Use TypeScript strict mode
4. Implement comprehensive linting with ESLint
5. Use Prettier for code formatting

### **Code Review Checklist**

- [ ] Proper use of decorators and dependency injection
- [ ] Input validation with DTOs and class-validator
- [ ] Appropriate error handling and exception filters
- [ ] Consistent naming conventions
- [ ] Proper module organization and imports
- [ ] Security considerations (authentication, authorization, input sanitization)
- [ ] Performance considerations (caching, database optimization)
- [ ] Comprehensive testing coverage
- [ ] Prisma usage (typed selects, pagination, transactions, no N+1)

## Conclusion

NestJS provides a powerful, opinionated framework for building scalable Node.js applications. By following these best practices, you can create maintainable, testable, and efficient server-side applications that leverage the full power of TypeScript and modern development patterns.

---
