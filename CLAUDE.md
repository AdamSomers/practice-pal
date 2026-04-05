# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PracticePal is a music practice tracker web app for students, parents, and teachers. Teachers create weekly practice charts; students complete practice sessions with gamified interactions (animations, sounds, rewards). The full spec is in `PracticePal-Spec-v1.md`.

**README.md maintenance:** When adding new features, commands, or changing setup steps, update `README.md` to keep it in sync.

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS v4, Framer Motion, Zustand, Recharts, Lucide icons, canvas-confetti
- **Backend**: Express + TypeScript, Drizzle ORM, PostgreSQL with JSONB
- **Auth**: Session-based (express-session). Test-login route for dev. Google OAuth planned.
- **Audio**: Web Audio API (oscillator-based synthetic sounds)
- **Font**: Nunito (Google Fonts)

## Development Commands

```bash
# Install dependencies (root + server + client)
npm install && cd server && npm install && cd ../client && npm install && cd ..

# Start both servers (backend :3002, frontend :5174)
npm run dev

# Or start individually
npm run dev:server   # Express on 0.0.0.0:3002
npm run dev:client   # Vite on 0.0.0.0:5174 (proxies /api to :3002)

# Database
npm run db:push      # Push schema to PostgreSQL via drizzle-kit
npm run db:seed      # Run seed script (clears + repopulates)
npm run db:reset     # Push schema + seed

# Build
npm run build
```

## Project Structure

```
server/
  src/
    app.ts              # Express app setup, middleware, route mounting
    index.ts            # Server entry point
    db/
      schema.ts         # Drizzle ORM schema (all tables)
      index.ts          # DB connection
    routes/
      auth.ts           # POST /test-login, GET /me, POST /logout
      studios.ts        # Studio CRUD + membership + invitations
      charts.ts         # Chart CRUD + items + reorder + duplicate
      sessions.ts       # Session start, checkoff, complete
      progress.ts       # Progress stats, session history, mastery log
    middleware/
      auth.ts           # requireAuth middleware, session type augmentation
  drizzle.config.ts

client/
  src/
    App.tsx             # React Router routes
    main.tsx            # Entry point
    index.css           # Tailwind v4 config with custom theme
    lib/
      api.ts            # Typed API client (fetch wrapper)
      types.ts          # Shared TypeScript types
      sounds.ts         # Web Audio API sound effects
    stores/
      auth.ts           # Zustand auth store
    components/
      Layout.tsx        # Responsive shell (sidebar desktop, tabs mobile)
      chart-builder/    # CategoryPicker, ItemForm, KeySelector, ModifierSelector, ChartItemCard
      session/          # TimerBar, CheckboxGrid, ProgressIndicator, SessionComplete, Metronome
    pages/
      LoginPage.tsx     # Dev test accounts + Google OAuth placeholder
      DashboardPage.tsx # Studio grid + create modal + invitations
      StudioPage.tsx    # Charts list, members, mastery tabs
      StudioSettingsPage.tsx
      ChartBuilderPage.tsx  # Create/edit chart with category items
      SessionPlayerPage.tsx # Timer, checkboxes, progress garden, metronome
      ProgressPage.tsx      # Stats cards, weekly chart, links
      SessionHistoryPage.tsx

scripts/
  seed.ts              # Deterministic seed (12 mock accounts, realistic musical data)
```

## Architecture

- **Monorepo**: `server/` (Express API) + `client/` (Vite React). Vite proxies `/api` to backend.
- **API**: RESTful JSON at `/api/*`. All routes except `/api/auth/*` require auth.
- **Auth**: Session cookie via express-session. Dev uses `POST /api/auth/test-login` with `mock_user_id`.
- **DB**: PostgreSQL + Drizzle ORM. Schema uses enums (studio_role, chart_category, recording_type) and JSONB for ChartItem.config.
- **User roles per Studio**: owner, editor, viewer — enforced server-side via `verifyMembership()` helper.
- **7 chart categories**: scales, arpeggios, cadences, repertoire, sight_reading, theory, other. Each has category-specific JSONB config.

## Key Domain Concepts

- **Studio**: Named collection (e.g., "Dana Piano") — unit of sharing between users
- **PracticeChart**: Weekly assignment containing ChartItems with category-specific configs
- **PracticeSession**: Timed practice run with SessionCheckoffs per item/repetition
- **MasteredItem**: Trophy case of completed items per Studio

## Responsive Design

- **Tablet-first** (768-1023px) primary target
- Desktop (>=1024px): sidebar nav, wider content area
- Phone (<768px): bottom tab bar, single column
- Palette: warm purples (primary), teals (accent), yellows (warm), white/cream backgrounds

## Mock Accounts (for testing)

Login via dev accounts on the login page:
- `blank-alice` — Empty, no studios
- `blank-bob` — 1 empty studio
- `one-chart-carol` — 1 studio, 1 chart, 3 items
- `active-dana` — 1 studio, 6 charts, 15+ sessions, mastery items
- `casual-eli` — Sparse practice data
- `parent-frank` — Owns 2 studios (Gina Piano, Henry Guitar)
- `teacher-katie` — Editor on 6 studios (cross-studio teacher view)
- `shared-viewer-luna` — Viewer on Gina Piano

## Environment

```
DATABASE_URL=postgres://adam@localhost:5432/practicepal
SESSION_SECRET=dev-secret-change-me
APP_ENV=development
PORT=3002
```

PostgreSQL 16 via Homebrew. Binary at `/opt/homebrew/opt/postgresql@16/bin/psql`.

## Port Registry (Local Dev)

To avoid collisions with other projects on this machine, this project uses non-default ports.

| Project | Frontend | Backend |
|---------|----------|---------|
| practice-pal | 5173 | 3000 |
| **practice-pal-team** | **5174** | **3002** |
| lead-app | 5175 | 8001 |
| fitness-app | 5176 | 8002 |

**All dev servers must bind to `0.0.0.0`** (not localhost) so they're accessible from other devices on the local network (e.g., phone at `http://10.0.0.7:<port>`).

## Work Management Process

All feature and bug fix work follows a structured pipeline. This is not optional. Every request from Adam that involves code changes goes through this process. The process is designed for Adam to fire off a batch of requests and walk away. Work should never block on his input. When he comes back, he should find completed work with a clear list of items to review.

### Directory Structure

```
plans/           # One markdown file per work item. Never delete plan files.
release-notes/   # One file per release version.
```

### Item Sizing

Every incoming request gets sized before any work begins. Size determines how much process ceremony the item gets.

| Size | Examples | Branch? | Full plan? | Manual acceptance tests? | Automated tests? |
|------|----------|---------|------------|--------------------------|------------------|
| **S** | Bug fix, copy change, style tweak, config change | Yes (can batch multiple S items on one branch) | No. One-paragraph description + acceptance criteria in plan file. | No. Acceptance = "does it look right and work." | Only if touching existing tested paths. |
| **M** | New UI component, new API endpoint, moderate refactor | Yes | Yes, but build plan can be concise. | Yes, but keep them short and practical. | Yes. |
| **L** | New feature area, schema changes, multi-page flows | Yes | Full ceremony: requirements, build plan, test plan. | Yes, detailed. | Yes, comprehensive. |

Claude makes the sizing call. Adam can override. When in doubt, size down. The goal is momentum, not paperwork.

### Batch Processing

When Adam sends multiple requests at once:

1. **Triage first.** Read all requests before starting any work. Size each item. Group related items.
2. **Batch small items.** Multiple S-sized fixes can share a single branch (e.g., `fix/batch-ui-fixes-2026-04-05`) and a single plan file with a checklist of items.
3. **Parallelize independent work.** Unrelated M and L items get their own branches and should be developed concurrently using parallel agents on separate worktrees.
4. **Work the whole batch to completion.** Don't finish one item and wait for feedback. Push everything to "awaiting acceptance" state, then present Adam with a single summary of all items ready for review.

### Work Item Lifecycle

Items move through these states. S items skip steps marked with *.

1. **Intake** — Adam describes a feature or bug. The PM agent rewrites the request into structured requirements. For ambiguous requests, make best-guess assumptions and document them in the plan rather than blocking on clarification. Research the domain if the solution isn't obvious. Save as `plans/<slug>.md`.
2. **Build Planning*** — Dev agent adds a build plan section: files to create/modify, API changes, schema changes, implementation steps.
3. **Test Planning*** — QA agent adds: (a) manual acceptance tests for complex interactions or data-sensitive flows, and (b) automated E2E test instructions. Skip manual test plans for items where acceptance is visually obvious.
4. **Development** — Work happens on a feature branch (`feature/<slug>` or `fix/<slug>`). Parallel agents on separate worktrees for independent items. Dev agent implements and marks development complete.
5. **QA Verification** — QA agent runs automated tests and documents results.
6. **Awaiting Acceptance** — Work is done. Plan file lists what Adam needs to verify. For S items this is just "confirm it looks right." For M/L items, specific acceptance test checkboxes. Any assumptions made during intake are flagged here for Adam to validate.
7. **Accepted / Merged** — Adam confirms. Branch merges to main.

### Plan File Format

**For S items (or batched S items):**

```markdown
# <Title>

**Status:** intake | in-development | awaiting-acceptance | accepted | merged
**Size:** S
**Branch:** fix/<slug>

## Items
- [ ] Description of fix/change (acceptance: what to verify)
- [ ] ...

## Assumptions
<any assumptions made without asking Adam>

## Notes
<context, research, decisions>
```

**For M/L items:**

```markdown
# <Title>

**Status:** intake | build-planning | test-planning | in-development | awaiting-acceptance | accepted | merged
**Size:** M or L
**Branch:** feature/<slug>
**Version:** (assigned at merge)

## Requirements
<structured requirements>

## Assumptions
<assumptions made without asking Adam, flagged for review>

## Build Plan
<files to create/modify, API changes, implementation steps>

## Test Plan

### Acceptance Tests
- [ ] Test description (only Adam marks these verified)
- [ ] ...

### Automated E2E Tests
<test instructions and expected results>

## QA Results
<test execution results>

## Notes
<context, research, decisions>
```

### Versioning and Release Notes

Semantic versioning: `MAJOR.MINOR.PATCH`.
- MAJOR: breaking changes to data model or API contracts
- MINOR: new features
- PATCH: bug fixes, polish, minor tweaks

A batch of S items merged together is a single PATCH bump. Each M item is at least a MINOR bump. On merge to main, create `release-notes/v<version>.md` with:
- Version number and date
- Summary of changes
- List of plan files included
- Any migration steps or breaking changes

**After creating the release notes file**, add it to the About page import list in `client/src/pages/AboutPage.tsx`:
1. Add an import: `import vXYZ from '../../../release-notes/vX.Y.Z.md?raw';`
2. Add the entry to the `sortedNotes` array (newest first): `{ version: 'vX.Y.Z', content: vXYZ }`

This must happen before deployment. Release notes are bundled at build time and displayed on the About page.

### Acceptance Review Summary

When all items in a batch reach "awaiting acceptance," present Adam with a single review summary:

```
## Ready for Review

### feature/cool-new-thing (M)
- What it does: <one line>
- What to test: <specific instructions>
- Assumptions made: <any>
- Plan: plans/cool-new-thing.md

### fix/batch-ui-fixes (S x4)
- Items: <list>
- What to verify: <brief>
- Plan: plans/batch-ui-fixes-2026-04-05.md

### Deployment
Once accepted, these changes will be version v0.X.Y.
```

### Key Rules

1. **Never delete plan files.** Update their status instead.
2. **All work happens on branches.** No direct commits to main for feature/bug work.
3. **Never block on Adam.** Make assumptions, document them, keep moving. Flag assumptions in the acceptance review so Adam can correct course.
4. **Complete the whole batch.** Don't stop after one item. Push everything to "awaiting acceptance" before presenting results.
5. **Gate deployments on acceptance.** If Adam asks to merge or deploy before acceptance tests are verified, remind him. If he overrides, note it in the plan file.
6. **Enumerate changes before deployment.** Always list what's going into a release before deploying.
7. **Confirm before deploying.** Never deploy without Adam's explicit go-ahead.
8. **Surface outstanding tasks.** When Adam starts a session, let him know if there are items awaiting his acceptance or input.
9. **Size down, not up.** When in doubt about sizing, go smaller. Add ceremony only when the item's complexity demands it.

### Agent Roles

- **Project Manager agent**: Triage, sizing, requirements writing, domain research, batch coordination, acceptance review summaries. Does not interview Adam unless a request is genuinely ambiguous and making an assumption would be risky.
- **Development agent**: Build planning, implementation, branch management. Runs on worktrees for parallel execution.
- **QA agent**: Test planning (manual + automated), test execution, results documentation. Writes manual acceptance tests only for M/L items with complex interactions.

Agents run in parallel by default for independent items. The PM agent coordinates the overall batch and assembles the final review summary.
