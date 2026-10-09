# Demo guide

Use Node 20.9+ (Node 22 was used for verification), then `pnpm dev`.

1. Open `/` to see the landing page migrated from **procureguard-updated.zip**.
2. Open `/login`; keep **Demo account** selected. Choose **Buyer demo** (`buyer@demo.com`).
3. Open **Create tender**. Complete details, add deliverables, drag to reorder, add requirements and select documents. Review and publish with a future deadline.
4. Sign out, then choose **Vendor demo** (`vendor@demo.com`). Browse tenders, open the new tender and apply. Use vault filenames or enter fictional filenames for required documents; answer all requirements.
5. Open **My applications** to see the MSFLib table. In **Document vault**, expand the MSFLib tree; save and remove document metadata.
6. Sign out and return as buyer. Open the tender, view the application and trigger assessment. Read the MSFLib Markdown report, ask the demo assistant a question and resize the review panes. This does not run real AI or read files.
7. Compare vendors in the MSFLib table and select one. Confirm the award.
8. Buyer: open **Orders & escrow**, choose **Manage order** in the order table, then simulate funding. Vendor: open **Orders & payouts**, choose **Manage order**, enter carrier/tracking and mark shipped. Buyer: confirm receipt, then simulate provider payout confirmation.
9. Review notifications in both accounts; mark read or delete. No real money moves.
10. To test onboarding, register a new **Demo account**, choose buyer/vendor and complete the steps. New accounts see their own buyer tenders or vendor applications.

## Live MSFLib demonstration

Configure `API_URL`, the token key and workspace strategy in `.env.local`. Choose **Live MSFLib account** at login/register. `/workspace` exposes organization selection/creation, profile creation/editing/avatar/account lookup, real document upload/retrieval/download/ingestion, AI evaluation/chat/streaming and notification management. `/account` provides recovery/reset and optionally OTP (`NEXT_PUBLIC_ENABLE_OTP=true` only if supported).

Live integrations need an actual compatible API. Existing `.env.local` points to `/api`, but this shell supplies no backend there. Configure a working API before claiming live functionality. Do not use real credentials in demo registration.

## Checks

`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
