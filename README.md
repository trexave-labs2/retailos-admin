# TX RetailOS Admin

The internal platform administration console for **TX RetailOS**, built for the Trexave team.

RetailOS Admin is a separate administrative surface from the shop-owner application. It is intended to give authorized platform operators visibility into registered accounts and stores, subscription requests, customer feedback, and platform-level administrative activity.

## Product scope

The planned first release focuses on:

- Platform overview and attention-required summaries.
- Read-only account and store oversight.
- Read-only subscription and plan-change request visibility.
- Feedback inbox and support workflow tracking.
- A dedicated, read-only platform administration audit log.

System health and controlled operational actions are planned for a later phase.

## Related repositories

- [RetailOS Client](https://github.com/ENJ0Y-Labs/retailos-client) — shop-owner application.
- [RetailOS Server](https://github.com/ENJ0Y-Labs/retailos-server) — application API and data services.
- [RetailOS Admin](https://github.com/ENJ0Y-Labs/retailos-admin) — this platform administration project.

## Documentation

- [Product Requirements Document](./PRD.md) — product goals, users, scope, workflows, requirements, release plan, and acceptance criteria.
- [Agent Instructions](./AGENT.md) — repository-specific rules for contributors and AI coding agents.

## Important product and security boundaries

- This is an internal platform console, not a second shop dashboard.
- Platform-admin access must be granted and enforced by the server. Hiding a link or protecting a frontend route is not authorization.
- The existing RetailOS Server does not yet provide the platform-admin role, administrative authorization, or the proposed platform-admin endpoints described in the PRD.
- Proposed API paths in the PRD are planning contracts, not claims that those endpoints already exist.
- Account deletion, account suspension, unrestricted browsing of shop financial/customer records, impersonation, and manual paid-plan activation are out of scope for the initial release.
- A pending plan-change request must never be represented as proof of payment or as an active paid subscription.

## Project status

**Status: Product definition and planning.**

Do not present mock data or unfinished screens as connected, production-ready administration features. Implementation should proceed against verified server contracts, with authorization and security foundations completed before platform data is exposed.
