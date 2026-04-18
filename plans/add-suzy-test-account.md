# Add Suzy Test Account

**Status:** accepted
**Size:** S
**Branch:** fix/add-suzy-test-account
**Version:** v0.1.4

## Items
- [ ] Add "Suzy" button to the login page's `TEST_ACCOUNTS` list in `client/src/pages/LoginPage.tsx` (acceptance: Suzy button appears in the Dev Accounts grid; clicking it logs in as a blank-slate account)

## Assumptions
- Suzy is a friend Adam wants to test the app. She should start with a blank-slate account (no studios, no charts) so her feedback reflects a true first-time experience, matching how Alice and Bob are set up.
- No seed script change needed. The `POST /api/auth/test-login` route auto-creates users by email pattern (`<id>@test.local`) on first login. The existing "Adam" button works the same way without being in the seed.
- Label: "Suzy", desc: "Blank slate" (mirrors Alice/Bob). Slug: `suzy`.

## Notes
- If Adam would rather give Suzy pre-populated data (e.g., a studio with a few charts so she can poke at real features without building first), we can extend the seed script in a follow-up. The current approach gives her the empty-state experience.
