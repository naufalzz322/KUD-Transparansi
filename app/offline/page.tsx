'use client';

import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="max-w-md w-full bg-surface rounded-2xl shadow-warm-lg p-8 text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-primary-50 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        <h1 className="font-display text-2xl font-bold text-text-primary mb-3">
          Tidak Ada Koneksi
        </h1>

        <p className="text-text-secondary mb-6">
          Sepertinya Anda sedang offline. Silakan periksa koneksi internet
          Anda dan coba lagi.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-6 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-colors"
          >
            Coba Lagi
          </button>

          <Link
            href="/"
            className="block w-full py-3 px-6 bg-surface border border-border rounded-xl font-semibold text-text-primary hover:bg-surface-hover transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>

        <p className="mt-8 text-sm text-text-muted">
          Data setoran terakhir telah disimpan dan akan disinkronkan ketika
          koneksi kembali.
        </p>
      </div>
    </div>
  );
}
