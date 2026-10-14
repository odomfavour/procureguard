# SDD ledger — plan: docs/superpowers/plans/2026-10-14-vendor-wallet.md
Ruling: Work in the existing dirty workspace without branch changes or commits — preserve the user's active IDE changes and avoid extra approval gates.
Ruling: Accept explicit available_balance plus currency fields as a provisional, strict contract; never infer available money from balance or escrow — live API examples remain necessary to confirm integration.
Task 1: complete — adapter tests pass; explicit provisional mapping disclosed.
Task 2: complete — route, msflib form/table, navigation and order invalidation implemented. Nine wallet tests pass. Network error regression exposed stale-handler retries; needsRefresh ref now prevents them until refresh.
Task 3: verifying — TypeScript and targeted lint pass; full suite has two pre-existing File-is-not-defined multipart failures under Node 18. Live browser and authenticated response mapping not verified.
Independent review: wallet_review found unsupported huge balances; added failing regression then monetary range guard. No other material findings.
Task 3: complete — 12 focused wallet/order tests pass, typecheck and targeted lint pass. Full suite 46/48 with the same unrelated application multipart and vendor onboarding multipart File runtime failures. Documentation updated. No real withdrawal or browser verification performed.
