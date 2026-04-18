# Printable Chart

**Status:** merged
**Size:** M
**Branch:** feature/printable-chart
**Version:** v0.1.0

## Requirements

Teachers need a way to print practice charts for students. Each chart on the Charts tab gets a printer icon; clicking opens a print-friendly view at `/charts/:id/print` with a clean layout optimized for paper.

## Assumptions

- Print view is read-only, no interactive elements beyond Print and Back buttons
- Checkbox grid renders empty bordered squares (not interactive checkboxes) for handwritten checkmarks
- The print route lives inside the ProtectedRoute/Layout wrapper (requires auth)
- Category-specific config fields are rendered as detail lines beneath each item label

## Build Plan

### Files created
- `client/src/pages/PrintableChartPage.tsx` — New page component

### Files modified
- `client/src/App.tsx` — Add route for `/charts/:id/print`
- `client/src/pages/StudioPage.tsx` — Add printer icon button to chart cards in ChartsTab

## Test Plan

### Acceptance Tests
- [ ] Printer icon appears on chart cards in the Charts tab
- [ ] Clicking printer icon navigates to `/charts/:id/print`
- [ ] Print page shows chart title, date, and all items with config details
- [ ] Each item shows empty checkbox squares matching its repetition count
- [ ] Print button triggers browser print dialog
- [ ] Back button returns to previous page
- [ ] `@media print` hides buttons and app chrome, shows only chart content
- [ ] Layout is clean and readable on paper (no colored backgrounds, adequate spacing)

## Notes

- Uses `getItemLabel` from `ChartItemCard.tsx` for consistent item naming
- Uses `CATEGORIES` from `CategoryPicker.tsx` for category labels
- Print CSS uses `@media print` in a `<style>` tag within the component
