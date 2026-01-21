# Implementation Plan: Refactor TeacherSessionDetailPage Attendance with useAppForm

**Date:** January 22, 2026  
**Status:** Planning Phase

## 1) Requirements Summary

- Refactor attendance state management in `TeacherSessionDetailPage` to use `useAppForm`.
- Replace manual `draftAttendance` state, `attendanceChanges` memo, and `handleStatusChange` with form-driven state.
- Preserve current UX and behaviors: attendance options, save action, optimistic UI safety, and summary counts.
- Keep the page structure and existing non-attendance logic intact (materials, notes, session info).

## 2) Current Implementation Analysis

- Attendance state is stored in a `draftAttendance` object and updated per student.
- Change detection uses `attendanceChanges` memo comparing original vs draft map.
- Save action maps `draftAttendance` into `items` and submits via `useRecordAttendance`.
- Summary counts use `draftAttendance` to compute totals.

## 3) Target Design (Form-Driven)

### Form Shape

- Form values will use a single object:
  - `attendance: Record<string, AttendanceStatus | null>`

### Form Lifecycle

- Initialize `useAppForm` with default values derived from `attendanceQuery.data`.
- On `attendanceQuery.data` change or session change, reset form values to match server data.
- Use `form.handleSubmit` for save action.
- Use `form.Subscribe` to read `isDirty`/`isSubmitting` and drive Save button state.

### UI Binding

- Each student row will bind to `form.Field` keyed by `attendance.${studentId}`.
- `Select` will read from `field.state.value` and call `field.handleChange`.

### Change Detection & Save

- Remove `attendanceChanges` memo.
- Save button uses `form.Subscribe` state (e.g., `isDirty` + not submitting).
- `onSubmit` builds payload from `form` values.

### Attendance Summary

- Use form values as the canonical state for count calculations.
- Fallback to server status only when form state has not been initialized.

## 4) Implementation Steps

1. **Add form setup**
   - Import `useAppForm` into the page.
   - Define `AttendanceFormValues` type.
   - Create form instance with `defaultValues` derived from attendance query data.

2. **Replace local state**
   - Remove `draftAttendance` state and `setDraftAttendance` logic.
   - Remove `attendanceChanges` memo and `handleStatusChange`.

3. **Wire student selects to form**
   - Wrap each row in `form.Field` for `attendance.${studentId}`.
   - Use `field.state.value` and `field.handleChange` to control `Select`.

4. **Update save handler**
   - Convert to `form.handleSubmit` based handler.
   - Build `items` from `values.attendance`.
   - Keep success feedback unchanged.

5. **Update save button state**
   - Replace `attendanceChanges` with `form.Subscribe` for `isDirty` and `isSubmitting`.

6. **Update summary counts**
   - Use `form` state to compute counts.
   - Ensure counts remain stable before data is loaded.

7. **Clean up unused logic**
   - Remove any no-longer-used refs, memoized values, and helpers.

## 5) Files to Update

- [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher/sessions/$sessionId.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher/sessions/$sessionId.tsx)

## 6) Testing Plan (Manual)

- Load the session page and confirm attendance statuses reflect server data.
- Change one student status → Save button becomes enabled.
- Save updates → success message appears; button disables while saving.
- Change multiple statuses, save, then refresh → persisted values match.
- Verify summary counts update immediately after selection changes.
- Verify no changes → Save button remains disabled.

## 7) Risks / Considerations

- Ensure form is reset when switching `sessionId` to avoid stale values.
- Ensure `Select` handles `null` values correctly (e.g., `undefined` for placeholder).
- Avoid breaking TanStack Start SSR boundaries; keep client-side only logic in component scope.
