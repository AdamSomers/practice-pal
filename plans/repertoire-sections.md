# Repertoire Section Practice

**Status:** intake
**Size:** M
**Branch:** feature/repertoire-sections

## Requirements

When practicing a repertoire piece, teachers often break it into sections. Currently, to practice sections separately you must create multiple chart items with different measure ranges. This is cumbersome.

Instead, a single repertoire item should support a "sections" practice mode:
- Radio selector: "Entire piece" vs "Sections"
- If "Entire piece": repetitions apply to the whole piece (current behavior)
- If "Sections": user specifies number of sections and reps per section (same reps for all sections)
- Sections can be simply numbered (Section 1, 2, 3...) or have specific measure ranges
- In practice mode, checkboxes display per-section with the specified reps per section

## Assumptions
- Same number of reps across all sections (no per-section rep count)
- Section labels default to "Section 1", "Section 2" etc. but can optionally specify measure ranges
- Existing repertoire items continue to work as-is (backward compatible, defaulting to "Entire piece")
- The total checkbox count in practice mode = sections x reps_per_section

## Build Plan

### Schema Changes (server/src/db/schema.ts + client/src/lib/types.ts)
Add to ChartItemConfig for repertoire:
- `practiceMode`: "entire" | "sections" (default: "entire")
- `sectionCount`: number (only when mode = "sections")
- `sectionsRepsEach`: number (reps per section, only when mode = "sections")
- `sectionLabels`: string[] (optional, e.g. ["mm. 1-16", "mm. 17-32", ...])

The existing `repetitions` field on chart_items stays as-is for "entire" mode.

### Chart Builder Changes (client/src/components/chart-builder/ItemForm.tsx)
- Add radio group for repertoire: "Entire piece" / "Sections"
- When "Sections" selected:
  - Number input: "How many sections?" (1-20)
  - Number input: "Repetitions per section" (1-10)
  - For each section: optional text input for label (placeholder: "Section N")
- When "Entire piece": current repetitions field (no change)

### Session Player Changes
- **CheckboxGrid** (client/src/components/session/CheckboxGrid.tsx): When item has practiceMode="sections", render a group of checkboxes per section (section label + reps)
- **SessionPlayerPage** (client/src/pages/SessionPlayerPage.tsx): Adjust checkoff logic. Each section's reps are tracked independently. Item is complete when all sections x all reps are checked.
- **Server checkoff** (server/src/routes/sessions.ts): `repetitionNumber` encoding needs to support section+rep. Use encoding: `(sectionIndex * 100) + repNumber` to fit in existing integer field. E.g., section 2 rep 3 = 203.

### Display Changes
- **ChartItemCard**: Show "5 sections x 3 reps" summary when in sections mode
- **Practice mode**: Show section headers between checkbox groups

## Test Plan

### Acceptance Tests
- [ ] Create repertoire item with "Entire piece" mode. Verify it works exactly as before.
- [ ] Create repertoire item with "Sections" mode, 3 sections, 4 reps each. Save chart.
- [ ] Edit the sections item. Verify section count, reps, and labels persist.
- [ ] Practice the sections item. Verify 3 groups of 4 checkboxes appear with section labels.
- [ ] Complete all checkboxes. Verify item shows as complete.
- [ ] Add custom section labels (measure ranges). Verify they display in practice mode.

### Automated E2E Tests
- API: Create chart with sections repertoire item, verify config saved correctly
- API: Start session, record checkoffs with section encoding, verify completion

## Notes
- The repetitionNumber encoding (sectionIndex * 100 + rep) supports up to 99 reps per section and unlimited sections. This is more than sufficient.
- Backward compatibility: items without `practiceMode` default to "entire" behavior.
