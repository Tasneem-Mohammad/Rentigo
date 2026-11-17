# Stitch design — first implementation stage

## Approved scope

The user approved shared design foundations, navigation/footer and the homepage, followed by review. The reference is `stitch_rentigo_editorial_design_refinement.zip` containing `screen.png`, `code.html`, and `DESIGN.md`. The rendered screenshot/HTML palette takes precedence over conflicting palette examples in the design document. The PRD remains the functional source of truth.

## Implemented

- Newsreader and Plus Jakarta Sans served locally, paper/terracotta/charcoal/sage tokens, restrained 4px corners and hairline divisions.
- Sticky header with locality link, working search, active exploration navigation, listing/sign-in links and responsive mobile menu. Escape closes the mobile menu and restores toggle focus.
- Editorial manifesto beside a portrait product spotlight, with INR pricing and honest preview labels.
- Six photographic product cards, category/area filtering, price sorting, grid/list views, reset and empty states; controls act on fictional data only.
- PRD-aligned discovery/agreement/handover steps, listing CTA and multi-column footer with existing destinations.
- Reused existing UI primitives, Container, ProductCard, states, money formatter and routing. Added an optional image field and ProductMedia so original illustrated examples still render as before.
- Retained the original three sample items and added seven fictional editorial examples so homepage cards open matching details. Shared mock data makes them searchable in Explore, whose layout/filter implementation remains unchanged. Item details only gained shared image rendering; their layout remains unchanged.

Home components live in `src/components/home/`. `src/app/editorial.css` keeps this first-stage visual work separate from the existing scaffold's other page layout rules. Existing structure, server services, database utilities, API boundaries and environment settings were preserved.

## Content adaptations

Vijayawada and INR replace New York and USD. No insurance guarantee, verified-guild claim, live activity count, ratings or concierge sourcing promise was added. Rental requests, authentication, publishing and payments remain unimplemented. Preview controls never reserve items or save data. No donations, production integration or deployment.

## Assets

Seven product images in `public/images/stitch/` were downloaded from the exact image URLs in the user-supplied Stitch HTML. They are visual references for fictional listings, not photographs of real Vijayawada inventory. No image generation or replacement stock design was introduced. The source files are relatively low resolution, so higher-resolution originals would improve large-screen sharpness. The export's broken logo was not reused; the brand is rendered as text with a simple local monogram.

Dependencies added: `@fontsource/newsreader` and `@fontsource/plus-jakarta-sans`. Original fonts remain installed to preserve the previous foundation; no authentication or UI framework was introduced.

## Validation

Lint, TypeScript and production-build checks are run for this delivery, together with the existing navigation script against the production server. Browser QA uses installed Chrome in a temporary isolated profile; no browser library was added to the repository. Checks cover image loading, category and area filtering, reset, daily-rate sorting, grid/list switch, mobile navigation, responsive overflow at 320/390/768/1024/1440px and the featured item's mobile page. Desktop and mobile screenshots were visually inspected. Reduced-motion CSS is retained.

Final results: `npm run lint`, `npm run typecheck` and `npm run build` passed. The navigation script passed 25 page/filter URLs, three unknown-route 404s, category filtering and empty search. Final Chrome checks also passed mobile search submission and Escape-to-close navigation. No uncaught browser errors were observed. Desktop/mobile screenshots were inspected after the final readability refinements. QA used port 3100 to avoid interrupting an existing development server, then stopped its own server.

Existing eight moderate lint-tool dependency advisories are unchanged; these predate the design stage. No full feature or later page design stage is included. Next checkpoint: user review of the homepage before dedicated Explore/item-detail redesign.
