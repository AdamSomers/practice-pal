# PracticePal — Music Practice Tracker

## Product Specification v1.1

*Revised 2026-04-19. Aligned with shipped v0.2.0. Offline mode, musical notation rendering, mastery log UI, and performance recordings are deferred (§12). Goals, custom rewards, session emoji rewards, progress-range selector, session pause, and the Technique category are new additions reflecting the shipped app.*

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Team Roles & Personas](#2-team-roles--personas)
3. [User Roles & Access Model](#3-user-roles--access-model)
4. [Data Model](#4-data-model)
5. [Feature Specifications](#5-feature-specifications)
   - 5.1 Authentication & Accounts
   - 5.2 Studios (Shared Collections)
   - 5.3 Practice Chart Builder
   - 5.4 Practice Session Player
   - 5.5 Goals & Progress
   - 5.6 PDF Export
6. [Practice Chart Domain Model](#6-practice-chart-domain-model)
7. [UI/UX Requirements](#7-uiux-requirements)
8. [Technical Architecture](#8-technical-architecture)
9. [Deployment](#9-deployment)
10. [Milestones & Build Order](#10-milestones--build-order)
11. [End-to-End Testing & Mock Data](#11-end-to-end-testing--mock-data)
12. [Deferred / Future Work](#12-deferred--future-work)

---

## 1. Product Overview

PracticePal is a web application for music students, parents, and teachers to create structured weekly practice charts and track practice sessions with gamified, delightful interactions.

### Core Loop

1. **Teacher** (or parent) creates a practice chart for the week.
2. **Student** opens a practice session from the chart.
3. Student works through each item, checking off individual repetitions.
4. Checking boxes triggers playful animations and sounds. A progress indicator advances.
5. A minimum practice timer must elapse before the session can be completed.
6. When all items are checked and the timer is done, a celebratory moment reveals a random emoji reward from categories the owner has enabled.
7. Session data is logged to history and the progress dashboard. Practice toward longer-running goals is tracked separately.

### Key Principles

- **Tablet-first, responsive everywhere**: Must look and work great on iPad/tablet. Also fully functional on phone and desktop browser.
- **Joyful for kids**: The practice session should feel like a game. Animations, sounds, and rewards matter as much as the data model.
- **Simple for teachers and parents**: A teacher should be able to build a week's chart in under two minutes. A parent copying from handwritten notes should find the builder intuitive.

---

## 2. Team Roles & Personas

When implementing this spec, adopt the following perspectives at each stage:

| Role | Focus Area |
|------|-----------|
| **PM (Piano Pedagogy Expert)** | Ensures the domain model correctly represents how piano lessons work. Validates that practice categories and modifiers are accurate and pedagogically useful. |
| **UI/UX Designer** | Owns layout, spacing, color, typography, animation design, and responsive breakpoints. |
| **Front-End Engineer** | Implements the React UI, animations, audio, and responsive layouts. |
| **Back-End Engineer** | Implements the API, database schema, OAuth, and file storage. |
| **QA Engineer** | Writes and runs test plans. Validates cross-device rendering, audio playback, timer accuracy, and data integrity. |

---

## 3. User Roles & Access Model

### 3.1 Authentication

- OAuth login (Google as the primary provider; email/password and Apple are out of scope for v1).
- No anonymous access. All data is tied to an authenticated user.
- First-time login creates an account automatically.
- Development and test builds expose a `POST /api/auth/test-login` route that accepts a `mock_user_id` and bypasses OAuth. This route is gated off in production.

### 3.2 Concepts

- **User**: An authenticated person (teacher, parent, or student).
- **Studio**: A named collection of practice charts belonging to a student's practice life (e.g., "Ada Piano", "Henry Guitar"). A Studio is the unit of sharing.
- **Studio Role**: Each user's relationship to a Studio.
  - `owner` — Created the Studio. Full admin rights. Can delete the Studio. Can invite/remove members.
  - `editor` — Can create, edit, and delete charts. Can start and complete practice sessions. Cannot delete the Studio or manage members.
  - `viewer` — Read-only. Can view charts, sessions, and progress. Cannot edit or practice.

### 3.3 Sharing Flow

1. Owner creates a Studio (e.g., "Ada Piano").
2. Owner invites other users by email.
3. Invited users receive a pending membership. They accept it to join with the assigned role.
4. A user can belong to many Studios. A Studio can have many users.

### 3.4 Example Scenario

- **Adam** (parent) creates Studio "Ada Piano" and Studio "Ada Guitar". He is `owner` of both.
- **Jennah** (mom) is invited as `editor` to "Ada Piano".
- **Katie** (piano teacher) is invited as `editor` to "Ada Piano". Katie also owns Studios for her other students.
- Katie's dashboard shows all Studios she has access to.

---

## 4. Data Model

### 4.1 Entity Relationship Overview

```
User ──< StudioMembership >── Studio ──< PracticeChart ──< ChartItem
                                  │             │
                                  │             └──< PracticeSession ──< SessionCheckoff
                                  │                          │
                                  │                          └── SessionReward (emoji earned)
                                  │
                                  ├──< CustomReward
                                  ├──< Goal
                                  └──< MasteredItem  (schema reserved; no UI yet)
                                          │
                                          └── PerformanceRecording  (schema reserved; no UI yet)
```

### 4.2 Entity Definitions

All tables use UUID primary keys with `defaultRandom()`. Timestamps default to `now()`. Foreign keys cascade on studio deletion unless noted.

#### User
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| email | string | Unique. From OAuth provider or test-login. |
| display_name | string | |
| avatar_url | string | Nullable, from OAuth. |
| created_at | timestamp | |

#### Studio
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| name | string | e.g., "Ada Piano" |
| instrument | string | Nullable, e.g., "Piano", "Guitar" |
| owner_id | FK → User | |
| reward_categories | JSONB (string[]) | Which emoji categories are in play. Default `["animals","music","food"]`. |
| progress_time_range | text | Nullable. `'1w' \| '2w' \| '1mo' \| '3mo' \| '6mo'`. Null defaults to `'1w'`. |
| allow_pausing | boolean | Default `true`. If false, the session timer hides its pause button. |
| created_at | timestamp | |

#### StudioMembership
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| studio_id | FK → Studio | On delete cascade. |
| user_id | FK → User | |
| role | enum | `owner` \| `editor` \| `viewer` |
| invited_by | FK → User | Nullable. |
| accepted_at | timestamp | Null = pending invitation. |
| created_at | timestamp | |

#### PracticeChart
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| studio_id | FK → Studio | On delete cascade. |
| title | string | e.g., "Week of April 18" |
| created_by | FK → User | |
| minimum_practice_minutes | integer | Default 0. Zero = no timer gate. |
| created_at | timestamp | |
| updated_at | timestamp | |

#### ChartItem
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| chart_id | FK → PracticeChart | On delete cascade. |
| category | enum | `scales` \| `arpeggios` \| `cadences` \| `repertoire` \| `sight_reading` \| `theory` \| `technique` \| `other` |
| sort_order | integer | Default 0. |
| config | JSONB | Category-specific structured data. Schema per category in §6. |
| repetitions | integer | Default 5. Ignored for theory (1 implicit checkbox) and for repertoire in sections mode (derived from section × reps). |

#### PracticeSession
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| chart_id | FK → PracticeChart | On delete cascade. |
| user_id | FK → User | |
| started_at | timestamp | |
| completed_at | timestamp | Null = in progress. |
| duration_seconds | integer | Nullable. |
| timer_target_seconds | integer | Snapshot of chart's minimum × 60 at session start. |

#### SessionCheckoff
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| session_id | FK → PracticeSession | On delete cascade. |
| chart_item_id | FK → ChartItem | On delete cascade. |
| repetition_number | integer | 1-based. For sections mode, encoded as `section_index * 100 + rep_number`. |
| checked_at | timestamp | |

#### SessionReward
Emoji earned when a session completes. The emoji is drawn from the studio's enabled `reward_categories`.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| session_id | FK → PracticeSession | On delete cascade. |
| studio_id | FK → Studio | On delete cascade. |
| user_id | FK → User | Who practiced. |
| emoji | text | The actual emoji character(s). |
| category | text | e.g., `animals`, `music`, `food`. |
| earned_at | timestamp | |

#### CustomReward
An owner-defined reward (e.g., "Boba tea trip") that can be attached to a Goal.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| studio_id | FK → Studio | On delete cascade. |
| created_by | FK → User | |
| title | string | |
| emoji | text | Nullable. |
| created_at | timestamp | |

#### Goal
A manually-tracked milestone within a studio. Goals are independent of sessions: completing sessions does not automatically progress goals. Goals are marked complete by hand.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| studio_id | FK → Studio | On delete cascade. |
| created_by | FK → User | |
| title | string | |
| description | string | Nullable. |
| target_date | date | Nullable. |
| reward_type | text | `'emoji'` \| `'custom'`. Default `'emoji'`. |
| reward_emoji | text | Nullable. |
| custom_reward_id | FK → CustomReward | Nullable. **On delete set null** (so the goal retains its snapshot title if the reward is deleted). |
| custom_reward_title | text | Snapshot of the custom reward title at goal creation time. Preserved if the reward is later deleted. |
| completed_at | timestamp | Null = active. |
| completed_by | FK → User | Who marked it complete. |
| created_at | timestamp | |

#### MasteredItem (schema reserved)
Present in the schema for forward compatibility. **No UI in v1.1.** Populated only by seed scripts for a small number of demo accounts. Deferred to a future milestone (§12).

#### PerformanceRecording (schema reserved)
Same status as MasteredItem. Schema exists to keep migrations cumulative; upload and YouTube-link UIs are deferred.

---

## 5. Feature Specifications

### 5.1 Authentication & Accounts

#### Current state
- `POST /api/auth/test-login` accepts `{ mock_user_id }` and creates/finds a user by `<slug>@test.local` email. Used by the login page's "Dev Accounts" grid and by E2E tests.
- Sessions are stored in Postgres via `connect-pg-simple`, keyed by an HTTP-only cookie.
- Logout clears the session.

#### Target state (next milestone)
- OAuth 2.0 login with Google via Passport.js. On first login, auto-create User from OAuth profile (email, display_name, avatar_url).
- Email magic links via Resend, as an alternative for users without Google accounts.
- Test-login route remains available only when `APP_ENV !== 'production'`, gated at router registration time.
- Out of scope for v1: Apple sign-in, password auth.

#### Screens
- **Login page**: App logo + "Sign in with Google" button (currently a disabled placeholder) + "Send magic link" (future) + Dev Accounts grid (test builds only).
- **Profile page**: Not required for v1.1. Logout is exposed from the app shell.

---

### 5.2 Studios (Shared Collections)

#### Requirements
- A user's home screen shows all Studios they belong to.
- Creating a Studio: name (required), instrument (optional).
- Inviting members: enter email + select role (editor/viewer). If the email doesn't match an existing user, an invitation record is created; the user can accept it on next sign-in.
- **Studio Settings** (owner-only unless noted):
  - General: name, instrument.
  - **Allow session pausing**: boolean, default on. When off, the practice timer hides its pause button.
  - Members: list, role change, remove, invite.
  - Danger zone: delete studio (cascades to all charts, sessions, goals, rewards, memberships).
- **On the Goals & Progress page** (owner/editor), there is a Reward Settings panel:
  - **Reward categories**: a multi-select of emoji buckets (`animals`, `music`, `food`, `nature`, `space`, etc.). Controls which pool the session-completion emoji is drawn from.
  - **Custom Rewards**: create/delete rewards that can be attached to goals. Cascade behavior: deleting a custom reward that's been attached to a goal clears the FK but leaves the goal's snapshot title intact.

#### Screens
- **Home / Dashboard**: Card grid of Studios. Each card shows: name, instrument, chart count, last activity. "+ Create Studio" card. Pending invitations appear above the grid.
- **Studio Detail**: Tabs for Charts, Goals & Progress (alias for the per-studio progress page), and Members/Settings (via gear icon).
- **Studio Settings**: Name, instrument, session-pausing toggle, members, danger zone.
- **Goals & Progress**: See §5.5.

---

### 5.3 Practice Chart Builder

This is the most complex editor in the app. It balances power (a teacher specifying detailed musical instructions) with simplicity (a parent copying from handwritten notes).

#### 5.3.1 Categories (Fixed Set)

The builder offers 8 categories. The user adds one or more **items** from any category. Each category has its own structured config fields.

| Category | Purpose | Config Fields |
|----------|---------|--------------|
| **Scales** | Technical drills on a scale | `key`, `type` (major / natural_minor / harmonic_minor / melodic_minor / chromatic / pentatonic / blues / whole_tone / other), `customType` (when `type='other'`), `bpm` (optional), `bpmMax` (optional upper bound), `modifiers[]`, `notes` |
| **Arpeggios** | Technical drills on an arpeggio | `key`, `type` (major / minor / diminished / augmented / dominant_7th / major_7th / minor_7th), `bpm`, `bpmMax`, `modifiers[]`, `notes` |
| **Cadences** | Functional harmony drills | `key`, `keyType` (major / minor), `type` (perfect / plagal / imperfect / deceptive), `modifiers[]`, `notes` |
| **Repertoire** | A piece being learned | `piece`, `composer`, `practiceMode` (`entire` \| `sections`), `sectionCount`, `sectionsRepsEach`, `sectionLabels[]`, `movement`, `bpm`, `bpmMax`, `modifiers[]`, `notes` |
| **Sight Reading** | Timed sight-reading block | `description`, `key`, `modifiers[]`, `notes` |
| **Theory** | Written theory exercise | `label` (topic), `description`. **No repetitions, no modifiers.** |
| **Technique** | Finger drills / Hanon / etude-as-drill | `label`, `description`, `bpm`, `bpmMax`, `modifiers[]`, `notes` |
| **Other** | Catch-all | `label`, `description`, `modifiers[]`, `notes` |

#### 5.3.2 BPM as an Optional Range

Scales, arpeggios, repertoire, and technique expose a **BPM** input. Teachers may enter a single value or a range.

- `bpm` alone → displays as `"120 BPM"`.
- `bpm` + `bpmMax` → displays as `"100-120 BPM"` wherever BPM is rendered (chart card, practice player, printable chart).
- The upper-BPM input is disabled until a lower BPM is entered.

#### 5.3.3 Modifiers

Modifiers are tags applied to any category except theory. They describe *how* to practice. The UI presents them as a chip multi-select with a free-text "custom" option.

Default suggestions: **Left hand, Right hand, Hands together, Contrary motion, Staccato, Legato, Forte, Piano, With metronome, Slow tempo, Performance tempo, Eyes closed, From memory**.

Custom modifiers can be added as free text and render alongside the suggestions.

#### 5.3.4 Repetitions

Every item except Theory has a `repetitions` count. Preset choices: 1, 2, 3, 4, 5, 6, 8, 10. A "More..." option opens a free numeric input (max 99). Default is the student's last-used value (localStorage), falling back to 5.

For **Repertoire** in sections mode, repetitions come from `sectionCount × sectionsRepsEach`; the top-level repetitions field is hidden in the form.

#### 5.3.5 Repertoire Sections Mode

Repertoire items have a practice-mode toggle:

- **Entire piece**: one `repetitions` value like any other item.
- **Sections**: the piece is broken into N numbered sections, each with M reps. Section labels are optional (default: "Section 1", "Section 2", etc.). Section count caps at 20; reps-per-section caps at 10.

Section checkoffs are stored in `session_checkoffs.repetition_number` as `(sectionIndex × 100) + repNumber`, which keeps the integer column usable without schema change.

#### 5.3.6 Builder UI Behavior

- Title auto-suggests "Week of [date]". Minimum practice time: dropdown (0, 10, 15, 20, 25, 30, 45, 60 minutes). 0 = no timer gate.
- "+ Add Item" opens a category picker. Selecting a category opens the item form with that category's fields.
- **Key selector**: Dropdown of all 12 major keys + their relative minors, with enharmonic equivalents shown (F#/Gb).
- **Piece combobox** (repertoire): autocompletes from previously used `(piece, composer)` pairs in this studio.
- Items are displayed as cards. They can be reordered via drag-and-drop.
- Actions per item: edit, duplicate, delete (with confirm).
- Actions per chart: delete (with confirm), duplicate (appends "(copy)" to title, navigates to new chart).
- Draft persistence: unsaved chart-builder state auto-saves to localStorage. A banner is shown when a draft is restored after refresh.
- Leaving with unsaved changes: native `beforeunload` prompt + an in-app modal on route change with Save / Discard / Keep editing.

#### 5.3.7 Musical Notation

Deferred. Current v1.1 renders items typographically (key names, chord symbols as plain text, section labels). See §12.

---

### 5.4 Practice Session Player

This is the screen the student interacts with during practice. It must be **delightful, focused, and distraction-free**.

#### 5.4.1 Session Initialization

- User selects a chart and taps "Start Practice".
- A session is created with `started_at = now()` and `timer_target_seconds` from the chart.
- If an in-progress session exists for this chart (stored in localStorage under `pp_active_session_<chartId>`), it is resumed and all existing checkoffs are restored.

#### 5.4.2 Layout

1. **Timer bar** (top): Counts up from 0:00 toward the target. When the target is reached, the bar turns teal and displays "Minimum time reached." Runs continuously from session start unless paused (§5.4.5).
2. **Practice items list** (main content): Each item renders as a CheckboxGrid tile showing the category icon, label, detail line (key/type/BPM/description as relevant), modifiers, and a row of checkboxes — one per rep, or grouped by section for repertoire in sections mode.
3. **Progress indicator** (between items and the finish button): A horizontal progress bar showing overall percentage. Does not gate completion; it's purely a visual cue.
4. **Finish Session** button (appears when the timer target is met but checkboxes remain): Explicit completion option for sessions where the student has practiced enough but doesn't want to check every box.
5. **Metronome FAB** (fixed bottom-right): Opens the metronome panel (§5.4.6).

#### 5.4.3 Checkbox Interactions

**This is the most important UX in the entire app. Make it magical.**

- **Tap to check**: Tapping an unchecked box checks it immediately (optimistic update; rolls back on server error).
- **Animation**: Each check triggers a satisfying spring animation on the checkbox: the check mark scales in with rotation, and a ring pulse fades out.
- **Sound**: Each check plays a short synthesized tone via the Web Audio API (oscillator-based, ~80–200ms). Uncheck plays a subtly different tone. Sounds are intentionally simple; see §12 for the "varied sound bank" future addition.
- **Uncheck**: Tapping a checked box unchecks it immediately.
- **No timer-lock on last checkbox**: v1.1 does not lock the final checkbox behind the timer. Completion is gated by `allComplete && timerMet`. If the student checks everything before the timer elapses, a banner appears: "Great work! Keep practicing until the timer finishes." They can still complete manually via the Finish button once the timer is met.
- Haptic feedback and a mute toggle are deferred (§12).

#### 5.4.4 Session Completion

When all checkboxes are checked AND the timer target is met (or the user taps Finish after the timer is met):

1. `completeSession` is called: `completed_at = now()`, `duration_seconds` = elapsed.
2. A random emoji reward is claimed from the studio's enabled `reward_categories` (persisted as a `SessionReward`).
3. The **SessionComplete** screen renders: congratulatory message, time practiced, items completed. Confetti is triggered via `canvas-confetti`.
4. Tapping "Done" navigates to the reward reveal: the emoji animates in center-screen; tapping "Collect" returns to the studio.
5. The session record is removed from localStorage.

#### 5.4.5 Session Pause

When the studio's `allow_pausing` setting is `true` (default), the TimerBar renders a pause/resume button inline.

- Pausing freezes the elapsed counter. Time passed while paused is not added to `duration_seconds`.
- Resuming re-anchors `startTimeRef` so the counter continues from the frozen value.
- Pause state is session-local and not persisted. On reload, the timer restarts the paused portion (acceptable trade-off — infrequent case).

#### 5.4.6 Ending Without Finishing

The "End session" control (top-left arrow) shows a confirmation dialog: *"Your current progress will be discarded and no reward will be earned."* Confirming clears the localStorage entry and navigates back to the studio. No database write — the session remains `in_progress` in the database and will expire naturally from the UI.

#### 5.4.7 Metronome

A built-in metronome is available during any session. It is a floating action button that expands into a panel; the panel does not obscure checkbox content.

**Implemented controls:**

1. **BPM display** (large, centered).
2. **Slider** (30–240 BPM).
3. **± buttons** for ±1 BPM.
4. **Tap tempo**: user taps ≥ 2 times; BPM is calculated from the average inter-tap interval over the last 5 taps.
5. **Preset tempo chips**: 60, 72, 80, 92, 100, 108, 120, 132, 144 BPM.
6. **Start / Stop** toggle.
7. **Animated pendulum**: a stylized metronome graphic whose pendulum arm swings back and forth. **The swing rate must match the current BPM** — one full left-to-right-to-left cycle equals two beats. Today's implementation approximates this via a JS-scheduled interval; it drifts slightly from the audio clock at high tempos. Target behavior: the pendulum angle is computed from `audioContext.currentTime` and the next-beat schedule so it stays locked to the audio.

**Implemented under the hood:**

- Audio scheduling uses the Web Audio API with the standard "lookahead" pattern (25ms JS timer, 100ms scheduling horizon, `audioContext.currentTime` as the clock). No `setInterval` for audio.
- Click sound is a short sine-wave oscillator (~50ms). Two-click-set toggle, volume control, and time-signature/downbeat accent are out of scope for v1.1.

---

### 5.5 Goals & Progress

The per-studio Goals & Progress page is the parent- and teacher-facing dashboard. It is also where students see their cumulative rewards.

#### 5.5.1 Stats Cards

Three cards at the top of the page:

- **Total Minutes**: Sum of `duration_seconds` across all completed sessions for this user in this studio, converted to minutes.
- **Sessions**: Count of completed sessions.
- **Day Streak**: Consecutive days with at least one completed session, counting backward from today (or yesterday, if no practice today yet).

#### 5.5.2 Practice Time Chart

A bar chart of practice minutes over a time window. The window is controlled by a **range selector** dropdown:

- `1w` (default) — last 7 days, one bar per day, day-of-week labels.
- `2w` — last 14 days, one bar per day, "MMM D" labels.
- `1mo` — last 30 days, one bar per day, "MMM D" labels.
- `3mo` — last 90 days, **bucketed by week** (Mon-Sun), "MMM D" label of the Monday.
- `6mo` — last 180 days, bucketed by week.

Selection persists via `studios.progress_time_range`. Each studio has its own saved range. Non-owner/editor viewers see the owner's chosen range and cannot change it.

#### 5.5.3 My Rewards

Grid display of all `SessionReward`s earned in this studio by the current user. Each cell shows the emoji and the date earned. A hover/tap reveals the session it came from.

#### 5.5.4 Goals

Goals are **manual milestones**, not automatic counters. A teacher or parent sets a goal ("Play Für Elise section A from memory"), attaches an optional target date and reward, and later marks it complete by hand.

- **Active goals**: Listed in reverse creation order. Each card shows title, description, target date (if set), reward preview (emoji or custom reward title), and actions: **complete** (✓, with confirm), **edit** (pencil), **delete** (trash, with confirm).
- **Completed goals**: Collapsed by default. "N completed" toggle expands the list. Completed goals retain a delete action.
- **Completing a goal**: Requires a confirmation dialog ("Mark this goal complete?"). On confirm, the goal is patched with `completed_at = now()` and `completed_by = currentUser.id`, and the `GoalRewardReveal` overlay celebrates with confetti.
- **Goal form**: Modal with title, description, target date (date picker), and a reward picker. Reward picker has two modes:
  - **Emoji**: choose from a curated grid of goal-reward emojis (🏆, ⭐, 🎉, ...).
  - **Custom**: pick from the studio's existing `CustomReward`s, or create a new one inline. Creating one updates both the form's picker and the Reward Settings panel (remount via refresh key).
- **Editing a goal**: Same form, pre-filled. Submit button reads "Save Changes". Only active goals are editable.

#### 5.5.5 Reward Settings (owner/editor)

Rendered below Goals on the Goals & Progress page, visible only to owner/editor:

- **Reward Categories**: A grid of toggle chips. Selecting categories determines which emoji pool session-rewards draw from. At least one category must be selected (the last one cannot be toggled off).
- **Custom Rewards**: A list of custom rewards with add/delete. Deleting a reward used by a goal succeeds (FK is `ON DELETE SET NULL`); the goal keeps its snapshot `custom_reward_title` so its display is unchanged.

#### 5.5.6 Session History

Link at the bottom of the progress page. Opens a page listing all of the user's practice sessions for the studio, sorted by `started_at` desc. Each row shows: date, chart title, duration, status (completed / in-progress / abandoned — sessions older than 24h without `completed_at`).

---

### 5.6 PDF Export

Any practice chart can be printed via a **printable view** at `/charts/:id/print`.

- A printer icon on each chart card opens this page.
- The page renders a clean, printer-friendly layout: chart title, studio name, date, item list with category, label, details, modifiers, and a row of empty check squares matching the repetition count.
- `@media print` CSS hides the app chrome and buttons, leaving only the chart content.
- Printing uses the browser's `window.print()` flow; no server-side PDF generation. Users who want a real PDF file use their browser's "Save as PDF" printer.

This is intentional: the client-side approach is simpler, has no server overhead, and produces acceptable output. A server-side generator (Puppeteer / react-pdf) is out of scope.

---

## 6. Practice Chart Domain Model

This section documents the JSONB schema for each category's `config` field. This is the source of truth for what the builder UI collects and what the session player renders.

### 6.1 Scales Config
```json
{
  "key": "C Major",
  "type": "major",
  "customType": null,
  "bpm": 80,
  "bpmMax": 100,
  "modifiers": ["Legato", "Forte"],
  "notes": "Focus on evenness"
}
```
`type` values: `major`, `natural_minor`, `harmonic_minor`, `melodic_minor`, `chromatic`, `pentatonic`, `blues`, `whole_tone`, `other`. When `type === 'other'`, `customType` holds the user's free-text scale name (e.g., "Lydian Dominant").

### 6.2 Arpeggios Config
```json
{
  "key": "G Major",
  "type": "major",
  "bpm": 80,
  "bpmMax": null,
  "modifiers": ["Staccato"],
  "notes": ""
}
```
`type` values: `major`, `minor`, `diminished`, `augmented`, `dominant_7th`, `major_7th`, `minor_7th`.

### 6.3 Cadences Config
```json
{
  "key": "D Major",
  "keyType": "major",
  "type": "perfect",
  "modifiers": [],
  "notes": ""
}
```
`keyType`: `major` \| `minor`. `type`: `perfect`, `plagal`, `imperfect`, `deceptive`.

### 6.4 Repertoire Config
```json
{
  "piece": "Sonatina in C Major, Op. 36 No. 1",
  "composer": "Clementi",
  "practiceMode": "sections",
  "sectionCount": 3,
  "sectionsRepsEach": 3,
  "sectionLabels": ["Exposition", "Development", "Recapitulation"],
  "movement": "1st Movement",
  "bpm": 100,
  "bpmMax": null,
  "modifiers": ["With metronome"],
  "notes": ""
}
```
When `practiceMode === 'entire'`, the `section*` fields are ignored and the item uses `ChartItem.repetitions`. When `practiceMode === 'sections'`, the total checkboxes = `sectionCount * sectionsRepsEach`. Section labels are optional; if absent, the player renders "Section 1", "Section 2", etc.

Unlike spec v1.0, v1.1 uses a **uniform** reps-per-section value rather than per-section reps. This was a deliberate simplification of the builder UI; per-section variability is deferred (§12).

### 6.5 Sight Reading Config
```json
{
  "description": "Grade 3 sight reading, 5 minutes",
  "key": "F Major",
  "modifiers": [],
  "notes": ""
}
```
`ChartItem.repetitions` should be set to 1 (a single "done" checkbox).

### 6.6 Theory Config
```json
{
  "label": "Chord inversions",
  "description": "Complete exercises 5–10 in Level 3 Theory Book"
}
```
Theory has **no** `repetitions` field shown in the form and **no** modifiers. The server still stores `repetitions` (defaults to the ItemForm's last value) for schema uniformity, but it's not user-visible.

### 6.7 Technique Config
```json
{
  "label": "Hanon No. 1",
  "description": "Hands together, eyes closed",
  "bpm": 80,
  "bpmMax": null,
  "modifiers": ["Slow tempo"],
  "notes": ""
}
```
Technique behaves like scales/arpeggios: supports modifiers, BPM range, repetitions.

### 6.8 Other Config
```json
{
  "label": "Ear training exercise",
  "description": "Identify intervals: major 3rd, perfect 5th, octave.",
  "modifiers": ["With headphones"],
  "notes": ""
}
```

---

## 7. UI/UX Requirements

### 7.1 Responsive Breakpoints

| Breakpoint | Target | Layout |
|-----------|--------|--------|
| ≥1024px | Desktop | Sidebar navigation + main content area. |
| 768–1023px | Tablet (primary target) | Bottom tab navigation. Single-column content. Generous touch targets. |
| <768px | Phone | Bottom tab navigation. Compact cards. |

### 7.2 Navigation Structure

- **Home** — Studio list
- **Studio Detail** — Charts, Goals & Progress, Settings
- **About** — Info + release notes (linked from the app shell)

A standalone "Practice" top-level tab and a Profile page are deferred.

### 7.3 Color & Visual Design

- **Palette**: Warm purples (primary), teals (accent), warm yellows, white/cream backgrounds.
- **Typography**: Nunito (Google Fonts).
- **Icons**: Lucide.
- **Animations**: Framer Motion. Smooth 200–400ms transitions.
- **Dark mode**: Deferred.

### 7.4 Accessibility

- All interactive elements keyboard-navigable.
- Color contrast WCAG AA.
- Animations must not rely solely on color for state communication.
- Screen-reader accessibility is a known gap; audit deferred.

---

## 8. Technical Architecture

### 8.1 Stack

| Layer | Technology |
|-------|-----------|
| **Front-end** | React 18 + Vite + TypeScript |
| **Styling** | Tailwind CSS v4 (`@theme` syntax) |
| **Routing** | React Router v6 |
| **State** | Zustand (auth store) |
| **Charts** | Recharts |
| **Animations** | Framer Motion + canvas-confetti |
| **Audio** | Web Audio API (oscillator-based synthetic sounds) |
| **Icons** | Lucide React |
| **Back-end** | Express + TypeScript |
| **ORM** | Drizzle |
| **Database** | PostgreSQL 16 (JSONB for config) |
| **Auth** | `express-session` + `connect-pg-simple` (cookie-based). OAuth to come via Passport.js. |
| **Hosting** | Fly.io (practicepal-staging.fly.dev) |
| **PDF** | Client-side printable HTML (browser Save-as-PDF) |

### 8.2 Monorepo Layout

```
server/     # Express API (port 3002 dev, 8080 prod)
  src/
    app.ts, index.ts
    db/schema.ts, db/index.ts
    routes/auth.ts, studios.ts, charts.ts, sessions.ts, progress.ts, goals.ts, rewards.ts
    middleware/auth.ts

client/     # Vite React (port 5174 dev, static build prod)
  src/
    App.tsx, main.tsx, index.css
    lib/api.ts, types.ts, sounds.ts, rewardEmojis.ts
    stores/auth.ts
    components/Layout.tsx, chart-builder/*, session/*, goals/*, rewards/*
    pages/LoginPage.tsx, DashboardPage.tsx, StudioPage.tsx, StudioSettingsPage.tsx,
          ChartBuilderPage.tsx, SessionPlayerPage.tsx, ProgressPage.tsx,
          SessionHistoryPage.tsx, PrintableChartPage.tsx, AboutPage.tsx

scripts/
  seed.ts             # Deterministic seed (mock accounts + realistic musical data)

plans/                # Per-work-item plan files (see CLAUDE.md)
release-notes/        # Per-version release notes, bundled into AboutPage at build time
```

### 8.3 API Design

RESTful JSON at `/api/*`. All endpoints except `/api/auth/*` require authentication. Session cookie is set by `/auth/test-login` (dev) or `/auth/google/*` (future).

**Shipped endpoints:**

```
Auth:
  POST   /auth/test-login           — Dev/test only
  GET    /auth/me                    — Current user
  POST   /auth/logout

Studios:
  GET    /studios                    — List user's studios
  POST   /studios                    — Create
  GET    /studios/:id                — Get details (includes role)
  PATCH  /studios/:id                — Update (owner only): name, instrument, rewardCategories, progressTimeRange, allowPausing
  DELETE /studios/:id                — Soft delete (owner only)
  GET    /studios/:id/members
  POST   /studios/:id/members        — Invite
  PATCH  /studios/:id/members/:uid   — Change role
  DELETE /studios/:id/members/:uid
  POST   /studios/:id/members/accept — Accept pending invitation
  GET    /studios/invitations        — Pending invitations for current user

Charts:
  GET    /charts?studioId=:id
  POST   /charts                     — Create
  GET    /charts/:id                 — With items
  PATCH  /charts/:id                 — Update + item upsert/reorder
  DELETE /charts/:id
  POST   /charts/:id/duplicate
  GET    /charts/repertoire-pieces?studioId=:id  — Autocomplete source

Sessions:
  POST   /sessions                    — Start (body: { chartId })
  GET    /sessions/:id                — With checkoffs
  PATCH  /sessions/:id                — Complete (body: { completedAt, durationSeconds })
  POST   /sessions/:id/checkoffs     — Record checkoff
  DELETE /sessions/:id/checkoffs/:cid — Undo
  POST   /sessions/:id/reward         — Claim session emoji reward

Progress:
  GET    /progress/studios/:id                    — Stats + chart data (accepts ?range=)
  GET    /progress/studios/:id/sessions           — History
  GET    /progress/studios/:id/rewards            — Earned rewards
  GET    /progress/studios/:id/mastery            — Mastery log (no UI yet)
  POST   /progress/studios/:id/mastery            — Add mastery item (no UI yet)

Rewards (custom):
  GET    /rewards?studioId=:id
  POST   /rewards
  DELETE /rewards/:id

Goals:
  GET    /goals?studioId=:id&status=active|completed|all
  POST   /goals
  PATCH  /goals/:id
  POST   /goals/:id/complete
  DELETE /goals/:id
```

### 8.4 Schema Migrations

Drizzle-kit `push` is **not** used for this project — it attempts to drop the `session` table managed by `connect-pg-simple`. Migrations are applied by hand via `psql` using explicit ALTER statements. Every release that changes the schema must include a **Migration Notes** section in its release notes file listing the SQL to run against staging/prod before deploy.

---

## 9. Deployment

### 9.1 Fly.io Setup

- App: `practicepal-staging` (`practicepal-staging.fly.dev`). Two `shared-cpu-1x` / 256MB machines in `sjc`, auto-stop when idle.
- Database: `practicepal-staging-db` (unmanaged Fly Postgres). Internal hostname `practicepal-staging-db.flycast`.
- Secrets: `DATABASE_URL`, `SESSION_SECRET`. OAuth client credentials will be added in the auth milestone.
- Deploy: `npm run deploy:staging` → `fly deploy --app practicepal-staging`.

### 9.2 Environment Variables

```
DATABASE_URL=postgres://practicepal_staging:...@practicepal-staging-db.flycast:5432/practicepal_staging?sslmode=disable
SESSION_SECRET=...
APP_ENV=production
PORT=8080
# Future:
# GOOGLE_OAUTH_CLIENT_ID=...
# GOOGLE_OAUTH_CLIENT_SECRET=...
# RESEND_API_KEY=...
```

### 9.3 Local Dev Port Registry

| Project | Frontend | Backend | DB |
|---------|----------|---------|----|
| practice-pal-team (this) | 5174 | 3002 | `practicepal_team` |

All dev servers bind to `0.0.0.0`, not localhost, so devices on the LAN (`botbox.local`) can reach them.

---

## 10. Milestones & Build Order

### Shipped (v0.1.0 – v0.2.0)

- Foundation: schema, test-login auth, studio CRUD, membership & invitations, responsive shell.
- Chart builder: all 8 categories (including Technique), key selector, modifier chips, repetitions, repertoire sections, drag-and-drop reorder, duplicate, BPM range input, draft persistence, leave-confirm.
- Session player: timer with optional pause, checkbox grid with animations + synthesized sounds, progress indicator, session completion with emoji reward + confetti, in-progress resume, metronome with BPM slider / ± / tap tempo / preset chips / animated pendulum.
- Goals & Progress: stats cards, bar chart with per-studio time-range selector, My Rewards grid, Goal CRUD + edit + confirm-complete + celebration, custom rewards, reward categories, session history, printable chart view.
- Ops: Fly.io deployment, session persistence in Postgres, release-notes pipeline into AboutPage.

### Next: Milestone A — Authentication

- Google OAuth via Passport.js. Auto-create users from profile.
- Email magic-link sign-in via Resend (optional but planned).
- Keep test-login route, gated off when `APP_ENV === 'production'`.
- Wire a "Profile" link in the app shell (logout, email, display name).
- Update E2E tests to use test-login (unchanged).

### Next: Milestone B — End-to-End Testing

See §11. Playwright is required before the app is released publicly. Subtasks:

- Playwright config with three device projects (desktop, tablet, phone).
- Global setup runs `npm run db:reset` and waits on health check.
- Page Object Models for all screens.
- Suite coverage: auth, studios, chart builder, session player, goals/progress, sharing/permissions, edge cases, visual review.
- Visual-regression baselines via `toHaveScreenshot()` after design review.
- GitHub Actions CI running all suites on push/PR.

### Deferred (see §12)

Metronome pendulum-to-audio-clock lock; offline mode; musical notation; mastery UI; performance recordings; varied sound bank; surprise-illustration library; haptic feedback; mute toggle; timer-lock on last checkbox; per-section variable reps for repertoire; Profile page; standalone Practice tab; Ear Training placeholder.

---

## 11. End-to-End Testing & Mock Data

### 11.1 Testing Philosophy

E2E tests serve two consumers:

1. **QA Agent** — Runs Playwright suites headlessly to verify features. Tests must be deterministic, fast to reset, with clear pass/fail output.
2. **UI Design Agent** — Launches the app (headed or dev server) with pre-populated data for visual inspection. Needs realistic, diverse data across accounts. Captures screenshots at every breakpoint for design review.

Both start from a known, reproducible state:

- All mock data is generated by a single deterministic seed (`scripts/seed.ts`), already shipped.
- Database can be torn down and re-seeded in under 10 seconds (`npm run db:reset`).
- OAuth is bypassed via `POST /api/auth/test-login`.
- No external service dependencies.

### 11.2 Mock Account Catalog

The seed script already creates these accounts. Each represents a distinct usage pattern.

#### Tier 1: Empty / Minimal
| Account | Description |
|---------|-------------|
| `blank-alice` | Brand new user. No studios, no charts, no sessions. |
| `blank-bob` | 1 empty studio ("Bob Piano"). |
| `one-chart-carol` | 1 studio, 1 chart with 3 items (scale, repertoire, theory). 0 sessions. |

#### Tier 2: Active Single-Student
| Account | Description |
|---------|-------------|
| `active-dana` | Diligent student. 1 studio. 6 charts across 6 weeks. Current chart uses all 8 categories. 15 completed + 3 abandoned sessions. Custom rewards, goals (active + completed), session rewards, 4 mastered items in schema. |
| `casual-eli` | Casual student. 1 studio, 3 charts, 4 completed short sessions. |

#### Tier 3: Multi-Studio / Sharing
| Account | Description |
|---------|-------------|
| `parent-frank` | Owns "Gina Piano" and "Henry Guitar", each with 4 charts and 9–10 sessions. |
| `teacher-katie` | Editor on 5 student studios + owner of "Katie Demo". Tests cross-studio workflow. |
| `shared-viewer-luna` | Viewer on "Gina Piano". Tests viewer restrictions. |
| `invited-pending-maya` | Has one pending (unaccepted) invitation from Frank. |

#### Tier 4: Edge Cases
| Account | Description |
|---------|-------------|
| `stress-test-nick` | 1 studio, 20 charts, 100 sessions over 6 months. Performance stress. |
| `unicode-olivia` | Display name "Оливия 🎵", unicode studio/chart/piece names. |
| `mid-session-pat` | 1 in-progress session with 7/12 checkoffs and timer mid-run. Tests resume. |

Additional students and children (`student-iris`, `student-jack`, `student-kara`, `child-gina`, `child-henry`) are seeded to populate Katie's and Frank's shared studios.

### 11.3 Seed Data Generator

`scripts/seed.ts` already implements:

- Idempotent (wipes and recreates every run).
- Fast (< 10 seconds).
- Realistic musical data (real piece titles and composers, real scale progressions).
- Deterministic UUIDs (v5 from slugs) and fixed date anchors so screenshots compare stably.

Commands:

```bash
npm run db:push      # Schema sync via drizzle-kit (only for greenfield; see §8.4 caveat)
npm run db:seed      # Wipe + repopulate
npm run db:reset     # Combined
```

The seed does NOT populate `MasteredItem` UI state (since no UI exists yet) beyond what's needed to render Dana's progress page without errors.

### 11.4 Playwright Suites (to build)

Directory layout:

```
tests/e2e/
  fixtures/               # Exported seed data JSON + test assets
  pages/                  # Page Object Models
  helpers/
    auth.ts               # loginAs(mockUserId) helper
    db.ts                 # resetDatabase() / seedDatabase() helpers
    screenshots.ts        # Multi-breakpoint capture
    clock.ts              # Timer manipulation
    global-setup.ts       # One-time setup: db:reset, verify health
  suites/
    01-auth.spec.ts
    02-studios.spec.ts
    03-chart-builder.spec.ts
    04-session-player.spec.ts
    05-goals-progress.spec.ts
    06-pdf-export.spec.ts
    07-sharing-permissions.spec.ts
    08-edge-cases.spec.ts
    09-visual-review.spec.ts
  playwright.config.ts
```

Playwright config projects: `tablet` (iPad Pro 11 — primary target), `phone` (iPhone 14), `desktop` (1440×900 Chrome). Fully parallel. Trace on first retry; screenshot on failure; video on retained failure.

### 11.5 Suite Coverage Checklist

Per-suite critical cases (subset; full cases to be written during the testing milestone):

- **01-auth**: test-login works for each tier; logout clears session; unauthenticated routes redirect.
- **02-studios**: create, rename, delete with confirm, invite, accept, pending state UI, role enforcement.
- **03-chart-builder**: add an item in each of the 8 categories; BPM single and BPM range; modifiers (default + custom); reorder; duplicate item; delete item; duplicate chart; draft persistence survives refresh.
- **04-session-player**: start, resume (`mid-session-pat`), checkbox animation fires, sound doesn't error, progress bar advances, pause & resume, end-session confirm, session completion triggers confetti and reward claim, metronome: BPM slider, ± buttons, tap tempo, preset chips, pendulum visibly animates and its rate changes when BPM changes.
- **05-goals-progress**: stats card values match sum of sessions, range selector persists per-studio, switching studios gives independent range state, goal create / edit / complete / delete, confirm-complete dialog, custom reward created in goal form appears in Reward Settings without reload, reward settings disappear bug does not recur (regression guard), deleting a custom reward used by a goal succeeds and the goal retains its snapshot title.
- **06-pdf-export**: printer icon opens printable view; `@media print` hides chrome; all items render with correct empty check squares.
- **07-sharing-permissions**: owner vs editor vs viewer UI and API enforcement; removing a member revokes access.
- **08-edge-cases**: unicode round-trip; empty chart; rapid check/uncheck doesn't corrupt state; back button during session; very long titles.
- **09-visual-review**: screenshots at all three breakpoints for every significant screen state (empty, populated, mid-session, complete, goals with active+completed, reward settings, range-selector open, etc.).

### 11.6 CI Integration

GitHub Actions workflow running on push/PR:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test, POSTGRES_DB: practicepal_test }
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run db:reset
        env: { DATABASE_URL: postgres://postgres:test@localhost:5432/practicepal_test }
      - run: npm run build
      - run: npx playwright test
        env: { DATABASE_URL: postgres://postgres:test@localhost:5432/practicepal_test, APP_ENV: test }
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: 'tests/e2e/test-results/' }
```

---

## 12. Deferred / Future Work

The following are explicitly out of scope for v1.1 and listed here so the product team remembers them:

### Authentication
- Apple sign-in.
- Password-based auth.

### Session Player Polish
- **Timer-lock on last checkbox**: force the final unchecked box to remain locked until the timer elapses, rather than gating only at the Finish button.
- **Varied sound bank**: 8–12 pre-recorded cheerful clips (xylophone, harp, chime, piano notes) instead of synthesized oscillator tones.
- **Haptic feedback** on mobile (`navigator.vibrate`).
- **Mute toggle** for session FX (metronome has its own volume; this is for the checkbox sounds).
- **Surprise illustration library**: 15–20 cute animal/mythical creature illustrations shown on session completion, replacing the current confetti-only flourish.

### Metronome
- **Pendulum sync to audio clock**: compute swing angle from `audioContext.currentTime` and the scheduled next-beat, rather than from a JS `setInterval`. Current implementation approximates BPM but drifts; the pendulum and audio can desync noticeably above ~160 BPM.
- Dual click-sound sets (Woodblock / Digital) with downbeat accents.
- Volume control for the metronome click.
- Time-signature selector (4/4, 3/4, 2/4, 6/8) with downbeat accenting.
- Auto-suggest BPM from the selected chart item (a "Set to ♩=80" chip).
- Per-studio persistence of last-used BPM, sound, and volume.

### Chart Builder
- **Musical notation rendering**: VexFlow or abcjs integration for key signatures, scale/arpeggio staves, cadence chord symbols. Punt; current Unicode/typographic approach is acceptable for v1.1.
- **Per-section variable reps** for repertoire (currently uniform `reps × sections`).
- **Octaves** and **hands** (RH/LH/HT) fields on scales and arpeggios.
- Tempo marking as free-text (e.g., "♩=80 allegro"), in addition to numeric BPM.

### Progress & Mastery
- **Mastery log UI**: mark items mastered, view trophy case, attach performance recordings (schema exists).
- **Performance recording upload**: file upload via Fly Tigris, or YouTube link embed.
- Calendar heat-map view in addition to the bar chart.

### Offline Mode
- Service Worker app-shell caching.
- IndexedDB (Dexie.js) mirror of studios/charts/sessions.
- Mutation queue + sync-on-reconnect.
- PWA manifest for home-screen install.

### PDF Export
- Server-side PDF generation (Puppeteer / react-pdf) for a native `.pdf` download instead of the browser's Save-as-PDF flow. Punt; current approach is fine.

### Navigation
- **Profile page**: display name, avatar, logout.
- **Practice top-level tab** for quick resume of the most recent active session.
- **Ear Training "Coming Soon"** placeholder card.

### Miscellaneous
- Dark mode.
- Practice streak gamification beyond the day-streak card (badges, milestones).
- Push notifications for new charts or practice reminders.
- Real-time collaboration (live updates when teacher edits while parent views).
- Audio reference recordings attached to chart items.

---

## Appendix A: Release & Versioning

Versioning: `MAJOR.MINOR.PATCH`.

- MAJOR: breaking changes to data model or API contracts.
- MINOR: new features.
- PATCH: bug fixes, polish, minor tweaks.

Each release produces a `release-notes/v<version>.md` file, imported into `client/src/pages/AboutPage.tsx` at build time. Release notes must stay in sync with every commit that lands on main under the unreleased version — amend the file on each merge, not just at version creation. Migration SQL (if any) must be documented in the release notes so staging/prod can apply schema changes before deploy.

## Appendix B: Work Management Process

See `CLAUDE.md` for the full spec. Summary: all work happens on branches, sized S/M/L, tracked in `plans/<slug>.md` files through `intake → (build-planning) → (test-planning) → in-development → awaiting-acceptance → accepted → merged`. Small items batch onto a single branch. Plans are never deleted.
