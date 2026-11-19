# TX RetailOS Admin

Independent platform administration console for TX RetailOS. This application has its own frontend, routes, design system, authentication entry point, and responsive layout. It does not import or depend on the RetailOS Client.

## Stack

- React 18 + TypeScript
- Vite
- React Router
- Lucide icons
- Plain CSS design system (no Client UI dependency)

## Local development

1. Install Node.js 20 or newer.
2. Install dependencies with `npm install`.
3. Create `.env.local` with the API origin:

   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```

4. Start the app with `npm run dev`.

The browser must be able to reach the RetailOS Server. The API must allow the Admin origin in `CORS_ORIGINS` and issue the separate secure `retailos_admin_session` cookie. Use `credentials: include`; do not put API secrets or administrator credentials in frontend environment variables.

## Build

- `npm run build`
- `npm run preview`

## Backend contract

The frontend uses the existing RetailOS Server platform-admin API and its dedicated platform-admin authentication flow. Admin credentials and the `retailos_admin_session` HttpOnly cookie are independent of the Client password and session cookie:

- `POST /admin/auth/login`, `GET /admin/auth/me`, `POST /admin/auth/logout`, `POST /admin/auth/change-password`
- `GET /admin/profile`, `PATCH /admin/profile`, `POST /admin/sessions/revoke-all`
- `GET /admin/overview`
- `GET /admin/users`, `GET /admin/users/{id}`
- `GET /admin/stores`, `GET /admin/stores/{id}`
- `GET /admin/subscriptions`, `GET /admin/subscription-requests`
- `GET /admin/feedback`, `GET /admin/feedback/{id}`, `PATCH /admin/feedback/{id}/status`
- `GET /admin/audit-logs`
- `GET /admin/administrators`, `PUT /admin/users/{id}/admin-role` (super-admin only)
- `GET /admin/monitoring/summary`, `GET /admin/monitors`, `GET /admin/incidents`

Admin signs in through `/admin/auth/login` and receives an independent HttpOnly `retailos_admin_session` cookie. The Admin password is stored separately from the Client password, including when both accounts use the same email. Change the Admin password from Settings to separate credentials for accounts that were promoted from an existing retail user.

All administrative authorization is enforced by the server. Frontend guards are only a navigation convenience. Pending subscription requests are never represented as paid activations. Feedback delivery state remains separate from support workflow state.

## Monitoring boundary

The Monitoring and Incidents screens are read-only. The existing backend also exposes monitor-management endpoints, but this console intentionally does not expose configuration or manual-check controls in this first interface. Recurring checks require a separately deployed scheduler; the Flask request process does not run a recurring scheduler.

## Production deployment

Set `VITE_API_BASE_URL` to the RetailOS Server origin at build time. Add the deployed Admin origin to the backend's comma-separated `CORS_ORIGINS` setting. Keep `PLATFORM_ADMIN_EMAIL` and `PLATFORM_ADMIN_PASSWORD` only in backend hosting secrets and run the documented bootstrap release command after migrations. Never place these values in the Admin frontend.
