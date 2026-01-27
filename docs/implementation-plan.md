## Implementation Plan — Teacher Assessment Scores Skeletons + Suspense Query

### Goal

Add proper loading skeletons to the teacher assessment scores page and migrate its data fetching to `useSuspenseQuery` for a smoother loading experience.

### Scope

- Frontend (academic app): update the teacher assessment scores route to use suspense-driven data fetching and skeleton fallbacks.
- API hooks: add a suspense variant for the assessment scores query hook used on the page.

### Out of Scope

- Backend changes or new endpoints.
- UI redesign beyond skeletons and suspense boundaries.

### Existing Implementation Review

- Teacher assessment scores page is in [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher/assessments/scores/$componentId.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher/assessments/scores/$componentId.tsx).
- The page uses `useAssessmentScores` with `enabled: true`, a manual `isLoading` empty message, and a route-level `pendingComponent` spinner.
- Suspense patterns exist elsewhere with skeleton fallbacks (e.g., [apps/academic/src/routes/\_authed/dashboard/\_sidenavs/admin-staff/settings/customization/index.tsx](apps/academic/src/routes/_authed/dashboard/_sidenavs/admin-staff/settings/customization/index.tsx)).
- Query hooks are located under [apps/academic/src/lib/services/api/assessment-scores](apps/academic/src/lib/services/api/assessment-scores).

### Requirements

- Use `useSuspenseQuery` for the assessment scores data.
- Add skeleton UI that follows design guidelines (flat surfaces, no shadows/borders, surface backgrounds, animate-pulse).
- Preserve existing UX, error handling, and form behavior.

### Implementation Plan

1. **Add Suspense Query Hook**

- Create `useSuspenseAssessmentScores` alongside the current `useAssessmentScores` hook in the assessment scores API module.
- Reuse existing query options and query keys to keep cache behavior consistent.
- Export the suspense hook from the assessment scores index barrel.

2. **Introduce Skeleton Component**

- Add a route-local skeleton component (e.g., `-components/teacher-assessment-scores-skeleton.tsx`).
- Skeleton should cover:
  - Page header and back button area
  - Component/class/subject summary card
  - Data table toolbar placeholder and several rows with input placeholders
- Use `animate-pulse` with surface backgrounds to match the UI system.

3. **Refactor the Route to Use Suspense**

- Split the page into a small wrapper that reads `componentId` and renders a `React.Suspense` boundary.
- Move data fetching into a child component that calls `useSuspenseAssessmentScores`.
- Replace the route `pendingComponent` spinner with the new skeleton to keep a consistent loading experience.
- Remove `isLoading` fallback strings and rely on suspense loading state.

4. **Maintain Accessibility and Errors**

- Keep existing `errorComponent` behavior on the route.
- Ensure skeleton uses semantic structure without extra ARIA unless necessary.
- Preserve current error messaging and feedback dialog usage for submit errors.

### Testing Plan

- Open the assessment scores page and confirm the skeleton appears until data resolves.
- Verify the table renders and inputs populate after loading.
- Save scores and confirm success/error feedback still works.
- Confirm no Suspense or React Query warnings in the console.

### Open Decisions

- None identified; the page has a single query dependency so a single suspense boundary should suffice.
