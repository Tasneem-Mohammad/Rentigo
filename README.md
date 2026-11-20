# Rentigo

Local peer-to-peer rental marketplace for Vijayawada. This repository contains a runnable **scaffold**, not a live rental service. Authentication integration is implemented but disabled until development services are configured and verified. Private listing drafts now persist to MongoDB. Publishing, rentals, messaging, moderation and money movement remain unavailable. See [Authentication setup](docs/AUTHENTICATION.md).

## Run locally

Open this directory (the inner `Rentigo` folder containing `package.json`). Use Node.js 22.15+ and npm.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. Environment setup is optional for the preview; all integrations default to disabled. Never put production secrets in this project without explicit authorization. With integrations disabled, pages and builds do not contact providers. Enabling authentication requires an approved development database and email sender.

```powershell
npm run lint
npm run typecheck
npm run build
npm start
```

With the production server running, `node scripts/check-navigation.mjs` checks all page links, mock filtering and not-found behavior. A browser review is still needed for visual/mobile approval.

## Routes

| Route | Scaffold behavior |
| --- | --- |
| `/` | Responsive homepage, categories and fictional products |
| `/explore` | Keyword/category/area filtering of mock listings, including Stitch editorial examples |
| `/items/cordless-drill`, `/items/weekend-tent`, `/items/home-projector` | Mock item details and disabled request/message controls |
| `/login`, `/signup` | Account forms; disabled until services are configured |
| `/dashboard` | Workspace placeholder and navigation |
| `/listings`, `/listings/new` | Private draft list and working save-draft form |
| `/bookings`, `/bookings/preview` | Empty booking list and details layout |
| `/messages`, `/profile` | Empty account screen layouts |
| `/admin` | Admin-only layout with no real moderation actions |

The workspace layout now verifies a server session, and admin layout requires an active admin account. Public browsing remains available. Future business mutations still need independent ownership, participant and identity checks. See docs/AUTHENTICATION.md for setup and unverified integration cases.

## Structure

```text
src/
  app/                  App Router pages, route groups, errors and API boundary
  components/
    ui/                 Button, Input, Card
    layout/             Container, Header, Footer
    listings/           ProductCard and local SVG illustration
    shared/             Preview notice, empty/loading states and page layouts
  server/
    auth/               Session and actor contracts
    services/           Domain use-case contracts
    repositories/       Persistence contracts
    validation/         Server input schemas
  models/               Model boundary documentation (no business schemas except private listings)
  lib/                  Mock data, money formatting and lazy provider utilities
  types/                Public display DTOs
  constants/            Shared navigation
  config/               Server-only environment validation
docs/                   Existing product docs and scaffold decisions
```

Unused hooks, booking components and domain implementation files are intentionally omitted. Tailwind v4 uses CSS-first theme configuration in `globals.css` and the PostCSS plugin, rather than a legacy JavaScript Tailwind config. Fonts are bundled locally with Fontsource. Stitch stage one uses Newsreader and Plus Jakarta Sans, with locally saved reference images and Next.js image optimization. No remote image provider is used at runtime.

## Private listing drafts

Signed-in owners can save, view and edit incomplete private listings. See [Draft listings](docs/DRAFT_LISTINGS.md) for scope, API details and validation. Saved drafts now include a photo editor for signed Cloudinary uploads, cover selection and removal; it remains disabled until development Cloudinary is configured. See [Photo setup and acceptance](docs/LISTING_PHOTOS.md). Private drafts now include simple availability date ranges; see [Availability behavior and testing](docs/LISTING_AVAILABILITY.md). Publishing and booking availability enforcement are not included yet.

## Stitch homepage review

The approved first design stage implements the supplied Stitch homepage and shared visual foundation. See `docs/STITCH_STAGE_1.md` for scope, asset provenance and validation. The homepage includes six fictional editorial cards and a featured item; original sample listings and routes remain available. Category, area, grid/list and daily-rate controls filter only local mock data. Explore and account/detail layouts have not received their next design stage.

## Documentation and status

Read `docs/PRD.md` first, then `docs/SYSTEM_DESIGN.md`. Both existing documents are unchanged. At scaffold creation, `AGENTS.md`, `docs/DESIGN_BRIEF.md` and `docs/IMPLEMENTATION_PLAN.md` were missing. A new AGENTS.md supplies development instructions; it does not replace an approved design brief or implementation plan. Visual direction comes from the user's scaffold request (terracotta, warm ivory, understated luxury) and earlier request for DM Serif Display and Manrope.

Mongoose replaces the official-driver-only proposal in SYSTEM_DESIGN at the user's explicit request. No Netlify deployment has been performed. When deployment is authorized, connect this directory as the Netlify base, run `npm run build`, and use Netlify's Next.js integration; do not statically export the future server app. Configure development/preview credentials separately from production.

See ARCHITECTURE.md, DATABASE_DESIGN.md, API_PLAN.md and DEVELOPMENT_ROADMAP.md in docs for boundaries, proposed records and next steps. Rental-only: no buying, donations, live payments, or protection guarantees.
