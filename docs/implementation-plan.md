## Implementation Plan — Recap UI Simplification + Invalid-Items Popup

### Goal

Simplify the recap UI by removing redundant widgets, and provide a compact, actionable popup beside the submission button that lists invalid items and a lightweight status hint.

### Scope

- Frontend only (Academic app).
- Remove the “Tercapai vs Remedial” widget from the insights panel.
- Remove the “Status pengiriman” widget block.
- Add an icon button next to “Kirim ke Wali Kelas” that opens a popup with invalid items and submission status.

### Out of Scope

- Backend changes and new API fields.
- Changes to readiness logic or submission behavior.
- Additional analytics or new report widgets.

### Current Implementation Review

- Recap page renders summary cards, a table, and the insights panel with two sections: “Tercapai vs Remedial” and “Distribusi nilai.”
- Submission action currently lives under the insights column, and a separate “Status pengiriman” widget exists (RecapSubmissionPanel).
- Readiness data is available in `effectiveReadiness` (missing scores, weight validation, isReady) and submission status in `submission`.
- UI components available include `@repo/ui/button` and the new `@repo/ui/popover` components.

### Functional Requirements

1. Remove the “Tercapai vs Remedial” block from the insights panel.
2. Remove the “Status pengiriman” widget from the recap page layout.
3. Add a compact icon button next to the submission button that:
   - Opens a popup listing invalid readiness items.
   - Shows a short submission status line (e.g., Draft / Submitted / Returned + timestamp).
   - Is keyboard and screen-reader accessible.

### UX/Design Requirements

- Keep layout flat (no borders/shadows), use existing surface colors and status colors.
- The popup should be concise: label + value per line, status highlighted with info/success/warning tone.
- Icon button should visually pair with the submit button; keep size consistent with the button height.

### Proposed UI Implementation

- Use `@repo/ui/popover` for the invalid-items popup:
  - `Popover` + `PopoverTrigger asChild` wrapping an icon-only `Button`.
  - `PopoverContent` with a compact custom layout.
- Icon: use a Lucide icon with the `Icon` suffix (e.g., `InfoIcon` or `AlertTriangleIcon`).
- Popup content structure:
  - Header line: “Status pengiriman: <label>” + date if submitted/resubmitted.
  - Separator.
  - Invalid items list:
    - “Nilai kosong”: `{missingScoreCount}` and `{missingStudentCount} siswa` (only if missingScoreCount > 0).
    - “Bobot penilaian”: `{weightTotal}/100` + “OK” or “Periksa”.
    - If `!hasSelection`, show “Filter belum lengkap”.
  - If `isReady`, show a single line “Semua siap dikirim.”

### Data/State Mapping

- Use existing fields from `effectiveReadiness`, `submissionStatus`, `submission?.submittedAt`, and `hasSelection`.
- Derive a short status label from `submissionStatus` (draft/submitted/returned/resubmitted).
- Derive a formatted date using `formatDateLocal` (already used in RecapSubmissionPanel).

### Implementation Tasks

1. **Update RecapInsights**
   - Remove the “Tercapai vs Remedial” card.
   - Remove unused props (`passCount`, `remedialCount`) from `RecapInsights` and its call site.

2. **Remove RecapSubmissionPanel**
   - Remove `RecapSubmissionPanel` usage from the recap page layout.
   - Remove the import in recap route.
   - Decide whether to delete the component file or leave it for potential reuse; prefer removing if no longer used.

3. **Add Submission Info Popup**
   - Import popover components from `@repo/ui/popover` and the chosen icon.
   - Add an icon-only `Button` next to the existing submit button in the insights column.
   - Implement popup content with compact status and invalid items.
   - Ensure `aria-label` on icon button and use `sr-only` text if needed.

4. **Styling/Interaction**
   - Keep alignment and spacing consistent with the current button stack.
   - Use status colors for labels (success/warning/info) without borders/shadows.

### Testing Plan

- Manual UI checks:
  - Popup opens and closes via mouse and keyboard.
  - Correct invalid items display when missing scores or invalid weights.
  - “Semua siap dikirim” appears when ready.
  - Status line updates for draft/submitted/returned/resubmitted.
- Regression checks:
  - Submit button behavior unchanged.
  - Insights chart still renders and layout remains responsive.
