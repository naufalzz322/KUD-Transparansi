'use client';

import { useState } from 'react';
import { PINInput } from './PINInput';
import { useRouter } from 'next/navigation';

interface PINLoginProps {
  memberName?: string;
}

export function PINLogin({ memberName }: PINLoginProps) {
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePinComplete = async (pin: string) => {
    setLoading(true);
    setError(undefined);

    const token = window.location.pathname.split('/').pop();

    try {
      const response = await fetch('/api/portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'PIN salah');
        setLoading(false);
        return;
      }

      router.push(`/portal/${token}/dashboard`);
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-cream flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-warm-lg">
          <span className="text-2xl font-bold text-white">KUD</span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-primary">
          {process.env.NEXT_PUBLIC_KOPERASI_NAME || 'KUD Sumber Makmur'}
        </h1>
        <p className="text-text-secondary mt-2 text-sm">
          Portal Anggota
        </p>
      </div>

      <div className="w-full max-w-xs">
        {memberName ? (
          <p className="text-center text-text-primary mb-6">
            Halo, <span className="font-semibold text-primary">{memberName}</span>
          </p>
        ) : null}

        <PINInput
          length={6}
          onComplete={handlePinComplete}
          error={error}
        />

        {loading && (
          <p className="text-center text-text-secondary mt-6">
            Memverifikasi...
          </p>
        )}
      </div>

      <p className="text-center text-xs text-text-muted mt-10 max-w-xs">
        Masukkan 6 digit PIN Anda. PIN diberikan oleh admin KUD.
      </p>
    </div>
  );
}
