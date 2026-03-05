# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PracticePal is a music practice tracker web app for students, parents, and teachers. Teachers create weekly practice charts; students complete practice sessions with gamified interactions (animations, sounds, rewards). The full spec is in `PracticePal-Spec-v1.md`.

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

# Start both servers (backend :3001, frontend :5173)
npm run dev

# Or start individually
npm run dev:server   # Express on localhost:3001
npm run dev:client   # Vite on localhost:5173 (proxies /api to :3001)

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
PORT=3001
```

PostgreSQL 16 via Homebrew. Binary at `/opt/homebrew/opt/postgresql@16/bin/psql`.
