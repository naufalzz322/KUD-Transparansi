import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from './providers';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: 'KUD Transparansi - Transparansi Setoran Anggota',
  description: 'Platform transparansi setoran anggota KUD dengan portal verifikasi',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KUD Trans',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'KUD Transparansi',
    title: 'KUD Transparansi',
    description: 'Platform transparansi setoran anggota KUD dengan portal verifikasi',
  },
};

export const viewport: Viewport = {
  themeColor: '#1B4D3E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
