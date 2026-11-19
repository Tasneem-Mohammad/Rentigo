# My Project Status — Rentigo

Last updated: 19 November 2026

Rentigo is a local peer-to-peer rental marketplace for Vijayawada, India. This document tracks major project milestones.

## Overall status

The project foundation and homepage are complete. Local signup and sign-in use the development MongoDB database, and owners can save, view and edit private listing drafts through a guided category-first journey. The current work is a development checkpoint, not an authentication release. Email verification remains unresolved after manual review. This checkpoint covers authentication; photo-upload work is deferred to a separate change. Public discovery still uses sample listings. Rentigo is in local development, not a live rental service.

## Major milestones

| Milestone | Status | What was delivered |
| --- | --- | --- |
| Project scaffold | Complete | A runnable Next.js project with organised frontend/server boundaries, reusable components, configuration, documentation and navigable placeholder pages. |
| Homepage and design foundation | Complete | The approved Stitch-based homepage, responsive navigation, product presentation, sample browsing controls, how-it-works section and footer. Shared styling establishes the visual direction for future pages. |
| Local account access | Development checkpoint; verification acceptance incomplete | Signup, username/email sign-in, secure sessions, sign-out and protected account pages. Email delivery is configured locally, but inbox delivery, successful verification and subsequent sign-in still need confirmed end-to-end acceptance. Existing-account guidance remains under review. Accounts are not identity-verified or enabled for rental transactions. |
| Private draft listings | Implemented; follow-up review planned | Owners can create, view and edit their own drafts in MongoDB, with ownership and conflicting-edit protection. The guided journey starts with illustrated category choices, then required item name and condition, followed by rental details. Deposit and estimated value remain separate owner-entered amounts. Saving is an explicit final action; drafts stay private. |

## Still to build

Complete the follow-up review of local account access and the guided draft journey. Email verification and password recovery need final end-to-end review; Google sign-in remains unconfigured. Photo uploads are deferred and not included in this checkpoint. Availability, identity/eligibility checks and publishing remain to build, followed by real discovery, rental requests, bookings, messaging, reports, administration and payments. Explore and item-detail pages still need their dedicated design work. Other workspace screens remain placeholders. The application has not been deployed.

## Next planned milestone

Resume the unresolved email-verification review, including existing-account guidance and confirmed inbox-to-sign-in behavior. Independent UI and private-draft work can continue while authentication remains gated. Keep photo uploads in a separate follow-up change, with their own setup and live acceptance checks. Availability and publishing readiness follow, with identity verification remaining a separate requirement before publishing or rental transactions. Continue in the agreed order: authentication → real listings → discovery → rental requests. See [Draft listings](DRAFT_LISTINGS.md) and [Authentication setup](AUTHENTICATION.md).

For requirements, see [PRD](PRD.md). For the proposed development sequence, see [Development roadmap](DEVELOPMENT_ROADMAP.md).

## Keeping this overview current

Update this document only when a major feature or milestone is completed or the overall project stage changes. Keep entries brief and understandable to someone new to the project. Do not log daily activity, small fixes, font or spacing adjustments, individual checks, or Git commits. Keep technical details in the relevant feature documentation and Git history. Clearly distinguish frontend demonstrations from working features.
