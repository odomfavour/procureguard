# ProcureGuard

ProcureGuard is a Next.js / React procurement frontend for buyers and vendors. Buyers publish tenders, review proposals, request applicant assessments and start escrow checkout. Vendors submit proposals and documents, track applications and record shipments. The frontend uses MSFLib for authentication, API access and reusable UI components.

## Run locally

Use Node 20.9 or newer (Node 22 recommended) and pnpm. Private MSFLib packages require the `GITHUB_PACKAGES_TOKEN` referenced by `.npmrc` when installing dependencies.

```sh
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `/`. Register a buyer or vendor at `/register`, then sign in at `/login` and complete onboarding. The current login and registration screens use live MSFLib authentication; the demo account selector is disabled.

## Backend configuration

This repository contains the frontend, not the procurement backend. `.env.example` sets `API_URL` to `https://procure-api-mqlx.onrender.com/api/v1`; the root layout also uses this as its fallback. Set `API_URL` to your compatible backend and restart the development server after changing configuration. The configured URL is not evidence that the service is available or that an end-to-end workflow has been verified.

The supplied configuration uses `NEXT_PUBLIC_WORKSPACE_MODE=single`. Procurement adapters explicitly request unscoped MSFLib clients (`isWorkspaceScoped: false`); enabling the workspace decorator alone does not make those requests tenant-scoped. The backend must enforce account roles, record access, file permissions and payment state transitions.

Other settings in `.env.example` configure the access-token storage key, optional workspace strategy/default tenant, optional OTP and legacy reference mocks. `NEXT_PUBLIC_USE_MOCKS` controls legacy reference services; it does not enable demo login or disable the current live procurement adapters. Enable OTP only with a supporting auth backend.

## MSFLib modules used

| Module | Current use |
|---|---|
| `@msflib/core` | Application configuration, authenticated procurement API/ multipart clients, token storage and workspace reset |
| `@msflib/react-auth` | Root `AuthProvider`, registration, login, session, logout and account recovery/reset |
| `@msflib/react-components/formbuilder` | Authentication, onboarding, tender and proposal forms |
| `@msflib/react-components/table` | Tender, application, assessment, order and notification tables |
| `@msflib/react-components/draggable` | Reorder tender deliverables before publication |
| `@msflib/react-components/markdown` | Render string assessment reports; retained demo assessment UI |
| `@msflib/react-components/tree-view` | Local document metadata vault and retained document panels |
| `@msflib/react-components/otp-input`, `/skeleton` | Capability-gated account verification and loading placeholders |

Workspace, profile, documents, AI and notification hook integrations also remain in `components/integration`, but their standalone portal is not mounted by a current route. Retained demo assessment components use ChatBox and ResizablePane. See the [MSFLib usage audit](docs/MSFLIB_USAGE_AUDIT.md) for the distinction between accessible features and retained source.

## Routes and workflow

- `/login`, `/register`, `/account`: live authentication and account assistance.
- `/onboarding/buyer`, `/onboarding/vendor`: organization/business details; vendor onboarding submits actual selected file bytes.
- `/dashboard`, `/tenders`, `/tenders/new`, `/tenders/[tenderId]`: buyer overview, tender creation and applicant review.
- `/vendor/dashboard`, `/vendor/tenders`, `/vendor/tenders/[id]/apply`, `/vendor/applications`: vendor browsing, proposals, actual file attachments and application tracking.
- `/applications/[id]`: buyer application review, backend assessment and acceptance with supported Paystack checkout links.
- `/payments/callback`, `/payments/[id]`: backend payment verification and payment details.
- `/orders`, `/vendor/orders`: order records, vendor shipment and buyer receipt confirmation.
- `/notifications`, `/vendor/notifications`: backend notification management for authenticated accounts.
- `/vendor/documents`: retained local filename metadata vault, not a live upload/download service.
- `/workspace`: redirects authenticated users to their role dashboard, or unauthenticated users to login.
- `/demo`: redirects to `/dashboard`; it does not enable demo authentication.

Local demo branches remain in the source. Their filenames contain no original file bytes, assessments are deterministic and escrow is simulated. Live adapters instead depend on the configured backend; payment, escrow release and payout behavior cannot be established from frontend code alone.

## Validation

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Assessment on 12 October 2026: 36/36 Node tests passed on Node 22 and TypeScript passed. ESLint reported two `no-explicit-any` errors in `components/msflib/procurement-form-layout.tsx`. Production build, browser interactions and live backend/payment behavior were not verified in that assessment. Tests exercise local logic and mocked API contracts; they do not prove deployment or payment settlement.

See the [demo guide](docs/DEMO_GUIDE.md) for the current presentation journey and [implementation status](docs/IMPLEMENTATION_STATUS.md) for limitations.
