# Batch S Items - April 19, 2026

**Status:** awaiting-acceptance
**Size:** S (x9)
**Branch:** fix/batch-goals-charts-2026-04-19

## Items

### Goals & Progress
- [x] **BUG: Reward Settings disappears on click** — RewardsLibrary loses local state when parent re-renders after `updateStudio`. Fix by not re-setting studio state redundantly, or by stabilizing the component. Investigate first. (Acceptance: click a category chip or open/close the "New reward" form, Reward Settings stays put)
- [x] **BUG: Can't delete custom reward used in goals** — FK `goals.custom_reward_id` is ON DELETE RESTRICT (default). Change to SET NULL so goals keep their `customRewardTitle` snapshot. Requires schema migration. (Acceptance: delete a custom reward that has been referenced by a goal; succeeds; goal still shows its reward title from the snapshot)
- [x] **Delete completed goals** — Add delete button on completed goals list on ProgressPage, with confirm. Endpoint already exists. (Acceptance: delete a completed goal with confirm; gone on refresh)
- [x] **Confirm goal completion** — Before firing `completeGoal`, show a confirmation dialog. (Acceptance: click complete; see confirm; cancel preserves goal; confirm completes it)

### Practice Sessions
- [x] **Confirm End Session** — Before navigating away from SessionPlayerPage on "End session" click, show a confirm dialog. (Acceptance: click End Session; see confirm; cancel stays on page; confirm exits to studio)

### Chart editing
- [x] **Theory: no repetitions** — Hide the Repetitions section in ItemForm when category is 'theory'. Server does not need changes (repetitions defaults handled). Keep existing data. (Acceptance: edit a theory item, no reps field; existing theory items with reps still save without errors)
- [x] **Theory: no modifiers** — Hide ModifierSelector for theory category. (Acceptance: edit a theory item, no modifiers picker; existing theory items with modifier data render elsewhere fine)
- [x] **Other & Theory description on chart edit view** — ChartItemCard currently shows only `config.label` for these cats. Also show `config.description` beneath. Matches what CheckboxGrid already does in practice mode. (Acceptance: theory/other items show their description line on the chart builder card, truncated like other details)
- [x] **Modifiers: replace "Hands separate" with "Left hand" and "Right hand"** — Update `DEFAULT_SUGGESTIONS` in ModifierSelector. Existing items with "Hands separate" still render fine (free text). (Acceptance: chip list no longer offers "Hands separate"; offers "Left hand" and "Right hand")

## Assumptions
- Delete-custom-reward fix uses FK SET NULL + migration, not a cascade. Goals retain their `customRewardTitle` snapshot so display stays intact.
- Reward Settings bug root cause is RewardsLibrary re-mount on parent state update. Simplest fix: avoid `setStudio(updated)` if it returns the same shape. If that doesn't resolve it, will stabilize via keyed subtree or memo.
- Theory keeps its existing reps/modifiers columns in the DB; we just hide those fields in the form. No data migration.
- Left/Right hand replaces Hands separate; we don't migrate existing items (they continue to render their chip text as-is).

## Notes
- File touchpoints: ProgressPage.tsx (reward bug, delete completed, confirm completion), goals/schema migration (FK), server rewards.ts (safe since FK handles it), SessionPlayerPage.tsx (end confirm), ItemForm.tsx (theory conditionals), ChartItemCard.tsx (description display), ModifierSelector.tsx (list).
