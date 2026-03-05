# PracticePal — Music Practice Tracker

## Product Specification v1.0

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
   - 5.5 Progress & History
   - 5.6 PDF Export
   - 5.7 Offline Mode
6. [Practice Chart Domain Model](#6-practice-chart-domain-model)
7. [UI/UX Requirements](#7-uiux-requirements)
8. [Technical Architecture](#8-technical-architecture)
9. [Deployment](#9-deployment)
10. [Milestones & Build Order](#10-milestones--build-order)
11. [End-to-End Testing & Mock Data](#11-end-to-end-testing--mock-data)
    - 11.1 Testing Philosophy
    - 11.2 Mock Account Catalog
    - 11.3 Seed Data Generator
    - 11.4 Playwright Test Suites
    - 11.5 Visual Regression & UI Design Review
    - 11.6 Test Scenarios Matrix
    - 11.7 CI Integration
12. [Future Work](#12-future-work)

---

## 1. Product Overview

PracticePal is a web application for music students, parents, and teachers to create structured weekly practice charts and track practice sessions with gamified, delightful interactions.

### Core Loop

1. **Teacher** creates a practice chart for the week (or parent transcribes from lesson notes).
2. **Student** opens a practice session from the chart.
3. Student works through each item, checking off individual repetitions.
4. Checking boxes triggers playful animations and sounds. A progress indicator advances.
5. A minimum practice timer must elapse before the session can be completed.
6. When all items are checked and the timer is done, a celebratory surprise is revealed (confetti + random cute animal or mythical creature illustration).
7. Session data is logged to a history and progress dashboard.

### Key Principles

- **Tablet-first, responsive everywhere**: Must look and work great on iPad/tablet. Also fully functional on phone and desktop browser.
- **Offline-capable**: Full offline mode with local caching and background sync.
- **Joyful for kids**: The practice session experience should feel like a game. Animations, sounds, and rewards matter as much as the data model.
- **Musically literate UI**: Render actual musical notation where appropriate (key signatures, chord symbols, scale patterns). This is not a generic to-do app.

---

## 2. Team Roles & Personas

When implementing this spec, adopt the following perspectives at each stage:

| Role | Focus Area |
|------|-----------|
| **PM (Piano Pedagogy Expert)** | Ensures the domain model correctly represents how piano lessons work. Validates that practice categories, modifiers, and musical rendering are accurate and pedagogically useful. Reviews all terminology. |
| **UI/UX Designer** | Owns layout, spacing, color, typography, animation design, and responsive breakpoints. Ensures the app is beautiful, playful, and intuitive for a child user while remaining powerful for the teacher/parent editor. |
| **Front-End Engineer** | Implements the React UI, offline caching via service workers, musical notation rendering, animations, audio, and responsive layouts. |
| **Back-End Engineer** | Implements the API, database schema, OAuth, real-time sync, file storage, and PDF generation. |
| **QA Engineer** | Writes and runs test plans for every feature. Validates offline mode edge cases, cross-device rendering, audio playback, timer accuracy, and data integrity across sync boundaries. |

---

## 3. User Roles & Access Model

### 3.1 Authentication

- OAuth login (Google as minimum provider; Apple and email/password are nice-to-haves).
- No anonymous access. All data is tied to an authenticated user.
- First-time login creates an account automatically.

### 3.2 Concepts

- **User**: An authenticated person (teacher, parent, or student).
- **Studio**: A named collection of practice charts belonging to a student's practice life (e.g., "Ada Piano", "Ada Guitar"). A Studio is the unit of sharing.
- **Studio Role**: Each user's relationship to a Studio.
  - `owner` — Created the Studio. Full admin rights. Can delete the Studio. Can invite/remove members.
  - `editor` — Can create, edit, and delete charts within the Studio. Can start and complete practice sessions. Cannot delete the Studio or manage members.
  - `viewer` — Read-only. Can view charts, sessions, and progress. Cannot edit or practice.

### 3.3 Sharing Flow

1. Owner creates a Studio (e.g., "Ada Piano").
2. Owner invites other users by email.
3. Invited users receive an invitation (in-app notification + optional email). They accept to join with the assigned role.
4. A user can belong to many Studios. A Studio can have many users.

### 3.4 Example Scenario

- **Adam** (parent) creates Studio "Ada Piano" and Studio "Ada Guitar". He is `owner` of both.
- **Jennah** (mom) is invited as `editor` to "Ada Piano".
- **Katie** (piano teacher) is invited as `editor` to "Ada Piano". Katie also owns Studios for her other students: "Ben Piano", "Carlos Piano", etc.
- Katie's dashboard shows all Studios she has access to. She can quickly create this week's chart for each student.

---

## 4. Data Model

### 4.1 Entity Relationship Overview

```
User ──< StudioMembership >── Studio ──< PracticeChart ──< ChartItem ──< ItemRepetition
                                              │
                                              └──< PracticeSession ──< SessionCheckoff
                                                        │
                                                        └──< PerformanceRecording
```

### 4.2 Entity Definitions

#### User
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| email | string | From OAuth provider |
| display_name | string | |
| avatar_url | string | nullable, from OAuth |
| created_at | timestamp | |

#### Studio
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | string | e.g., "Ada Piano" |
| instrument | string | nullable, e.g., "Piano", "Guitar" |
| owner_id | FK → User | |
| created_at | timestamp | |

#### StudioMembership
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| studio_id | FK → Studio | |
| user_id | FK → User | |
| role | enum | `owner`, `editor`, `viewer` |
| invited_by | FK → User | |
| accepted_at | timestamp | nullable (null = pending invitation) |

#### PracticeChart
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| studio_id | FK → Studio | |
| title | string | e.g., "Week of March 3" |
| created_by | FK → User | |
| minimum_practice_minutes | integer | Timer duration for sessions |
| created_at | timestamp | |
| updated_at | timestamp | |

#### ChartItem
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| chart_id | FK → PracticeChart | |
| category | enum | See §6 for category enum |
| sort_order | integer | Display order within chart |
| config | JSONB | Category-specific structured data. Schema per category defined in §6. |
| repetitions | integer | Number of times to practice this item |

#### PracticeSession
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| chart_id | FK → PracticeChart | |
| user_id | FK → User | Who practiced |
| started_at | timestamp | |
| completed_at | timestamp | nullable (null = in progress) |
| duration_seconds | integer | Actual elapsed practice time |
| timer_target_seconds | integer | Snapshot of chart's minimum_practice_minutes × 60 |

#### SessionCheckoff
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| session_id | FK → PracticeSession | |
| chart_item_id | FK → ChartItem | |
| repetition_number | integer | Which rep (1-based) was checked |
| checked_at | timestamp | |

#### PerformanceRecording
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| studio_id | FK → Studio | |
| chart_item_id | FK → ChartItem | nullable (can be general) |
| user_id | FK → User | |
| type | enum | `file_upload`, `youtube_link` |
| url | string | YouTube URL or path to stored file |
| title | string | |
| notes | text | nullable |
| recorded_at | timestamp | |

#### MasteredItem
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| studio_id | FK → Studio | |
| category | enum | Same as ChartItem.category |
| description | string | e.g., "C Major Scale - 4 octaves" |
| mastered_at | date | |
| recording_id | FK → PerformanceRecording | nullable |

---

## 5. Feature Specifications

### 5.1 Authentication & Accounts

#### Requirements
- OAuth 2.0 login with Google.
- On first login, auto-create User record from OAuth profile.
- Session management via HTTP-only cookies or JWTs with refresh tokens.
- Logout clears local session and cached data.

#### Screens
- **Login page**: Simple, friendly. App logo + "Sign in with Google" button.
- **Profile page**: View display name, email, avatar. Option to log out.

---

### 5.2 Studios (Shared Collections)

#### Requirements
- A user's home screen shows all Studios they belong to, grouped by role.
- Creating a Studio: name (required), instrument (optional).
- Inviting members: enter email + select role (editor/viewer). If the email doesn't match an existing user, the invitation is stored and fulfilled when they sign up.
- Studio settings page (owner only): rename, manage members (change role, remove), delete Studio.
- Deleting a Studio soft-deletes all associated charts and sessions.

#### Screens
- **Home / Dashboard**: Card grid of Studios. Each card shows: Studio name, instrument icon, number of charts, last activity date. "+ Create Studio" card.
- **Studio Detail**: List of practice charts (most recent first). "+ Create Chart" button. Members sidebar or section.
- **Studio Settings**: Name, members list with role badges, invite form, danger zone (delete).

---

### 5.3 Practice Chart Builder

This is the most complex editor in the app. It must balance power (a teacher needs to specify detailed musical instructions) with simplicity (a parent copying from handwritten notes should find it intuitive).

#### 5.3.1 Categories (Fixed Set)

The builder offers these fixed categories. The user adds one or more **items** from any category. Each category has its own structured config fields.

| Category | Config Fields | Notes |
|----------|--------------|-------|
| **Scales** | `key` (e.g., C, F#, Bb), `scale_type` (major, natural minor, harmonic minor, melodic minor, chromatic), `octaves` (1–4), `hands` (RH, LH, HT), `tempo_marking` (free text, e.g., "♩=80"), `modifiers[]` (see modifier list below) | |
| **Arpeggios** | `key`, `arpeggio_type` (major, minor, diminished, dominant 7th, major 7th, minor 7th), `octaves`, `hands`, `tempo_marking`, `modifiers[]` | |
| **Cadences** | `key`, `cadence_type` (I-IV-V-I, I-IV-V7-I, I-ii-V-I, I-vi-IV-V-I, or free text), `inversions` (root, 1st, 2nd, all), `hands` | |
| **Repertoire** | `piece_title`, `composer`, `sections[]` (each: `label` string e.g., "mm. 1–16" or "Section A", `repetitions` integer, `notes` free text e.g., "hands separate, slow"), `modifiers[]` | Repertoire is the main category. A chart typically has 1–3 pieces. |
| **Sight Reading** | `level` (free text, e.g., "Grade 2"), `duration_minutes`, `notes` | |
| **Theory** | `assignment_description` (free text), `due_date` (optional), `completed` (boolean) | This is a checklist item, not a repetition-based item. |
| **Other** | `title`, `description` (free text), `modifiers[]` | Catch-all for anything else the teacher assigns (e.g., "practice test", "rhythm clapping exercise"). |

#### 5.3.2 Modifiers

Modifiers are tags that can be applied to Scales, Arpeggios, Repertoire, and Other items. They describe *how* to practice, not *what* to practice. The UI should present these as a multi-select with common options plus a free-text "custom" option.

**Common modifiers** (present as selectable chips/tags):

- **Dynamics**: piano (p), forte (f), mezzo-forte (mf), crescendo, decrescendo
- **Articulation**: legato, staccato, accent
- **Rhythm**: dotted rhythms, swing, triplets
- **Tempo**: slow, moderate, fast, with metronome
- **Technique**: hands separate (HS), hands together (HT), contrary motion, parallel motion
- **Other**: eyes closed, from memory, with pedal, without pedal

Additionally, allow free-text custom modifiers.

#### 5.3.3 Repetitions

Every item except Theory has a `repetitions` count (default: 3). This determines how many checkboxes appear in the practice session.

For **Repertoire**, repetitions are set *per section*, not per item. So a piece with 3 sections, each with 5 repetitions, produces 15 checkboxes.

#### 5.3.4 Builder UI Behavior

- The builder starts with an empty chart. The user sets: title (auto-suggest "Week of [date]"), minimum practice time (dropdown: 15, 20, 25, 30, 45, 60 minutes).
- A prominent "+ Add Item" button or floating action button opens a category picker.
- Selecting a category opens a form with that category's config fields, pre-populated with sensible defaults.
- **Key selector**: A visual picker showing the circle of fifths or a simple dropdown with all 12 major keys + their relative minors. Enharmonic equivalents shown (e.g., F#/Gb).
- **Modifier selector**: Chip/tag multi-select. Tapping a chip toggles it. A "+" chip opens free text input for custom modifiers.
- Items are displayed as cards in the builder. They can be reordered via drag-and-drop. Each card shows a summary and an edit/delete control.
- **Save** persists the chart. It appears in the Studio's chart list.
- **Duplicate Chart**: Copy an existing chart as a starting point for next week. Clears session history but preserves all items.

#### 5.3.5 Musical Notation Rendering

Where relevant, the builder and session player should render musical information visually:

| Element | Rendering |
|---------|-----------|
| Key signature | Show the key signature on a treble clef staff (sharps/flats on correct lines). Use a music font or SVG rendering. |
| Scale pattern | Show the ascending scale on a single staff (one octave). |
| Arpeggio pattern | Show the arpeggio chord tones on a staff. |
| Cadence / Chord progression | Show chord symbols (e.g., I – IV – V7 – I) and optionally a lead-sheet style staff with block chords. |
| Repertoire | No notation rendering. Title + composer + section labels. |

Use a library like **VexFlow**, **abcjs**, or **Flat.io embed** for rendering. Choose whichever has the smallest bundle size that supports:
- Treble and bass clef
- Key signatures
- Individual notes and chords on a staff
- Chord symbols above the staff

If notation rendering proves too complex for v1, fall back to a clean typographic display using musical Unicode symbols (♯, ♭, ♮) and standard chord notation. This is an acceptable MVP fallback, but notation rendering is the goal.

---

### 5.4 Practice Session Player

This is the screen the student interacts with during practice. It must be **delightful, focused, and distraction-free**.

#### 5.4.1 Session Initialization

- User selects a chart from the Studio and taps "Start Practice".
- A session record is created with `started_at = now()` and `timer_target_seconds` from the chart.
- The session player screen opens full-screen (or near full-screen).

#### 5.4.2 Layout

The session player shows:

1. **Timer bar** (top): Counts up from 0:00 toward the target time. Shows elapsed / target. Fills a progress bar as time passes. When the target is reached, the bar turns green and shows a checkmark. The timer does NOT auto-pause; it runs continuously from session start.

2. **Practice items list** (main content): Scrollable list of all chart items, grouped by category. Each item shows:
   - Category icon + label (e.g., 🎵 Scale: C Major)
   - Musical rendering (see §5.3.5)
   - Modifier tags
   - A row of checkboxes, one per repetition. Labeled "1, 2, 3..." etc.
   - For Repertoire: checkboxes grouped by section.

3. **Progress indicator** (bottom or side): A playful visual showing overall progress. Examples:
   - A garden that grows flowers as boxes are checked.
   - A rocket that ascends toward space.
   - A path with a character walking toward a treasure chest.
   - Choose one and implement it well. It should animate smoothly as progress increases.

4. **Metronome panel** (collapsible, docked to the bottom or accessible via a persistent floating button): A built-in metronome the student can use during practice. See §5.4.6 for full specification.

#### 5.4.3 Checkbox Interactions

**This is the most important UX in the entire app. Make it magical.**

- **Tap to check**: Tapping an unchecked box checks it immediately.
- **Animation**: Each check triggers a small, satisfying animation ON the checkbox itself. Examples: a burst of sparkles, a small bouncing star, a musical note that floats up and fades, a ripple effect. Vary between 3–5 animation variants chosen at random.
- **Sound**: Each check plays a short, cheerful sound effect. Use a bank of 8–12 sounds: short piano notes (different pitches), xylophone tones, harp plucks, a gentle chime, a soft "ding", a playful "pop". Choose at random per check. Sounds must be short (< 500ms) and not annoying on repetition.
- **Haptic feedback** (mobile): Trigger a light haptic tap if the device supports it.
- **Uncheck**: Tapping a checked box unchecks it (with a subtle reverse animation). No sound on uncheck.
- **Disabled state**: If the timer has NOT reached its target, AND all other checkboxes are checked, the LAST remaining unchecked box (or boxes) in the entire session should show a "locked" state with a small tooltip/message: "Keep practicing! Timer finishes in X:XX." The user literally cannot check the final box(es) until the timer is complete. Specifically: the user can check all boxes except the last one freely. The last remaining unchecked box across the entire session becomes locked until the timer elapses.

#### 5.4.4 Session Completion

When ALL checkboxes are checked AND the timer target is met:

1. The progress indicator reaches 100% with a flourish animation.
2. A 1–2 second delay builds anticipation.
3. **Confetti explosion** fills the screen (use a confetti library like `canvas-confetti`).
4. A **surprise illustration** fades in at the center: a cute, randomly selected image of an animal or mythical creature. Examples: a happy otter, a baby dragon, a unicorn, a fox with a piano, a narwhal, a phoenix. Maintain a library of 15–20 such illustrations. Display with a congratulatory message: "Amazing practice, [name]! 🎉" or similar.
5. A "Done" button saves the session (`completed_at = now()`, `duration_seconds` = elapsed time) and returns to the Studio view.

#### 5.4.5 Session Persistence

- Checkoff state is saved in real-time (debounced writes to the server, plus local storage for offline).
- If the user leaves mid-session and returns, all checked boxes and the elapsed timer should be restored.
- Sessions older than 24 hours that are incomplete can be "abandoned" (shown in history as incomplete).

#### 5.4.6 Metronome

A built-in metronome is available during any practice session. It is a first-class feature of the session player, not a separate page or external tool.

##### Metronome UI

The metronome lives in a **collapsible panel** docked to the bottom of the session player (above the progress indicator) or accessible via a persistent floating button (🎵 or metronome icon). Tapping the button expands/collapses the panel. The panel must not obscure checkbox content when expanded — it should push content up or use a slide-over drawer on phone.

The panel contains:

1. **Tempo control**: A large, prominent BPM display (e.g., "♩ = 92") with:
   - A **slider** for continuous adjustment (range: 30–240 BPM).
   - **– / +** buttons for ±1 BPM fine adjustment. Long-press for ±5 BPM rapid adjustment.
   - **Tap tempo**: A "Tap" button. The user taps it rhythmically 4+ times and the BPM is calculated from the average inter-tap interval. The displayed BPM updates in real time as they tap.
   - **Preset tempos**: Tappable labels for standard tempo markings — Largo (50), Adagio (70), Andante (92), Moderato (108), Allegro (132), Vivace (160), Presto (184). Tapping sets the BPM instantly. These serve double duty as a music vocabulary reference for the student.
   - **Smart default**: When a chart item has a `tempo_marking` field with a numeric value (e.g., "♩=80"), the metronome auto-suggests that tempo when the user scrolls to or selects that item. A small "Set to ♩=80" chip appears near the tempo control. Tapping it sets the BPM. This is a suggestion, not automatic — the student chooses when to use it.

2. **Start/Stop toggle**: A large, easy-to-hit play/stop button. Spacebar should also toggle on desktop (only when the metronome panel is expanded, to avoid conflicts with checkbox interaction).

3. **Click sound selector**: Two distinct click sound options, presented as two tappable icons or labeled buttons (e.g., "Woodblock" and "Digital"). The student picks whichever they prefer. The two sounds should be:
   - **Sound A — "Woodblock"**: A warm, natural-sounding click. Emulates a traditional wooden metronome. Slightly resonant, organic character. The downbeat (beat 1) uses a higher-pitched or accented variant of the same sound.
   - **Sound B — "Digital"**: A clean, crisp electronic click. Sharper attack, no resonance. More like a classic Dr. Beat or digital metronome. The downbeat uses a distinct higher-pitched tone.
   - Both sounds need a **downbeat variant** (accented/higher pitch for beat 1) and a **regular beat variant** (beats 2, 3, 4, etc.).
   - The active sound is visually indicated (highlighted border, filled background, etc.).

4. **Volume control**: A small volume slider or a set of 3 discrete volume levels (low / medium / high), controlling only the metronome click volume. This is independent of the checkbox sound effects volume/mute. The metronome should be audible over piano playing, so the default should be medium-high.

5. **Time signature** (stretch goal for v1, but design the UI to accommodate it): A selector for common time signatures — 4/4, 3/4, 2/4, 6/8. Defaults to 4/4. This determines the accent pattern (which beat gets the downbeat sound). If not implemented in v1, hard-code 4/4 and leave a placeholder.

##### Animated Metronome Visual

The panel includes an **animated metronome graphic** that ticks in time with the click. This is not decorative — it provides a visual pulse for the student to follow, especially useful when the volume is low or off.

**Design requirements:**

- **Style**: A stylized, playful illustration of a classic pendulum metronome (the pyramid-shaped kind). Not photorealistic — match the app's illustration style. Rounded edges, warm colors.
- **Animation**: The pendulum arm swings left and right in a smooth arc, synchronized exactly to the BPM. The swing should use an easing curve that mimics real pendulum physics — slightly faster through the center, slightly slower at the extremes. At higher tempos (>160 BPM), the swing arc should narrow so the animation remains readable and doesn't feel frantic.
- **Beat flash**: On each click, the metronome body emits a subtle pulse or glow. On the downbeat, the pulse is slightly larger/brighter.
- **Idle state**: When the metronome is stopped, the pendulum rests at center with a gentle idle sway (very slow, subtle, like breathing). This communicates "I'm ready" without being distracting.
- **Size**: The metronome graphic should be roughly 80–100px tall on tablet/desktop, 60px on phone. It should not dominate the panel — the tempo controls are more important.

##### Technical Implementation

- **Audio engine**: Use Tone.js (already in the tech stack) or the Web Audio API directly. The metronome tick must be sample-accurate — do NOT use `setInterval` or `setTimeout` for audio scheduling. Use the Web Audio API's clock (`audioContext.currentTime`) to schedule clicks ahead of time in a lookahead buffer. This is critical for tempo accuracy. A common pattern is the "scheduling ahead" approach: a JavaScript timer runs at ~25ms intervals and schedules audio events 100ms into the future using the Web Audio API clock.
- **Audio assets**: Pre-load both click sound sets (4 audio samples total: woodblock regular, woodblock accent, digital regular, digital accent) on session start. Use `AudioBuffer` for instant playback.
- **Animation sync**: Drive the pendulum animation from the same scheduling clock as the audio. Use `requestAnimationFrame` and interpolate the pendulum angle based on the current beat position. Do not use CSS animation duration to match BPM — it will drift from the audio.
- **Performance**: The metronome must not cause jank in the rest of the session player. Audio scheduling happens on a dedicated Web Audio thread. Animation is a single `transform: rotate()` on a GPU-composited layer.
- **Persistence**: Remember the last-used BPM, click sound, and volume per-studio in local storage. When the user starts a new session in the same studio, the metronome defaults to their previous settings.

---

### 5.5 Progress & History

#### 5.5.1 Session History

A chronological log of all practice sessions for a Studio.

| Column | Content |
|--------|---------|
| Date | When the session was started |
| Chart | Which chart was used |
| Duration | How long the session lasted |
| Completion | % of items checked off |
| Status | Completed ✅ / In Progress 🔄 / Abandoned ❌ |

Tapping a session shows the detail: which items were checked, timestamps of each checkoff.

#### 5.5.2 Progress Dashboard

A high-level view of practice progress for a Studio. This is the screen a parent or teacher checks weekly.

- **Total practice time**: All-time and for the current week/month. Show as a large, prominent number.
- **Weekly breakdown**: A calendar heat map or bar chart showing practice minutes per day for the past 4–8 weeks.
- **Current focus**: What's on the current chart — summary of keys, pieces, and techniques being worked on.
- **Mastery log**: A running list of items marked as "mastered" (see below). For each, show the date, category, description, and a link to a performance recording if one exists.

#### 5.5.3 Mastery Tracking

- On the chart builder or on the progress page, a teacher/editor can mark a specific skill as "mastered." (e.g., "C Major Scale — 4 octaves — mastered on March 1")
- Mastered items are collected in the Mastery Log.
- For repertoire, mastering a piece can include attaching a **performance recording**: either a file upload (audio or video, stored on the server) or a YouTube link.
- The mastery log is a point of pride. It should feel like a trophy case.

#### 5.5.4 Performance Recordings

- Upload a file: accept audio (mp3, m4a, wav) or video (mp4, mov, webm). Max size: 100 MB. Store on server filesystem or object storage (S3-compatible on Fly.io via Tigris).
- YouTube link: Paste a YouTube URL. Validate the URL format. Embed the video player inline in the mastery log.
- Recordings are associated with a Studio. Optionally linked to a specific chart item.

---

### 5.6 PDF Export

- Any practice chart can be exported as a printable PDF.
- The PDF layout is **independent of the web UI**. It should be optimized for paper:
  - US Letter size (8.5" × 11").
  - Compact layout. No large margins. Maximize use of space.
  - All chart items listed with their details, modifiers, and a row of empty checkboxes for each repetition.
  - Musical notation (if rendered in the web UI) should appear in the PDF.
  - Studio name, chart title, and date at the top.
  - A space at the bottom for notes (free text from the teacher, or just blank lines).
- Use a server-side PDF generation library (e.g., Puppeteer rendering a print-optimized HTML template, or a library like `pdf-lib` or `react-pdf`).

---

### 5.7 Offline Mode

The app must work without an internet connection. This is critical because practice often happens in locations without reliable Wi-Fi.

#### 5.7.1 Offline Capabilities

| Action | Offline Support |
|--------|----------------|
| View cached Studios and charts | ✅ |
| Start and complete a practice session | ✅ |
| Create a new chart | ✅ |
| Edit an existing chart | ✅ |
| View session history and progress | ✅ (cached data only) |
| OAuth login | ❌ (must be online to authenticate) |
| Invite members to a Studio | ❌ |
| Upload performance recordings | ❌ (queued for upload on reconnect) |
| PDF export | ✅ (if using client-side generation) |

#### 5.7.2 Implementation Approach

- **Service Worker**: Register a service worker that caches the app shell (HTML, CSS, JS, fonts, audio files, illustrations).
- **Local Data Store**: Use IndexedDB (via a wrapper like Dexie.js or idb) to store:
  - All Studios the user belongs to
  - All charts in those Studios
  - All in-progress and recent sessions
  - A queue of mutations (creates, updates, checkoffs) made while offline
- **Sync Strategy**:
  - On reconnect, replay the mutation queue against the server API.
  - Use timestamps and last-write-wins for conflict resolution (acceptable for this use case; practice data is rarely edited concurrently).
  - Show a sync indicator in the UI: a small icon showing "synced," "syncing," or "offline (X changes pending)."
- **PWA Manifest**: Include a web app manifest so the app can be installed to the home screen on mobile devices with an app icon.

---

## 6. Practice Chart Domain Model

This section provides the detailed schema for each category's `config` JSONB field. This is the source of truth for what the builder UI must collect and what the session player must render.

### 6.1 Scales Config

```json
{
  "key": "C",
  "accidental": null,        // null | "sharp" | "flat"
  "scale_type": "major",     // "major" | "natural_minor" | "harmonic_minor" | "melodic_minor" | "chromatic"
  "octaves": 2,              // 1–4
  "hands": "HT",             // "RH" | "LH" | "HT"
  "tempo_marking": "♩=80",   // free text, nullable
  "modifiers": ["legato", "forte"],
  "notes": ""                // free text for extra instructions
}
```

### 6.2 Arpeggios Config

```json
{
  "key": "G",
  "accidental": "sharp",
  "arpeggio_type": "major",  // "major" | "minor" | "diminished" | "dominant_7th" | "major_7th" | "minor_7th"
  "octaves": 2,
  "hands": "HT",
  "tempo_marking": null,
  "modifiers": ["staccato"],
  "notes": ""
}
```

### 6.3 Cadences Config

```json
{
  "key": "D",
  "accidental": null,
  "cadence_type": "I-IV-V7-I",  // common patterns or free text
  "inversions": "all",           // "root" | "1st" | "2nd" | "all"
  "hands": "HT",
  "notes": ""
}
```

### 6.4 Repertoire Config

```json
{
  "piece_title": "Sonatina in C Major",
  "composer": "Clementi",
  "sections": [
    {
      "label": "mm. 1–16",
      "repetitions": 5,
      "notes": "hands separate first, then together"
    },
    {
      "label": "mm. 17–32",
      "repetitions": 3,
      "notes": "focus on dynamics"
    }
  ],
  "modifiers": ["with metronome"]
}
```

Note: For Repertoire, `ChartItem.repetitions` is ignored. The repetition counts come from `sections[].repetitions`. The total checkbox count for this item = sum of all section repetitions.

### 6.5 Sight Reading Config

```json
{
  "level": "Grade 2",
  "duration_minutes": 5,
  "notes": "Use the RCM sight reading book, exercises 14–18"
}
```

For sight reading, `ChartItem.repetitions` should be set to 1 (one checkbox — "done"). The real metric is the duration, which is informational.

### 6.6 Theory Config

```json
{
  "assignment_description": "Complete exercises 5–10 in the Theory Book Level 3",
  "due_date": "2025-03-10",
  "completed": false
}
```

Theory items have 1 checkbox (done/not done). The `completed` field in config syncs with the session checkoff.

### 6.7 Other Config

```json
{
  "title": "Ear Training Exercise",
  "description": "Identify intervals: major 3rd, perfect 5th, octave. Use the practice audio tracks.",
  "modifiers": ["with headphones"],
  "notes": ""
}
```

---

## 7. UI/UX Requirements

### 7.1 Responsive Breakpoints

| Breakpoint | Target | Layout |
|-----------|--------|--------|
| ≥1024px | Desktop | Sidebar navigation + main content area. Builder uses two-column layout. |
| 768–1023px | Tablet (primary target) | Bottom tab navigation. Builder uses single-column with expandable sections. Generous touch targets. |
| <768px | Phone | Bottom tab navigation. All single-column. Compact cards. |

### 7.2 Navigation Structure

**Bottom tabs (tablet/phone) or sidebar (desktop):**

1. **Home** — Studio list
2. **Practice** — Start/resume session (quick access to current chart)
3. **Progress** — Dashboard and history
4. **Profile** — Account settings, logout

**Within a Studio:**

- Charts tab (list of charts, + create)
- Progress tab (studio-specific progress)
- Members tab (if owner/editor)
- Mastery tab (trophy case)

### 7.3 Color & Visual Design

- **Palette**: Warm and inviting. Not sterile or corporate. Think: soft purples, teals, warm yellows, with white/cream backgrounds. Avoid primary-color children's app cliché — this should feel refined but friendly.
- **Typography**: A clean sans-serif for UI (e.g., Inter, Nunito). A serif or specialized font for musical elements where appropriate.
- **Icons**: Rounded, friendly line icons. Lucide or Phosphor icon set.
- **Animations**: Smooth, 200–400ms transitions. Use Framer Motion or CSS transitions. No janky or sudden state changes.
- **Dark mode**: Nice-to-have for v2. Not required for v1.

### 7.4 Accessibility

- All interactive elements must be keyboard-navigable.
- Color contrast must meet WCAG AA.
- Checkbox animations must not rely solely on color (use shape changes too).
- Sound effects should be toggleable (mute button in session player).

---

## 8. Technical Architecture

### 8.1 Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Front-end** | React (Next.js or Vite+React) with TypeScript | Component model, ecosystem, SSR optional |
| **Styling** | Tailwind CSS | Responsive utilities, design system speed |
| **State / Offline** | Zustand or Redux Toolkit + IndexedDB (Dexie.js) | Simple state management + offline persistence |
| **Music rendering** | VexFlow or abcjs | Staff notation rendering. Evaluate bundle size. |
| **Animations** | Framer Motion + canvas-confetti | UI transitions + celebration effects |
| **Audio** | Howler.js or Tone.js | Low-latency audio playback for checkbox sounds |
| **Back-end** | Node.js (Express or Fastify) or Python (FastAPI) | REST API. Choose based on team comfort. |
| **Database** | PostgreSQL | Relational data with JSONB for flexible config |
| **Auth** | Passport.js (Google OAuth) or Auth.js (NextAuth) | OAuth flow handling |
| **File storage** | Tigris (Fly.io S3-compatible) or local disk | Performance recording uploads |
| **PDF generation** | Puppeteer (server-side) or @react-pdf/renderer | Print-optimized chart export |
| **Hosting** | Fly.io | Already has an account. Deploy as a single app or separate front-end/back-end. |

### 8.2 API Design

RESTful JSON API. All endpoints require authentication except `/auth/*`.

**Key endpoints:**

```
Auth:
  POST   /auth/google          — Initiate Google OAuth
  GET    /auth/google/callback  — OAuth callback
  POST   /auth/logout           — Clear session
  GET    /auth/me               — Current user profile

Studios:
  GET    /studios               — List user's studios
  POST   /studios               — Create studio
  GET    /studios/:id           — Get studio details
  PATCH  /studios/:id           — Update studio
  DELETE /studios/:id           — Soft-delete studio (owner only)

Studio Members:
  GET    /studios/:id/members         — List members
  POST   /studios/:id/members         — Invite member
  PATCH  /studios/:id/members/:uid    — Change role
  DELETE /studios/:id/members/:uid    — Remove member

Charts:
  GET    /studios/:id/charts          — List charts
  POST   /studios/:id/charts          — Create chart
  GET    /charts/:id                  — Get chart with items
  PATCH  /charts/:id                  — Update chart
  DELETE /charts/:id                  — Delete chart
  POST   /charts/:id/duplicate        — Duplicate chart

Sessions:
  POST   /charts/:id/sessions         — Start session
  GET    /sessions/:id                 — Get session state
  PATCH  /sessions/:id                 — Update session (complete)
  POST   /sessions/:id/checkoffs      — Record checkoff(s)
  DELETE /sessions/:id/checkoffs/:cid  — Undo checkoff

Progress:
  GET    /studios/:id/progress         — Aggregate progress data
  GET    /studios/:id/sessions         — Session history
  GET    /studios/:id/mastery          — Mastery log

Mastery:
  POST   /studios/:id/mastery          — Mark item as mastered
  PATCH  /mastery/:id                  — Update mastery entry
  DELETE /mastery/:id                  — Remove from mastery log

Recordings:
  POST   /studios/:id/recordings       — Upload recording or add YouTube link
  GET    /recordings/:id               — Get recording details
  DELETE /recordings/:id               — Delete recording

Export:
  GET    /charts/:id/export/pdf        — Generate and download PDF

Sync (for offline):
  POST   /sync                         — Submit queued offline mutations
  GET    /sync/state?since=<timestamp> — Get changes since timestamp
```

### 8.3 Offline Sync Protocol

1. Every mutation (create, update, checkoff) is assigned a client-generated UUID and a local timestamp.
2. Mutations are written to IndexedDB immediately and queued for sync.
3. On reconnect, the client POSTs the queue to `/sync` in chronological order.
4. The server applies each mutation, using the client UUID for idempotency (skip if already applied).
5. The server responds with the current state of affected entities.
6. The client reconciles: server state wins for any conflicts.
7. The client clears the synced mutations from the queue.

---

## 9. Deployment

### 9.1 Fly.io Setup

- Deploy as a single Fly.io app (monorepo: API + static front-end served by the same process, or use Fly.io's multi-process support).
- **PostgreSQL**: Use Fly Postgres (managed). Provision a single-node `shared-cpu-1x` instance for development; scale as needed.
- **File Storage**: Use Fly.io Tigris (S3-compatible) for performance recordings. Configure via environment variables.
- **Secrets**: Store OAuth client ID/secret, database URL, and Tigris credentials as Fly.io secrets.
- **Custom Domain**: Optional. Can use `*.fly.dev` for now.
- **SSL**: Automatic via Fly.io.

### 9.2 Environment Variables

```
DATABASE_URL=postgres://...
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
SESSION_SECRET=...
TIGRIS_ACCESS_KEY=...
TIGRIS_SECRET_KEY=...
TIGRIS_BUCKET=...
TIGRIS_ENDPOINT=...
APP_URL=https://practicepal.fly.dev
```

---

## 10. Milestones & Build Order

Build in this order. Each milestone is a deployable, testable increment.

### Milestone 1: Foundation
- [ ] Project scaffolding (monorepo, TypeScript, build tooling)
- [ ] Database schema and migrations
- [ ] Google OAuth login/logout
- [ ] User profile page
- [ ] Studio CRUD (create, list, view, edit, delete)
- [ ] Studio membership (invite, accept, role management)
- [ ] Basic responsive layout shell (navigation, routing)
- [ ] Deploy to Fly.io with Postgres

### Milestone 2: Chart Builder
- [ ] Chart CRUD within a Studio
- [ ] Full builder UI for all 7 categories
- [ ] Key selector component (all 12 major/minor keys with enharmonics)
- [ ] Modifier tag selector component
- [ ] Repetition configuration
- [ ] Repertoire section builder (multiple sections per piece)
- [ ] Drag-and-drop reordering of items
- [ ] Chart duplication
- [ ] Musical notation rendering (VexFlow/abcjs integration — or Unicode fallback for MVP)

### Milestone 3: Practice Session Player
- [ ] Session initialization and timer
- [ ] Checkbox grid rendering for all category types
- [ ] Checkbox animations (3–5 variants, random selection)
- [ ] Sound effects bank (8–12 sounds, random on check)
- [ ] Haptic feedback (mobile)
- [ ] Timer-gated last-checkbox logic
- [ ] Progress indicator (animated visual)
- [ ] Session completion flow: confetti + surprise illustration + congratulatory message
- [ ] Session persistence (resume interrupted sessions)
- [ ] Session saving to database
- [ ] Metronome: BPM slider, +/- buttons, tap tempo, preset tempo labels
- [ ] Metronome: Web Audio API scheduling (not setInterval) for sample-accurate clicks
- [ ] Metronome: Two click sound sets (Woodblock + Digital) with accent/regular variants
- [ ] Metronome: Volume control independent of checkbox sounds
- [ ] Metronome: Animated pendulum synced to audio clock (not CSS duration)
- [ ] Metronome: Auto-suggest tempo from chart item's tempo_marking field
- [ ] Metronome: Persist last-used settings (BPM, sound, volume) per Studio in local storage
- [ ] Metronome: Collapsible panel / floating button, responsive across breakpoints

### Milestone 4: Progress & History
- [ ] Session history list
- [ ] Progress dashboard (total time, weekly breakdown chart, current focus)
- [ ] Mastery log (mark items mastered, view trophy case)
- [ ] Performance recording upload (file + YouTube link)
- [ ] File storage integration (Tigris)

### Milestone 5: PDF Export
- [ ] Print-optimized HTML template for charts
- [ ] Server-side PDF generation
- [ ] Download endpoint
- [ ] Verify: compact layout, all data, notation, checkboxes render correctly on US Letter

### Milestone 6: Offline Mode
- [ ] Service worker registration and app shell caching
- [ ] IndexedDB schema (mirror of server data)
- [ ] Offline data reading (Studios, charts, sessions, progress)
- [ ] Offline chart creation and editing
- [ ] Offline session play (checkoffs stored locally)
- [ ] Mutation queue and sync-on-reconnect
- [ ] Sync status indicator in UI
- [ ] PWA manifest and home-screen installability
- [ ] Conflict resolution testing

### Milestone 7: E2E Testing Infrastructure
- [ ] Playwright config with three device projects (desktop, tablet, phone)
- [ ] Seed data generator script (`scripts/seed.ts`) with all mock accounts from §11.2
- [ ] Test auth bypass route (`POST /auth/test-login`) gated by build flag
- [ ] `npm run db:reset` and `npm run db:seed` commands (< 10 second execution)
- [ ] Page Object Models for all screens
- [ ] Auth and Studios suites (01, 02)
- [ ] Chart Builder suite (03)
- [ ] Session Player suite (04) including clock manipulation for timer tests
- [ ] Progress & History suite (05)
- [ ] PDF Export suite (06)
- [ ] Offline Mode suite (07)
- [ ] Sharing & Permissions suite (08)
- [ ] Edge Cases suite (09)
- [ ] Visual Review suite (10) with screenshot capture at all breakpoints
- [ ] Visual regression baseline established and committed
- [ ] GitHub Actions CI pipeline running all suites on push/PR

### Milestone 8: Polish & QA
- [ ] Cross-device testing (iPad, iPhone, Android tablet, Android phone, desktop Chrome/Firefox/Safari)
- [ ] Accessibility audit (keyboard nav, screen readers, contrast)
- [ ] Animation and audio polish
- [ ] Loading states, empty states, error states for every screen
- [ ] Edge cases: empty studios, no charts, no sessions, expired invitations
- [ ] Performance optimization (lazy loading, code splitting, image optimization)
- [ ] Rate limiting and input validation on all API endpoints
- [ ] Security audit (OWASP basics: CSRF, XSS, injection, auth bypass)

---

## 11. End-to-End Testing & Mock Data

### 11.1 Testing Philosophy

E2E tests serve two distinct consumers in this project, and the testing infrastructure must serve both:

1. **QA Agent** — Runs Playwright test suites headlessly to verify all features work correctly. Tests must be deterministic, fast to reset, and produce clear pass/fail output with actionable error messages.
2. **UI Design Agent** — Launches the app in a browser (headed Playwright or dev server) with pre-populated data to visually inspect screens in various states. Needs to see realistic, diverse data — not just "Test User 1" with one chart. Must be able to capture screenshots at every breakpoint (phone, tablet, desktop) for design review.

Both agents need to start from a **known, reproducible state**. Therefore:

- All mock data is generated by a single deterministic seed script.
- The database can be torn down and re-seeded in under 10 seconds.
- OAuth is bypassed in test mode via a test-only auth route that accepts a mock user ID directly.
- No external service dependencies in tests (no real Google OAuth, no real Tigris). All external services are stubbed.

### 11.2 Mock Account Catalog

The seed script creates the following accounts. Each represents a distinct usage pattern the app must handle gracefully.

#### Tier 1: Empty / Minimal Accounts

| Account | Description | Data |
|---------|-------------|------|
| `blank-alice` | Brand new user. Just signed up. | No Studios, no charts, no sessions. Tests empty states everywhere. |
| `blank-bob` | User with one empty Studio. | 1 Studio ("Bob Piano"), 0 charts. Tests the empty chart list. |
| `one-chart-carol` | User with a single chart, never practiced. | 1 Studio, 1 chart with 3 items (1 scale, 1 repertoire with 2 sections, 1 theory). 0 sessions. Tests chart view, session start. |

#### Tier 2: Active Single-Student Accounts

| Account | Description | Data |
|---------|-------------|------|
| `active-dana` | A diligent student mid-semester. | 1 Studio ("Dana Piano"). 6 charts spanning 6 weeks. Current week's chart has all 7 categories populated. 15 completed sessions with realistic durations (18–45 min). 3 in-progress sessions (abandoned). 4 items in mastery log, 1 with a YouTube recording link. |
| `casual-eli` | A casual student, sparse practice. | 1 Studio. 3 charts over 2 months. 4 completed sessions (short, 15 min). 1 chart with no sessions at all. No mastery items. Tests sparse progress dashboard. |

#### Tier 3: Multi-Studio / Sharing Accounts

| Account | Description | Data |
|---------|-------------|------|
| `parent-frank` | A parent managing two children. | Owns 2 Studios: "Gina Piano" and "Henry Guitar". Each has 4 charts and 8+ sessions. Frank has never practiced himself (he's the parent). Tests multi-studio dashboard, owner management. |
| `teacher-katie` | A piano teacher with 5 students. | Editor on 5 Studios (owned by different parents): "Gina Piano" (Frank's), "Dana Piano", "Iris Piano", "Jack Piano", "Kara Piano". Each has 2–6 charts. Katie can see and edit all of them. Tests the teacher's cross-studio workflow. Also owns her own Studio "Katie Demo" with sample charts she uses as templates. |
| `shared-viewer-luna` | A grandparent with view-only access. | Viewer on "Gina Piano" (Frank's). Can see charts, sessions, progress, mastery. Cannot edit or practice. Tests viewer permissions enforcement. |
| `invited-pending-maya` | A user with a pending invitation. | Account exists, but has 1 pending (unaccepted) Studio invitation from Frank. Tests invitation flow and pending state UI. |

#### Tier 4: Edge Case Accounts

| Account | Description | Data |
|---------|-------------|------|
| `stress-test-nick` | Heavy user for performance testing. | 1 Studio, 20 charts, 100 completed sessions spanning 6 months. Every chart uses all 7 categories with max items. Tests scroll performance, progress chart rendering, history pagination. |
| `unicode-olivia` | Internationalization edge cases. | Display name: "Оливия 🎵". Studio name: "Оливия's Пианино". Chart title: "Неделя 1 — Гаммы & Études". Piece titles include accented characters, CJK, emoji. Tests rendering and storage of non-ASCII data everywhere. |
| `mid-session-pat` | User frozen mid-practice. | 1 Studio, 1 chart, 1 session that is IN PROGRESS: 7 of 12 checkboxes checked, timer at 11:42 of 20:00 target. Tests session resume, timer restoration, locked-last-checkbox state. |

### 11.3 Seed Data Generator

#### Script: `scripts/seed.ts`

A single TypeScript script that populates the database. It must be:

- **Idempotent**: Running it twice produces the same result (wipes and re-creates).
- **Fast**: Completes in < 10 seconds including teardown.
- **Realistic**: Musical data must be pedagogically plausible. No "Scale in the key of AAAA" or "Song by Composer123". Use real keys, real piece titles, real composers, real modifiers that a piano teacher would actually assign.
- **Deterministic**: Uses a fixed random seed so that generated data (session timestamps, durations, checkoff patterns) is identical across runs. This allows screenshot comparison.

#### Commands

```bash
# Full reset: drop all data, recreate schema, seed everything
npm run db:reset

# Seed only (assumes schema exists): wipe data, insert mock accounts + data
npm run db:seed

# Seed a specific tier only (for faster iteration)
npm run db:seed -- --tier 1
npm run db:seed -- --tier 2
npm run db:seed -- --account active-dana

# Generate seed data as JSON (for offline/IndexedDB seeding in tests)
npm run db:seed -- --export json > tests/fixtures/seed-data.json
```

#### Test Auth Bypass

In test/development mode (controlled by `NODE_ENV=test` or `APP_ENV=test`), the API exposes an additional auth route:

```
POST /auth/test-login
Body: { "mock_user_id": "active-dana" }
Response: Sets the same session cookie as real OAuth. Returns user profile.
```

This route **does not exist** in production builds. Guard with a build-time flag, not just an environment variable check.

Playwright tests use this route to authenticate as any mock user instantly, with no OAuth redirect flow.

#### Realistic Musical Content

The seed script should draw from this reference data to populate charts with pedagogically accurate content:

**Scale assignments by difficulty progression**:
- Weeks 1–2: C Major, G Major, F Major (1 octave, HT, slow legato)
- Weeks 3–4: D Major, Bb Major, A minor (2 octaves, HT, adding staccato)
- Weeks 5–6: Eb Major, A Major, E minor harmonic (2 octaves, hands separate then together, forte)
- Later weeks: Chromatic, Db Major, F# minor melodic (3–4 octaves, with dotted rhythms, contrary motion)

**Repertoire examples** (use real, recognizable beginner/intermediate pieces):
- "Für Elise" — Beethoven (sections: mm. 1–22, mm. 23–54, mm. 55–82)
- "Sonatina in C Major, Op. 36 No. 1" — Clementi (Mvt. I, Mvt. II, Mvt. III)
- "Prelude in C Major, BWV 846" — J.S. Bach (mm. 1–19, mm. 20–35)
- "Minuet in G Major" — Petzold/Bach (Section A, Section B)
- "Doctor Gradus ad Parnassum" — Debussy (mm. 1–24, mm. 25–46, mm. 47–end)
- "Maple Leaf Rag" — Joplin (Section A, Section B, Section C, Section D)

**Theory assignments**: "Complete exercises 5–10 in Level 3 Theory Book", "Write out the key signature for all sharp keys", "Identify intervals worksheet, p. 22"

**Mastery log entries**: "C Major Scale — 4 octaves, HT, ♩=120", "G Major Arpeggio — 2 octaves", "'Minuet in G Major' — performance-ready"

### 11.4 Playwright Test Suites

All tests live in `tests/e2e/`. Playwright is the test runner (already available via Claude Code plugin). Tests use the Page Object Model pattern for maintainability.

#### Directory Structure

```
tests/
├── e2e/
│   ├── fixtures/
│   │   ├── seed-data.json          # Exported seed data for reference
│   │   └── test-assets/            # Sample audio/video files for upload tests
│   │       ├── sample-recording.mp3
│   │       └── sample-video.mp4
│   ├── pages/                      # Page Object Models
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   ├── StudioPage.ts
│   │   ├── ChartBuilderPage.ts
│   │   ├── SessionPlayerPage.ts
│   │   ├── ProgressPage.ts
│   │   └── PdfExportPage.ts
│   ├── helpers/
│   │   ├── auth.ts                 # loginAs(mockUserId) helper
│   │   ├── db.ts                   # resetDatabase(), seedDatabase() helpers
│   │   ├── screenshots.ts          # Multi-breakpoint screenshot capture
│   │   └── clock.ts               # Timer manipulation utilities
│   ├── suites/
│   │   ├── 01-auth.spec.ts
│   │   ├── 02-studios.spec.ts
│   │   ├── 03-chart-builder.spec.ts
│   │   ├── 04-session-player.spec.ts
│   │   ├── 05-progress-history.spec.ts
│   │   ├── 06-pdf-export.spec.ts
│   │   ├── 07-offline.spec.ts
│   │   ├── 08-sharing-permissions.spec.ts
│   │   ├── 09-edge-cases.spec.ts
│   │   └── 10-visual-review.spec.ts
│   └── playwright.config.ts
```

#### Playwright Configuration

```typescript
// tests/e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './suites',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  globalSetup: require.resolve('./helpers/global-setup.ts'), // runs db:reset + db:seed
  projects: [
    // Primary: tablet (the design target)
    {
      name: 'tablet',
      use: { ...devices['iPad Pro 11'] },
    },
    // Phone
    {
      name: 'phone',
      use: { ...devices['iPhone 14'] },
    },
    // Desktop
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
```

#### Global Setup / Teardown

```typescript
// tests/e2e/helpers/global-setup.ts
// Runs ONCE before all test suites.
// 1. Starts the app server (or verifies it's running)
// 2. Runs db:reset (schema + seed)
// 3. Waits for health check endpoint to respond

// tests/e2e/helpers/auth.ts
// Helper to login as any mock user:
export async function loginAs(page: Page, mockUserId: string) {
  await page.request.post('/auth/test-login', {
    data: { mock_user_id: mockUserId }
  });
  // Reload to pick up session cookie
  await page.goto('/');
}
```

#### Suite Specifications

Each suite below lists the test cases the QA agent must implement and verify.

---

**Suite 01: Authentication (`01-auth.spec.ts`)**

| Test | Account | Verifies |
|------|---------|----------|
| Login page renders with Google OAuth button | (none) | Login page layout, no broken assets |
| Test-login as `active-dana`, lands on dashboard | `active-dana` | Auth bypass works, dashboard loads |
| Test-login as `blank-alice`, sees empty state | `blank-alice` | Empty dashboard renders correctly |
| Logout clears session, redirects to login | `active-dana` | Session teardown |
| Unauthenticated access to `/studios` redirects to login | (none) | Route protection |

---

**Suite 02: Studios (`02-studios.spec.ts`)**

| Test | Account | Verifies |
|------|---------|----------|
| Create a new Studio with name and instrument | `blank-alice` | Studio CRUD, form submission |
| Studio appears on dashboard after creation | `blank-alice` | Dashboard reactivity |
| View Studio detail page with charts listed | `active-dana` | Chart list rendering, sort order |
| Rename a Studio (owner) | `parent-frank` | Edit flow, persistence |
| Delete a Studio (owner) with confirmation dialog | `blank-bob` | Soft delete, confirmation UX |
| Non-owner cannot see Studio settings | `teacher-katie` on Frank's studio | Permission enforcement in UI |
| Invite a member by email, see pending state | `parent-frank` | Invitation creation |
| Accept a pending invitation | `invited-pending-maya` | Invitation acceptance flow |
| Multi-studio dashboard for teacher shows all Studios | `teacher-katie` | Cross-studio listing (6 Studios) |
| Viewer (`shared-viewer-luna`) sees charts but no edit controls | `shared-viewer-luna` | Viewer role enforcement |

---

**Suite 03: Chart Builder (`03-chart-builder.spec.ts`)**

| Test | Account | Verifies |
|------|---------|----------|
| Create chart with default title "Week of [date]" | `active-dana` | Auto-title, chart creation |
| Set minimum practice time to 25 minutes | `active-dana` | Timer config |
| Add a Scale item: select key (Bb), minor, 2 octaves, HT, add modifiers (legato, forte) | `active-dana` | Key selector, scale config, modifier chips |
| Add an Arpeggio item: dominant 7th, hands separate | `active-dana` | Arpeggio config |
| Add a Cadence item: I-IV-V7-I, all inversions | `active-dana` | Cadence config |
| Add Repertoire: "Für Elise", 3 sections, varying reps per section | `active-dana` | Multi-section builder, per-section reps |
| Add Sight Reading item with level and duration | `active-dana` | Sight reading config |
| Add Theory item with description and due date | `active-dana` | Theory config, date picker |
| Add Other item with custom title and modifier | `active-dana` | Catch-all category |
| Reorder items via drag-and-drop | `active-dana` | Drag-and-drop, sort persistence |
| Edit an existing item, verify changes persist | `active-dana` | Edit flow, update API |
| Delete an item from chart | `active-dana` | Item deletion |
| Duplicate a chart, verify copy has all items but no sessions | `active-dana` | Duplication logic |
| Musical notation renders for scale item (key signature + notes on staff) | `active-dana` | VexFlow/abcjs integration |
| Musical notation renders for cadence item (chord symbols) | `active-dana` | Chord rendering |
| All 12 major keys selectable, enharmonics shown (F#/Gb) | `active-dana` | Key selector completeness |
| Custom free-text modifier can be added | `active-dana` | Custom modifier input |

---

**Suite 04: Session Player (`04-session-player.spec.ts`)**

| Test | Account | Verifies |
|------|---------|----------|
| Start a session, timer begins counting | `one-chart-carol` | Session init, timer start |
| All chart items render with correct checkbox count | `one-chart-carol` | Checkbox grid matches chart data |
| Repertoire sections render separately with per-section checkboxes | `active-dana` | Section-level rendering |
| Checking a box triggers animation (visual change occurs) | `one-chart-carol` | Checkbox animation fires |
| Checking a box plays an audio sound | `one-chart-carol` | Audio playback (verify no JS errors; can't assert audio content) |
| Unchecking a box reverses the check (no sound) | `one-chart-carol` | Uncheck logic |
| Progress indicator advances as boxes are checked | `one-chart-carol` | Progress bar/visual updates |
| Timer-lock: last unchecked box is disabled before timer elapses | `one-chart-carol` | Timer gating — use Playwright clock to verify lock state |
| Timer-lock: after fast-forwarding clock past target, last box becomes enabled | `one-chart-carol` | Timer gating unlock — use `page.clock.fastForward()` |
| Completion: all boxes checked + timer done → confetti + surprise illustration | `one-chart-carol` | End-of-session celebration |
| Surprise illustration is a visible image element with non-zero dimensions | `one-chart-carol` | Image asset loaded |
| Congratulatory message includes user's name | `one-chart-carol` | Personalized message |
| Session saved: `completed_at` and `duration_seconds` persisted | `one-chart-carol` | API persistence |
| Resume mid-session: login as `mid-session-pat`, verify 7/12 boxes checked, timer at ~11:42 | `mid-session-pat` | Session resume, state restoration |
| Mute button disables sound effects | `one-chart-carol` | Mute toggle |
| Metronome panel opens and closes via toggle button | `one-chart-carol` | Panel expand/collapse |
| Metronome BPM slider adjusts displayed tempo | `one-chart-carol` | Slider control, BPM display updates |
| Metronome +/- buttons adjust BPM by 1 | `one-chart-carol` | Fine adjustment |
| Metronome tap tempo: 4 taps at ~120 BPM sets tempo to ~120 | `one-chart-carol` | Tap tempo calculation (use Playwright's `page.click` with timed delays) |
| Metronome preset tempo buttons set BPM (tap "Allegro" → 132) | `one-chart-carol` | Preset selection |
| Metronome start/stop toggles audio (verify no JS errors on start/stop cycle) | `one-chart-carol` | Playback toggle |
| Metronome click sound selector switches between Woodblock and Digital | `one-chart-carol` | Sound variant toggle, active state indicator |
| Metronome volume control changes level | `one-chart-carol` | Volume slider/buttons |
| Metronome animated pendulum is visible and has CSS transform when playing | `one-chart-carol` | Animation element present with dynamic transform |
| Metronome auto-suggests tempo from chart item's tempo_marking | `active-dana` | Smart default chip appears for item with ♩=80 |
| Metronome settings persist across sessions in same Studio | `active-dana` | LocalStorage persistence (set BPM → end session → start new → verify BPM) |

---

**Suite 05: Progress & History (`05-progress-history.spec.ts`)**

| Test | Account | Verifies |
|------|---------|----------|
| Session history shows all sessions with correct status icons | `active-dana` | History list rendering |
| Completed sessions show ✅, in-progress show 🔄 | `active-dana` | Status differentiation |
| Total practice time displayed, matches sum of session durations | `active-dana` | Aggregation accuracy |
| Weekly breakdown chart renders with data points | `active-dana` | Chart/graph rendering |
| Mastery log shows 4 mastered items | `active-dana` | Mastery list |
| Mastery entry with YouTube link renders embedded player | `active-dana` | YouTube embed |
| Mark a new item as mastered from progress page | `active-dana` | Mastery creation flow |
| Empty progress page renders correctly | `blank-bob` | Empty state |
| Sparse progress (few sessions) renders without broken layout | `casual-eli` | Sparse data handling |
| Stress test: 100 sessions render without excessive lag (< 3s load) | `stress-test-nick` | Performance threshold |

---

**Suite 06: PDF Export (`06-pdf-export.spec.ts`)**

| Test | Account | Verifies |
|------|---------|----------|
| Export button triggers PDF download | `active-dana` | Download flow |
| Downloaded PDF is a valid PDF file (check magic bytes / MIME type) | `active-dana` | File integrity |
| PDF contains chart title, studio name, date | `active-dana` | Header content |
| PDF contains all chart items with modifiers and repetition checkboxes | `active-dana` | Content completeness |
| PDF fits on US Letter without clipping | `active-dana` | Page size |
| PDF for a chart with all 7 categories renders all sections | `active-dana` | Full-category coverage |

---

**Suite 07: Offline Mode (`07-offline.spec.ts`)**

| Test | Account | Verifies |
|------|---------|----------|
| After loading app online, going offline still renders cached dashboard | `active-dana` | Service worker cache |
| Charts are viewable offline | `active-dana` | IndexedDB read |
| Start and complete a practice session offline | `active-dana` | Offline session play |
| Create a new chart offline | `active-dana` | Offline creation |
| Reconnect: offline session syncs to server | `active-dana` | Mutation queue replay |
| Reconnect: offline chart syncs to server | `active-dana` | Mutation queue replay |
| Sync status indicator shows "offline (X changes pending)" | `active-dana` | UI indicator |
| Sync status indicator shows "synced" after reconnect | `active-dana` | UI indicator update |

Use Playwright's `page.context().setOffline(true/false)` to toggle connectivity.

---

**Suite 08: Sharing & Permissions (`08-sharing-permissions.spec.ts`)**

| Test | Account | Verifies |
|------|---------|----------|
| Owner can invite, editor cannot | `parent-frank` vs `teacher-katie` | Role-based UI |
| Editor can create chart in shared Studio | `teacher-katie` on "Gina Piano" | Editor write access |
| Editor can start a practice session in shared Studio | `teacher-katie` | Editor session access |
| Viewer cannot see "Create Chart" or "Start Practice" buttons | `shared-viewer-luna` | Viewer restrictions |
| Viewer cannot POST to chart creation API endpoint (403) | `shared-viewer-luna` | API-level enforcement |
| Removing a member revokes their access immediately | `parent-frank` removes `shared-viewer-luna` | Access revocation |
| Teacher sees all 6 Studios on their dashboard | `teacher-katie` | Multi-studio aggregation |

---

**Suite 09: Edge Cases (`09-edge-cases.spec.ts`)**

| Test | Account | Verifies |
|------|---------|----------|
| Unicode Studio and chart names render correctly | `unicode-olivia` | i18n rendering |
| Unicode content round-trips through API (create → read) | `unicode-olivia` | Storage encoding |
| Chart with 0 items shows helpful empty state | `blank-bob` (create empty chart) | Empty chart UX |
| Session on a chart with only 1 checkbox (Theory item) | `one-chart-carol` | Single-checkbox edge case |
| Rapidly checking/unchecking boxes does not corrupt state | `one-chart-carol` | Debounce / race condition |
| Browser back button during session does not lose data | `one-chart-carol` | Navigation safety |
| Two browser tabs open on same session (last write wins) | `active-dana` | Concurrency handling |
| Very long piece title / modifier text does not overflow layout | custom inline data | Layout robustness |

---

**Suite 10: Visual Review (`10-visual-review.spec.ts`)**

This suite is specifically for the **UI Design Agent**. It does not assert functional correctness. Instead, it navigates through every significant screen state and captures full-page screenshots at all three breakpoints. The design agent reviews these screenshots to make aesthetic and UX decisions.

```typescript
// Conceptual structure of the visual review suite

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet:  { width: 1194, height: 834 },  // iPad Pro 11"
  phone:   { width: 390,  height: 844 },  // iPhone 14
};

const VISUAL_SCENARIOS = [
  // Empty states
  { name: 'dashboard-empty',        user: 'blank-alice',      path: '/' },
  { name: 'studio-no-charts',       user: 'blank-bob',        path: '/studios/:id' },
  
  // Populated states  
  { name: 'dashboard-multi-studio', user: 'parent-frank',     path: '/' },
  { name: 'dashboard-teacher',      user: 'teacher-katie',    path: '/' },
  { name: 'studio-with-charts',     user: 'active-dana',      path: '/studios/:id' },
  
  // Chart builder
  { name: 'builder-empty',          user: 'active-dana',      path: '/charts/new' },
  { name: 'builder-populated',      user: 'active-dana',      path: '/charts/:id/edit' },
  { name: 'builder-key-selector',   user: 'active-dana',      action: 'open key picker' },
  { name: 'builder-modifier-chips', user: 'active-dana',      action: 'open modifier selector' },
  
  // Session player
  { name: 'session-fresh-start',    user: 'one-chart-carol',  action: 'start session' },
  { name: 'session-mid-progress',   user: 'mid-session-pat',  path: '/sessions/:id' },
  { name: 'session-timer-locked',   user: 'one-chart-carol',  action: 'check all but last, timer not done' },
  { name: 'session-metronome-closed', user: 'one-chart-carol', action: 'start session, metronome panel collapsed' },
  { name: 'session-metronome-open',   user: 'one-chart-carol', action: 'start session, expand metronome panel' },
  { name: 'session-metronome-playing', user: 'one-chart-carol', action: 'metronome playing at 120 BPM, pendulum mid-swing' },
  { name: 'session-complete',       user: 'one-chart-carol',  action: 'complete session (with confetti)' },
  
  // Progress & history
  { name: 'progress-active',        user: 'active-dana',      path: '/studios/:id/progress' },
  { name: 'progress-sparse',        user: 'casual-eli',       path: '/studios/:id/progress' },
  { name: 'progress-heavy',         user: 'stress-test-nick', path: '/studios/:id/progress' },
  { name: 'history-list',           user: 'active-dana',      path: '/studios/:id/sessions' },
  { name: 'mastery-log',            user: 'active-dana',      path: '/studios/:id/mastery' },
  
  // Sharing & members
  { name: 'studio-members',         user: 'parent-frank',     path: '/studios/:id/members' },
  { name: 'invite-modal',           user: 'parent-frank',     action: 'open invite dialog' },
  { name: 'pending-invitation',     user: 'invited-pending-maya', path: '/' },
  
  // Special
  { name: 'login-page',             user: null,               path: '/login' },
  { name: 'profile-page',           user: 'active-dana',      path: '/profile' },
  { name: 'ear-training-coming-soon', user: 'active-dana',    path: '/ear-training' },
  { name: 'unicode-content',        user: 'unicode-olivia',   path: '/studios/:id' },
];

// For each scenario × each viewport:
//   1. Set viewport
//   2. Login as user (or stay logged out)
//   3. Navigate to path or perform action
//   4. Wait for network idle + animations to settle
//   5. Capture full-page screenshot to: screenshots/{scenario}-{viewport}.png
```

#### Screenshot Output

```
tests/screenshots/
├── dashboard-empty-desktop.png
├── dashboard-empty-tablet.png
├── dashboard-empty-phone.png
├── dashboard-multi-studio-desktop.png
├── dashboard-multi-studio-tablet.png
├── dashboard-multi-studio-phone.png
├── session-complete-desktop.png
├── session-complete-tablet.png
├── session-complete-phone.png
...
```

Running the visual review suite:

```bash
# Capture all screenshots (takes ~2 min)
npx playwright test --project=desktop --project=tablet --project=phone 10-visual-review.spec.ts

# Open the screenshot directory for review
open tests/screenshots/
```

The UI design agent should re-run this suite after any visual change and compare before/after screenshots. Consider integrating `playwright`'s built-in `expect(page).toHaveScreenshot()` for visual regression detection after the initial design is approved and baselined.

### 11.5 Visual Regression Baseline Workflow

Once the UI Design Agent approves the initial screenshots, establish baselines:

1. **Baseline capture**: `npx playwright test 10-visual-review.spec.ts --update-snapshots`
2. **Regression check on every PR**: `npx playwright test 10-visual-review.spec.ts` — Playwright compares against baselines, highlights pixel differences above threshold.
3. **Threshold**: Allow 0.5% pixel difference to absorb minor anti-aliasing variations across environments.
4. **Review failing snapshots**: If a visual change is intentional, the design agent reviews the diff and updates the baseline. If unintentional, it's a bug.

### 11.6 Test Scenarios Matrix

This matrix maps user stories to test suites, ensuring complete coverage. The QA agent should verify that every cell is covered.

| User Story | Auth | Studios | Builder | Session | Progress | PDF | Offline | Sharing | Edge |
|------------|:----:|:-------:|:-------:|:-------:|:--------:|:---:|:-------:|:-------:|:----:|
| New user signs up, sees empty dashboard | ✅ | ✅ | | | | | | | |
| Teacher creates a chart for a student | | ✅ | ✅ | | | | | ✅ | |
| Parent copies chart from lesson notes | | | ✅ | | | | | | |
| Student completes a practice session | | | | ✅ | | | | | |
| Student resumes an interrupted session | | | | ✅ | | | | | |
| Timer prevents premature completion | | | | ✅ | | | | | |
| Parent reviews weekly progress | | | | | ✅ | | | | |
| Teacher marks a piece as mastered | | | | | ✅ | | | ✅ | |
| Parent uploads a recital video | | | | | ✅ | | | | |
| Teacher prints a practice sheet | | | | | | ✅ | | | |
| Student practices offline | | | | ✅ | | | ✅ | | |
| Offline changes sync on reconnect | | | | | | | ✅ | | |
| Viewer can see but not edit | | | | | | | | ✅ | |
| App handles Unicode content | | | | | | | | | ✅ |
| App handles heavy data volume | | | | | ✅ | | | | ✅ |

### 11.7 CI Integration

Add Playwright tests to the CI pipeline (GitHub Actions or Fly.io deploy hook).

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: practicepal_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run db:reset
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/practicepal_test
      - run: npm run build
      - run: npx playwright test
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/practicepal_test
          APP_ENV: test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: |
            tests/e2e/test-results/
            tests/e2e/screenshots/
```

#### QA Agent Workflow

The QA agent's workflow for verifying a feature:

1. `npm run db:reset` — 10-second full reset.
2. `npx playwright test suites/03-chart-builder.spec.ts` — Run the relevant suite.
3. Review the HTML report: `npx playwright show-report`.
4. On failure: inspect trace viewer (`trace.zip` attached to failed tests), screenshots, and video recordings auto-captured by Playwright.
5. File bugs with the trace artifact attached for immediate reproducibility.

#### UI Design Agent Workflow

The design agent's workflow for reviewing visual changes:

1. `npm run db:reset` — Ensure fresh, realistic data.
2. `npx playwright test 10-visual-review.spec.ts` — Capture all screenshots.
3. Open `tests/screenshots/` and review each screen at all three breakpoints.
4. For interactive review: `npm run dev` and use the test-login route to switch between accounts, seeing the app as each persona.
5. After design changes, re-run the visual suite and compare before/after.

---

These are explicitly out of scope for v1 but are planned:

- **Ear Training Sub-App**: Interactive ear training exercises (interval identification, chord quality, rhythm dictation). Display as "Coming Soon!" in the app with a teaser card.
- **Dark Mode**: Full dark theme.
- **Multiple OAuth Providers**: Apple, email/password.
- **Real-Time Collaboration**: Live updates when teacher edits a chart while parent is viewing.
- **Notifications**: Push notifications for new charts, practice reminders.
- **Practice Streaks**: Gamified streak tracking (practice X days in a row).
- **Teacher Dashboard**: Aggregate view across all of a teacher's Studios.
- **Audio Playback**: Attach reference recordings to chart items (teacher plays the passage, student can listen).

---

## Appendix A: Illustration & Sound Asset Requirements

### Celebration Illustrations

Provide 15–20 illustrations for the session completion surprise. Each should be:
- A cute, friendly animal or mythical creature, ideally in a musical context.
- Flat or soft-3D illustration style. Consistent art style across all images.
- Square aspect ratio, minimum 512×512px.
- Transparent or solid-color background.

**Suggested subjects**: otter with headphones, dragon playing piano, unicorn with a music note mane, fox playing violin, narwhal with a treble clef tusk, penguin conductor, owl with sheet music, phoenix with musical flames, raccoon drummer, bunny with a harp, cat at a grand piano, hedgehog with maracas, turtle with a metronome shell, baby griffin singing, axolotl with a microphone.

Source: Commission an illustrator, use a licensed illustration library (e.g., undraw, humaaans), or generate with an image generation tool (ensure consistent style).

### Sound Effects

Provide 8–12 short audio clips for checkbox interactions:
- **Duration**: 100–500ms each.
- **Style**: Musical, bright, cheerful. Think: individual piano notes in a major scale, xylophone hits, chime tones, harp plucks, gentle bell dings.
- **Format**: MP3 and OGG for browser compatibility.
- **Volume**: Normalized. Not jarring.
- Source: Freesound.org (CC0 licensed), create with a synthesizer, or generate with an audio tool.

### Metronome Click Sounds

Provide 2 click sound sets, each with 2 variants (regular beat + accented downbeat). Total: 4 audio files.

| Set | Regular Beat | Accented Downbeat | Character |
|-----|-------------|-------------------|-----------|
| **Woodblock** | `metronome-wood-regular.mp3` | `metronome-wood-accent.mp3` | Warm, natural. Emulates a wooden metronome body being struck. Slight room resonance. The accent variant is the same timbre but higher-pitched (think: the "bell" sound on a mechanical metronome). |
| **Digital** | `metronome-digital-regular.mp3` | `metronome-digital-accent.mp3` | Clean, crisp electronic tick. Sharp transient, no tail. The accent variant is a distinctly higher-pitched tone (think: classic Dr. Beat "beep" vs "boop"). |

**Requirements for all metronome samples:**
- **Duration**: 20–80ms. Must be extremely short to sound precise at high tempos.
- **Format**: MP3 and OGG. Also provide the raw WAV sources for Web Audio API `AudioBuffer` decoding.
- **Latency**: Zero fade-in. The transient must be at the very start of the file (no leading silence).
- **Volume**: Normalized to the same perceived loudness across all 4 samples. The accent variants should be ~3 dB louder than their regular counterparts.
- Source: Synthesize with a DAW or Tone.js, or source from Freesound.org (CC0). The woodblock sound can be sampled from a real woodblock recording if available.

---

## Appendix B: Ear Training "Coming Soon" Placeholder

In the app navigation or on the Studio page, include a card/section:

> **🎧 Ear Training — Coming Soon!**
>
> Interactive exercises to sharpen your musical ear: interval recognition, chord identification, rhythm dictation, and more. Stay tuned!

This should be a static placeholder with a tasteful "coming soon" badge. No functionality behind it.
