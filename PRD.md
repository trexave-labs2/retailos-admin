# TX RetailOS Admin — Product Requirements Document

**Product:** TX RetailOS Admin  
**Organization:** Trexave Technologies  
**Product area:** Internal platform administration  
**Document status:** Proposed product requirements  
**Release target:** Initial administrative release (scope defined below)

---

## 1. Product overview

TX RetailOS Admin is an internal platform-administration console for authorized Trexave personnel who operate and support TX RetailOS.

It is a separate product surface from the RetailOS shop-owner application. The shop-owner application supports day-to-day retail operations such as sales, products, inventory, customers, debts, alerts, audit history, settings, and plan information. The admin console provides platform-level oversight rather than duplicating those shop workflows.

The initial console should help authorized operators understand the state of the platform, find accounts and stores, inspect subscription requests, review customer feedback, and trace administrative actions.

## 2. Problem statement

RetailOS already stores information that is useful for platform support and operations, including user and store records, subscription-change requests, feedback submissions, and store-scoped audit records.

However, the current system does not provide a dedicated platform-admin experience or a verified platform-admin authorization model. Existing store authorization is not equivalent to platform-wide administrative permission. Feedback can be submitted and its email-delivery outcome tracked, but there is no administrative feedback-management workflow. Existing audit access is store-scoped rather than a platform-admin audit facility.

Trexave therefore needs a secure administrative surface and the server capabilities required to support it.

## 3. Product goals

1. Give authorized Trexave operators a reliable high-level view of RetailOS.
2. Make account and store lookup possible without exposing unnecessary shop data.
3. Make subscription and plan-change request status visible without implying that a request is a payment.
4. Provide a usable feedback review workflow that distinguishes message delivery from support resolution.
5. Make platform-admin actions traceable through a dedicated audit record.
6. Establish a secure foundation for later operational capabilities.

## 4. Non-goals

The initial release is not intended to:

- Replace or duplicate the shop-owner RetailOS Client.
- Provide public customer registration or self-service admin-role assignment.
- Process payments or verify bank transfers.
- Manually activate paid plans without verified payment evidence and an approved billing workflow.
- Delete or suspend accounts or stores.
- Impersonate shop owners or sign in as another user.
- Provide unrestricted access to shop-level customer records, debts, or detailed financial transactions.
- Become a complete infrastructure monitoring or incident-management platform.
- Expose secrets, raw server exceptions, credentials, or environment configuration.

These capabilities require separate product, security, and operational decisions before they can be considered.

## 5. Users and access

### 5.1 Platform administrator

An authorized Trexave operator responsible for platform oversight and support.

Expected initial capabilities:
- View platform overview metrics.
- Search and inspect account/store summaries.
- Inspect subscription and plan-change requests.
- Review submitted feedback and update its support workflow state.
- Read platform-admin audit records.

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

The current RetailOS Server does not yet implement the platform-admin role or dedicated platform-admin authorization. These are prerequisites, not existing capabilities.

## 6. Information architecture

The proposed primary navigation is:

1. **Overview**
2. **Accounts & Stores**
3. **Subscriptions**
4. **Feedback Inbox**
5. **Admin Audit Log**
6. **System Health** — later phase

The admin console should have its own layout and navigation. It may reuse sound design conventions from the RetailOS Client, but should not copy the shop-owner dashboard's information architecture.

## 7. Functional requirements

### 7.1 Overview

**Purpose:** Answer what is happening across RetailOS and what needs attention.

Proposed summary metrics:
- Registered accounts.
- Registered stores.
- Pending plan-change requests.
- Feedback submissions requiring review.

Proposed supporting content:
- Recent account registrations.
- Recent plan-change requests.
- Recent feedback requiring attention.

Requirements:
- Metrics must be calculated and returned by the server.
- The interface must not use hardcoded or fabricated production counts.
- Counts must have clearly defined meanings and must not conflate pending requests with paid subscriptions.
- The overview must not expose individual shop sales or customer financial records by default.
- Each summary should link to the relevant filtered section where practical.

**Note:** These metrics and supporting queries are proposed. They are not confirmed existing administrative API responses.

### 7.2 Accounts & Stores

**Purpose:** Allow authorized operators to locate and inspect platform accounts and their associated stores.

Account/store list fields proposed:
- Account ID.
- Owner name.
- Email address.
- Store name.
- Current plan.
- Subscription status.
- Registration date.

Search should support:
- Email.
- Owner name.
- Store name.
- Account or store identifier.

Account detail should provide, where the server has reliable data:
- Account and associated store information.
- Current plan and subscription status.
- Trial status and expiry information.
- Usage information.
- Product and customer counts.
- Monthly sales count.
- Relevant administrative activity history.

Requirements:
- List results must support server-side pagination.
- Search and filters must be applied by the server for platform-wide data.
- Only fields needed for platform support should be returned.
- The initial release is read-only.
- Do not expose full customer lists, debt details, receipts, or transaction-level financial data in the initial account detail view.
- Missing or unavailable data must be represented honestly rather than inferred.

**Out of scope:** account deletion, store deletion, account suspension, store suspension, and impersonation.

### 7.3 Subscriptions

**Purpose:** Give platform operators visibility into store plans, trials, and requested plan changes.

Proposed list/detail information:
- Store and account reference.
- Current plan.
- Subscription status.
- Trial status and relevant dates.
- Requested target plan.
- Billing interval.
- Saved price snapshot, where available.
- Request status and timestamps.

Requirements:
- Pending plan-change requests must be clearly labelled as requests.
- A request must not be displayed as proof of payment.
- A pending request must not be displayed as an active paid subscription.
- The initial release is read-only.
- The interface must reflect the server's authoritative plan and subscription state.
- Where billing data is not available, the interface must say so rather than manufacture a payment state.

**Current limitation:** The existing backend supports plan catalogue and subscription-related operations, including plan-change requests, but paid billing is not configured. A payment-provider integration and verified payment workflow are future work.

**Out of scope:** manual paid activation, payment capture, refunds, invoice management, and payment reconciliation.

### 7.4 Feedback Inbox

**Purpose:** Let authorized operators review feedback already submitted through RetailOS.

List information:
- Submission identifier.
- Category.
- Submission date.
- Contact name, if supplied.
- Contact email, if supplied.
- Message preview.
- Email-delivery status.
- Support workflow status.

Detail view:
- Full submitted message.
- Submission metadata.
- Contact details where supplied.
- Delivery status and relevant delivery timestamp.
- Support workflow status.

Filters:
- Category.
- Date range.
- Email-delivery status.
- Support workflow status.

Support workflow:
- New.
- In Progress.
- Resolved.

Requirements:
- Email-delivery status and support workflow status must be separate fields with separate meanings.
- Existing delivery states such as pending, sent, and failed must not be overwritten to represent support resolution.
- The server must validate allowed support-status transitions or allowed values.
- Every administrative status change must be recorded in the platform-admin audit trail.
- Feedback content must be displayed safely as untrusted user-submitted text.
- Contact information must only be shown to authorized operators who need it for support.

**Current limitation:** The backend stores feedback submissions and email-delivery state, but does not yet provide platform-admin listing or support workflow management. A separate support-status field and migration are required.

### 7.5 Admin Audit Log

**Purpose:** Provide a trustworthy record of platform-level administrative activity.

Proposed record information:
- Administrator identity.
- Action performed.
- Affected account or store, where applicable.
- Timestamp.
- Outcome.
- Reason or safe contextual metadata, where appropriate.

Requirements:
- The platform-admin audit log must be separate from existing store-scoped audit logs.
- The interface must be read-only.
- Records must be append-only from the application's perspective.
- Administrative mutations must write their audit record as part of the same successful operation where practical.
- Sensitive values must be excluded, including passwords, password hashes, session data, tokens, secrets, credentials, and payment credentials.
- Access to audit records must itself be restricted to authorized platform administrators.

### 7.6 System Health — later phase

**Purpose:** Provide a safe, high-level view of application readiness and selected operational dependencies.

Potential information:
- Application readiness.
- Database connectivity status.
- Feedback-delivery configuration or service status.
- Safe operational error summaries.

Requirements:
- The server must expose a dedicated, restricted health/diagnostics contract.
- Do not expose environment variables, secrets, database connection strings, credentials, raw exception traces, or internal infrastructure details.
- The current public health endpoint only provides a basic application readiness response and is not sufficient for this feature.
- This section is not required for the initial release.

## 8. Proposed administrative API contracts

The following are proposed API contracts for coordination between the admin client and RetailOS Server. They are not claims that the routes currently exist.

| Proposed endpoint | Purpose |
| --- | --- |
| `GET /admin/overview` | Aggregated platform metrics and attention counts. |
| `GET /admin/accounts` | Search, filter, and paginate account/store summaries. |
| `GET /admin/accounts/{id}` | Retrieve a safe account and associated store detail view. |
| `GET /admin/subscription-requests` | List plan-change requests across platform scope. |
| `GET /admin/feedback` | List and filter feedback submissions. |
| `PATCH /admin/feedback/{id}` | Update the separate support workflow status. |
| `GET /admin/audit` | Retrieve platform-admin audit records. |
| `GET /admin/health` | Retrieve restricted operational diagnostics; later phase. |

All administrative routes must:
- Require a valid authenticated session.
- Require explicit platform-admin authorization.
- Validate query parameters, identifiers, and mutation payloads.
- Use consistent API response conventions.
- Apply pagination and sensible result limits to list endpoints.
- Avoid returning unnecessary personal or sensitive data.
- Be covered by positive and negative authorization tests.

The admin client must not ship functional screens against assumed endpoints. Backend contracts must be implemented and verified first.

## 9. UX and accessibility requirements

- Responsive layout for desktop, tablet, and mobile.
- Dedicated platform-admin navigation and page structure.
- Clear page titles, status labels, and action hierarchy.
- Consistent loading, empty, error, and unauthorized states.
- Search and filters should preserve understandable state.
- Lists should remain usable at narrow widths.
- Keyboard navigation and visible focus indicators.
- Accessible labels and controls.
- Readable color contrast and status indicators that do not rely on color alone.
- Confirmation for any future sensitive or destructive action.
- No fabricated charts, counts, activity, or records in production.

## 10. Non-functional requirements

### Security and privacy
- Server-side authorization on every admin API request.
- Least-privilege data exposure.
- Secure session handling consistent with the existing RetailOS authentication model.
- No client-side privilege escalation.
- Safe handling and rendering of user-submitted feedback.
- Append-only administrative audit history.
- No secrets or sensitive credentials in logs or UI responses.

### Reliability
- Clear handling of network failures and server errors.
- No false success states when an administrative request fails.
- Metrics and statuses must come from authoritative server responses.
- Pagination and filtering must behave consistently.

### Maintainability
- Keep API access centralized using the project's established integration pattern.
- Avoid duplicating business rules in the frontend.
- Document API dependencies and configuration.
- Keep platform administration concerns separate from shop-owner workflows.

## 11. Dependencies and required backend work

The initial product depends on changes in RetailOS Server:

1. Introduce an explicit server-managed platform-admin identity/role.
2. Implement server-side platform-admin authorization.
3. Establish a controlled initial-admin provisioning process.
4. Add a dedicated platform-admin audit record model or equivalent isolated audit mechanism.
5. Add platform overview aggregation.
6. Add safe account/store search and detail queries.
7. Add platform-wide subscription-request listing.
8. Add feedback listing and detail access for administrators.
9. Add a separate feedback support workflow status and database migration.
10. Add audited feedback status updates.
11. Add administrative audit listing.

System-health diagnostics are a later dependency.

Existing store-scoped audit logs must not be treated as a substitute for platform-admin audit records. Existing store authorization must not be treated as platform-admin authorization.

## 12. Delivery roadmap

### Phase 1 — Authorization and administrative API foundation

Deliver:
- Platform-admin identity and controlled provisioning.
- Server-side authorization.
- Dedicated platform audit foundation.
- Overview aggregation contract.
- Safe account/store list contract.

Acceptance:
- Normal users receive an authorization failure for all protected admin endpoints.
- A user cannot grant themselves admin access by changing browser data or request payloads.
- Authorized admins can access only the intended administrative data.
- Administrative access and mutations are covered by tests.

### Phase 2 — Admin shell and overview

Deliver:
- Dedicated admin application shell.
- Responsive navigation.
- Overview cards and attention sections.
- Loading, empty, error, and unauthorized states.

Acceptance:
- Overview uses live server data.
- No production metric is hardcoded.
- Layout is usable on desktop and mobile.
- Unauthorized users cannot access protected data.

### Phase 3 — Accounts and subscriptions

Deliver:
- Account/store search and pagination.
- Read-only account detail.
- Subscription and plan-change request listing.
- Trial and usage visibility where supported.

Acceptance:
- Search and pagination are server-backed.
- Data exposure follows least privilege.
- Pending plan-change requests are not represented as paid activations.
- Missing backend information is not fabricated.

### Phase 4 — Feedback and platform audit

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

### Phase 5 — System health and separately approved operations

Deliver:
- Restricted operational diagnostics.
- Evaluate future account controls, internal support roles, and billing workflows through separate product/security decisions.

Acceptance:
- Diagnostics expose only safe operational information.
- Any new privileged operation has explicit authorization, audit coverage, tests, and a recovery procedure.
- No deferred feature is silently added to the initial release.

## 13. Definition of done

The initial release is ready for production consideration when:

- Platform-admin authorization is enforced by RetailOS Server for every administrative endpoint.
- Ordinary users are denied access even when they manually navigate to admin routes or call endpoints directly.
- Initial admin provisioning is controlled and documented.
- Overview, account/store, subscription, feedback, and audit data come from verified backend contracts.
- No production screen relies on fabricated metrics or records.
- Search, filters, and pagination behave correctly where required.
- Loading, empty, error, and unauthorized states are implemented.
- Administrative mutations are validated, authorized, and audited.
- Feedback delivery state and support workflow state remain distinct.
- Pending subscription requests are never presented as payment confirmation.
- Sensitive information is excluded from API responses, logs, and the UI.
- Desktop and mobile usability and basic accessibility have been checked.
- Relevant tests, lint checks, type checks, and production build checks pass.
- Documentation reflects the delivered behavior and known limitations.

## 14. Success measures

The initial release should be evaluated against these outcomes:

- An authorized operator can find an account or store using the supported search fields.
- An operator can identify pending plan-change requests without confusing them with paid subscriptions.
- An operator can review feedback and track whether Trexave has addressed it.
- Platform-admin actions can be traced to an administrator and timestamp.
- Ordinary users cannot access platform administration data.
- Operators can use the core workflows on desktop and mobile.

Baseline values and numeric service targets should be established after the first production deployment; this PRD does not invent current platform counts or performance baselines.

## 15. Open decisions

The following decisions must be resolved before the related implementation begins:

1. Which named Trexave personnel should receive the initial platform-admin role?
2. What controlled provisioning mechanism will create the first administrator?
3. Will the first release support one platform-admin level only, or are additional internal support roles required?
4. What exact account/store fields are necessary for support, and which should be excluded?
5. What retention policy applies to feedback submissions and platform-admin audit records?
6. What support-status transitions and ownership rules are required for feedback?
7. What pagination limits and default sort orders should apply to administrative lists?
8. Which operational signals are safe and useful for the later System Health phase?
9. Which payment provider and verified payment lifecycle will be used before paid-plan activation is automated?

Do not make irreversible product or security decisions by guessing. Record approved decisions and update this document when scope changes.
