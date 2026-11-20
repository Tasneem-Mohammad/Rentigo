# My Project Status — Rentigo

Last updated: 20 November 2026

Rentigo is a local peer-to-peer rental marketplace for Vijayawada, India. This document tracks major project milestones.

## Overall status

The project foundation and homepage are complete. Local signup and sign-in use the development MongoDB database, and owners can save, view and edit private listing drafts through a guided category-first journey. Private photo uploads, cover selection and removal are implemented, with development Cloudinary connectivity checked; the complete owner/browser journey still needs acceptance. Email verification remains unresolved after manual review. Explicitly enabled local prototype publishing now shows completed listings alongside sample discovery. Identity and eligibility integration is deferred for this local stage. Rentigo is in local development, not a live rental service.

## Major milestones

| Milestone | Status | What was delivered |
| --- | --- | --- |
| Project scaffold | Complete | A runnable Next.js project with organised frontend/server boundaries, reusable components, configuration, documentation and navigable placeholder pages. |
| Homepage and design foundation | Complete | The approved Stitch-based homepage, responsive navigation, product presentation, sample browsing controls, how-it-works section and footer. Shared styling establishes the visual direction for future pages. |
| Local account access | Development checkpoint; verification acceptance incomplete | Signup, username/email sign-in, secure sessions, sign-out and protected account pages. Email delivery is configured locally, but inbox delivery, successful verification and subsequent sign-in still need confirmed end-to-end acceptance. Existing-account guidance remains under review. Accounts are not identity-verified or enabled for rental transactions. |
| Private draft listings | Manual management checks passed | Owners can create, view, edit and permanently delete their own drafts in MongoDB, with ownership and conflicting-edit protection. Duplicate names within the same owner/category are prevented; manual checks passed for required pickup area, save redirects, normalized duplicate titles, and confirmed deletion. The guided journey requires category, item name, condition and approximate pickup area. Deposit and estimated value remain separate owner-entered amounts. Explicit saves return to My Listings; drafts stay private. |
| Listing creation and local publication | Core manual checks passed; review fixes await retest | Verified-email owners can publish complete items locally, browse their details, and withdraw to edit privately with photos retained. Save as draft is optional. Manual checks passed for publication, search, withdrawal, private-page removal and stale-write protection. Identity/eligibility integration is deferred locally; production publishing and rentals remain blocked. |
| Private listing photos | Implemented; live journey acceptance pending | Saved drafts support compressed uploads, private owner-only image access, cover selection and removal. Development Cloudinary connectivity is checked. Automated checks cover upload validation, ownership and conflicting operations; complete browser and live concurrency acceptance remains pending. |
| Private draft availability | Manual checks passed | Stitch-based date-range controls, selected-date summary and clear action. Manual checks confirmed incomplete/reversed date rejection, saved-date persistence and clearing; publishing and booking availability enforcement remain separate. |

## Still to build

Complete end-to-end acceptance of local account access, the guided draft journey and private photos. Email verification and password recovery need final inbox/browser review; Google sign-in remains unconfigured. Photo upload, refresh, cover/removal, interrupted-upload recovery and two-tab conflicts need live owner/browser acceptance. Identity/eligibility checks remain before public launch, followed by fuller discovery, rental requests, bookings, messaging, reports, administration and payments. Explore and item-detail pages still need their dedicated design work. Other workspace screens remain placeholders. The application has not been deployed.

## Next planned milestone

Retest the focused conflict-recovery, pickup-area search and zero-deposit publication fixes, then improve discovery of actual published listings with keyword, category, area and availability filtering. Retain final authentication/email and cross-account acceptance checks. Continue in the agreed order: authentication → real listings → discovery → rental requests. Identity/eligibility verification remains required before public launch; its current exception applies only to local prototype publishing. A hosted preview is under consideration; deployment and changing the local-only gate are not yet approved. See [Local prototype publishing](PROTOTYPE_PUBLISHING.md).

For requirements, see [PRD](PRD.md). For the proposed development sequence, see [Development roadmap](DEVELOPMENT_ROADMAP.md).

## Keeping this overview current

Update this document only when a major feature or milestone is completed or the overall project stage changes. Keep entries brief and understandable to someone new to the project. Do not log daily activity, small fixes, font or spacing adjustments, individual checks, or Git commits. Keep technical details in the relevant feature documentation and Git history. Clearly distinguish frontend demonstrations from working features.
