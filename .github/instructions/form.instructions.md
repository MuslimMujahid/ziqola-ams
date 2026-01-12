---
description: "Best practice for building form with @tanstack/react-form and validation with Zod"
applyTo: "**/*.tsx, **/*.ts, **/*.jsx, **/*.js"
---

# Copilot Instructions: TanStack Form + Zod

This document summarize best practices for building form with @tanstacl/react-form and validation with Zod

## Dependencies

- Runtime: `@tanstack/react-form`, `zod`.

## Conventions

- Use client components for interactive forms (`"use client"`).
- Detach form as separate component (e.g., `contact-form.tsx`)
- Name schemas `xyzSchema` and types `XyzInput` via `z.infer<typeof xyzSchema>`.
- Use controlled inputs via TanStack Form `Field` render prop.
- Show errors from `field.state.meta.errors` and `form.Subscribe`.
- Keep labels, descriptions, and errors connected with `id` and `aria-*` for accessibility.

## Starter Template

Create custom form contexts and hooks in `hooks/forms.ts`:

```tsx
// form.ts
import { createFormHookContexts, createFormHook } from "@tanstack/react-form";
import { TextField } from "@/components/text-field";
import { TextArea } from "@/components/text-area";

export const { fieldContext, formContext, useFieldContext } =
  createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextArea,
  },
  formComponents: {},
});
```

Create custom field components in `components/`:

```tsx
// text-field.tsx
import { useFieldContext } from "@/hooks/forms";

export default function TextField({ label }: { label: string }) {
  const field = useFieldContext<string>();

  return (
    <label>
      <span>{label}</span>
      <input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
    </label>
  );
}
```

Create a client component form with Zod validation. Replace `ContactSchema` and fields as needed.

```tsx
// contact-form.tsx
"use client";
import { useAppForm } from "@/hooks/forms";
import { Button } from "@/components/button";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactInput = z.infer<typeof contactSchema>;

export function ContactForm({
  onSubmit,
}: {
  onSubmit?: (values: ContactInput) => Promise<void> | void;
}) {
  const form = useAppForm({
    defaultValues: { name: "", email: "", message: "" },
    validators: {
      onChange: contactSchema,
    },
    onSubmit: async ({ value }) => {
      // Do something
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
      noValidate
    >
      <form.AppField name="name">
        {(field) => <field.TextField label="Name" />}
      </form.AppField>

      <form.AppField name="email">
        {(field) => <field.TextField type="email" label="Email" />}
      </form.AppField>

      <form.AppField name="message">
        {(field) => <field.TextArea label="Message" className="min-h-28" />}
      </form.AppField>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? "Sending..." : "Send"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
```

### Usage in a Page

```tsx
// apps/web/app/contact/page.tsx
import { ContactForm } from "./contact-form";

async function sendContact(values: {
  name: string;
  email: string;
  message: string;
}) {
  // Example: call a server action or API route
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  if (!res.ok) throw new Error("Failed to send message");
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl py-10">
      <h1 className="mb-6 text-2xl font-semibold">Contact Us</h1>
      <ContactForm onSubmit={sendContact} />
    </div>
  );
}
```

## Validation Patterns

- Prefer form-level validators via `useForm`.
- Use `z.object({...}).refine(...)` for cross-field constraints (e.g., matching passwords).

## Accessibility

- Connect `label` → `input` with `htmlFor`/`id`.
- Reflect errors via `aria-invalid` and `aria-describedby`.
- Include `role="alert"` for prominent server errors.

## Notes

- Prefer to use `useAppForm` from `createFormHook` in `hooks/forms.ts` if exist.
- Prefer custom field components over native input if exist.
- Keep component APIs simple: `onSubmit(values)`; avoid passing the entire `FormApi` upstream unless necessary.
