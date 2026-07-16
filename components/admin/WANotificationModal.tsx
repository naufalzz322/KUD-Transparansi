'use client';

import { useState } from 'react';
import { useScrollLock } from '@/components/ui/useScrollLock';

interface MemberNotification {
  memberId: string;
  memberName: string;
  memberEmail?: string;
  phone: string;
  hasDeposit: boolean;
  qty?: number;
  grade?: string;
}

interface WANotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: MemberNotification[];
  onSend: (memberIds: string[], channel?: 'whatsapp' | 'email' | 'sms' | 'both' | 'wa_sms' | 'wa_email') => Promise<void>;
  unit?: string;
}

type NotificationChannel = 'whatsapp' | 'email' | 'sms' | 'both' | 'wa_sms' | 'wa_email';

export function WANotificationModal({
  isOpen,
  onClose,
  notifications,
  onSend,
  unit = 'unit',
}: WANotificationModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(notifications.filter((n) => n.hasDeposit).map((n) => n.memberId))
  );
  const [channel, setChannel] = useState<NotificationChannel>('whatsapp');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [fallbackEnabled, setFallbackEnabled] = useState(true);

  // Lock scroll when modal is open
  useScrollLock(isOpen);

  const toggleMember = (memberId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(notifications.filter((n) => n.hasDeposit).map((n) => n.memberId)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSend = async () => {
    setSending(true);
    try {
      await onSend(Array.from(selectedIds), channel);
      setSent(true);
      setTimeout(() => {
        setSent(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to send notifications:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const eligibleCount = notifications.filter((n) => n.hasDeposit).length;
  const withEmailCount = notifications.filter((n) => n.hasDeposit && n.memberEmail).length;
  const selectedCount = selectedIds.size;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform rounded-xl bg-white shadow-xl transition-all max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Kirim Notifikasi</h3>
              <p className="text-sm text-text-secondary">
                {selectedCount} dari {eligibleCount} anggota terpilih
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Channel Selection */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Channel Pengiriman
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    channel === 'whatsapp'
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  disabled={withEmailCount === 0}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    channel === 'email'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                      : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                  } ${withEmailCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email ({withEmailCount})
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('both')}
                  disabled={withEmailCount === 0}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    channel === 'both'
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                      : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                  } ${withEmailCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Keduanya
                </button>
              </div>
              {withEmailCount === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  ⚠️ Tidak ada anggota dengan email. Tambahkan email anggota untuk mengaktifkan notifikasi email.
                </p>
              )}
            </div>

            {/* Preview */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="font-medium text-green-800">Preview Pesan</span>
              </div>
              <div className="bg-white rounded-lg p-3 text-sm text-gray-700 whitespace-pre-line">
{`🥛 Konfirmasi Setoran

Halo Pak/Bu [Nama Anggota],

📅 Tanggal: [tanggal hari ini]
📦 Qty: [qty] {unit} | Grade: [A/B]
✅ Tercatat oleh: [Admin]

Lihat riwayat lengkap:
[Link Portal]

Ada pertanyaan? Hubungi admin.`}
              </div>
            </div>

            {/* Member Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-primary">
                  Pilih Penerima
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-primary hover:underline"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-xs text-text-secondary hover:underline"
                  >
                    Batal Semua
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <label
                    key={n.memberId}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !n.hasDeposit ? 'opacity-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(n.memberId)}
                      onChange={() => toggleMember(n.memberId)}
                      disabled={!n.hasDeposit}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">{n.memberName}</p>
                      <p className="text-sm text-text-secondary">{n.phone}</p>
                      {n.memberEmail && (
                        <p className="text-xs text-blue-600">{n.memberEmail}</p>
                      )}
                    </div>
                    {n.hasDeposit ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">
                        {n.qty} L {n.grade && `• ${n.grade}`}
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full whitespace-nowrap">
                        Belum setor
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Success Message */}
            {sent && (
              <div className="bg-green-100 border border-green-300 text-green-800 rounded-lg p-4 flex items-center gap-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Notifikasi berhasil dikirim!</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-text-primary rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSend}
                disabled={sending || selectedCount === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Kirim ({selectedCount})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
