# Presentation and verification guide

The current sign-in flow uses live accounts. Demo account selection is disabled. `/demo` redirects to `/dashboard`, and `/workspace` redirects to a role dashboard after authentication; neither provides a standalone integration showcase.

## Preparation

1. Use Node 20.9+ (Node 22 recommended), configure `.env.local` from `.env.example`, install dependencies and run `pnpm dev`.
2. Confirm your compatible backend is available at `API_URL`. The example URL is a configuration default, not a verified service guarantee.
3. Prepare separate buyer and vendor accounts with access to the same tender workflow. Use the payment provider's test environment for payment demonstrations and confirm that configuration with the backend operator before checkout.

## Current live journey

1. Open `/` and explain the buyer/vendor procurement workflow.
2. Register a buyer at `/register`, sign in at `/login` and complete buyer onboarding. Returning accounts are routed according to account/onboarding responses.
3. Create a tender at `/tenders/new`: add details, deliverables, requirements and required document labels, reorder deliverables and publish with a future deadline.
4. Sign out and register/sign in as a vendor. Complete business onboarding, including selected document/gallery uploads. These requests send actual file bytes.
5. Browse `/vendor/tenders`, open the tender and apply with item unit prices, delivery timeline, proposal, requirement responses and actual required files.
6. Review `/vendor/applications` and the submitted application's details.
7. Sign back in as the buyer. Open the tender's applicants, inspect the application and preview available document URLs. Trigger **Analyze applicant** and inspect the backend-returned report, findings, evidence and limitations. The frontend does not itself establish document authenticity or the backend's analysis method.
8. Accept an eligible application and inspect the returned checkout link. The UI supports HTTPS Paystack URLs. Continue only with the prepared payment test setup. If acceptance succeeds without a supported checkout URL, check backend/application status before retrying acceptance.
9. On `/payments/callback`, inspect backend verification status and payment details. A redirect alone does not establish successful payment; order shipment eligibility follows the backend's funding status.
10. Vendor: open `/vendor/orders`, select **Manage order**, enter a tracking reference and confirm shipment when eligible. Buyer: open `/orders` and confirm receipt after shipment. Confirm any escrow release/payout separately in the backend/provider; the UI does not prove settlement.
11. Review notifications and read/unread actions for both roles.

`/vendor/documents` is a retained local filename vault, not a live document upload/download module. The standalone profile, workspace, document ingestion and AI chat panels in `components/integration` are not routed in the current application.

## Verification record

Run `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build` with supported Node. Record browser results for both roles, mobile navigation, validation, missing records, failed requests and payment failure/pending states separately from compilation and mocked contract tests.

Source assessment on 12 October 2026: 36/36 tests passed on Node 22; TypeScript passed; lint reported two explicit-`any` errors. Build, browser and live backend/payment verification remain outstanding from that assessment.
