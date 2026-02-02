## Implementation Plan — Homeroom Recap Review + Score Table

### Goal

Extend the homeroom recap page so homeroom teachers can review submitted scores in a data table, in addition to approving/rejecting change requests.

### Scope

- Backend: add a homeroom recap detail endpoint that returns score data for a selected submission (students + assessment type breakdown).
- Frontend (Academic app): add table view to the homeroom recap page, reuse existing table patterns, and keep the approve/reject flow intact.

### Requirements (Updated)

1. Replace the recap list with selector-driven review (no separate list view).
2. Add a class filter plus a single selector for subject - teacher.
3. Default to the most recent submitted recap for the selected class.
4. Scope to active period only (no period filter).
5. Display summary cards and a data table for the selected recap.
6. Continue to allow approve/reject from the detail view with change-request status next to actions.

### Out of Scope

### Requirements (Updated)

### UI/UX Design

- Replace the list with a selector bar:
  - Class dropdown.
  - Subject - teacher dropdown (disabled until class selected).
- Show summary cards and the data table for the selected recap.
- Place change-request status next to the approve/reject actions.
- Keep colors and layout consistent with the current flat design system (no borders or shadows).

2. Allow homeroom teachers to open a submitted recap and review student scores.
3. Display scores using a data table (sortable, paginated like other tables).

### Current Implementation Review

### API/Data Design

- **Selector data endpoint**: extend `GET /assessment-recap/homeroom` to return
  active-period submissions grouped by class and subject-teacher pairs
  (or add a lightweight `GET /assessment-recap/homeroom/options`).
- **Detail endpoint**: `GET /assessment-recap/homeroom/:submissionId`
  - Response should include: class, subject, period labels, assessment types, class KKM, and student rows with component scores and final score.
  - Match the shape of existing teacher recap data where possible to reuse table logic.

- Homeroom recap list and decisions already exist in [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher/compile/index.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher/compile/index.tsx).
- Recap table component exists in [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher/recap/-components/recap-table.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher/recap/-components/recap-table.tsx) and uses the shared data table pattern.

### API/Data Design

1. **Backend: DTOs + Types**
   - Add a DTO for homeroom recap detail parameters.
   - Add response types for recap detail (assessment types + students + KKM).
   - Add selector option response types if using a dedicated options endpoint.

- **Detail endpoint**: `GET /assessment-recap/homeroom/:submissionId`
  - Response should include: class, subject, period labels, assessment types, class KKM, and student rows with component scores and final score.
  - Match the shape of existing teacher recap data where possible to reuse table logic.

2. **Backend: Service Logic**
   - Implement a detail query scoped by submission ID and homeroom authorization.
   - If needed, implement selector options query (class + subject-teacher pairs for active period).

### UI/UX Design

- Add a “Lihat Rekap” action on each list card to open score details.

3. **Backend: Controller + Permissions**
   - Add a `GET /assessment-recap/homeroom/:submissionId` route.
   - Add `GET /assessment-recap/homeroom/options` if separating selector data.
   - Keep permission aligned with `ASSESSMENT_READ` and homeroom checks.

- Show scores in a data table using the same table component or a small wrapper that adapts data to the existing column model.
- Use a split layout or expandable panel:
  - Option A: expand/collapse under each list item.
  - Option B: right-side panel or dialog with the data table.

4. **Frontend: API Client + Hooks**
   - Add API client and hooks to fetch selector options and recap detail by submission ID.
   - Add query keys for options + detail caching and invalidation.

- Keep colors and layout consistent with the current flat design system (no borders or shadows).

### Implementation Tasks

5. **Frontend: Data Mapping**
   - Transform detail data into `RecapTableRow` to reuse [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher/recap/-components/recap-table.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher/recap/-components/recap-table.tsx).
   - Compute summary cards from detail data or use API-provided summary.
1. **Backend: DTOs + Types**
   - Add a DTO for homeroom recap detail parameters.
   - Add response types for recap detail (assessment types + students + KKM).

1. **Backend: Service Logic**
1. **Frontend: UI Updates**
   - Replace the list with selector controls (class + subject-teacher).
   - Default to the latest submission for the selected class.
   - Render summary cards and the recap table for the selected submission.
   - Show change-request status next to approve/reject actions.
   - Implement a detail query that reuses the existing recap computation but scoped by submission ID and homeroom authorization.
   - Validate homeroom ownership of the class linked to the submission.

1. **Backend: Controller + Permissions**
1. **Frontend: Loading + Empty States**
   - Add skeleton state for selector + detail table.
   - Show empty state if no submissions exist for a class.
   - Add a `GET /assessment-recap/homeroom/:submissionId` route.
   - Keep permission aligned with `ASSESSMENT_READ` and homeroom checks.
1. **Frontend: API Client + Hooks**
   - Add API client and hooks to fetch homeroom recap detail by submission ID.

### Testing Plan

- **Backend**
  - Verify options endpoint returns only active-period submissions.
  - Verify detail endpoint returns consistent assessment types and student rows.
  - Verify homeroom authorization blocks non-homeroom access.
  - Add query keys for detail caching and invalidation.

5. **Frontend: Data Mapping**
   - Transform detail data into `RecapTableRow` to reuse [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher/recap/-components/recap-table.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher/recap/-components/recap-table.tsx).

- **Frontend**
  - Manual UI: selector loads, default selection applies, table renders, actions work.
  - Regression: approve/reject flow invalidates options + detail data.
  - Ensure assessment type averages and final score are computed or passed from the API.

### Risks / Open Questions

### Decision Summary

- Selector fields: Class + Subject - Teacher.
- Default selection: most recent submission for the selected class.
- Period scope: active period only (no period filter).
- Change-request status placement: next to action buttons.
  - Render the table panel (expandable section or modal) with the selected recap’s data.

7. **Frontend: Loading + Empty States**
   - Add a skeleton state for the detail table.
   - Show a friendly empty state if no students are returned.

### Testing Plan

- **Backend**
  - Verify detail endpoint returns consistent assessment types and student rows.
  - Verify homeroom authorization blocks non-homeroom access.

- **Frontend**
  - Manual UI: list loads, detail opens, table renders, and actions still work.
  - Regression: approve/reject flow still invalidates list and detail data.

### Risks / Open Questions

- Decide whether detail view should be inline expansion or modal panel for best usability.
- Confirm whether to return only active period data or allow historical submissions.
