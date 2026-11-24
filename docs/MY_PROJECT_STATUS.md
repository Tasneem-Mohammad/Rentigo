# My Project Status — Rentigo

Last updated: 24 November 2026

Rentigo is a local peer-to-peer rental marketplace for Vijayawada, India. This document tracks major project milestones.

## Overall status

The project foundation and homepage are complete. Local signup and sign-in use the development MongoDB database, and owners can save, view and edit private listing drafts through a guided category-first journey. Private photo uploads, cover selection and removal are implemented, with development Cloudinary connectivity checked; the complete owner/browser journey still needs acceptance. Hosted account and email access are now reported working; focused acceptance of signup, sign-in, verification resend and password recovery is in progress. Prototype listings can be browsed alongside sample discovery. Hosted prototype publishing uses one server-controlled switch; genuine identity and eligibility integration remains deferred. Rentigo is deployed on Vercel with a user-reported personal domain for testing, not an operational rental service.

## Major milestones

| Milestone | Status | What was delivered |
| --- | --- | --- |
| Project scaffold | Complete | A runnable Next.js project with organised frontend/server boundaries, reusable components, configuration, documentation and navigable placeholder pages. |
| Homepage and design foundation | Complete | The approved Stitch-based homepage, responsive navigation, product presentation, sample browsing controls, how-it-works section and footer. Shared styling establishes the visual direction for future pages. |
| Account access and hosted testing | User reports hosted access working; focused acceptance pending | Signup, username/email sign-in, verification resend and password recovery are available on the hosted testing app. Duplicate username/email guidance is implemented and code review reported no actionable findings. Final browser acceptance remains pending. Accounts are not identity-verified or eligible for real rental transactions. |
| Private draft listings | Manual management checks passed | Owners can create, view, edit and permanently delete their own drafts in MongoDB, with ownership and conflicting-edit protection. Duplicate names within the same owner/category are prevented; manual checks passed for required pickup area, save redirects, normalized duplicate titles, and confirmed deletion. The guided journey requires category, item name, condition and approximate pickup area. Deposit and estimated value remain separate owner-entered amounts. Explicit saves return to My Listings; drafts stay private. |
| Listing creation and prototype publication | Core local checks passed; simplified hosted publication awaits acceptance | Complete listings support publication, discovery and withdrawal. Active verified-email owners can publish complete listings when the prototype switch is enabled. No simulated verification or tester setup is required. Real verification and rental transactions remain unavailable. |
| Private listing photos | Implemented; live journey acceptance pending | Saved drafts support compressed uploads, private owner-only image access, cover selection and removal. Development Cloudinary connectivity is checked. Automated checks cover upload validation, ownership and conflicting operations; complete browser and live concurrency acceptance remains pending. |
| Listing availability | Simplified choice implemented; acceptance pending | Usually available is now the default, with an optional specific date window. Existing windows are preserved. Automated checks cover date-free publication and incomplete-window rejection; booking reservations remain separate work. |

## Still to build

Complete end-to-end acceptance of local account access, the guided draft journey and private photos. Email verification and password recovery need final inbox/browser review; Google sign-in remains unconfigured. Photo upload, refresh, cover/removal, interrupted-upload recovery and two-tab conflicts need live owner/browser acceptance. Identity/eligibility checks remain before public launch, followed by fuller discovery, rental requests, bookings, messaging, reports, administration and payments. Explore and item-detail pages still need their dedicated design work. Other workspace screens remain placeholders. The application is deployed on Vercel, and the user reports a personal domain is connected. Hosted account/email access is reported working; focused acceptance of signup, sign-in, resend verification and password recovery is in progress.

## Next planned milestone

Enable the single publishing switch and accept the hosted flow: verify email, complete listing → publish → browse → withdraw. Retain focused account/email and cross-account checks. Then improve discovery with real listings, keyword/category/area and availability filtering, followed by rental requests. Genuine verification/eligibility remain required before real rental launch. See [Prototype publishing](PROTOTYPE_PUBLISHING.md) and [Vercel setup](VERCEL_SETUP.md).

For requirements, see [PRD](PRD.md). For the proposed development sequence, see [Development roadmap](DEVELOPMENT_ROADMAP.md).

## Keeping this overview current

Update this document only when a major feature or milestone is completed or the overall project stage changes. Keep entries brief and understandable to someone new to the project. Do not log daily activity, small fixes, font or spacing adjustments, individual checks, or Git commits. Keep technical details in the relevant feature documentation and Git history. Clearly distinguish frontend demonstrations from working features.
