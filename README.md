# PracticePal

A music practice tracker for students, parents, and teachers. Teachers create weekly practice charts, students complete sessions with gamified interactions (animations, sounds, confetti rewards), and everyone can track progress over time.

## Features

**Studios** — Shared workspaces (e.g. "Ada Piano") where teachers, parents, and students collaborate. Role-based access: owner, editor, and viewer.

**Practice Chart Builder** — Create weekly assignments with items across 7 music categories: scales, arpeggios, cadences, repertoire, sight reading, theory, and other. Each category has specific configuration options (key, tempo, modifiers). Optional minimum practice time per chart.

**Session Player** — Timed practice sessions with checkbox-based repetition tracking. Includes a built-in metronome. Completing all items triggers a celebration with confetti and animations. Synthetic sound effects via Web Audio API.

**Progress Dashboard** — Stats cards, weekly practice charts, session history, and a mastery trophy case for completed items.

**Responsive Design** — Tablet-first (iPad primary target), with full support for desktop sidebar navigation and mobile bottom tab bar.

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** 16

## Setup

```bash
# Clone and install dependencies
git clone <repo-url> && cd practice-pal-team
npm install && cd server && npm install && cd ../client && npm install && cd ..

# Create the database
createdb practicepal_team

# Push the schema and seed with test data
npm run db:reset
```

Create a `.env` file in `server/`:

```
DATABASE_URL=postgres://YOUR_USER@localhost:5432/practicepal_team
SESSION_SECRET=dev-secret-change-me
APP_ENV=development
PORT=3002
```

## Running

```bash
# Start both servers
npm run dev

# Or individually
npm run dev:server   # Express API on http://0.0.0.0:3002
npm run dev:client   # Vite dev server on http://0.0.0.0:5174
```

The frontend proxies `/api` requests to the backend automatically.

## Test Accounts

The seed script creates 12 mock accounts. Log in from the dev login page:

| Account | Description |
|---------|-------------|
| Alice | Blank slate — no studios |
| Bob | One empty studio |
| Carol | One studio, one chart, 3 items |
| Dana | Active user — 6 charts, 15+ sessions, mastery items |
| Eli | Casual / sparse practice data |
| Frank | Parent — owns 2 studios (Gina Piano, Henry Guitar) |
| Katie | Teacher — editor on 6 studios |
| Luna | Shared viewer on Gina Piano |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend concurrently |
| `npm run dev:server` | Start Express API only |
| `npm run dev:client` | Start Vite dev server only |
| `npm run build` | Build both client and server |
| `npm run db:push` | Push Drizzle schema to PostgreSQL |
| `npm run db:seed` | Clear and re-seed the database |
| `npm run db:reset` | Push schema + seed (full reset) |

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Zustand, Recharts
- **Backend:** Express, TypeScript, Drizzle ORM, PostgreSQL
- **Auth:** express-session (dev test-login; Google OAuth planned)
- **Audio:** Web Audio API (synthetic oscillator sounds)
