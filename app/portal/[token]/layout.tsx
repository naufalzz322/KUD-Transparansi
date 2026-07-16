'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { BottomNav } from '@/components/portal/BottomNav';
import { PortalHeader } from '@/components/portal/PortalHeader';

interface MemberData {
  id: string;
  name: string;
  memberNumber: string;
}

type TabType = 'dashboard' | 'setoran' | 'settings';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const token = params.token as string;

  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  // Check if this is the login page (no sub-path)
  const isLoginPage = pathname === `/portal/${token}` || pathname === `/portal/${token}/`;

  useEffect(() => {
    // Skip session verification on login page
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    verifySession();
    // Determine current tab from pathname
    if (pathname.includes('/dashboard')) setCurrentTab('dashboard');
    else if (pathname.includes('/setoran')) setCurrentTab('setoran');
    else if (pathname.includes('/settings')) setCurrentTab('settings');
  }, [token, isLoginPage, pathname]);

  const verifySession = async () => {
    try {
      const response = await fetch(`/api/portal/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setMember(data.member);
      } else {
        // Invalid session, redirect to login using window.location
        window.location.href = `/portal/${token}`;
        return;
      }
    } catch (error) {
      console.error('Session verification failed:', error);
      window.location.href = `/portal/${token}`;
      return;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Memuat...</p>
        </div>
      </div>
    );
  }

  // Show login page without header/nav
  if (isLoginPage || !member) {
    return (
      <div className="min-h-screen bg-cream">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <PortalHeader
        memberName={member.name}
        memberNumber={member.memberNumber}
        token={token}
      />

      <main className="flex-1 pb-20 -mt-2">
        <div className="p-4">
          {children}
        </div>
      </main>

      <BottomNav activeTab={currentTab} token={token} />
    </div>
  );
}
