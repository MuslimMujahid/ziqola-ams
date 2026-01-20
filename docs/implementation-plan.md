# Sessions Management — “Today” Calendar Tab Plan

## 1) Requirements Summary

- Add a new tab in sessions management that shows the current day’s sessions for a class in a calendar view.
- Keep the existing list view and filters intact.
- Use existing session data and API endpoints; no new backend endpoint unless needed for timezone accuracy.

## 2) Existing Implementation Review

- Sessions management route exists at apps/academic/src/routes/\_authed/dashboard/\_sidenavs/admin-staff/sessions/index.tsx with list + filters and a “Sesi hari ini” quick filter button.
- Sessions API already supports date range filtering via dateFrom/dateTo and classId in sessions query DTO.
- Calendar UI primitives exist in apps/academic/src/components/calendar and a full schedule calendar is implemented in the teaching-assignments route.

## 3) Assumptions / Clarifications

- “Current day” is determined by Asia/Jakarta timezone.
- “Sessions of current day of a class” means calendar view is scoped to a selected class (class selection required, not ALL).
- Calendar tab should support clicking sessions to open the existing edit flow.
- Clicking empty slots should prefill a new session form (date + start/end time).

## 4) Functional Scope

### Frontend (Academic app)

1. **UI: Add Tabs**
   - Introduce a tabs switch (e.g., list / today calendar) on the sessions page, following the teaching-assignments pattern (TabsRoot, TabsList, TabsTrigger).
   - Default to list view; calendar view should only be enabled when a class is selected.

2. **Calendar View Component**
   - Create a sessions calendar component under the sessions route folder (kebab-case file name).
   - Reuse calendar primitives from apps/academic/src/components/calendar.
   - Render a single-day column with half-hour time slots and session blocks positioned by start/end time.
   - Provide loading skeleton and empty state; include a prompt to select a class when the class filter is ALL.

3. **Data Fetching**
   - When calendar tab is active:
   - Build query params using classId, academicPeriodId, and dateFrom/dateTo set to today’s date in Asia/Jakarta timezone.
     - Use a larger limit (or no pagination) to load all sessions for the day.
   - Continue using existing list query for list tab.

4. **Interactions**
   - Clicking a session block opens edit mode using the existing session form modal (same as list actions).
   - Clicking empty slots prefills a new session form with date + time boundaries.

### Backend

- No changes required if current filters suffice.
- If timezone correctness is a concern, consider a server-side “today” query parameter or tenant timezone settings.

## 5) Data & UI Considerations

- Date boundaries should match the UI’s “today” filter logic; ensure the calendar and list use the same date formatting.
- Use consistent visual language with existing schedule calendar (colors, labels, minimal borders).
- Use status colors for different session types only if such fields exist; otherwise use neutral tones.

## 6) Implementation Steps (High-Level)

1. Review sessions management route and add tabs state (list vs calendar).
2. Add a new calendar component scoped to “today” sessions, reusing calendar primitives.
3. Add a dedicated sessions query for the calendar tab (dateFrom/dateTo = today, classId required).
4. Wire calendar events to open the session edit modal; keep list actions unchanged.
5. Add empty states and loading skeletons for the calendar tab.
6. Validate UI behavior with class filter changes and tab switching.

## 7) Testing Plan

- Manual QA:
  - Tab switching between list and calendar.
  - Calendar view requires class selection; displays empty state if none.
  - “Today” sessions show at correct times and order.
  - Clicking session opens edit modal and updates after save.
- Optional unit test for time-to-slot mapping utility if added.

## 8) Open Questions

- Confirm any Jakarta timezone utilities already in the codebase (or decide where to add one).
