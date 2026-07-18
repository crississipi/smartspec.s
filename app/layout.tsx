import type { Metadata } from 'next';
import { Commissioner } from 'next/font/google';
import '@/app/globals.css';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

const commissioner = Commissioner({
  variable: '--font-commissioner',
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'SmartSpecs',
  description: 'Your AI assistant in choosing the best computer setup.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/assets/favicon.png', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script async defer src="https://accounts.google.com/gsi/client"></script>
      </head>
      <body className={commissioner.variable}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}