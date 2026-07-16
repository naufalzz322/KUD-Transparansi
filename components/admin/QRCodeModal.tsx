'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useScrollLock } from '@/components/ui/useScrollLock';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    name: string;
    memberNumber: string;
    qrCodeData?: string;
    portalToken?: string;
  } | null;
}

export function QRCodeModal({ isOpen, onClose, member }: QRCodeModalProps) {
  // Lock scroll when modal is open
  useScrollLock(isOpen);

  if (!isOpen || !member) return null;

  const cooperativaName = process.env.NEXT_PUBLIC_KOPERASI_NAME || 'KUD Sumber Makmur';
  const portalUrl = member.portalToken
    ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/portal/${member.portalToken}`
    : '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl shadow-warm-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-text-primary">
              QR Code Anggota
            </h3>
            <p className="text-sm text-text-secondary">{member.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cream rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* QR Card */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-[8.5cm] h-[5.5cm] border-2 border-primary rounded-lg p-3 bg-white shadow-sm">
            <div className="flex items-start gap-2 h-full">
              {/* QR Code */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-white border border-gray-200 rounded">
                  {member.qrCodeData ? (
                    <Image
                      src={member.qrCodeData}
                      alt="QR Code"
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No QR
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs font-bold text-primary truncate">{cooperativaName}</span>
                </div>

                <div className="w-px h-px bg-gray-300 my-1" />

                <h3 className="font-semibold text-sm text-text-primary truncate">
                  {member.name}
                </h3>
                <p className="text-xs text-text-secondary font-mono">
                  No. {member.memberNumber}
                </p>

                <div className="mt-auto pt-2">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Scan untuk cek setoran Anda
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Portal URL */}
          {portalUrl && (
            <div className="mt-4 w-full">
              <p className="text-xs text-text-muted mb-1">Link Portal:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={portalUrl}
                  className="flex-1 px-3 py-2 text-sm bg-cream/50 border border-border rounded-lg text-text-secondary font-mono truncate"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(portalUrl);
                  }}
                  className="px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-3 w-full">
            <a
              href={`/qr-card?member=${member.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2.5 border border-border rounded-lg font-medium text-text-secondary hover:bg-cream transition-colors text-center"
            >
              Cetak QR
            </a>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
