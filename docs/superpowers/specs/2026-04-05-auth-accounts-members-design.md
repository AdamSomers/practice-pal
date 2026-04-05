# Auth, Account Management, and Members — V1 Design

## Overview

PracticePal currently uses dev-only test login with no real authentication. For V1, we need production-ready auth, user account management, and a working invitation system so teachers can invite students and parents to studios.

## Design Decisions

**Authentication methods:** Google OAuth + email magic links (passwordless). No passwords in the system.

**Auth framework:** Passport.js with express-session. The app already uses express-session. Passport plugs directly in. `connect-pg-simple` for production session persistence in PostgreSQL.

**Email service:** Resend for magic link delivery and invite notifications.

**Signup model:** Open self-serve. Anyone can sign up and create or join studios.

**Dev test login:** Exists only when `APP_ENV=development`. Production login page shows Google OAuth and magic link only.

## Schema Changes

### Users table — new columns

| Column | Type | Notes |
|--------|------|-------|
| `google_id` | text, nullable, unique | Google OAuth subject ID |
| `avatar_upload_url` | text, nullable | User-uploaded avatar override |
| `email_verified` | boolean, default false | True after first magic link or Google OAuth login |

Existing columns unchanged: `id`, `email`, `display_name`, `avatar_url`, `created_at`.

`avatar_url` holds the Google profile picture (auto-set on Google OAuth login). `avatar_upload_url` is the user's manual override and takes display precedence when set.

### New table: `magic_links`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid, PK | |
| `email` | text, not null | Target email |
| `token_hash` | text, not null | SHA-256 hash of the random token |
| `expires_at` | timestamp, not null | 15 minutes from creation |
| `used_at` | timestamp, nullable | Set on use, prevents replay |
| `created_at` | timestamp, not null | |

The actual token (64-char random hex) is sent in the email. Only the hash is stored. This means a database leak doesn't compromise login links.

### New table: `studio_invite_links`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid, PK | |
| `studio_id` | uuid, FK to studios | |
| `role` | studio_role enum | Role assigned on join |
| `code` | text, not null, unique | 8-char random alphanumeric code for URL |
| `created_by` | uuid, FK to users | |
| `max_uses` | integer, nullable | Null = unlimited |
| `use_count` | integer, default 0 | |
| `expires_at` | timestamp, nullable | Null = never expires |
| `created_at` | timestamp, not null | |

### Session store

Add `connect-pg-simple` for production. It auto-creates a `session` table in PostgreSQL. Dev can continue using MemoryStore (simpler, no persistence needed).

## Authentication Flows

### Google OAuth

1. User clicks "Sign in with Google" on login page
2. Redirect to Google consent screen via Passport (`passport-google-oauth20`)
3. Google redirects back to `/api/auth/google/callback` with authorization code
4. Passport exchanges code for tokens, extracts profile (email, name, avatar, Google ID)
5. Find user by `google_id`. If not found, find by `email`. If not found, create new user.
6. If existing user found by email but no `google_id`, link the Google account (set `google_id`, update `avatar_url`)
7. Set `email_verified = true`
8. Serialize user ID into session
9. Redirect to `/` (or to a pending invite URL if one was in the OAuth state)

### Email Magic Link

1. User enters email on login page, clicks "Send login link"
2. Server generates 64-char random hex token
3. Server stores SHA-256 hash of token in `magic_links` table with 15-minute expiry
4. Server sends email via Resend with link: `https://app/auth/magic-link/verify?token=<token>&email=<email>`
5. Response is always "If an account exists, we've sent a login link" (prevents email enumeration)
6. User clicks link in email
7. Server hashes the token from the URL, looks up matching `magic_links` row
8. Validates: not expired, not already used
9. Marks link as used (`used_at = now()`)
10. Find user by email. If not found, create new user with email and display name from email prefix.
11. Set `email_verified = true`
12. Serialize user ID into session
13. Redirect to `/` (or pending invite URL)

### Logout

Same as today. Destroy session, clear cookie, redirect to login page.

### Session Management

- Sessions stored in PostgreSQL via `connect-pg-simple` in production
- `httpOnly: true`, `secure: true` (production), `sameSite: 'lax'`
- 7-day max age (existing setting)
- Session ID regenerated on login (prevents session fixation)
- Existing 401 redirect on the client handles expired sessions

## Invitation System

### Email Invitations (existing, enhanced)

Current flow: owner enters email, server creates user record + pending membership. No notification sent.

V1 flow:
1. Owner enters email and role in studio settings
2. Server creates pending membership (same as today)
3. Server sends invite email via Resend with link to the app
4. If the invitee already has an account: they see the invitation on their dashboard (existing UI) and accept it
5. If the invitee doesn't have an account: the email link goes to the login page. After signing up (Google or magic link), they land on the dashboard and see the pending invitation.

The invite email includes: studio name, who invited them, their role, and a direct link.

### Shareable Invite Links (new)

1. Owner generates an invite link in studio settings, choosing a role (editor or viewer)
2. Server creates a `studio_invite_links` row with a random 8-char code
3. Owner copies the link (e.g., `https://app/invite/abc12345`) and shares it however they want (text, email, etc.)
4. Recipient opens the link. If logged in, they join the studio immediately at the specified role. If not logged in, they're redirected to login/signup, then auto-join after auth.
5. Owner can optionally set max uses and/or expiration
6. Owner can see active invite links in studio settings and revoke them

## Account Management (Profile Page)

The profile page (`/profile`) replaces the current placeholder with:

- **Display name**: Editable text field. Saves on blur or explicit save.
- **Avatar**: Shows Google profile picture by default. User can upload a custom image to override. Option to revert to Google picture.
- **Email**: Display only. Shows the email associated with the account.
- **Connected accounts**: Shows "Google" badge if `google_id` is set. If the user signed up via magic link, they can link their Google account later.
- **Delete account**: Red button at the bottom. Confirmation dialog. Deletes user, their memberships, and their sessions/checkoffs. Studios they own would need to be transferred or deleted first.

## API Routes

### New auth routes (mounted at `/api/auth`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/google` | Initiates Google OAuth redirect |
| GET | `/google/callback` | Google OAuth callback |
| POST | `/magic-link` | Request a magic link email |
| GET | `/magic-link/verify` | Verify magic link token, create session |
| POST | `/test-login` | Dev only, existing |
| GET | `/me` | Get current user, existing |
| POST | `/logout` | Destroy session, existing |

### New/modified profile routes (mounted at `/api/users`)

| Method | Path | Description |
|--------|------|-------------|
| PATCH | `/me` | Update display name |
| POST | `/me/avatar` | Upload avatar image |
| DELETE | `/me/avatar` | Remove uploaded avatar (revert to Google) |
| POST | `/me/link-google` | Link Google account to existing user |
| DELETE | `/me` | Delete account |

### New invite link routes (on studios router)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/studios/:id/invite-links` | List active invite links |
| POST | `/studios/:id/invite-links` | Create invite link |
| DELETE | `/studios/:id/invite-links/:linkId` | Revoke invite link |
| POST | `/invite/:code` | Accept an invite link (public, requires auth) |

## Security

### Token security
- Magic link tokens: 64-char random hex, SHA-256 hashed before storage
- Invite link codes: 8-char random alphanumeric, not sensitive (they grant membership, not account access)

### Rate limiting
- `POST /auth/magic-link`: 5 per email per hour, 20 per IP per hour
- `GET /auth/magic-link/verify`: 10 attempts per IP per 15 minutes
- `POST /invite/:code`: 10 per IP per hour

### Email privacy
- Member list API returns display names and avatars only
- Studio owner sees member emails (needed for managing invitations)
- Users see their own email on their profile
- No public user search or listing endpoint
- Magic link request always returns success regardless of whether email exists

### Session security
- `httpOnly`, `secure` (production), `sameSite: 'lax'` (all existing)
- Session ID regenerated on login
- PostgreSQL session store in production (survives server restarts)

### OAuth security
- Passport handles the OAuth `state` parameter for CSRF protection
- Google OAuth client secret stored in environment variables, never in code

## Login Page (Production)

The login page in production shows:
1. PracticePal logo and tagline
2. "Sign in with Google" button (primary, prominent)
3. Divider ("or")
4. Email input + "Send login link" button
5. Subtitle text: "No password needed. We'll email you a link."

In development, the existing test accounts grid appears below a divider.

## Environment Variables (New)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | OAuth redirect URI (e.g., `https://practicepal-staging.fly.dev/api/auth/google/callback`) |
| `RESEND_API_KEY` | Resend API key for sending emails |
| `APP_URL` | Base URL of the app (for magic link and invite URLs in emails) |

## Dependencies (New)

| Package | Purpose |
|---------|---------|
| `passport` | Auth framework |
| `passport-google-oauth20` | Google OAuth strategy |
| `connect-pg-simple` | PostgreSQL session store |
| `resend` | Email sending |
| `express-rate-limit` | Rate limiting |
| `crypto` (built-in) | Token generation and hashing |

## Testing Strategy

### API Integration Tests (~15-20 tests)

Run against the Express app using supertest. External services mocked at the boundary.

**Magic link flow:**
- Request magic link, verify email is "sent" (captured by mock)
- Click magic link, verify session created and user exists
- Expired link returns error
- Reused link returns error
- Request for non-existent email still returns success (no enumeration)

**Google OAuth flow:**
- Mock Google token verification to return fake profile
- New user: verify user created with Google ID, email, avatar
- Existing user (same email, no Google ID): verify Google ID linked
- Existing user (already has Google ID): verify login works

**Invite flows:**
- Email invite: create pending membership, verify invite appears on invitee's dashboard
- Accept invite: verify membership updated, studio appears
- Invite link: create link, use it, verify membership created
- Invite link with max uses: verify rejected after limit
- Expired invite link: verify rejected

**Profile:**
- Update display name
- Upload avatar
- Delete avatar (revert to Google)
- Link Google account
- Delete account (verify cascade)

**Auth guards:**
- Protected routes return 401 without session
- Rate limiting returns 429 after threshold

### E2E Tests with Playwright (3-4 tests)

- Magic link happy path: enter email, intercept email via test hook, click link, land on dashboard
- Invite link happy path: generate link, open in new context, sign up, verify studio membership
- Logout: verify redirect to login, protected routes inaccessible
- Login page renders correctly in production mode (no test accounts)

### Dev test login

Continues to work in `APP_ENV=development` for fast local iteration and any test that doesn't specifically test auth flows.
