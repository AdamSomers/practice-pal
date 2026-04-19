# BPM Range

**Status:** awaiting-acceptance
**Size:** M
**Branch:** feature/bpm-range

## Requirements
BPM on a practice item should optionally be a range. If the teacher sets a lower and upper BPM, display as "100-120"; if just one value, display as "120" (today's behavior).

## Assumptions
- Add a `bpmMax` field to `ChartItemConfig`. Existing `bpm` is the min or sole value.
- Rendering rule: `bpmMax` set → "{bpm}-{bpmMax}"; otherwise → "{bpm}".
- UI: two adjacent number inputs, labeled "BPM (optional)" and "to (optional upper)". Only show "to" visibly when min is set.
- Applies to scales, arpeggios, repertoire (the three places BPM already exists). Technique gets it too (shipped separately).
- Backward compatible with existing items (which only have `bpm`).

## Build Plan
1. `client/src/lib/types.ts` — add `bpmMax?: number` to `ChartItemConfig`.
2. `client/src/components/chart-builder/ItemForm.tsx` — replace the 3 BPM inputs with a new dual-input component.
3. `client/src/components/chart-builder/ChartItemCard.tsx` — replace `{config.bpm} BPM` with a formatted range string.
4. `client/src/components/session/CheckboxGrid.tsx` — same formatting.
5. `client/src/pages/PrintableChartPage.tsx` — same formatting.

## Acceptance Tests
- [ ] Scale/arpeggio/repertoire items allow entering a BPM min and max.
- [ ] Leaving max blank works; displays "{min} BPM".
- [ ] Setting both min and max displays "{min}-{max} BPM" on chart cards, practice player, and printable chart.
- [ ] Existing items without bpmMax still display correctly.

## Notes
- No backend schema change. `bpmMax` lives in the JSONB `config` column.
