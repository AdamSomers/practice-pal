# PracticePal MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a working PracticePal music practice tracker running locally with core features: auth, studios, chart builder, practice session player, progress/history.

**Architecture:** Monorepo with Vite+React frontend and Express+PostgreSQL backend. TypeScript throughout. Frontend proxies API calls to backend dev server. Test-login route for local development.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Express, PostgreSQL, Drizzle ORM, Zustand, canvas-confetti, Howler.js

---

## Phase 1: Project Scaffolding

### Task 1: Initialize monorepo with shared TypeScript config

**Files:**
- Create: `package.json` (root)
- Create: `tsconfig.base.json`
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`

### Task 2: Set up Express backend with health check

**Files:**
- Create: `server/src/index.ts`
- Create: `server/src/app.ts`

### Task 3: Set up Vite React frontend with Tailwind

**Files:**
- Create: `client/index.html`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `client/vite.config.ts`
- Create: `client/tailwind.config.ts`
- Create: `client/src/index.css`

### Task 4: Set up PostgreSQL with Drizzle ORM

**Files:**
- Create: `server/src/db/index.ts`
- Create: `server/src/db/schema.ts`
- Create: `server/drizzle.config.ts`

## Phase 2: Database Schema & Auth

### Task 5: Define all database tables per spec

**Files:**
- Modify: `server/src/db/schema.ts` — all entities (User, Studio, StudioMembership, PracticeChart, ChartItem, PracticeSession, SessionCheckoff, PerformanceRecording, MasteredItem)

### Task 6: Auth routes (test-login + session middleware)

**Files:**
- Create: `server/src/routes/auth.ts`
- Create: `server/src/middleware/auth.ts`

## Phase 3: API Routes

### Task 7: Studio CRUD + membership API

**Files:**
- Create: `server/src/routes/studios.ts`

### Task 8: Chart CRUD + items API

**Files:**
- Create: `server/src/routes/charts.ts`

### Task 9: Session + checkoff API

**Files:**
- Create: `server/src/routes/sessions.ts`

### Task 10: Progress + mastery API

**Files:**
- Create: `server/src/routes/progress.ts`

## Phase 4: Frontend Core

### Task 11: Router, layout shell, auth context

**Files:**
- Create: `client/src/lib/api.ts`
- Create: `client/src/stores/auth.ts`
- Create: `client/src/components/Layout.tsx`
- Create: `client/src/pages/LoginPage.tsx`

### Task 12: Dashboard + Studio pages

**Files:**
- Create: `client/src/pages/DashboardPage.tsx`
- Create: `client/src/pages/StudioPage.tsx`
- Create: `client/src/pages/StudioSettingsPage.tsx`

### Task 13: Chart Builder

**Files:**
- Create: `client/src/pages/ChartBuilderPage.tsx`
- Create: `client/src/components/chart-builder/CategoryPicker.tsx`
- Create: `client/src/components/chart-builder/ItemForm.tsx`
- Create: `client/src/components/chart-builder/KeySelector.tsx`
- Create: `client/src/components/chart-builder/ModifierSelector.tsx`
- Create: `client/src/components/chart-builder/ChartItemCard.tsx`

### Task 14: Practice Session Player

**Files:**
- Create: `client/src/pages/SessionPlayerPage.tsx`
- Create: `client/src/components/session/TimerBar.tsx`
- Create: `client/src/components/session/CheckboxGrid.tsx`
- Create: `client/src/components/session/ProgressIndicator.tsx`
- Create: `client/src/components/session/SessionComplete.tsx`
- Create: `client/src/components/session/Metronome.tsx`
- Create: `client/src/lib/sounds.ts`

### Task 15: Progress & History pages

**Files:**
- Create: `client/src/pages/ProgressPage.tsx`
- Create: `client/src/pages/SessionHistoryPage.tsx`

## Phase 5: Seed Data & Integration

### Task 16: Seed script with mock accounts

**Files:**
- Create: `scripts/seed.ts`

### Task 17: Integration testing & local run verification

Run the full app locally, verify all pages load and core flows work.
