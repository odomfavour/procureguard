# MSFLib usage audit

Reviewed against current routes/providers on 12 October 2026. Imports and executable adapters establish source integration, not successful backend operation or compatibility with all documented server contracts.

## Current routed integrations

| Package/export | Source | Current use / limit |
|---|---|---|
| `@msflib/core`: `configureApplication` | `lib/application.config.ts` | API URL, token key, auth endpoint mappings and optional workspace decorator |
| `@msflib/core`: `configuredApiClient` | `lib/api/{onboarding,tenders,applications,procurement-analysis,payments,orders,notifications}.ts` | Authenticated API and multipart requests for the main procurement journey; explicitly `isWorkspaceScoped: false` |
| `@msflib/core`: storage/config/workspace reset | `components/auth/session-expiry.tsx`, prototype portal | Session expiry cleanup and logout support |
| `@msflib/react-auth`: `AuthProvider`, `useAuth` | `app/Provider.tsx`, authentication and portal components | Root auth provider; live registration/login/session/logout and account assistance |
| `@msflib/react-components/formbuilder`: `FormBuilder` | `components/msflib/form-builder.tsx` and prototype form consumers | Auth, onboarding, tender and application forms; client-only adapter avoids SSR access to `window` |
| `@msflib/react-components/table`: `TableWidget` | `components/msflib/data-table.tsx` and prototype consumers | Tender/application listings, structured analysis details, order records and notifications |
| `@msflib/react-components/draggable`: `DraggableList` | `components/prototype/create-tender.tsx` | Reorder deliverables before tender submission |
| `@msflib/react-components/markdown`: `MarkdownMessage` | `components/prototype/analysis-report.tsx` | Render backend assessment strings; structured reports use tables and section controls |
| `@msflib/react-components/tree-view`: `TreeView` | `components/prototype/vault.tsx` | Local document filename metadata; no live upload/download through this vault |
| `@msflib/react-components/otp-input`: `OtpInput` | `components/auth/AuthScreen.tsx` | `/account` verification, only when OTP configuration and backend support it |
| `@msflib/react-components/skeleton`: `AppSkeleton` | `components/ui/shared.tsx` | Loading placeholders, including dynamic FormBuilder loading |

## Retained source, not a routed standalone feature

`components/integration/LivePortal.tsx` has no current route consumer. `/workspace` redirects to `/dashboard` or `/vendor/dashboard`, or to login without authentication. The root provider mounts `AuthProvider`; it does not mount workspace/profile/documents/AI/notification providers.

| Package/export | Retained source | Status |
|---|---|---|
| `@msflib/react-workspace`: `useWorkspace`, `workspaceHookDecorator` | `WorkspacePanel.tsx`, application config | Panel not routed; decorator remains configurable |
| `@msflib/react-shared`: `useActiveWorkspace` | `WorkspacePanel.tsx`, `LivePortal.tsx` | Retained standalone workspace state UI |
| `@msflib/core`: `setActiveWorkspace` | Workspace panel, LivePortal, logout/expiry | Selection UI not routed; cleanup remains in current flow |
| `@msflib/react-profile`: `useProfile` | `ProfilePanel.tsx` | Profile/avatar panel not routed |
| `@msflib/react-documents`: `useDocuments` | `DocumentsPanel.tsx`, `AiPanel.tsx` | Upload/retrieval/ingestion panel not routed; current procurement uploads instead use core multipart clients |
| `@msflib/react-ai`: `useLlm`, `useAgent`, `readAskStream` | `AiPanel.tsx` | Grounded questions/streaming panel not routed; current applicant assessment calls procurement backend endpoints |
| `@msflib/react-notification`: `useNotification` | `LivePortal.tsx` | Panel not routed; current notifications use core API adapters |
| ChatBox, MarkdownMessage, ResizablePane | `components/prototype/assessment.tsx`, `AiPanel.tsx` | Retained deterministic demo review / standalone AI panel; do not describe as the current live assessment journey |

## Verification boundaries

Main flows use MSFLib auth, core clients and reusable components rather than imports alone. This review does not confirm backend availability, multi-organization enforcement, document ingestion, model execution, payment settlement or browser usability.

Local demo branches persist fixtures in browser storage; filename metadata has no original file bytes, findings/chat are deterministic and escrow is simulated. The login mode selector is currently disabled, so the former buyer/vendor demo-button instructions do not apply. Legacy reference services use separate fixtures and intentionally blocked live fallback.

The README lists current modules directly. The presentation guide follows the routed buyer/vendor procurement journey; retained standalone panels require routing/provider work before they can be presented as available features.

## Vendor wallet addition — 14 October 2026

`components/prototype/vendor-wallet.tsx` uses the existing msflib FormBuilder adapter for the bank withdrawal form and DataTable/TableWidget for withdrawal history. `lib/api/wallet.ts` uses `configuredApiClient({ isWorkspaceScoped: false })` for all three wallet endpoints. Live response field mappings are provisional because the published schema does not define wallet or withdrawal responses; see implementation status.
