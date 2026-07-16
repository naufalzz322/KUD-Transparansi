'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RiwayatPage() {
  const router = useRouter();

  // Get token from URL
  const token = window.location.pathname.split('/')[2];

  useEffect(() => {
    // Redirect to setoran page
    router.replace(`/portal/${token}/setoran`);
  }, [router, token]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
