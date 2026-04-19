# Technique Practice Item Category

**Status:** merged
**Size:** L
**Branch:** feature/technique-category
**Version:** v0.2.0

## Requirements
Add a "Technique" practice item category (e.g., Hanon exercises, finger drills). Structurally similar to scales/arpeggios: label, description, optional BPM, repetitions, modifiers.

## Assumptions
- Technique config fields: `label`, `description`, `bpm`.
- Repetitions + modifiers apply (not hidden like theory).
- Icon: Dumbbell (indigo).
- Inserted between Theory and Other in the category picker.

## Build Plan
- `server/src/db/schema.ts`: add `'technique'` to the `chart_category` enum.
- Apply `ALTER TYPE chart_category ADD VALUE 'technique';` to local and staging DBs.
- `client/src/lib/types.ts`: add `'technique'` to `ChartCategory`.
- `client/src/components/chart-builder/CategoryPicker.tsx`: add CATEGORIES entry (Dumbbell icon, indigo).
- `client/src/components/chart-builder/ItemForm.tsx`: add `CATEGORY_LABELS` entry and a `case 'technique'` in `renderCategoryFields` with label, description, BPM fields.
- `client/src/components/chart-builder/ChartItemCard.tsx`: add `case 'technique'` in `getItemLabel`; add `technique` to the description-line condition.
- `client/src/components/session/CheckboxGrid.tsx`: add `case 'technique'` in `getItemDetails` with description and BPM.
- `client/src/pages/PrintableChartPage.tsx`: add `case 'technique'` in `getItemDetails` with label, description, BPM.

## Acceptance Tests
- [ ] Technique appears as a tile in chart builder category picker.
- [ ] Creating a technique item with label, description, BPM, reps, modifiers works.
- [ ] Created technique item shows on chart edit page with description + details.
- [ ] Practice session renders technique item correctly.
- [ ] Printable chart shows technique item.

## Notes
- Enum value addition requires `ALTER TYPE` on staging DB before deploy.
- drizzle-kit push isn't safe in this repo (tries to drop the connect-pg-simple `session` table). Apply ALTER directly via psql.
