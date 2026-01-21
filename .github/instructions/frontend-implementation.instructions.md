---
description: "Guidelines for implementing frontend features"
---

# Frontend Implementation Guidelines

When implementing frontend features, adhere to the following guidelines to ensure consistency, maintainability, and performance.

## General Practices

- Page transition animation (Framer Motion).
- Loading skeletons for charts and cards.
- Modular, reusable, and well-commented components.
- Accessible (ARIA-friendly) markup.
- Consistent component folder structure
- Use TypeScript for type safety. AVOID using `any`.
- DON'T destructure react imports; ALWAYS import React as a whole.
- ALWAYS prefer `type` over `interface` except for component props.
- ALWAYS prefer named exports over default exports for better maintainability.
- NEVER use Enums; prefer object instead.
- ALWAYS use `cn` utility for conditional classNames.
- ALWAYS create component's props type.

## Components

- Use shadcn components as the base for all UI elements.
- Ensure components are reusable and maintainable.
- Use icons from Lucide Icons for consistency. Use the component with suffix "Icon", e.g. instead of <Home />, use <HomeIcon />.
- Place page specific components co-located within the route folder (`e.g., src/routes/login.tsx, src/routes/-components/login-form.tsx`).
- Place domain specific components within a domain folder under `src/components/[domain]` (e.g., `src/components/auth`).
- AVOID long inline logic in components; extract to custom hooks or utility functions.
- AVOID long files; split into smaller components or modules as needed.

## Naming Conventions

- Use `PascalCase` for component names (e.g., `UserProfile`).
- Use `camelCase` for variable and function names (e.g., `fetchData`).
- Use `UPPER_SNAKE_CASE` for constants (e.g., `API_URL`).
- Use `kebab-case` for file and folder names (e.g., `user-profile.tsx`).

## Files Structure

- Components are organized under the `src/components` directory. `src/components` contains subfolders for different types of components as below:
  - `charts`: Chart components like BarChart, LineChart, PieChart.
  - `forms`: Form and Fields components that is integrated with the form library.
  - `layout`: Layout components like Header, Footer, Sidebar.
  - `ui`: Primitive UI components like Button, Input, Modal.
  - `widgets`: Dashboard widgets like StatsCard, ActivityFeed.
  - Other custom folders as needed for specific domains or features (e.g., `auth`, `notifications`).
- `src/lib`: Contains utility functions, API services, and business logic.
  - `src/lib/services/api`: API service functions for interacting with backend endpoints.
    - Contains API service functions (e.g., `auth.client.ts`, `auth.server.ts`), query keys (e.g., `auth.keys.ts`), hooks (e.g., `use-login.ts`, `use-me.ts`), and types (e.g., `auth.types.ts`).
    - Add barrel files (e.g., `index.ts`) to re-export modules for easier imports.
    - Use suffix `*.client.ts` for client-side only services in `src/lib/services/api` (e.g., `api.client.ts`).
    - Use suffix `*.server.ts` for server-side only services in `src/lib/services/api` (e.g., `api.server.ts`).
    - Use suffix `*.types.ts` for type definitions in `src/lib/services/api` (e.g., `auth.types.ts`).
    - Use suffix `*.keys.ts` for query key definitions in `src/lib/services/api` (e.g., `auth.keys.ts`).
  - `src/lib/utils`: Utility functions and helpers including hooks.
    - Use suffix `*.server.ts` for server-side only utilities in `src/lib/utils` (e.g., `auth.server.ts`), else don't need suffix.
