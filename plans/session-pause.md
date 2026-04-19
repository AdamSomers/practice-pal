# Session Pause

**Status:** merged
**Size:** M
**Branch:** feature/studio-settings-2026-04-19
**Version:** v0.2.0

## Requirements
Pause button on the practice session timer. Pausing stops the timer; resume continues from paused elapsed. Toggled by a studio setting "Allow session pausing" (default true). When disabled, pause button is hidden.

## Assumptions
- Stored as `allowPausing` boolean column on studios table, default true.
- Pause state is session-local (not persisted); reload starts timer again from resumed-elapsed baseline via session record.
- Pause button lives in TimerBar next to elapsed display.
- Setting is toggled from StudioSettingsPage.

## Build Plan
1. `server/src/db/schema.ts`: add `allowPausing: boolean('allow_pausing').notNull().default(true)` to studios.
2. Apply SQL: `ALTER TABLE studios ADD COLUMN allow_pausing boolean NOT NULL DEFAULT true;`
3. `server/src/routes/studios.ts` PATCH: accept `allowPausing`.
4. `client/src/lib/types.ts`: add `allowPausing?: boolean` to Studio type.
5. `client/src/lib/api.ts`: `updateStudio` param type includes `allowPausing`.
6. `client/src/components/session/TimerBar.tsx`: add `isPaused` prop and internal logic that stops the tick when paused and adjusts start offset on resume. Add Pause/Play button inside the bar UI.
7. `client/src/pages/SessionPlayerPage.tsx`: add `isPaused` state; load studio (getStudio); pass through to TimerBar; respect studio.allowPausing to show/hide the pause button via a prop on TimerBar.
8. `client/src/pages/StudioSettingsPage.tsx`: add a toggle for "Allow session pausing".

## Acceptance Tests
- [ ] Studio Settings has an "Allow session pausing" toggle, default on.
- [ ] With pausing enabled: Pause button appears in the timer; click pauses; elapsed stops; click resumes without time jump.
- [ ] With pausing disabled: Pause button is hidden.

## Notes
- Staging DB must apply the same ALTER before deploy.
