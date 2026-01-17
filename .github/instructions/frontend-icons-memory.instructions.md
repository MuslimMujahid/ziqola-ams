---
description: "Guidelines for icon usage in the frontend"
applyTo: "**/*.tsx, **/*.jsx"
---

# Frontend Icons Memory

Use standardized icon components for consistency and maintainability.

## Prefer icon components over inline SVG

- Use library components (e.g., `lucide-react`) or shared UI components for icons.
- Avoid manually constructing `<svg>` markup in app code.

**Example**

```tsx
import { BellIcon } from "lucide-react";

<button type="button" className="inline-flex items-center gap-2">
  <BellIcon className="h-4 w-4" aria-hidden="true" />
  Notifikasi
</button>;
```
