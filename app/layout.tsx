import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import '../styles/globals.css';
import Providers from './Provider';
import { Bricolage_Grotesque, Schibsted_Grotesk } from 'next/font/google';
const body = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});
const heading = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ProcureGuard | Trusted procurement',
  description:
    'Transparent tenders, vendor evaluation and accountable procurement.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable}`}>
      <body>
        <AppRouterCacheProvider>
          <Providers apiURL={process.env.API_URL || 'https://procure-api-mqlx.onrender.com/api/v1'}>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
