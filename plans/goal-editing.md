# Goal Editing

**Status:** merged
**Version:** v0.2.0
**Size:** M
**Branch:** feature/goal-editing

## Requirements
Allow users to edit an existing goal: title, description, target date, and reward.

## Assumptions
- Reuse the existing `GoalForm` modal. A new `initialGoal` prop pre-populates fields and flips the submit button to "Save Changes".
- `PATCH /goals/:id` endpoint already exists. No backend changes needed.
- Edit button appears on active (non-completed) goals only, between Complete and Delete on the card.
- Cancel just closes the modal without saving (same as create).

## Build Plan
- `client/src/components/goals/GoalForm.tsx`: add optional `initialGoal` prop; seed state from it; title becomes "Edit Goal", submit becomes "Save Changes".
- `client/src/components/goals/GoalCard.tsx`: add optional `onEdit` prop and an edit icon button shown on active goals.
- `client/src/pages/ProgressPage.tsx`: track `editingGoal` state; show `GoalForm` when either creating or editing; route onSubmit to `createGoal` or `updateGoal` accordingly.

## Acceptance Tests
- [ ] Pencil icon appears on active goal cards (not on completed goals).
- [ ] Clicking edit opens the GoalForm pre-filled with the goal's current values.
- [ ] Changing fields and submitting updates the goal in place.
- [ ] Canceling leaves the goal unchanged.
- [ ] Switching between emoji and custom reward types preserves the selection.

## Notes
- `updateGoal` already exists in `client/src/lib/api.ts`.
