# Vendor wallet and withdrawals

## Purpose and approved scope

Vendors need to see money available for withdrawal after escrow release, submit a bank withdrawal request, and follow withdrawal status. The user approved a vendor wallet page with balance, a withdrawal form, a confirmation dialog, and history, and explicitly requires reusable msflib components.

## Integration and UI

Add `/vendor/wallet` and a `Wallet & withdrawals` link in the existing vendor Portal navigation. Keep the existing order shipment and receipt flow. Use the repository's client-only `FormBuilder` adapter backed by `@msflib/react-components/formbuilder`, its shared field definitions, and `DataTable` backed by msflib `TableWidget`. Reuse Portal, Panel, Heading, Loading, PageState, toast handling, and the existing MUI confirmation dialog pattern. No new component framework or dependency is needed.

The page shows the backend's available balance, a `Withdraw funds` form, and a withdrawal history table. Held escrow is not shown as available money. Bank details and amount are reviewed before the vendor confirms submission. A successful POST means a withdrawal request was submitted; it must not be described as a completed bank payout.

## API boundary

Add wallet types in `types/api/wallet.ts` and an adapter in `lib/api/wallet.ts`. Use `configuredApiClient({ isWorkspaceScoped: false })` so authentication follows the existing integrations. Relative paths are `/wallet` and `/wallet/withdrawals`; the application's configured base URL supplies `/api/v1`.

The public OpenAPI schema was inspected on 14 October 2026. Both GET endpoints and the POST success response have unspecified response schemas. Real response samples are needed to finalise balance and history field mappings. Do not guess currency units, multiply/divide balances, fabricate missing amounts as zero, or infer available funds from order totals. If a response cannot be mapped, show an explicit unavailable/error state with retry. Disable withdrawal submission until a valid available balance is known. Complete integration verification using authenticated GET responses when supplied; never submit a real withdrawal for testing.

POST `/wallet/withdrawals` sends exactly `amount`, `bank_name`, `account_name`, and `account_number`. The documented validation requires a positive amount, bank name of 2–120 characters, account name of 2–200 characters, and account number of 10–20 characters. Preserve account number as a string, including leading zeros. Trim bank/account names and account number; reject empty values and malformed amounts. Compare requested amount with the known available balance. Backend validation remains authoritative for balance changes and payment eligibility.

## State and errors

Only authenticated vendors fetch or submit wallet data. Queries include the current account ID to isolate cached data. Demo accounts get a sign-in message and do not make wallet requests or simulate withdrawals. Balance and history load independently with explicit loading, empty, and retry states.

Lock submission while a request is in flight. Do not automatically retry a withdrawal POST. Preserve entered details on failure and show the API error. On success, close the dialog, clear the form, and invalidate wallet balance and withdrawal history. Order actions that may advance release also invalidate the wallet queries so future visits do not use stale balances. An uncertain network result asks the vendor to refresh history before resubmission; the frontend cannot guarantee idempotency without server support.

## Verification

Add focused regression tests for response mapping once examples establish the contract, exact endpoint paths and request fields, validation boundaries, leading-zero account numbers, unavailable balances, and refusal of over-balance requests. Verify confirmation and duplicate submission protection using the existing test tooling where practical. Run the test suite, TypeScript checks, and relevant lint checks; report unrelated failures separately. Manually verify responsive layout and vendor navigation if browser tooling is available.

## Pending input and review

Need example authenticated JSON from GET `/api/v1/wallet` and GET `/api/v1/wallet/withdrawals`, with sensitive information removed. Available balance field semantics, currency units, history envelope, and withdrawal statuses remain unverified until those responses are available. Written design review is required before preparing the implementation plan.
