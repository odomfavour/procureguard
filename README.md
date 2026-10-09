# ProcureGuard

Procurement UI migrated from the user-supplied **procureguard-updated.zip** into the official Next.js 16 / React 19 / MSFLib shell. The navy landing page and buyer/vendor portal designs are preserved.

## Run

Use Node 20.9 or newer (verified with Node 22).

```sh
pnpm install
pnpm dev
```

Open `/`. At `/login`, choose **Buyer demo** or **Vendor demo**. Demo state persists in browser storage. Demo authentication, file metadata, assessments and escrow are explicitly simulated; no money moves.

For real MSFLib modules, configure a compatible API in `.env.local`, select **Live MSFLib account**, and open `/workspace`. The frontend does not include a backend. Existing localhost `/api` configuration must be replaced with a working service before live features can succeed.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

See [Demo guide](docs/DEMO_GUIDE.md), [Implementation status](docs/IMPLEMENTATION_STATUS.md), and [MSFLib usage audit and showcase](docs/MSFLIB_USAGE_AUDIT.md). Backend functionality and browser visual/interaction checks remain distinct from compilation and domain tests.
