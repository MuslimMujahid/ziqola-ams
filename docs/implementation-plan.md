# Teacher Dashboard Redesign (Mockup) — Implementation Plan

## 1) Requirements Summary

- Redesign the teacher dashboard using mock data where needed.
- Remove sections: Aksi Cepat, Progress Penilaian, Kehadiran Hari Ini.
- Keep sections: Jadwal Hari Ini, Tugas Tertunda.
- Add new sections: My Classes, Personal Info, Tenant-level News, Tenant-level Schedule (include start and end time).
- Preserve existing dashboard header and academic period badge.
- Follow UI guidelines: flat surfaces (no borders/shadows), status colors, clean spacing, accessibility.

## 2) Existing Implementation Review

- Route component: [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher.tsx).
- Existing cards/components:
  - [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher/-components/quick-actions.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher/-components/quick-actions.tsx)
  - [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher/-components/grading-progress-card.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher/-components/grading-progress-card.tsx)
  - [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher/-components/attendance-summary-card.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher/-components/attendance-summary-card.tsx)
  - [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher/-components/schedule-card.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher/-components/schedule-card.tsx)
  - [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher/-components/pending-tasks-card.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher/-components/pending-tasks-card.tsx)
- Data is currently sourced from `useTeacherDashboard()` with a summary payload in [apps/academic/src/lib/services/api/teacher-dashboard](apps/academic/src/lib/services/api/teacher-dashboard).

## 3) Redesign Approach (Mockup-first)

1. **Introduce new card components** (route-level, in -components):
   - `my-classes-card.tsx`
   - `personal-info-card.tsx`
   - `tenant-news-card.tsx`
   - `tenant-schedule-card.tsx`
     Each card should:
   - Use shadcn/ui primitives (`Card`, `Button`, etc.) or existing flat card styling consistent with current cards.
   - Use Lucide icons (component suffix `Icon`).
   - Include skeleton/loading state parity (optional for mock, but consistent with current card patterns).

2. **Remove deprecated sections**
   - Delete `QuickActions`, `GradingProgressCard`, and `AttendanceSummaryCard` from the page layout.
   - Keep the files temporarily unless referenced elsewhere (optional cleanup after redesign is stable).

3. **Retain existing cards**
   - Keep `ScheduleCard` (Jadwal Hari Ini) and `PendingTasksCard` (Tugas Tertunda) in the layout.

4. **Mock data strategy**
   - For mockup, define local dummy data inside the route component or a dedicated mock file under the same route folder.
   - Ensure mock data covers:
     - My classes: class name, subject count, homeroom flag (optional), next session.
     - Personal info: name, role, email, phone, main subject.
     - Tenant news: title, summary, date, category (info/announcement).
     - Tenant-level schedule: event title, date, start time, end time, location (optional).
   - Keep `useTeacherDashboard()` for existing sections (schedule & tasks) or replace with mock data if the goal is fully static.

5. **Layout update (responsive)**
   - Maintain top header + period badge.
   - Use a two-column grid on desktop:
     - Left column: My Classes → Jadwal Hari Ini → Tenant-level Schedule.
     - Right column: Personal Info → Tenant-level News → Tugas Tertunda.
   - For mobile, stack in a single column in priority order.

## 4) File Changes (Planned)

- Update layout in [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher.tsx).
- Add new components under [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher/-components](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher/-components):
  - `my-classes-card.tsx`
  - `personal-info-card.tsx`
  - `tenant-news-card.tsx`
  - `tenant-schedule-card.tsx`
- Update component index exports if needed:
  - [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher/-components/index.ts](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher/-components/index.ts)

## 5) UI/UX Notes

- Use flat surfaces and background separation (no borders or shadows).
- Include status colors on badges and highlights (info/warning/success).
- Use clear typography hierarchy and concise Indonesian labels.
- Ensure consistent spacing (`p-6`, `gap-6`, `rounded-xl`) and accessible focus states.

## 6) Testing Plan (Manual)

- Verify layout order and responsiveness for desktop/tablet/mobile.
- Confirm removed sections are no longer visible.
- Validate mock data renders correctly in new cards.
- Ensure `ScheduleCard` and `PendingTasksCard` still work with existing data fetching.
- Check for accessibility: headings, link focus states, readable contrast.

## 7) Risks / Open Questions

- Whether mock data should replace all API usage or only new sections (keep existing sections live).
- If tenant-level schedule/news require existing APIs, decide on stubbing vs. new API endpoints.
- Confirm desired data fields for “Personal Info” and “My Classes” to avoid mismatch with future backend payloads.
