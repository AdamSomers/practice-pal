# Chart Builder Draft Persistence

**Status:** awaiting-acceptance
**Size:** S
**Branch:** fix/chart-builder-draft-persistence

## Items
- [ ] Auto-save chart builder state to localStorage on every change (Acceptance: add items to a chart, refresh the page, see items restored)
- [ ] Show "Restored unsaved changes" banner when draft is loaded (Acceptance: refresh mid-edit, see banner)
- [ ] Clear draft after successful save (Acceptance: save chart, navigate away, come back to new chart, no stale draft)
- [ ] Dismiss banner on click (Acceptance: click the banner, it goes away)

## Assumptions
- Draft key format: `pp_chart_draft_{chartId}` for editing, `pp_chart_draft_new_{studioId}` for new charts
- Only one draft per chart/studio at a time (overwrites previous)
- Draft includes: title, minimumMinutes, items array, studioId
- Drafts older than 24 hours are ignored on restore (stale protection)
- No draft persistence for other pages (just chart builder)

## Notes
- ChartBuilderPage.tsx is the only file that needs changes
- localStorage is synchronous and fast, no debounce needed for this data size
