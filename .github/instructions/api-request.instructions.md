---
description: "Guidelines for making API requests"
---

# API Request Instructions

When making API requests in the project, follow these guidelines to ensure consistency and maintainability:

## General Guidelines

- ALWAYS use Axios for making HTTP requests.
- Define API requests in `src/lib/services/api/[domain]/api.[domain].ts` files (e.g., `src/lib/services/api/user/api.user.ts`).
- Define types for request payloads and responses in `src/lib/services/api/[domain]/types.ts`.
- Define custom hooks for API requests in `src/lib/hooks/[domain]/` (e.g., `src/lib/hooks/user/use-get-user.ts`).
- Build types using generics specified in `src/lib/services/api/api.types.ts` (e.g., `ApiResponse<T>`, `ApiListResponse<T>`).
- Primarily use client-side API requests. Only create server-side API requests when necessary.

## Naming Conventions

- For API request functions, use the format: `[httpMethod][Resource][Action]` (e.g., `getUserById`, `createUser`, `updateUserProfile`).
- For custom hooks, use the format: `use[Action][Resource]` (e.g., `useGetUserById`, `useCreateUser`, `useUpdateUserProfile`).
- For types, use the format: `[Resource][Request|Response|Variables]` (e.g., `UserResponse`, `CreateUserVariables`).

```typescript
type UserResponse = ApiResponse<{
  id: string;
  name: string;
  email: string;
}>;

type CreateUserVariables = {
  name: string;
  email: string;
  password: string;
};

async function createUser(
  data: CreateUserVariables,
): Promise<ApiResponse<UserResponse>> {
  const response = await axios.post<ApiResponse<UserResponse>>(
    "/api/users",
    data,
  );
  return response.data;
}
```

## Tanstack Query

- Use React Query for data fetching and state management.
- Create query keys factories for each resource (e.g., `userQueryKeys` for user-related queries).

```typescript
const userQueryKeys = {
  all: ["users"] as const,
  lists: () => [...userQueryKeys.all, "list"] as const,
  list: (vars: GetUsersVars) =>
    [...userQueryKeys.lists(), { filters }] as const,
  details: () => [...userQueryKeys.all, "detail"] as const,
  detail: (vars: GetUserVars) => [...userQueryKeys.details(), vars] as const,
};
```

- Create `queryOptions` for each query (e.g., `getUserQueryOptions` for `getUser`).

```typescript
const queryOptions = {
  getUser: (vars: GetUserVars) => ({
    queryKey: userQueryKeys.detail(vars),
    queryFn: () => getUserById(vars),
  }),
};
```

- Create custom hooks for each mutations (e.g., `useCreateUser` for `createUser`).
- Specify query keys to invalidate after mutations with `meta.invalidatesQueries`.

```typescript
const useCreateUser = () => {
  return useMutation({
    mutationFn: (data: CreateUserVariables) => createUser(data),
    meta: {
      invalidateQueries: [userQueryKeys.lists()],
    },
  });
};
```
