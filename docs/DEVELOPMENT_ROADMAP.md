# Development roadmap

This is a proposed sequence, not the missing approved IMPLEMENTATION_PLAN.md. PRD scope remains authoritative.

## Scaffold — this delivery

App Router, TypeScript, Tailwind, reusable responsive UI, navigable placeholder routes, fictional display data, server contracts, disabled lazy provider utilities, environment validation and architecture documentation. No database, auth, messaging or payments are live.

## Next: approve foundations

Review the visual direction and supply/approve the missing design brief and implementation plan. Confirm authentication provider, invitation/community approval, allowed categories and pilot boundaries. Keep mobile-first navigation and accessibility review part of approval.

## Then: accounts and listings

Implement established secure sessions and server authorization first. Add approved development Atlas schemas/repositories, ownership checks, Cloudinary signed uploads, minimal listing form and public/private location separation. Test permissions and invalid input before exposing data.

## Then: discovery and requests

Implement location/category/date-aware search and real availability. Agree day-counting rules. Implement requests, negotiated terms, immutable snapshots and atomic overlap prevention. Add focused integration tests for concurrent acceptance and authorization.

## Then: complete prototype journey

Add participant messaging, bilateral pickup/return confirmations, reports and operator review. Introduce clearly labelled simulated financial states only in the later working prototype. Test transitions and retries; no real collection.

## Later: controlled pilot

Deploy only after authorization. Separate preview and pilot data. Measure hosting quotas/performance, backup/restore and operational readiness. Assign contested-case review and settle deposit, cancellation, inspection, non-return and refund policies before selecting and integrating real payment and identity providers.

Stop after scaffold review for this task; no subsequent stage has been implemented.
