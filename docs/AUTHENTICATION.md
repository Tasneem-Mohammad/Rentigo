# Authentication integration — setup and verification pending

## Local signup/sign-in without email

At the user's request, local development can set `ENABLE_AUTH=true` and `AUTH_REQUIRE_EMAIL_VERIFICATION=false`, with a valid development database and private `BETTER_AUTH_SECRET`. This exception requires `NODE_ENV=development` and a localhost base URL; production or remote URLs reject it. The example environment retains verification enabled by default. Restart `npm run dev` after changing settings.

In this mode no signup/verification emails are sent. Signup creates a real account, then the user signs in separately. Email remains unconfirmed, identity remains unverified, and publishing/booking capabilities remain false. Password recovery stays unavailable without email delivery. Google setup is independent and remains optional. Restore verification and configure email before production.

Account entry is signup-first: signed-out navigation and private-page entry lead to `/signup`, with a clear existing-account link to `/login`. A successful local registration request clears the form and shows a neutral confirmation with “Continue to sign in”; it does not silently sign the user in or claim that HTTP 200 proves account creation. Better Auth may return a generic success for duplicate emails, so the copy directs existing users to their original credentials and offers recovery when email delivery is configured. Failed registration retains the form and never shows the success panel. Public browsing remains accessible. When verification is required, the email-verification instructions remain in place rather than claiming immediate readiness.

`scripts/check-auth-development.mjs` requires `RENTIGO_ALLOW_TEST_ACCOUNT=true`, uses `RENTIGO_BASE_URL` (default localhost:3101), and creates one labelled development test account. It checks signup, bad passwords, email/username sign-in, session access/revocation and rejection of client-assigned admin/identity privileges. It does not print passwords or send emails. Retained test users are not real marketplace users.

## Decision and scope

Better Auth 1.7.25 owns password hashing, credential accounts, Google OAuth, cookies, database sessions, verification and password-reset tokens. Its official MongoDB adapter uses the native driver; future business persistence continues to use Mongoose. Auth library collections are not duplicated as Mongoose models. This implements the newer account direction in API_DESIGN.md and DB_DESIGN.md rather than the earlier invite-only scaffold proposal.

Implemented code: username/email credential sign-in, signup, sign-out, Google continuation, verification emails, password recovery/reset forms, server-guarded workspace/admin routes, account profile display and a safe authenticated `/api/v1/me` response. Auth endpoints are library-owned under `/api/auth/*`; proposed custom registration/recovery aliases are not duplicated. Client errors do not echo provider/database payloads. Role, account, identity and eligibility fields are not client-writable. Publishing and booking capabilities remain false.

**This milestone is not complete:** development Atlas connectivity and local credential signup/sign-in/session revocation are verified. Email delivery, email verification, recovery and Google OAuth remain unconfigured and unverified. Local signup/sign-in is enabled using the development-only exception above. Existing private placeholder routes require sign-in; they are no longer public previews.

## Development setup

1. Create an Atlas **development** database separate from production, with a dedicated database user and reviewed network access. Prefer allowing your current development IP rather than unrestricted access. The adapter is configured for replica-set transactions; use Atlas, not a standalone MongoDB instance. Grant only the development database permissions needed for auth CRUD and index creation.
2. Copy `.env.example` to `.env.local` if no local environment file exists. Never overwrite existing secrets. Set `ENABLE_DATABASE=true`, a development `MONGODB_URI`, and `MONGODB_DB=rentigo_development`. Keep Cloudinary disabled.
3. Generate `BETTER_AUTH_SECRET` locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and save it privately in `.env.local`. Do not send it through chat or commit it.
4. Set `BETTER_AUTH_URL=http://localhost:3000`. Configure this exact origin; do not accept arbitrary callback hosts. HTTPS is required outside localhost. Set all variables before building and restart/rebuild after changes, since public header availability is rendered with build-time configuration on static pages.
5. Create a Resend account and configure an authorized sender. Set `RESEND_API_KEY` and `AUTH_EMAIL_FROM` to the authorized sender. Resend test senders may restrict recipients; use provider-supported test delivery first. No email service was activated by this work.
6. Optional Google setup: create a Google OAuth **web application**; authorize `http://localhost:3000` and callback `http://localhost:3000/api/auth/callback/google`. Configure test users if required by Google's app settings. Set both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Without them, credential access can work but Google remains unavailable. Never use production credentials for this test.
7. Set `ENABLE_AUTH=true` only after the above is ready. Start with a fresh development database. Confirm the adapter's unique email, username and session-token indexes finish successfully before allowing simultaneous registrations. Library collection names default to `user`, `account`, `session`, `verification` and `rateLimit`; inspect the installed library's generated fields/indexes before integrating domain models. Do not run schema migrations against production.
8. Run `npm run dev`. Create a test account, follow its email verification link, then sign in. Passwords use the library's hashing with a proposed 12–128-character UI/server limit. This technical default is not a new rental policy.

## Security and operational boundaries

- Account linking is disabled: matching email alone never merges Google and credential identities. Provide a proof-of-control linking flow in a later increment if needed.
- Email verification is required for credential sessions. Email confirmation does not update identity or transaction eligibility.
- Verification links expire after one hour. Password reset uses the library's single-use token handling and revokes existing sessions on success. Session lifetime is seven days, refreshed after one day; review these technical defaults before launch.
- Database-backed rate limiting is enabled. During local development all clients intentionally share a counter rather than trusting spoofable forwarded headers. Before deployment, configure and test the hosting proxy's authoritative IP header; do not blindly trust X-Forwarded-For.
- Secrets and email URLs are never logged by application code. Library logging is disabled to avoid accidental credential/provider payload exposure; add redacted operational monitoring before deployment.
- `/api/v1/me` returns only the current user's safe account fields, with no-store caching. Admin pages require a server-side admin role; signup cannot assign one. No public admin creation endpoint exists. A controlled first-admin provisioning procedure remains to be implemented and tested before operator rollout.
- Full business mutations must independently check session, active status, ownership, verified identity and eligibility. A layout guard is not authorization for future endpoints. Suspended-user flows for resolving existing rentals remain necessary before real rentals exist.

## Validation

Run lint, typecheck and build. With auth disabled and a production server running, use `node scripts/check-auth-unconfigured.mjs` to verify unavailable responses, no fabricated cookies, rejection of fake sessions and private-route sign-in redirects. The existing navigation smoke check still checks public pages and follows account redirects.

17 November 2026 verification: lint, TypeScript and production build passed. Disabled-mode auth checks passed, including all seven guarded workspace/admin paths and all four account forms. Navigation checks passed 26 page/filter URLs, public not-found handling and mock search. These disabled-mode results predate development configuration. Subsequently, the development-account test passed against Atlas: signup, both sign-in methods, wrong-password rejection, safe unverified/user defaults, and sign-out session revocation. One labelled test account was retained. No email or Google flows have been tested. Lint, TypeScript and production build passed after the development-only exception was added.

After configuration, the remaining integration acceptance tests are: persisted signup; duplicate/concurrent email and username rejection; bad password; unverified email; verification success/expiry/reuse; username and email sign-in; session persistence and expiry; sign-out invalidation; password-reset success/reuse/expiry/session revocation; Google success/cancellation/account collision; forged role/identity fields; ordinary user denied admin; restricted account denied private routes; cross-origin mutation rejection; and durable rate limiting across restarts. Live service tests are not replaced by disabled-mode checks.

References: [Better Auth MongoDB](https://better-auth.com/docs/adapters/mongo), [credentials](https://better-auth.com/docs/authentication/email-password), [username](https://better-auth.com/docs/plugins/username), [rate limiting](https://better-auth.com/docs/concepts/rate-limit).
