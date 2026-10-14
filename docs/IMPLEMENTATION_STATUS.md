# Implementation status

Reviewed against the source on 12 October 2026. “Implemented” means the frontend contains the behavior; it does not establish that a backend request succeeded.

## Current product

The Next.js / React application retains the navy landing page and buyer/vendor portals from the supplied design. Authentication uses the root MSFLib `AuthProvider`. Login and registration currently force live mode; the demo selector is commented out. Post-login routing reads account and onboarding data to choose onboarding or the role dashboard.

Live procurement adapters in `lib/api` use MSFLib's configured API and multipart clients for:

- Buyer/vendor onboarding, including vendor documents and gallery file bytes.
- Tender creation, role-specific listings, detail retrieval and pagination.
- Application submission with labelled file bytes, lists, details and applicant review.
- Backend applicant analysis, structured findings/evidence and document previews.
- Acceptance with a callback URL, supported HTTPS Paystack checkout links, backend payment verification and payment details.
- Order retrieval, vendor shipment and buyer receipt confirmation.
- Notification listing, detail retrieval and explicit read/unread updates.

The current procurement adapters use `isWorkspaceScoped: false`. Server-side authorization, persistence, assessment generation, storage, escrow accounting and payout behavior belong to the external backend and remain unverified here.

## Routes and retained integrations

`/workspace` redirects to the role dashboard; `/demo` redirects to `/dashboard`. Neither mounts `components/integration/LivePortal.tsx`. The standalone workspace/profile/documents/AI/notification panels remain in source, but the root provider currently mounts only MSFLib authentication, alongside React Query, theme and toast providers. Do not present the standalone panels as available live product features.

`/account` exposes account assistance, with OTP gated by `NEXT_PUBLIC_ENABLE_OTP`. `/vendor/documents` remains a local metadata vault. Actual file submission is implemented separately in live onboarding and tender applications.

LocalStorage demo branches and fixtures remain for reference; normal login no longer offers demo entry. Demo filenames contain no file bytes, analysis/chat is deterministic and escrow is simulated. Legacy investigation, risk and billing reference screens use separate fixture services. Their `apiFetch` fallback intentionally throws rather than accessing a live service. `NEXT_PUBLIC_USE_MOCKS` governs those legacy services, not current live login/procurement.

## Configuration and validation

`.env.example` and the root-layout fallback point to `https://procure-api-mqlx.onrender.com/api/v1`. Availability and compatibility of that service have not been established by this source review. Use a compatible API and single-workspace configuration for the documented workflow.

On 12 October 2026, 36/36 Node tests passed using Node 22 and TypeScript passed. ESLint found two explicit-`any` errors in `components/msflib/procurement-form-layout.tsx`. Tests cover demo behavior, request construction, response parsing, pagination, onboarding routing, payment URL filtering and token expiry. They use mocks/local logic rather than live services.

Production build, browser visual/interaction checks, accessibility and the complete backend/payment journey were not verified during this assessment. Existing UI text may still reference the former standalone workspace or simulation; that copy is not proof of feature availability.

## Vendor wallet — 14 October 2026

`/vendor/wallet` adds an authenticated vendor wallet, withdrawal confirmation form, and history. Uses msflib FormBuilder/TableWidget adapters and unscoped configured API clients for GET `/wallet`, GET `/wallet/withdrawals`, and POST `/wallet/withdrawals`. Requests preserve account numbers as strings, validate positive decimal amounts and available balance, and guard duplicate submissions. No real withdrawal has been submitted for testing.

Live response mapping remains unverified: the public OpenAPI document has no response schemas. The adapter provisionally accepts explicit `available_balance` and `currency` (directly or under `wallet`), and a withdrawal array (directly or under `withdrawals`) with `id`, `amount`, and `status`. Other shapes show a load error; total balance and held escrow are never substituted for available funds. Authenticated response examples are required to verify or adjust these mappings and currency units. Component tests use executable hook/API stubs; responsive browser rendering and real settlement have not been verified.
