# AGENT.md — TX RetailOS Admin

These instructions apply to all work in this repository. Read this file and `PRD.md` before planning or changing the project.

## 1. Product identity

TX RetailOS Admin is Trexave's internal platform-administration console. It is separate from the RetailOS shop-owner application.

Its purpose is to help authorized platform operators oversee platform accounts and stores, subscription requests, customer feedback, and platform-level administrative activity.

Do not turn this project into another shop operations dashboard. Shop owners should continue using the RetailOS Client.

## 2. Source of truth and repository boundaries

- Treat `PRD.md` as the product scope and acceptance reference.
- Inspect the current repository before assuming its framework, package manager, folder structure, scripts, deployment setup, or existing implementation.
- Follow relevant conventions from the RetailOS Client where appropriate, but do not copy its shop-specific navigation or workflows blindly.
- The RetailOS Server is the source of truth for business data, permissions, and administrative actions.
- Do not invent API endpoints, response fields, roles, permissions, or existing backend capabilities. Verify them in the server repository first.
- The administrative endpoints listed in `PRD.md` are proposed contracts until implemented and verified in RetailOS Server.
- Keep changes within this repository unless the task explicitly includes work in another repository. When backend work is required, identify the corresponding server change rather than silently simulating it in the client.

Related repositories:
- Client: https://github.com/ENJ0Y-Labs/retailos-client
- Server: https://github.com/ENJ0Y-Labs/retailos-server

## 3. Security rules

Security is a product requirement, not a finishing task.

- Never treat frontend route protection, hidden navigation, local storage, or a client-supplied role as authorization.
- Every privileged operation and every administrative data endpoint must be authorized by RetailOS Server.
- Never add a way for public registration or an ordinary user to grant themselves platform-admin privileges.
- Do not store passwords, session secrets, API secrets, payment credentials, or other secrets in source control.
- Do not expose secrets, raw exception traces, environment variables, or unnecessary personal/customer data in the interface or logs.
- Do not place shop-level customer financial records or detailed sales data in platform-wide views unless a separately approved requirement establishes a legitimate support need and access controls.
- Do not implement account deletion, account suspension, impersonation, unrestricted store access, or manual paid-plan activation without an explicit approved product and security design.
- Treat subscription requests as requests. Never represent a pending request as payment confirmation or an active paid plan.
- Keep email-delivery status separate from feedback support/resolution status.
- Administrative mutations must be authorized, validated, and recorded in an append-only platform audit trail on the server.
- API monitoring schedules must execute outside the monitored RetailOS API and must not depend on an open admin browser.
- Treat administrator-supplied monitor URLs as untrusted input. Prevent SSRF by blocking loopback, private, link-local, multicast, and other prohibited destinations; validate DNS and redirects; and enforce HTTPS, allowed ports/methods, timeouts, response limits, and concurrency limits.
- Never return stored monitor credentials or secret headers to the browser or write them to logs.
- Do not claim that periodic keep-alive requests guarantee production availability or remove hosting-provider restrictions.
- Distinguish target-service failures from monitoring-scheduler/control-plane failures, and calculate uptime only from real retained check records.

If a task conflicts with these rules, stop and explain the conflict before implementing it.

## 4. Product and UX rules

- Keep the admin experience visually and structurally distinct from the shop-owner dashboard while respecting the RetailOS brand.
- Prioritize clear information hierarchy, operational clarity, and responsive behavior over decorative dashboards.
- All data-driven screens must handle loading, empty, error, and unauthorized states.
- Lists should support appropriate search, filtering, sorting, and pagination when required by the PRD.
- Use clear labels for plan, trial, subscription, request, payment, feedback delivery, and support workflow states. Do not conflate them.
- Destructive or sensitive actions, if later approved, require explicit confirmation and clear consequences.
- Support keyboard navigation, visible focus, readable contrast, and accessible form labels.
- Do not invent counts, charts, activity, or customer records to make a screen appear populated. Clearly label any development fixture as mock data.

## 5. Engineering workflow

Before implementation:

1. Read this file and `PRD.md`.
2. Inspect the existing files and current git state.
3. Identify whether the task is frontend-only or requires a RetailOS Server change.
4. Verify every API contract against the server repository.
5. State the scope, affected areas, assumptions, and test plan before making broad changes.

During implementation:

- Prefer small, focused changes over unrelated refactors.
- Reuse established project patterns when they are sound.
- Keep API access centralized in the existing project API layer, if one exists.
- Keep presentation components separate from data-fetching and business rules where practical.
- Do not add dependencies without a clear need.
- Do not weaken TypeScript, linting, tests, or security checks to make a change pass.
- Do not silently change product scope or acceptance criteria.

After each implementation phase:

1. Run the relevant tests.
2. Run lint and type checks where configured.
3. Run the production build where configured.
4. Manually verify the affected flow at desktop and mobile widths.
5. Check browser and server output for errors where available.
6. Report exactly what was tested and what could not be tested.

Do not claim a test passed unless it was actually run.

## 6. API integration rules

- Use the established RetailOS client/server integration approach after verifying the current configuration.
- Do not hardcode production URLs, credentials, or environment-specific secrets.
- Treat server validation and authorization as mandatory even when the frontend performs matching validation for usability.
- Handle expected API failures without leaking internal server details.
- Use server-returned values for platform metrics and statuses. Do not calculate authoritative subscription or account states from incomplete client-side data.
- Do not ship a page as functional when it is backed only by placeholder responses.

## 7. Documentation maintenance

Update documentation when a change materially affects product behavior, setup, API integration, environment configuration, security, or testing.

If implementation reveals that the PRD is inaccurate or incomplete, report the discrepancy and propose a documentation update. Do not silently rewrite product requirements to match an accidental implementation.

## 8. Definition of responsible completion

A task is complete only when:

- The requested behavior matches the PRD or an explicitly approved change.
- Required server-side permissions and validation exist for privileged behavior.
- Relevant tests, lint, type checks, and build checks have been run where available.
- Responsive and failure states have been considered.
- Documentation is updated where necessary.
- The final report distinguishes completed work, outstanding dependencies, and unverified behavior.
