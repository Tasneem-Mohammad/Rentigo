# Vercel testing deployment

The user selected Vercel for the next hosted testing increment on 20 November 2026, replacing the earlier proposed Netlify destination. This does not approve a public rental launch or expand the local-only publishing exception.

## First deployment: interface only

Import the repository's main branch, root directory `./`, Next.js preset. The checked-in `vercel.json` selects the webpack production build used by local validation. Leave output/install settings at their framework defaults.

For the first deployment, override imported environment variables:

```dotenv
ENABLE_AUTH=false
ENABLE_DATABASE=false
ENABLE_CLOUDINARY=false
ENABLE_PROTOTYPE_PUBLISHING=false
AUTH_REQUIRE_EMAIL_VERIFICATION=true
```

This permits checking the deployed interface without enabling account/database/photo services using copied localhost settings. Local `.env.local` stays unchanged and ignored. Do not set NODE_ENV to development on Vercel. Keep secrets in Vercel environment settings, never Git or screenshots.

## After Vercel assigns the URL

Set BETTER_AUTH_URL to the exact chosen HTTPS deployment origin, without a trailing path. Use a separate hosted-test auth secret, testing database and least-privilege database user. Configure Atlas access for Vercel's outbound connectivity; the laptop's IP allowance is insufficient. Configure the email sender, keep email verification on, and verify callback links before enabling authentication. Google remains disabled unless both credentials and the exact callback URL are configured.

Then deliberately enable and test database/auth/photo services. Imported secrets alone do not complete hosted configuration. Hosted publishing remains blocked by design; a separate approved hosted-prototype gate is required. Before enabling photo delivery, reconcile the current 5 MiB private proxy limit with Vercel's 4.5 MB function payload limit, including existing assets. No existing photos are removed by this setup.

Test signup/verification/login, recovery, protected pages, ownership isolation and uploads before sharing with testers. Use deployment protection where available. Continue local work on feature branches, test previews, then merge approved changes to main.
