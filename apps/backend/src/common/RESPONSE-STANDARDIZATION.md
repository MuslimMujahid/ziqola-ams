# Backend Response Standardization

This document explains the standardized response format used across the backend API.

## Response Formats

### Success Response - Basic

Used for single resource responses or simple operations.

```typescript
{
  message: string;
  statusCode: number;
  success: boolean;
  data: any;
}
```

**Example:**

```json
{
  "message": "User retrieved successfully",
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Success Response - Array/Paginated

Used for list/collection responses with pagination metadata.

```typescript
{
  message: string;
  statusCode: number;
  success: boolean;
  data: array;
  meta: {
    offset: number;
    limit: number;
    sort: string;
    order: string;
  }
}
```

**Example:**

```json
{
  "message": "Users retrieved successfully",
  "statusCode": 200,
  "success": true,
  "data": [
    { "id": "1", "name": "John Doe" },
    { "id": "2", "name": "Jane Smith" }
  ],
  "meta": {
    "offset": 0,
    "limit": 10,
    "sort": "createdAt",
    "order": "desc"
  }
}
```

### Error Response

Used for all error responses.

```typescript
{
  statusCode: number;
  message: string;
  error: string;
}
```

**Example:**

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

## Usage in Controllers

The response standardization is applied globally through interceptors and filters. You have two options:

### Option 1: Return Raw Data (Recommended)

Simply return your data, and the interceptor will automatically wrap it:

```typescript
import { Controller, Get } from "@nestjs/common";

@Controller("users")
export class UsersController {
  @Get()
  findAll() {
    // Just return the data
    return [
      { id: "1", name: "John" },
      { id: "2", name: "Jane" },
    ];
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    // Just return the data
    return { id, name: "John Doe" };
  }
}
```

### Option 2: Use Helper Functions (Explicit)

For more control over message and status code, or for paginated responses:

```typescript
import { Controller, Get, Query } from "@nestjs/common";
import {
  successResponse,
  paginatedResponse,
  PaginationQueryDto,
  PaginationMeta,
} from "../common";

@Controller("users")
export class UsersController {
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    const users = [
      { id: "1", name: "John" },
      { id: "2", name: "Jane" },
    ];

    const meta = new PaginationMeta(
      query.offset,
      query.limit,
      query.sort,
      query.order
    );

    return paginatedResponse(users, meta, "Users retrieved successfully", 200);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    const user = { id, name: "John Doe" };
    return successResponse(user, "User retrieved successfully", 200);
  }
}
```

## Error Handling

Errors are automatically standardized by the global exception filter. Simply throw NestJS exceptions:

```typescript
import {
  Controller,
  Get,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";

@Controller("users")
export class UsersController {
  @Get(":id")
  findOne(@Param("id") id: string) {
    const user = this.usersService.findOne(id);

    if (!user) {
      // This will be transformed to the standard error format
      throw new NotFoundException("User not found");
    }

    return user;
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    if (!createUserDto.email) {
      // This will also be standardized
      throw new BadRequestException("Email is required");
    }

    return this.usersService.create(createUserDto);
  }
}
```

## Pagination Query Parameters

Use the `PaginationQueryDto` for endpoints that return lists:

```typescript
import { Controller, Get, Query } from "@nestjs/common";
import { PaginationQueryDto } from "../common";

@Controller("users")
export class UsersController {
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    // query.offset - Starting position (default: 0)
    // query.limit - Number of items (default: 10)
    // query.sort - Field to sort by (default: 'createdAt')
    // query.order - Sort order: 'asc' or 'desc' (default: 'desc')

    const users = this.usersService.findAll(query);
    return paginatedResponse(users, query);
  }
}
```

**Query Examples:**

- `GET /users` - Default pagination
- `GET /users?offset=10&limit=20` - Skip 10, take 20
- `GET /users?sort=name&order=asc` - Sort by name ascending
- `GET /users?offset=0&limit=50&sort=createdAt&order=desc` - Full pagination

## Implementation Details

The standardization is implemented using:

1. **TransformResponseInterceptor** - Wraps successful responses
2. **HttpExceptionFilter** - Transforms errors to standard format
3. **DTOs** - TypeScript types for responses
4. **Helper Functions** - Convenient response builders

These are registered globally in `main.ts`, so all endpoints automatically use the standard format.
