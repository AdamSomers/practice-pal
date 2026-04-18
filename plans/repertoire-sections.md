# Repertoire Section Practice

**Status:** merged
**Size:** M
**Branch:** feature/repertoire-sections
**Version:** v0.1.0

## Requirements

When practicing a repertoire piece, teachers break it into sections. Instead of creating multiple chart items for each section, a single repertoire item should support a "sections" practice mode.

- Repertoire items get a practice mode toggle: "Entire piece" (default) or "Sections"
- In sections mode, the teacher specifies section count (1-20), reps per section (1-10), and optional labels
- During a session, sections mode renders grouped checkboxes with subheadings per section
- Item completion requires all sections x all reps checked
- Backward compatible: existing items without practiceMode default to "entire" behavior

## Assumptions

- Section labels are optional; defaults to "Section 1", "Section 2", etc.
- Repetition number encoding for sections: (sectionIndex * 100) + repNumber. This fits within the existing integer repetitionNumber column with no schema changes.
- No server-side changes needed since repetitionNumber is already a generic integer.

## Build Plan

### Files modified:
1. `client/src/lib/types.ts` - Add practiceMode, sectionCount, sectionsRepsEach, sectionLabels to ChartItemConfig
2. `client/src/components/chart-builder/ItemForm.tsx` - Add practice mode radio group and section config fields for repertoire category
3. `client/src/components/chart-builder/ChartItemCard.tsx` - Show "N sections x M reps" detail for sections mode items
4. `client/src/components/session/CheckboxGrid.tsx` - Render grouped checkboxes per section with subheadings; export helper functions for total calculation
5. `client/src/pages/SessionPlayerPage.tsx` - Use helper functions for total checkbox count and allComplete check

### No files created or deleted.

## Test Plan

### Acceptance Tests
- [ ] Create a new repertoire item. Verify "Practice Mode" toggle appears with "Entire piece" selected by default.
- [ ] Switch to "Sections" mode. Verify section count, reps per section, and section label inputs appear.
- [ ] Set 4 sections, 2 reps each, label the first section "Intro". Save the item.
- [ ] Verify ChartItemCard shows "4 sections x 2 reps" in the detail line.
- [ ] Start a practice session with the sections item. Verify 4 section groups appear with subheadings.
- [ ] Check all checkboxes across all sections. Verify item completion (green checkmark) triggers correctly.
- [ ] Verify progress bar and auto-complete work correctly with sections items.
- [ ] Edit an existing repertoire item (non-sections). Verify it still works as "Entire piece" with no sections UI.
- [ ] Create a mix of sections and non-sections repertoire items on one chart. Verify session handles both correctly.

## Notes

The repetition number encoding (sectionIndex * 100 + repNumber) allows up to 99 reps per section and up to ~21 million sections within a standard integer. The UI caps sections at 20 and reps at 10, so this is well within bounds.
