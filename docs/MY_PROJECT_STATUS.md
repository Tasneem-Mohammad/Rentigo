# My Project Status — Rentigo

Last updated: 18 November 2026

Rentigo is a local peer-to-peer rental marketplace for Vijayawada, India. This document tracks major project milestones.

## Overall status

The project foundation and homepage are complete. Local signup and sign-in use the development MongoDB database, and owners can save, view and edit private listing drafts through a guided category-first journey. The current milestone is ready for a saved development checkpoint, with follow-up manual review planned. Public discovery still uses sample listings. Rentigo is in local development, not a live rental service.

## Major milestones

| Milestone | Status | What was delivered |
| --- | --- | --- |
| Project scaffold | Complete | A runnable Next.js project with organised frontend/server boundaries, reusable components, configuration, documentation and navigable placeholder pages. |
| Homepage and design foundation | Complete | The approved Stitch-based homepage, responsive navigation, product presentation, sample browsing controls, how-it-works section and footer. Shared styling establishes the visual direction for future pages. |
| Local account access | Working in development | Signup, username/email sign-in, secure sessions, sign-out and protected account pages. Signup leads to a sign-in confirmation step. Email verification is postponed only for local development; accounts are not identity-verified or enabled for rental transactions. |
| Private draft listings | Implemented; follow-up review planned | Owners can create, view and edit their own drafts in MongoDB, with ownership and conflicting-edit protection. The guided journey starts with illustrated category choices, then required item name and condition, followed by rental details. Deposit and estimated value remain separate owner-entered amounts. Saving is an explicit final action; drafts stay private. |

## Still to build

Complete the follow-up review of local account access and the guided draft journey. Email verification, password recovery and Google sign-in still need configuration and end-to-end testing. Listing photos, availability, identity/eligibility checks and publishing remain to build, followed by real discovery, rental requests, bookings, messaging, reports, administration and payments. Explore and item-detail pages still need their dedicated design work. Other workspace screens remain placeholders. The application has not been deployed.

## Next planned milestone

After the follow-up review, add photo uploads to private drafts before availability and publishing readiness. Continue in the agreed order: authentication → real listings → discovery → rental requests. See [Draft listings](DRAFT_LISTINGS.md) and [Authentication setup](AUTHENTICATION.md) for technical details and remaining checks.

For requirements, see [PRD](PRD.md). For the proposed development sequence, see [Development roadmap](DEVELOPMENT_ROADMAP.md).

## Keeping this overview current

Update this document only when a major feature or milestone is completed or the overall project stage changes. Keep entries brief and understandable to someone new to the project. Do not log daily activity, small fixes, font or spacing adjustments, individual checks, or Git commits. Keep technical details in the relevant feature documentation and Git history. Clearly distinguish frontend demonstrations from working features.
