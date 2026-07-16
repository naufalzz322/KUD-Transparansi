'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

type TabType = 'dashboard' | 'setoran' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  token: string;
}

interface TabItem {
  id: TabType;
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function BottomNav({ activeTab, token }: BottomNavProps) {
  const { addToast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setShowMenu(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    document.cookie = 'portal_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    addToast('Berhasil keluar', 'success');
    window.location.href = `/portal/${token}`;
  };

  const tabs: TabItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: `/portal/${token}/dashboard`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'setoran',
      label: 'Setoran',
      href: `/portal/${token}/setoran`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Profil',
      href: `/portal/${token}/settings`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 pb-5">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex flex-col items-center gap-1 py-2 px-3 min-w-[64px] transition-colors ${isActive ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}
              >
                <div className="p-1.5">{tab.icon}</div>
                <span className={`text-xs ${isActive ? 'font-medium' : ''}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-status-critical-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-status-critical" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-center text-text-primary mb-2">
              Keluar dari Aplikasi?
            </h3>
            <p className="text-sm text-text-secondary text-center mb-6">
              Anda harus masuk ulang dengan PIN untuk mengakses akun Anda.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 bg-cream border border-border rounded-xl font-medium text-text-primary hover:bg-border transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-3 bg-status-critical text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
