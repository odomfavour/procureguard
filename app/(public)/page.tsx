import Link from 'next/link';
import { LandingHeader } from '@/components/ui/landing-header';
export default function Home() {
  return (
    <main className="min-h-screen bg-[#101e42] text-white">
      <LandingHeader />
      <section className="mx-auto w-full max-w-6xl px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:py-24">
        <p className="mb-4 max-w-lg text-xs font-semibold uppercase leading-6 tracking-widest text-blue-300 sm:mb-5 sm:text-sm">
          Procurement intelligence · Secure fulfillment
        </p>
        <h1 className="max-w-4xl text-balance font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Procure with clarity. Deliver with confidence.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100 sm:mt-7 sm:text-lg sm:leading-8">
          Publish flexible tenders, receive supplier proposals, run
          buyer-controlled risk assessments, and track escrow-backed procurement
          from award to delivery.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link
            href="/register"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-5 py-3 text-center text-sm font-semibold text-[#101e42] transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:px-6 sm:text-base"
          >
            Create an account →
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/40 px-5 py-3 text-center text-sm transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:px-6 sm:text-base"
          >
            Sign in to your account
          </Link>
        </div>
        <div className="mt-12 grid min-w-0 gap-4 sm:mt-16 md:grid-cols-3 lg:mt-24">
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
              className="min-w-0 rounded-xl border border-white/20 bg-white/5 p-5 sm:p-6 lg:p-7"
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
