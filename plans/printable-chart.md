# Printable Chart Format

**Status:** intake
**Size:** M
**Branch:** feature/printable-chart

## Requirements

Each chart on the Charts tab should have a printer icon. Clicking it renders a printable representation of the practice view: items with their details and empty checkboxes. This lets teachers print charts for students who practice without a device.

## Assumptions
- Print view opens in a new browser tab or as a print-friendly overlay
- Uses browser's native print dialog (window.print())
- Layout is optimized for standard letter/A4 paper
- No server-side rendering needed. Client-only feature.
- Chart title, date, and studio name appear in the header
- Each item shows: category icon/label, item title, all config details, empty checkbox grid

## Build Plan

### New Component: PrintableChart
- `client/src/pages/PrintableChartPage.tsx` — Route: `/charts/:id/print`
- Fetches chart data via existing API (GET /charts/:id)
- Renders clean, print-optimized layout:
  - Header: chart title, studio name, date
  - Items list: category label, item details, checkbox grid (empty boxes)
  - Footer: "PracticePal" branding

### Print Styles
- Add `@media print` styles to hide nav, show only chart content
- Clean typography, adequate spacing for handwritten checkmarks
- Checkbox grid rendered as bordered squares

### Integration Points
- **StudioPage ChartsTab**: Add printer icon button to each chart card
- **ChartBuilderPage**: Optionally add print button in header
- **React Router**: Add route for `/charts/:id/print`

### Item Detail Rendering
- Reuse or extract item detail display logic from SessionPlayerPage
- Each category shows its relevant config fields:
  - Scales: key, type, BPM, modifiers
  - Arpeggios: key, type, BPM, modifiers
  - Cadences: key, type, modifiers
  - Repertoire: piece, composer, movement, measures, BPM
  - Sight reading: description, key
  - Theory: label, description
  - Other: label, description
- Notes field shown if present

## Test Plan

### Acceptance Tests
- [ ] Click printer icon on a chart card. New tab opens with printable view.
- [ ] Verify all items display with correct details and empty checkboxes.
- [ ] Use browser print dialog. Verify clean output on paper/PDF.
- [ ] Verify nav elements are hidden in print view.
- [ ] Test with a chart that has items from multiple categories.

### Automated E2E Tests
- Navigate to print page, verify all chart items render
- Verify checkbox count matches item repetitions

## Notes
- This feature pairs well with the repertoire sections feature. If sections are implemented first, the printable view should show section-grouped checkboxes.
