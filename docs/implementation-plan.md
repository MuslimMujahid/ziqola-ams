# Implementation Plan — /dashboard/student/schedule (Weekly View + Agenda Popup)

## Objective

Create the student schedule page at /dashboard/student/schedule, aligned with the teacher weekly schedule layout, and ensure clicking a schedule item opens the same popup used in the student dashboard “Agenda hari ini.”

## Requirements (from request)

1. Add /dashboard/student/schedule page similar to /dashboard/teacher/schedule.
2. Clicking a schedule item shows the same popup used in “Agenda hari ini” on the student dashboard.
3. Keep UI/UX aligned with existing scheduling components and topnav behavior.

## Current State Review

- Teacher weekly schedule exists at [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher/schedule/index.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher/schedule/index.tsx) and uses WeeklyScheduleCalendar.
- Student dashboard agenda card uses [apps/academic/src/routes/\_authed/dashboard/\_topnavs/student/-components/student-schedule-card.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/student/-components/student-schedule-card.tsx), which includes the popup dialog for session materials.
- There is no student schedule route under \_topnavs/student/schedule yet.

## Proposed Approach

### Frontend (Academic app)

1. **Create the student schedule route**

- Add [apps/academic/src/routes/\_authed/dashboard/\_topnavs/student/schedule/index.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/student/schedule/index.tsx).
- Mirror the teacher schedule layout (date range header, prev/next week controls, weekly calendar).
- Set staticData topnavId to student and include error/pending boundaries.

2. **Reuse WeeklyScheduleCalendar with student data**

- Build a student schedule data mapper that combines schedules + sessions for the selected week (similar to the teacher route logic).
- Map both schedules and sessions into the WeeklyScheduleItem structure (ensure classSubjectId, subjectName, className, startTime/endTime, sessionId).
- Keep date range logic aligned to Monday–Sunday windows.

3. **Make schedule item click behavior configurable**

- Refactor WeeklyScheduleCalendar to accept an optional onItemSelect callback (and/or a flag to disable default navigation).
- Teacher schedule keeps current navigation to /dashboard/teacher/sessions/$sessionId.
- Student schedule uses onItemSelect to open the agenda popup instead of navigating.

4. **Extract the student schedule popup into a reusable component**

- Move the dialog from student-schedule-card into a shared component, e.g. [apps/academic/src/routes/\_authed/dashboard/\_topnavs/student/-components/schedule-detail-dialog.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/student/-components/schedule-detail-dialog.tsx).
- Export the dialog and any needed types/helpers (StudentScheduleItem, material parsing helpers).
- Use the same dialog in both StudentScheduleCard (dashboard) and the new student schedule page.

5. **Wire item selection in student schedule page**

- Maintain local state for selected schedule item and dialog open state.
- Open dialog only when sessionId is present (consistent with the dashboard).
- Ensure keyboard accessibility for item selection if needed in the calendar component.

## Data Dependencies

- Student schedule page will rely on existing hooks:
  - useSessions with dateFrom/dateTo for weekly window.
  - useSchedules for class schedule items.
- If backend already filters sessions/schedules by current student enrollment, no extra client filters are needed; otherwise, add classId filter once the student class is available.

## Testing Plan

### Manual QA

- Navigate to /dashboard/student/schedule; verify header, date range, and calendar layout match teacher schedule.
- Click a schedule item with sessionId; the dialog should match the “Agenda hari ini” popup (materials, attachments, links).
- Click a schedule item without sessionId; no popup should open.
- Confirm student dashboard schedule card still opens the same dialog.

### Optional UI tests

- Snapshot or component tests for the dialog component rendering with and without materials.
- Interaction test for onItemSelect in WeeklyScheduleCalendar.

## Implementation Steps

1. Add student schedule route and weekly data mapping.
2. Refactor WeeklyScheduleCalendar to support customizable item selection.
3. Extract and reuse the schedule detail dialog from the student dashboard card.
4. Wire dialog interactions on the new student schedule page.
5. Run manual QA across student dashboard and student schedule page.

## Risks & Notes

- WeeklyScheduleCalendar refactor must preserve teacher navigation behavior.
- Ensure no server-only imports are added to client routes.
- Keep time/date formatting consistent with the student dashboard schedule card.
