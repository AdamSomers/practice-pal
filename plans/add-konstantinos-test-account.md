# Add Konstantinos Test Account

**Status:** merged
**Size:** S
**Branch:** fix/add-konstantinos-test-account
**Version:** v0.2.1

## Items
- [x] Add "Konstantinos" button to `TEST_ACCOUNTS` in `client/src/pages/LoginPage.tsx` (acceptance: button appears in the Dev Accounts grid; first click creates a blank-slate user via auto-create on `/api/auth/test-login`)

## Assumptions
- Blank-slate account, matching Suzy. No seed data; the `/api/auth/test-login` route finds-or-creates by `<slug>@test.local`.
- Slug: `konstantinos`. Long name, but the grid wraps fine — checked by eye.

## Notes
- Same mechanism as the Suzy account shipped in v0.1.4.
