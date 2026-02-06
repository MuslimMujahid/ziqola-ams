# Implementation Plan - Students Import Preview Rerender Reduction

## Goal

Reduce full-table rerenders when server errors are injected or corrected by narrowing form store subscriptions and avoiding broad `withForm` context updates at the table level.

## Requirements

- Keep current CSV preview UX, layout, and validation behavior.
- Continue using TanStack Form for field-level validation and error display.
- Preserve server error injection behavior from the import API response.
- Avoid unnecessary rerenders across all rows when only a subset of fields change.

## Current Observations

- `PreviewTable`, `PreviewRow`, and `PreviewCell` are wrapped with `withForm`, so they re-render whenever form store state changes.
- `PreviewRow` subscribes to `form.Field name="rows[index]"`, which broadens rerenders when errors change anywhere in the row object.
- `PreviewTable` already uses `useStore(form.store, selector)`, but still re-renders due to `withForm` context updates.

## Planned Approach

### 1) Pass `form` explicitly to preview components

- Remove `withForm` from `PreviewTable`, `PreviewRow`, and `PreviewCell`.
- Add explicit `form` props typed as `FormApi<StudentsImportFormValues>` and pass it down from `StudentsImport`.

### 2) Narrow subscriptions with `useStore`

- Keep `PreviewTable` subscribed only to `rows.length` using `useStore(form.store, selector)`.
- Replace row-level `form.Field name="rows[index]"` with `useStore` for the minimal signals needed for row styling, such as `isValid` or a per-row error flag.
- Keep cell-level field subscriptions via `form.Field` inside `PreviewCell` so only the edited field rerenders.

### 3) Keep server error injection unchanged initially

- Maintain current `form.setErrorMap` usage so behavior does not regress.
- If rerenders persist, consider a follow-up change to store server errors in field meta or in a narrow store per field.

## Implementation Tasks

1. Update preview component signatures
   - Add `form` prop and remove `withForm` wrappers.
   - Ensure `PreviewTable`, `PreviewRow`, and `PreviewCell` use explicit `form` prop.

2. Tighten row subscription
   - Replace `form.Field name="rows[index]"` in `PreviewRow` with `useStore` to read only the row validity flag or a computed error state.
   - Keep rendering logic and styling unchanged.

3. Keep cell subscriptions intact
   - Continue using `form.Field` in `PreviewCell` so field validation and error messages stay accurate.
   - Ensure field updates still call `field.handleChange` and maintain current error display.

4. Validate error injection path
   - Confirm `applyServerErrors` still surfaces errors in the correct cells after removing `withForm`.

## Files to Update

- [apps/academic/src/routes/\_authed/dashboard/\_sidenavs/admin-staff/students/-components/-students-imports-preview.tsx](apps/academic/src/routes/_authed/dashboard/_sidenavs/admin-staff/students/-components/-students-imports-preview.tsx)
- [apps/academic/src/routes/\_authed/dashboard/\_sidenavs/admin-staff/students/-components/-students-import.tsx](apps/academic/src/routes/_authed/dashboard/_sidenavs/admin-staff/students/-components/-students-import.tsx)

## Testing Plan

- Manual UI
  - Import CSV and confirm preview table renders correctly.
  - Trigger server-side errors and verify they show on the right cells.
  - Edit a single cell and verify only that row/cell rerenders (React DevTools highlight).
  - Remove a row and confirm the correct row is removed and virtualized list stays stable.
- Regression
  - Verify submit blocking and error messaging are unchanged.
  - Confirm class selection and custom field selects still behave as before.

## Risks / Notes

- If row-level validity is derived from `form.Field name="rows[index]"`, switching to `useStore` must preserve correct `isValid` behavior.
- Virtualized rows depend on stable `key`/index logic; avoid changing indices unexpectedly during error handling.
