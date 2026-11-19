# TX RetailOS Admin — Product Requirements Document

**Product:** TX RetailOS Admin  
**Organization:** Trexave Technologies  
**Product area:** Internal platform administration  
**Document status:** Proposed product requirements  
**Release target:** Initial administrative release (MVP)

---

## 1. Product overview

TX RetailOS Admin is an internal Platform Administration Console for authorized Trexave personnel who operate and support TX RetailOS.

It is a separate product surface from the RetailOS shop-owner application. The shop-owner application supports day-to-day retail operations such as sales, products, inventory, customers, debts, alerts, audit history, settings, and plan information. The Admin console provides platform-level oversight rather than duplicating those shop workflows.

The MVP gives authorized operators a reliable overview of the platform, account and store lookup, subscription visibility, feedback review, administrative accountability, and a high-level view of backend availability.

APIMON remains a separate monitoring product. It performs scheduled checks independently of RetailOS and the Admin browser. RetailOS Admin consumes APIMON's monitoring results through a secure server-to-server, read-only integration. Admin does not implement another monitoring scheduler or duplicate APIMON's checks.

## 2. Problem statement

RetailOS stores information useful for platform support and operations, including user and store records, subscription-change requests, feedback submissions, and store-scoped audit records.

However, the platform needs a dedicated administrative experience and a verified platform-admin authorization model. Existing store authorization is not equivalent to platform-wide administrative permission. Existing store-scoped audit records are not a substitute for platform-admin audit history. Feedback delivery status does not describe whether Trexave has reviewed or resolved a support issue.

Operators also need to understand whether the RetailOS backend is responding without making the Admin application responsible for monitoring it. APIMON already serves that separate monitoring responsibility; the Admin console needs a safe way to present its results.

## 3. Product goals

1. Give authorized Trexave operators a reliable high-level view of RetailOS.
2. Show useful platform metrics, including registered users, free users, active premium users, trial users, and stores, using authoritative backend data.
3. Make account and store lookup possible without exposing unnecessary shop data.
4. Make subscription and plan-change request status visible without implying that a request is a payment.
5. Provide a usable feedback review workflow that distinguishes message delivery from support resolution.
6. Make platform-admin actions traceable through dedicated audit records.
7. Display RetailOS backend monitoring information from APIMON without duplicating its monitoring engine.
8. Establish a secure foundation for later operational and billing capabilities.

## 4. Non-goals

The Admin MVP is not intended to:

- Replace or duplicate the shop-owner RetailOS Client.
- Provide public customer registration or self-service admin-role assignment.
- Process payments, verify bank transfers, or reconcile payments.
- Manually activate, extend, downgrade, or revoke paid plans.
- Delete or suspend user accounts or stores.
- Impersonate shop owners or sign in as another user.
- Provide unrestricted access to shop-level customer records, debts, receipts, or detailed financial transactions.
- Build a second uptime-monitoring scheduler or monitoring database inside RetailOS Admin.
- Manage APIMON monitor configuration, schedules, or alert destinations.
- Become a complete infrastructure observability or incident-management platform.
- Expose secrets, raw server exceptions, credentials, or environment configuration.

These capabilities require separate product, security, and operational decisions before they can be considered.

## 5. Users and access

### 5.1 Platform administrator

An authorized Trexave operator responsible for platform oversight and support.

Expected MVP capabilities:

- View platform overview metrics.
- Search and inspect account and store summaries.
- Inspect subscriptions, trials, and plan-change requests.
- Review submitted feedback and update its support workflow state.
- Read platform-admin audit records.
- View read-only backend health information retrieved from APIMON.
- Manage their own administrator profile and security settings.

### 5.2 Ordinary RetailOS user

A shop owner or normal application user.

Expected access:

- Continue using the RetailOS Client and its existing store-scoped capabilities.
- No access to platform-admin pages or platform-admin API data.

### 5.3 Authorization principles

- Platform-admin status must be explicitly managed by the server.
- The initial administrator must be provisioned through a controlled process, not public registration.
- The server must authorize every administrative request.
- Frontend route guards and hidden navigation are usability measures only; they are not security controls.
- An ordinary authenticated user attempting an administrative request must be denied with an authorization failure.
- A role or permission value supplied by the browser must never grant privileges.
- Admin access must be least-privilege and separate from ordinary store-admin permissions.

The RetailOS Server must be inspected and updated to provide the platform-admin role and dedicated authorization. These are prerequisites, not capabilities that should be assumed to exist.

### 5.4 Independent Admin credentials and sessions

RetailOS Admin and RetailOS Client are separate authentication realms. The same email address may identify a retail account and a platform-administrator account with different passwords.

- Client authentication uses the retail account password and Client session.
- Admin authentication uses a dedicated administrator password credential and an independent HttpOnly Admin session cookie.
- Signing in, signing out, changing a password, or revoking sessions in one application must not replace or invalidate the other application's session.
- Admin API authorization must validate the Admin session and server-assigned platform-admin role. A Client session must never grant platform-admin access.
- Public registration must not create or grant platform-admin credentials.
- Existing administrators migrated from the former shared-password flow retain their current password as the initial Admin password and must change it independently in Admin Settings.
- When an existing retail user is granted platform-admin access, the initial Admin credential may be initialized from the current retail password for compatibility; the administrator must change it immediately in Admin Settings.
- A bootstrap-created administrator with no pre-existing retail account must not be able to use the Admin password to sign in to the Client.

## 6. Information architecture

The independent Platform Admin navigation is:

1. **Overview**
2. **Users**
3. **Stores**
4. **Subscriptions**
5. **Subscription Requests**
6. **Feedback & Support**
7. **Audit Logs**
8. **Administrators**
9. **Monitoring**
10. **Incidents**
11. **Settings**

The Admin console has its own layout, routes, navigation, authentication entry point, and design system. It must not import Client UI components or depend on the RetailOS Client frontend.

Administrator privilege management is restricted to the deployment-provisioned `super_admin`. The Administrators navigation item may be shown only to that role as a usability measure; the server remains responsible for authorization.

Monitoring and Incidents are separate read-only views in the Admin interface. The current RetailOS Server exposes monitor summary, monitor list, and incident list APIs. The Admin UI does not expose monitor creation, configuration, manual-check, or scheduler controls. Recurring checks must be performed by a separately deployed scheduler, not by an open Admin browser or the Flask request process.

The APIMON integration described later in this PRD remains a proposed future integration unless a verified APIMON server-to-server contract is implemented. Do not label current RetailOS monitor records as APIMON data or claim APIMON is connected.

## 7. Functional requirements

### 7.1 Overview Dashboard

**Purpose:** Answer how large the RetailOS platform is, how its accounts and stores are distributed, what needs attention, and whether the backend is currently responding.

#### Summary metrics

The first dashboard uses the metrics currently returned by `GET /admin/overview`:

- **Total users:** All registered user accounts.
- **Total stores:** All registered stores.
- **Active premium stores:** Pro stores with an active subscription status and a non-expired current period. Trial stores are excluded from this count.
- **Active trial stores:** Pro stores with trial status and a non-expired current period.
- **Free stores:** Stores whose persisted current plan is free or null. Expired Pro rows are not silently reclassified as free.
- **New users in the last 30 days:** Accounts created in the rolling 30 days before the response generation time.
- **New stores in the last 30 days:** Stores created in the rolling 30 days before the response generation time.
- **Sales transactions in the last 30 days:** Persisted sale records created in the rolling 30 days. This is a transaction count, not revenue.

#### Supporting content

- Server-provided metric definitions so administrators can understand exactly what each count means.
- The response generation timestamp so the freshness of the snapshot is visible.
- No trend chart, revenue chart, activity feed, or other visualization should be shown unless an API returns the required underlying data. Do not manufacture time-series points from aggregate totals.

#### Requirements

- Metrics must be calculated and returned by the RetailOS Admin backend.
- Do not use hardcoded or fabricated production counts.
- Counts must have clearly defined meanings and must not conflate pending requests with paid subscriptions.
- Show the reporting period and relevant update time.
- Do not expose individual shop sales or customer financial records by default.
- If a metric is unsupported by available backend data, omit it or mark it unavailable rather than estimate it.

These are product requirements, not claims that the existing backend already exposes the required administrative API responses.

### 7.2 User Management

**Purpose:** Allow authorized operators to find and inspect registered RetailOS users.

The user directory must support:

- Viewing all registered users.
- Searching by name, email address, or user ID.
- Filtering by free, trial, and premium status.
- Filtering by registration date.
- Filtering or sorting by last activity where reliable activity data exists.
- Server-side pagination and sorting.

Proposed list information:

- User/account identifier.
- Name and email address.
- Registration date.
- Current plan and subscription status.
- Number of associated stores, where supported.
- Last activity, where supported.

The detail view may include basic account information, registration date, current plan and subscription status, trial dates, associated stores, subscription history, relevant usage information, and recent account activity where the server has reliable data.

Requirements:

- Search, filters, and pagination must be applied by the server for platform-wide data.
- Return only fields needed for platform support.
- Represent missing data honestly.
- The initial release is read-only.
- Do not expose full customer lists, debt details, receipts, or transaction-level financial data.
- Do not provide account deletion, suspension, password reset on behalf of a user, or impersonation in the MVP.

### 7.3 Store Management

**Purpose:** Give platform operators visibility into stores registered on RetailOS.

The store directory must support viewing all stores, searching by store name/owner/email/store ID, filtering by plan and subscription status, filtering by registration date and supported activity state, and server-side pagination and sorting.

Proposed store information:

- Store identifier and name.
- Owner/account.
- Registration date.
- Current plan and subscription status.
- Store status, if an authoritative status exists.
- Staff/user count, where supported.
- Last activity and usage information, where supported.

The detail view should provide a safe summary of the store, its owner, plan, subscription state, usage, and relevant administrative history.

Requirements:

- Retrieve store information through authorized Admin API endpoints.
- The initial release is read-only.
- Do not expose detailed shop customer records, debt ledgers, receipts, or transaction-level financial data.
- Do not provide store deletion, suspension, or impersonation in the MVP.
- Do not label a store active or inactive unless the backend has a documented rule and sufficient data.

### 7.4 Subscription Management

**Purpose:** Give platform operators visibility into plans, trials, premium entitlements, and requested plan changes.

The section should distinguish:

- Free accounts/stores.
- Active trials.
- Active premium subscriptions or entitlements.
- Expired subscriptions.
- Pending plan-change requests.
- Approved or rejected requests, where those states exist.

Proposed information includes user/account and store reference, current plan, subscription status, trial status and dates, requested target plan, billing interval, saved price snapshot where available, request status and timestamps, and payment reference or verified payment state only when an authoritative payment integration supplies it.

Requirements:

- Pending plan-change requests must be labelled as requests, not proof of payment.
- A pending request must not be displayed as an active paid subscription.
- The interface must reflect the server's authoritative plan and subscription state.
- If billing data is unavailable, say so rather than manufacture a payment state.
- The MVP is read-only.

Out of scope:

- Manual premium activation or extension.
- Manual plan changes.
- Payment capture, verification, refunds, invoice management, and payment reconciliation.

Manual activation may be considered later only after a verified billing workflow, explicit permissions, reason capture, duration/expiry rules, server-side validation, and audit logging have been designed and approved.

**Current limitation:** The existing backend supports plan catalogue and subscription-related operations, including plan-change requests, but paid billing is not configured. A payment-provider integration and verified payment workflow are future work.

### 7.5 Feedback & Support

**Purpose:** Let authorized operators review feedback submitted through RetailOS and track whether Trexave has addressed it.

List information:

- Submission identifier, category, and submission date.
- Contact name/email, if supplied.
- Associated user or store, if known and safely linkable.
- Message preview.
- Email-delivery status.
- Support workflow status.

The detail view should show the full submitted message, submission metadata, supplied contact details, delivery status and timestamp, and support workflow status.

Filters should include category, date range, email-delivery status, and support workflow status.

The initial support workflow states are:

- New.
- In Progress.
- Resolved.

Requirements:

- Email-delivery status and support workflow status are separate fields with separate meanings.
- Existing delivery states such as pending, sent, and failed must not be overwritten to represent support resolution.
- The server must validate allowed support-status values or transitions.
- Every administrative status change must be recorded in the platform-admin audit trail.
- Display feedback safely as untrusted user-submitted text.
- Show contact information only to authorized operators who need it for support.
- This is a basic feedback review workflow, not a complete ticketing, live-chat, or customer-support platform.

**Current limitation:** The backend stores feedback submissions and email-delivery state, but does not yet provide platform-admin listing or support workflow management. A separate support-status field and migration are required.

### 7.6 Audit Logs

**Purpose:** Provide a trustworthy record of platform-level administrative activity.

Proposed record information:

- Administrator identity.
- Action performed.
- Affected account or store, where applicable.
- Timestamp.
- Outcome.
- Reason or safe contextual metadata, where appropriate.

Events include administrator authentication events where appropriate, feedback support-status changes, future subscription/account changes if approved, security-sensitive configuration changes, and other privileged platform-admin operations.

Requirements:

- The platform-admin audit log is separate from existing store-scoped audit logs.
- The interface is read-only.
- Records are append-only from the application's perspective.
- Administrative mutations should write their audit record as part of the same successful operation where practical.
- Exclude passwords, password hashes, session data, tokens, secrets, credentials, and payment credentials.
- Restrict audit access to authorized platform administrators.
- Records must identify the actor, action, target, timestamp, and outcome sufficiently for investigation.

### 7.7 System Health — APIMON integration

**Purpose:** Show authorized operators whether the RetailOS backend is responding, using monitoring results produced by APIMON.

#### Product responsibility

- **APIMON:** Independently performs scheduled checks, records check results, and maintains monitoring history.
- **RetailOS Admin:** Retrieves and displays APIMON results for platform operators.
- **RetailOS Server:** Continues operating independently of APIMON and must not depend on APIMON for normal application functionality.

APIMON must continue checking RetailOS when the Admin browser is closed, no administrator is signed in, and RetailOS itself is unavailable.

The initial monitored service is the RetailOS backend health endpoint configured in APIMON. The exact URL and success criteria must be confirmed against the active APIMON configuration before implementation. Do not hardcode a monitoring URL in the Admin frontend.

#### Integration architecture

Use a server-to-server pull model:

1. APIMON performs scheduled checks independently and stores results in its own monitoring storage.
2. The RetailOS Admin backend makes authenticated, read-only requests to the APIMON API when it needs monitoring information.
3. The Admin backend validates and normalizes the APIMON response.
4. The Admin frontend receives only safe status and history fields needed for display.

The Admin backend must store the APIMON API credential as a server-side secret. Never send it to the browser, embed it in frontend code, store it in browser storage, or write it to application logs.

Use a dedicated read-only APIMON credential or API scope if supported. Do not give RetailOS Admin monitor-management permissions when it only needs status and history. If APIMON does not support scoped read-only credentials, document the limitation and address it before production use.

The Admin backend should use bounded timeouts and a short, documented cache where appropriate. APIMON being unavailable must not break the dashboard or other Admin workflows.

#### Information displayed

The System Health page should display:

- **Backend status:** Operational, Degraded, Down, or Unknown, based on APIMON's recorded state and documented status mapping.
- **Last successful check:** Timestamp of the latest successful check.
- **Last check:** Timestamp and outcome of the most recent attempted check.
- **Response time:** Duration recorded by APIMON for the relevant check.
- **Uptime/availability:** Calculated from actual retained APIMON check history for a clearly labelled reporting window.
- **Last incident:** Most recent recorded outage/failure and recovery information, if APIMON exposes it.
- **Monitoring data freshness:** When the displayed APIMON data was last retrieved or updated.

The Dashboard should show a compact version of current backend status and the time of the latest check. The System Health page may show additional history and incident details available from APIMON.

#### Status and failure handling

- If APIMON reports the backend healthy according to its configured success criteria, display Operational.
- If APIMON reports a failure state, display the mapped failure state and last-check details.
- If APIMON cannot be reached, its API request fails, credentials are invalid, or monitoring data is stale beyond the documented freshness threshold, display Unknown or Monitoring unavailable as appropriate.
- An APIMON API failure must never be represented as proof that RetailOS Server is down.
- Distinguish target-service failure from monitoring-service failure.
- Do not fabricate response times, uptime percentages, incidents, or timestamps.
- Calculate uptime only from actual retained check history and show the measurement window and treatment of missing data.
- Identify stale data so operators do not mistake an old successful check for current health.

#### Explicitly out of scope for the Admin MVP

- Building or hosting a second scheduler.
- Performing recurring health checks from the Admin frontend or backend.
- Creating a second monitoring database or incident engine.
- Registering, editing, pausing, or deleting APIMON monitors.
- Changing APIMON schedules or alert destinations.
- Sending monitoring webhooks from APIMON to RetailOS Admin.
- Full infrastructure observability, database metrics, background-job metrics, distributed tracing, and log aggregation.

A push/webhook integration may be considered later if there is a demonstrated need for near-real-time event delivery. It is not required for the MVP because APIMON already stores monitoring results that the Admin backend can retrieve.

### 7.8 Admin Settings

**Purpose:** Allow an administrator to manage their own access and basic preferences.

MVP capabilities:

- View and update permitted administrator profile details.
- Change password through the approved authentication flow.
- View active sessions and revoke sessions where supported by the authentication system.
- View basic account security information.
- Configure non-sensitive personal preferences such as display preferences, if supported.

Requirements:

- Do not expose secrets, environment variables, credentials, or unrestricted platform configuration.
- Sensitive changes require server-side authorization and appropriate re-authentication.
- Security-relevant changes must be recorded in the platform-admin audit trail.
- Platform-wide configuration controls are out of scope unless separately specified and approved.

## 8. Proposed administrative API contracts

The following are proposed contracts between the Admin client and RetailOS Server. They are not claims that the routes currently exist.

| Proposed endpoint | Purpose |
| --- | --- |
| GET /admin/overview | Aggregated platform metrics, trends, and attention counts. |
| GET /admin/users | Search, filter, and paginate platform users. |
| GET /admin/users/{id} | Retrieve a safe user detail view. |
| GET /admin/stores | Search, filter, and paginate stores. |
| GET /admin/stores/{id} | Retrieve a safe store detail view. |
| GET /admin/subscriptions | List subscription and entitlement states. |
| GET /admin/subscription-requests | List plan-change requests across platform scope. |
| GET /admin/feedback | List and filter feedback submissions. |
| GET /admin/feedback/{id} | Retrieve feedback detail. |
| PATCH /admin/feedback/{id} | Update the separate support workflow status. |
| GET /admin/audit | Retrieve platform-admin audit records. |
| GET /admin/system-health | Retrieve normalized, safe APIMON monitoring status. |
| GET /admin/system-health/history | Retrieve permitted APIMON check history and incident information. |
| GET /admin/settings/profile | Retrieve the current administrator's permitted profile. |
| PATCH /admin/settings/profile | Update permitted administrator profile fields. |
| GET /admin/settings/sessions | List the current administrator's sessions, where supported. |
| DELETE /admin/settings/sessions/{id} | Revoke an eligible session, where supported. |

The RetailOS Admin backend, not the browser, must call APIMON. Verify APIMON's current API paths and response schema before integration. Do not invent APIMON endpoint paths or response fields.

All administrative routes must:

- Require a valid authenticated session.
- Require explicit platform-admin authorization.
- Validate query parameters, identifiers, and mutation payloads.
- Use consistent API response conventions.
- Apply pagination and sensible result limits to list endpoints.
- Avoid returning unnecessary personal or sensitive data.
- Be covered by positive and negative authorization tests.

The Admin client must not ship functional screens against assumed endpoints. Backend contracts must be implemented and verified first.

## 9. UX and accessibility requirements

- Responsive layout for desktop, tablet, and mobile.
- Dedicated platform-admin navigation and page structure.
- Clear page titles, status labels, and action hierarchy.
- Consistent loading, empty, error, stale-data, and unauthorized states.
- Search and filters should preserve understandable state.
- Lists should remain usable at narrow widths.
- Keyboard navigation and visible focus indicators.
- Accessible labels and controls.
- Readable color contrast and status indicators that do not rely on color alone.
- Clear distinction between account plan, subscription state, payment state, and pending request state.
- Clear distinction between target backend health and APIMON monitoring availability.
- Confirmation for any future sensitive or destructive action.
- No fabricated charts, counts, activity, or records in production.

## 10. Non-functional requirements

### Security and privacy

- Server-side authorization on every Admin API request.
- Least-privilege data exposure.
- Independent Client and Admin credentials and sessions, with server-side authorization for each authentication realm.
- No client-side privilege escalation.
- Safe handling and rendering of user-submitted feedback.
- Append-only administrative audit history.
- No secrets or sensitive credentials in logs or UI responses.
- APIMON credentials stored only in server-side secret configuration.
- Admin-to-APIMON requests must be authenticated and read-only.
- No direct browser-to-APIMON request that exposes the APIMON credential.

### Reliability

- Clear handling of network failures and server errors.
- No false success states when an administrative request fails.
- Metrics and statuses must come from authoritative server responses.
- Pagination and filtering must behave consistently.
- APIMON outages must not prevent the rest of RetailOS Admin from operating.
- APIMON unavailability must be represented as Unknown or Monitoring unavailable, not as a confirmed RetailOS outage.
- The Admin application must not become a runtime dependency of RetailOS Client or APIMON.

### Maintainability

- Keep API access centralized using the project's established integration pattern.
- Avoid duplicating business rules in the frontend.
- Document API dependencies and configuration.
- Keep platform administration concerns separate from shop-owner workflows.
- Keep APIMON integration behind a backend service boundary so the provider can be changed without redesigning the Admin UI.

## 11. Dependencies and required backend work

The initial product depends on changes in RetailOS Server:

1. Introduce an explicit server-managed platform-admin identity/role.
2. Implement server-side platform-admin authorization.
3. Establish a controlled initial-admin provisioning process.
4. Add a dedicated platform-admin audit record model or equivalent isolated audit mechanism.
5. Add platform overview aggregation with documented metric definitions.
6. Add safe platform-wide user search and detail queries.
7. Add safe platform-wide store search and detail queries.
8. Add platform-wide subscription and plan-change request listing.
9. Add feedback listing and detail access for administrators.
10. Add a separate feedback support workflow status and database migration.
11. Add audited feedback status updates.
12. Add administrative audit listing.
13. Add a secure Admin backend integration with APIMON, including server-side secret configuration, response validation, safe status mapping, timeout handling, and stale-data handling.
14. Add the safe Admin settings endpoints required by approved authentication/session capabilities.

APIMON integration also depends on APIMON providing an authenticated way to retrieve monitor status and check history. Verify the existing APIMON API contract and determine whether a dedicated read-only credential or scope is available. If it is not available, define the smallest safe change needed to provide read-only access.

Existing store-scoped audit logs must not be treated as a substitute for platform-admin audit records. Existing store authorization must not be treated as platform-admin authorization.

## 12. Delivery roadmap

### Phase 1 — Authorization and administrative API foundation

Deliver:
- Platform-admin identity and controlled provisioning.
- Server-side authorization.
- Dedicated platform audit foundation.
- Overview aggregation contract.
- Safe user and store list/detail contracts.

Acceptance:
- Normal users receive an authorization failure for all protected Admin endpoints.
- A user cannot grant themselves Admin access by changing browser data or request payloads.
- Authorized admins can access only the intended administrative data.
- Administrative access and mutations are covered by tests.

### Phase 2 — Admin shell and overview dashboard

Deliver:
- Dedicated Admin application shell.
- Responsive navigation for the eight Admin sections.
- Overview cards and attention sections.
- Registration trend and plan distribution when supported by real backend data.
- Loading, empty, error, and unauthorized states.

Acceptance:
- Overview uses live server data.
- No production metric is hardcoded.
- Metric definitions are documented and consistent.
- Layout is usable on desktop and mobile.
- Unauthorized users cannot access protected data.

### Phase 3 — Users and Stores

Deliver:
- User directory, search, filters, and pagination.
- Read-only user detail.
- Store directory, search, filters, and pagination.
- Read-only store detail.

Acceptance:
- Search, filters, and pagination are server-backed.
- Data exposure follows least privilege.
- Account and store states are not inferred from missing data.
- No account/store mutation or impersonation action is available.

### Phase 4 — Subscription visibility

Deliver:
- Free, trial, active premium, and expired subscription visibility.
- Plan-change request listing and details.
- Clear distinction between request, entitlement, and verified payment states.

Acceptance:
- Pending plan-change requests are not represented as paid activations.
- Active premium counts exclude expired entitlements.
- Missing billing information is not fabricated.
- No manual premium activation or extension is available.

### Phase 5 — Feedback and Audit Logs

Deliver:
- Feedback inbox and detail.
- Separate support workflow state.
- Audited support-status updates.
- Read-only platform-admin audit log.

Acceptance:
- Delivery status remains independent from support status.
- Only authorized admins can review feedback.
- Every support-status mutation is traceable.
- Audit records do not expose secrets.

### Phase 6 — APIMON System Health integration

Deliver:
- Verified APIMON API contract and read-only access credential/scope.
- Server-to-server APIMON integration in the RetailOS Admin backend.
- Dashboard health summary.
- System Health page with status, last check, last successful check, response time, availability history, and incidents where APIMON provides them.
- Unknown, stale-data, and monitoring-unavailable states.

Acceptance:
- APIMON continues scheduled checks when the Admin browser is closed and when RetailOS Server is unavailable.
- The Admin browser never receives the APIMON API credential.
- Admin only retrieves monitoring information; it does not run or duplicate scheduled checks.
- APIMON API failure is not displayed as proof that RetailOS Server is down.
- Status and uptime are derived only from actual APIMON results and retained history.
- APIMON being unavailable does not break other Admin sections.

### Phase 7 — Basic Admin Settings and release hardening

Deliver:
- Administrator profile and approved security/session settings.
- Security audit coverage for supported changes.
- Final responsive, accessibility, and error-state review.
- Documentation of configuration and operational limitations.

Acceptance:
- Settings expose only approved administrator-level controls.
- Sensitive changes are authorized server-side.
- Relevant security changes are audited.
- Tests, lint checks, type checks, and production build checks pass.

## 13. Definition of done

The Admin MVP is ready for production consideration when:

- Platform-admin authorization is enforced by RetailOS Server for every administrative endpoint.
- Ordinary users are denied access even when they manually navigate to Admin routes or call endpoints directly.
- Initial Admin provisioning is controlled and documented.
- Dashboard metrics come from verified backend contracts and have documented definitions.
- User and store search, filters, and pagination behave correctly.
- Subscription states distinguish free, trial, active premium, expired, pending request, and verified payment where applicable.
- No production screen relies on fabricated metrics or records.
- Feedback delivery state and support workflow state remain distinct.
- Administrative support-status mutations are validated, authorized, and audited.
- Platform-admin audit records are protected and do not expose secrets.
- APIMON integration is server-to-server and read-only.
- The APIMON credential is never exposed to the browser or logs.
- Monitoring failures and target-service failures are distinguishable.
- The UI represents unavailable or stale APIMON data as Unknown or Monitoring unavailable rather than inventing a backend outage.
- Basic administrator settings expose only approved controls.
- Loading, empty, error, stale-data, and unauthorized states are implemented.
- Sensitive information is excluded from API responses, logs, and the UI.
- Desktop and mobile usability and basic accessibility have been checked.
- Relevant tests, lint checks, type checks, and production build checks pass.
- Documentation reflects the delivered behavior and known limitations.

## 14. Success measures

The initial release should be evaluated against these outcomes:

- An authorized operator can understand the platform's user, store, and plan distribution from the dashboard.
- An operator can find a user or store using supported search fields.
- An operator can identify active premium users without counting expired subscriptions.
- An operator can identify pending plan-change requests without confusing them with paid subscriptions.
- An operator can review feedback and track whether Trexave has addressed it.
- Platform-admin actions can be traced to an administrator and timestamp.
- Ordinary users cannot access platform administration data.
- Operators can use the core workflows on desktop and mobile.
- Operators can see whether the RetailOS backend is responding based on APIMON's actual monitoring records.
- APIMON monitoring continues independently of the Admin browser and RetailOS availability.

Baseline values and numeric service targets should be established after the first production deployment; this PRD does not invent current platform counts or performance baselines.

## 15. Open decisions

The following decisions must be resolved before the related implementation begins:

1. Which named Trexave personnel should receive the initial platform-admin role?
2. What controlled provisioning mechanism will create the first administrator?
3. Will the first release support one platform-admin level only, or are additional internal support roles required?
4. What exact account and store fields are necessary for support, and which should be excluded?
5. What retention policy applies to feedback submissions and platform-admin audit records?
6. What support-status transitions and ownership rules are required for feedback?
7. What pagination limits and default sort orders should apply to administrative lists?
8. What exact definitions should determine active stores and last activity?
9. What reporting periods should be available for registration trends and dashboard comparisons?
10. Which payment provider and verified payment lifecycle will be used before paid-plan activation or revenue reporting is introduced?
11. Which APIMON API endpoints and response fields expose monitor status, check history, and incidents?
12. Can APIMON issue a dedicated read-only API credential or scope for RetailOS Admin?
13. What APIMON data freshness threshold should cause the Admin UI to display a stale or unknown state?
14. What cache duration and request timeout should the Admin backend use when retrieving APIMON data?
15. What administrator session-management capabilities are supported by the existing authentication system?

Do not make irreversible product or security decisions by guessing. Record approved decisions and update this document when scope changes.
