# Progress Graph Time Range

**Status:** merged
**Size:** M
**Branch:** feature/studio-settings-2026-04-19
**Version:** v0.2.0

## Requirements
Time range selector on the Goals & Progress bar chart. Options: 1w, 2w, 1mo, 3mo, 6mo, custom (date range). Persists per studio. Default = 1w.

## Assumptions
- Stored as `progressTimeRange` column on studios table, text column.
- Values: '1w' | '2w' | '1mo' | '3mo' | '6mo' | 'custom:YYYY-MM-DD:YYYY-MM-DD'.
- Default '1w' when column is null.
- The graph aggregates by day for ranges <= 1mo, by week for 3mo, by week for 6mo (keeps bar count reasonable).
- Server endpoint accepts a `range` query parameter; if missing, uses studio's saved value.
- Saving a range updates the studio immediately.

## Build Plan
1. `server/src/db/schema.ts`: add `progressTimeRange: text('progress_time_range')` to studios table.
2. Apply SQL: `ALTER TABLE studios ADD COLUMN progress_time_range text;`
3. `server/src/routes/studios.ts` PATCH: accept `progressTimeRange`.
4. `server/src/routes/progress.ts`: parameterize the weekly query; accept optional `range` query param; compute date window based on range; return `weeklyData` with appropriate day/week buckets and labels matching the range.
5. `client/src/lib/types.ts`: add `progressTimeRange?: string` to Studio type.
6. `client/src/lib/api.ts`: `updateStudio` param type includes `progressTimeRange`. `getProgress` accepts optional range arg.
7. `client/src/pages/ProgressPage.tsx`: add a range selector dropdown at top of chart section; re-fetch progress on change; save to studio.

## Acceptance Tests
- [ ] Range dropdown visible on Goals & Progress page above the bar chart.
- [ ] Selecting a range updates the chart immediately.
- [ ] Refresh preserves the selected range.
- [ ] Custom range opens date pickers and applies correctly.
- [ ] Different studios can have different saved ranges.

## Notes
- Staging DB must apply the same ALTER before deploy.
