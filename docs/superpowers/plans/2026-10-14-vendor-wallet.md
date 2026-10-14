# Vendor Wallet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow authenticated vendors to view available wallet funds, request withdrawals, and view withdrawal history.

**Architecture:** Add a vendor route using the existing Portal and msflib adapters. Put response parsing and withdrawal validation in a typed API module, with account-specific React Query state in the wallet component. Unrecognised response shapes fail explicitly until real response examples establish the contract.

**Tech Stack:** Next.js, TypeScript, msflib core/FormBuilder/TableWidget, TanStack Query, existing MUI dialogs, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-14-vendor-wallet-design.md`

## Global Constraints

- Use `configuredApiClient({ isWorkspaceScoped: false })`.
- Use the repository's client-only `FormBuilder` adapter and `DataTable` backed by msflib `TableWidget`.
- No new component framework or dependency is needed.
- Preserve account number as a string, including leading zeros.
- Do not automatically retry a withdrawal POST.
- Disable withdrawal submission until a valid available balance is known.
- Never submit a real withdrawal for testing.
- Preserve existing uncommitted user changes; stage or commit no unrelated files.

## Review Focus

- Missing, null, blank, nonfinite, or ambiguous balances must not become available zero balances.
- Account changes must not expose prior account bank details or withdrawal history.
- Leading-zero account numbers and decimal amounts must survive request construction.
- Repeated confirmation and uncertain network outcomes must not cause automatic duplicate POSTs.
- Successful POST followed by failed refresh must still be described as a submitted request.

### Task 1: Typed wallet API and validation

**Files:** Create `types/api/wallet.ts`, `lib/api/wallet.ts`, `tests/wallet.test.mjs`.

**Interfaces:** Export `WalletRecord` with `availableBalance: string` and `currency: string`; `WithdrawalRecord` with `id`, `amount`, `status`, `bankName`, `accountName`, `accountNumber`, and `createdAt` strings; `WithdrawalInput` with string `amount`, `bank_name`, `account_name`, `account_number`. Export `parseWallet(value: unknown): WalletRecord`, `parseWithdrawals(value: unknown): WithdrawalRecord[]`, `validateWithdrawal(input: WithdrawalInput, availableBalance: string): WithdrawalInput`, `getWallet(): Promise<WalletRecord>`, `listWithdrawals(): Promise<WithdrawalRecord[]>`, `createWithdrawal(input: WithdrawalInput): Promise<unknown>`.

- [ ] Write Node tests using the existing transpile/VM adapter pattern. Assert exact GET `/wallet`, GET `/wallet/withdrawals`, POST `/wallet/withdrawals` paths, unscoped client configuration, and exact request keys. Assert account number `0123456789` remains unchanged.
- [ ] Test positive decimal amounts and boundary lengths: bank name 2–120, account name 2–200, account number 10–20. Reject zero, negative, blank, nonfinite, exponent or malformed amounts, over-balance amounts, and missing balance. Compare decimal currency amounts without floating-point rounding errors.
- [ ] Test parsers rejecting unspecified schemas, string placeholder responses, ambiguous `balance` fields, blank/null balances, malformed history rows, and missing status/amount. Accept an empty withdrawal array. Add positive response fixtures only after authenticated response examples confirm field names and currency units; until then do not implement guessed mappings as verified facts.
- [ ] Run `node --test tests/wallet.test.mjs`; confirm tests fail for absent implementation.
- [ ] Implement the types, validation and adapters. GET wrappers parse `unknown`; POST validates input fields and returns unknown success data without requiring a response shape. Missing verified response mappings produce a descriptive load error instead of invented money. Do not log account details or tokens.
- [ ] Run `node --test tests/wallet.test.mjs`; confirm all tests pass. Document unresolved live response mappings in the status documentation.

### Task 2: Vendor wallet page and navigation

**Files:** Create `components/prototype/vendor-wallet.tsx`, `app/(public)/vendor/wallet/page.tsx`; modify `components/prototype/portal.tsx`, `components/prototype/live-orders.tsx`; create `tests/vendor-wallet.test.mjs` using available component test tooling or executable component VM stubs.

**Consumes:** Task 1 exports. Existing FormBuilder, field/submit definitions, DataTable, Portal, PageState, Loading, toast provider, useAuth, useQuery/useQueryClient.

**Produces:** `VendorWallet()` route component and `Wallet & withdrawals` vendor navigation link.

- [ ] Write regression checks that unauthenticated/demo accounts make no wallet calls, account changes reset the form/dialog, invalid or unavailable balances prevent confirmation, and two rapid confirm clicks invoke only one POST. Assert cancel performs no POST and POST failure preserves form values.
- [ ] Test success followed by refresh failure: the submitted message remains accurate and no second POST is sent. Test history empty/error states independently from balance errors. Use mocked API boundaries, not source-string matching, for these behaviors.
- [ ] Run `node --test tests/vendor-wallet.test.mjs`; confirm failure for missing behavior.
- [ ] Build `VendorWallet` with account-keyed inner state. Enable wallet queries only for authenticated vendors. Show a demo sign-in state. Render available balance only when verified by the parser and format using the returned currency; never default unknown funds to zero.
- [ ] Render the four withdrawal fields and submit control through msflib FormBuilder. Validate before opening the MUI review dialog, show amount and destination for review, and protect confirmation with a synchronous ref lock and disabled controls. Disable editing while submitting. Preserve input on failure; for network uncertainty, ask the vendor to refresh withdrawal history before retrying.
- [ ] On success close/reset the form, announce `Withdrawal request submitted`, and refresh wallet/history queries without interpreting refresh failures as POST failure. Do not automatically retry. Render history using DataTable with amount, status, bank, masked account number, and date; show backend status rather than inferring completion.
- [ ] Add `/vendor/wallet` route and vendor navigation link. Invalidate `['procureguard', 'wallet']` after successful order shipment/receipt actions alongside existing invalidations.
- [ ] Run wallet component tests and TypeScript checks; correct integration issues.

### Task 3: Verification and integration status

**Files:** Modify `docs/IMPLEMENTATION_STATUS.md`, `docs/MSFLIB_USAGE_AUDIT.md` only where wallet integration requires it.

- [ ] Run `npm test`, `npm run typecheck`, and `npx eslint components/prototype/vendor-wallet.tsx lib/api/wallet.ts types/api/wallet.ts 'app/(public)/vendor/wallet/page.tsx'`. Report unrelated failures by test name; current full-suite failures involve missing runtime `File` in applications/onboarding multipart tests.
- [ ] Inspect the final diff to ensure bank details are not persisted or logged, unrelated user edits are retained, and reusable msflib adapters are used.
- [ ] If browser tooling is available, inspect desktop/mobile navigation, loading/error/empty states, and form confirmation using mocked responses. Do not perform a real withdrawal.
- [ ] Update documentation with verified behavior and explicit limitations: authenticated API samples remain required for live balance/history mapping if still unavailable. Report this limitation clearly; do not claim end-to-end payout verification.

## Execution recommendation

Native execution in the current session is recommended: the two implementation tasks share a small API boundary and existing UI adapters. Implementation awaits review of this written plan and selection of execution method under the writing-plans skill.
