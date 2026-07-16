'use client';

import { useState } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useScrollLock } from '@/components/ui/useScrollLock';

interface PortalMember {
  id: string;
  name: string;
  memberNumber: string;
  portalToken?: string;
  qrCodeData?: string | null;
}

interface PortalTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: PortalMember | null;
  onRegenerate: (memberId: string) => Promise<void>;
}

export function PortalTokenModal({
  isOpen,
  onClose,
  member,
  onRegenerate,
}: PortalTokenModalProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  // Lock scroll when modal is open
  useScrollLock(isOpen);

  if (!isOpen || !member) return null;

  const portalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/portal/${member.portalToken}`
    : `/portal/${member.portalToken}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = portalUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = async () => {
    setShowRegenerateConfirm(true);
  };

  const confirmRegenerate = async () => {
    setLoading(true);
    try {
      await onRegenerate(member.id);
      setShowRegenerateConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-md transform rounded-2xl bg-surface shadow-warm-lg transition-all">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-lg font-display font-semibold text-text-primary">Link Portal Anggota</h3>
                <p className="text-sm text-text-secondary">{member.name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-cream rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Member Info */}
              <div className="bg-cream rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{member.name}</p>
                    <p className="text-sm text-text-secondary">No. {member.memberNumber}</p>
                  </div>
                </div>
              </div>

              {/* Portal URL */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Link Akses Portal
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={portalUrl}
                    className="flex-1 px-4 py-2.5 bg-cream border border-border rounded-xl text-sm font-mono truncate text-text-primary"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="hidden sm:inline">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* QR Code */}
              {member.qrCodeData ? (
                <div className="flex flex-col items-center">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    QR Code (dari QR Card)
                  </label>
                  <img
                    src={member.qrCodeData}
                    alt={`QR Code ${member.name}`}
                    className="w-48 h-48 object-contain bg-white rounded-xl border border-border"
                  />
                  <p className="text-xs text-text-muted mt-2">QR dari menu QR Card</p>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl">
                  <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-text-secondary">Generate QR card dari menu QR Card untuk cetakan</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-border text-text-primary rounded-xl font-medium hover:bg-cream transition-colors"
                >
                  Tutup
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Generate Ulang
                    </>
                  )}
                </button>
              </div>

              {/* Warning */}
              <p className="text-xs text-amber-600 text-center flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Generate ulang akan mengubah link portal dan QR code
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Regenerate Confirmation Modal */}
      <ConfirmModal
        isOpen={showRegenerateConfirm}
        title="Generate Ulang Link Portal & QR"
        message="Yakin ingin generate ulang? Link portal dan QR code akan berubah. Link lama tidak bisa digunakan dan QR lama tidak valid."
        confirmText="Generate Ulang"
        variant="warning"
        onConfirm={confirmRegenerate}
        onCancel={() => setShowRegenerateConfirm(false)}
        loading={loading}
      />
    </>
  );
}
