'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#f1f3f6', color: '#111b33', fontFamily: 'system-ui, sans-serif' }}>
        <main role="alert" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: '24px', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '420px', textAlign: 'center' }}>
            <p style={{ color: '#2b4cc4', fontSize: '20px', fontWeight: 700 }}>◈ ProcureGuard</p>
            <h1 style={{ fontSize: '26px' }}>We couldn’t open the app</h1>
            <p style={{ color: '#55607a', lineHeight: 1.6 }}>Please try again, or refresh the page if the problem continues.</p>
            <button onClick={reset} style={{ border: 0, borderRadius: '8px', padding: '14px 24px', background: '#2b4cc4', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Try again</button>
            {/* A full navigation recovers even when the root layout/router failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ display: 'inline-block', marginLeft: '20px', color: '#2b4cc4' }}>Back to home</a>
          </div>
        </main>
      </body>
    </html>
  );
}
