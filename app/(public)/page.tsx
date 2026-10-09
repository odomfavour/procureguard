import Link from 'next/link';
export default function Home() {
  return (
    <main className="min-h-screen bg-[#101e42] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <div className="text-2xl font-bold">◈ ProcureGuard</div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-white/30 px-4 py-2 text-sm"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#101e42]"
          >
            Get started
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-blue-300">
          Procurement intelligence · Secure fulfillment
        </p>
        <h1 className="max-w-4xl font-display text-5xl font-bold leading-tight sm:text-7xl">
          Procure with clarity. Deliver with confidence.
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100">
          Publish flexible tenders, receive supplier proposals, run
          buyer-controlled risk assessments, and track escrow-backed procurement
          from award to delivery.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-white px-6 py-3 font-semibold text-[#101e42]"
          >
            Create an account →
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-white/40 px-6 py-3"
          >
            Explore demo accounts
          </Link>
        </div>
        <div className="mt-24 grid gap-4 md:grid-cols-3">
          {[
            [
              '01',
              'Publish any tender',
              'Goods, services and works with custom requirements.',
            ],
            [
              '02',
              'Compare with confidence',
              'Buyer-triggered simulated risk and compliance checks.',
            ],
            [
              '03',
              'Secure the transaction',
              'Escrow funding, shipment tracking and buyer-confirmed payout.',
            ],
          ].map(([n, t, d]) => (
            <div
              key={n}
              className="rounded-xl border border-white/20 bg-white/5 p-7"
            >
              <div className="text-blue-300">{n}</div>
              <h2 className="mt-4 text-xl font-bold">{t}</h2>
              <p className="mt-2 text-blue-100">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
