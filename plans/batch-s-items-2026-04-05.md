# Batch S Items - April 2026

**Status:** awaiting-acceptance
**Size:** S (x9)
**Branch:** fix/batch-s-items-2026-04-05

## Items

### Chart Management
- [x] **Delete chart UI** — Add delete button to chart cards on StudioPage ChartsTab. Confirm dialog before delete. API already exists (DELETE /charts/:id). (Acceptance: delete a chart, confirm it's gone on refresh)
- [x] **Duplicate chart UI** — Add duplicate button to chart cards on StudioPage ChartsTab. API already exists (POST /charts/:id/duplicate). Navigate to the new chart after duplication. (Acceptance: duplicate a chart, see the copy appear with "(copy)" suffix)
- [x] **Duplicate practice item** — Add duplicate button to ChartItemCard in chart builder. Copies item config/category/repetitions, appends to end with next sortOrder. (Acceptance: duplicate an item in chart builder, see the copy appear below)

### Category Tweaks
- [x] **Cadences: replace cadence type with key type** — Current cadence types (perfect, plagal, imperfect, deceptive) don't allow specifying major/minor. Replace the "cadence type" selector with a "key type" field (major/minor). Keep the cadence types as-is but add key type. (Acceptance: create a cadence item, see major/minor key type option)
- [x] **Scales: "other" type with text box** — Add "other" option to scale type selector. When selected, show a text input for custom scale name. Store as type: "other", customType: "user text". (Acceptance: select "other" in scales, type custom name, save and re-edit to verify persistence)
- [x] **Rename "Progress" to "Goals & Progress"** — Update nav label in Layout.tsx, StudioPage tabs, and ProgressPage title. (Acceptance: see "Goals and Progress" everywhere that previously said "Progress")

### Practice Mode
- [x] **Show all item details in practice mode** — Currently some details show (BPM, movement, measures). Ensure ALL config fields display: key, type, composer, description, label, measures, movement, BPM, notes, modifiers. Each category should show its relevant fields. (Acceptance: create items with all fields filled, verify they all appear in practice mode)

### Navigation
- [x] **Release notes link in sidebar** — Add a release notes page at /release-notes. Add a link at the bottom of the sidebar (above logout). Page displays release notes from the release-notes/ directory. For now, show a placeholder since no releases exist yet. (Acceptance: see link in sidebar, click to view release notes page)

### Bugs
- [x] **BUG: "No Studios Yet" after navigating away** — After updating a chart, clicking Home shows "No Studios Yet". Refresh goes to login. Likely cause: session cookie not being sent on subsequent API calls, or DashboardPage local state not refreshing. Investigate auth store + API fetch behavior. (Acceptance: update a chart, navigate Home, studios appear correctly)
- [x] **BUG: Session completion not showing in goals** — Not a bug. Goals are manual milestones (create and complete them yourself). Session completions earn rewards (shown in "My Rewards" on the Goals & Progress page). There is no automatic connection between session completion and goal progress. If auto-tracking is desired, that would be a new feature.

## Assumptions
- Delete chart should require a confirmation dialog (not just instant delete)
- Duplicate chart navigates to the duplicated chart for editing
- Cadences: adding key type (major/minor) as a separate field, keeping cadence type (perfect, plagal, etc.) as well
- "Other" scale type stores as `type: "other"` with a `customType` field in config JSONB
- Release notes page will be a simple static page for now, populated as releases happen
- The goals bug may be a display issue rather than a data issue. Will investigate both frontend and backend.

## Notes
- Chart delete/duplicate APIs already existed in server/src/routes/charts.ts. Added `duplicateChart` to client API.
- Practice item duplicate is client-side only during editing (items aren't saved until chart is saved)
- Auth bug fix: Added global 401 handler in `client/src/lib/api.ts` that redirects to `/login` when any non-auth API call returns 401. Previously, expired sessions caused empty state instead of login redirect.
- Goals clarification: Goals are independent manual milestones. Session completions earn emoji rewards shown in "My Rewards". No auto-connection exists between sessions and goals. If Adam wants session-linked goals (e.g., "practice 5 times this week"), that would be a new M-sized feature.
- Used "Goals & Progress" (with ampersand) instead of "Goals and Progress" to keep the tab label short on mobile.
