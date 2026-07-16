'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { KUDLogo } from '@/components/ui/KUDLogo';

interface MemberQR {
  id: string;
  memberNumber: string;
  name: string;
  phone: string;
  portalToken: string;
  qrCodeData: string | null;
}

interface QRStatus {
  totalMembers: number;
  withQR: number;
  withoutQR: number;
  progress: number;
}

export default function QRCardPage() {
  const { addToast } = useToast();
  const [members, setMembers] = useState<MemberQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<QRStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [regenerateConfirm, setRegenerateConfirm] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchMembers();
    fetchStatus();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/members/qr/generate');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const generateQR = async (memberIds?: string[]) => {
    setGenerating(true);
    try {
      const response = await fetch('/api/members/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds }),
      });

      const result = await response.json();

      if (response.ok) {
        addToast(`QR berhasil di-generate untuk ${result.generated} anggota`, 'success');
        fetchMembers();
        fetchStatus();
      } else {
        addToast(result.error || 'Gagal generate QR', 'error');
      }
    } catch (error) {
      console.error('Failed to generate QR:', error);
      addToast('Gagal generate QR', 'error');
    } finally {
      setGenerating(false);
      setShowGenerateModal(false);
    }
  };

  const generateSingleQR = async (memberId: string) => {
    setGeneratingIds(prev => new Set(prev).add(memberId));
    try {
      const response = await fetch('/api/members/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: [memberId] }),
      });

      if (response.ok) {
        addToast('QR berhasil di-generate', 'success');
        fetchMembers();
        fetchStatus();
      }
    } catch (error) {
      console.error('Failed to generate QR:', error);
      addToast('Gagal generate QR', 'error');
    } finally {
      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  const toggleSelect = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const selectAll = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.id)));
    }
  };

  const handlePrint = () => {
    if (selectedMembers.size === 0) {
      addToast('Pilih anggota terlebih dahulu', 'error');
      return;
    }

    // Open print page with member IDs
    const memberIds = Array.from(selectedMembers).join(',');
    window.open(`/qr-card/print?members=${memberIds}`, '_blank');
  };

  const handlePrintSingle = (memberId: string) => {
    window.open(`/qr-card/print?members=${memberId}`, '_blank');
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.memberNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const membersWithoutQR = filteredMembers.filter(m => !m.qrCodeData);
  const selectedWithoutQR = filteredMembers.filter(m => selectedMembers.has(m.id) && !m.qrCodeData);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <KUDLogo size="md" />
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            QR Card Anggota
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Generate dan cetak kartu QR untuk akses portal anggota
          </p>
        </div>
      </div>

      {/* Progress Card */}
      {status && status.totalMembers > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-text-primary">Progress QR Code</h2>
            <span className="text-sm text-text-secondary">
              {status.withQR} / {status.totalMembers} anggota
            </span>
          </div>
          <div className="w-full bg-cream rounded-full h-2 mb-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${status.progress}%` }}
            />
          </div>
          {status.withoutQR > 0 && (
            <button
              onClick={() => setShowGenerateModal(true)}
              disabled={generating}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              Generate QR untuk {status.withoutQR} anggota yang belum punya
            </button>
          )}
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari anggota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Select All */}
            <button
              onClick={selectAll}
              className="px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-cream transition-colors"
            >
              {selectedMembers.size === filteredMembers.length ? 'Batal Pilih' : 'Pilih Semua'}
            </button>

            {/* Generate Selected */}
            <button
              onClick={() => {
                if (selectedWithoutQR.length > 0) {
                  generateQR(Array.from(selectedWithoutQR.map(m => m.id)));
                } else if (selectedMembers.size > 0) {
                  addToast('Anggota terpilih sudah punya QR code', 'info');
                } else {
                  addToast('Pilih anggota terlebih dahulu', 'error');
                }
              }}
              disabled={selectedMembers.size === 0 || generating}
              className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Generate ({selectedWithoutQR.length})
            </button>

            {/* Print Selected */}
            <button
              onClick={handlePrint}
              disabled={selectedMembers.size === 0}
              className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2 shadow-warm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Cetak ({selectedMembers.size})
            </button>
          </div>
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className={`bg-surface rounded-2xl border overflow-hidden shadow-warm transition-all ${
              selectedMembers.has(member.id)
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border'
            }`}
          >
            {/* Card Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <label className="flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(member.id)}
                    onChange={() => toggleSelect(member.id)}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                </label>
                <div className="min-w-0">
                  <p className="font-medium text-text-primary truncate">{member.name}</p>
                  <p className="text-xs text-text-muted">#{member.memberNumber}</p>
                </div>
              </div>
              {member.qrCodeData ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex-shrink-0">
                  ✓ Ada
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex-shrink-0">
                  Belum
                </span>
              )}
            </div>

            {/* QR Code Preview */}
            <div className="p-4 flex items-center justify-center bg-cream min-h-[180px]">
              {member.qrCodeData ? (
                <img
                  src={member.qrCodeData}
                  alt={`QR Code ${member.name}`}
                  className="w-32 h-32 object-contain"
                />
              ) : (
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-text-muted/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <p className="text-sm text-text-muted">QR belum di-generate</p>
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div className="p-3 border-t border-border flex gap-2">
              {!member.qrCodeData ? (
                <button
                  onClick={() => generateSingleQR(member.id)}
                  disabled={generatingIds.has(member.id)}
                  className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {generatingIds.has(member.id) ? 'Generate...' : 'Generate QR'}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setRegenerateConfirm({ id: member.id, name: member.name })}
                    disabled={generatingIds.has(member.id)}
                    className="flex-1 py-2 border border-border text-text-primary rounded-xl text-sm font-medium hover:bg-cream transition-colors disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={() => handlePrintSingle(member.id)}
                    className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Cetak
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-medium text-text-primary mb-2">
            {searchQuery ? 'Tidak ada hasil' : 'Belum ada anggota'}
          </h3>
          <p className="text-text-secondary mb-6">
            {searchQuery
              ? `Tidak ditemukan anggota dengan "${searchQuery}"`
              : 'Tambahkan anggota terlebih dahulu'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="text-primary hover:underline"
            >
              Hapus pencarian
            </button>
          ) : (
            <Link
              href="/anggota"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Anggota
            </Link>
          )}
        </div>
      )}

      {/* Generate Modal */}
      <ConfirmModal
        isOpen={showGenerateModal}
        title="Generate QR Code"
        message={`Generate QR code untuk ${status?.withoutQR || 0} anggota yang belum memiliki?`}
        confirmText="Generate"
        variant="info"
        onConfirm={() => generateQR()}
        onCancel={() => setShowGenerateModal(false)}
        loading={generating}
      />

      {/* Regenerate Confirmation Modal */}
      <ConfirmModal
        isOpen={!!regenerateConfirm}
        title="Regenerate QR Code"
        message={`Yakin ingin regenerate QR code untuk ${regenerateConfirm?.name || ''}? QR code lama akan digantikan dengan yang baru.`}
        confirmText="Regenerate"
        variant="warning"
        onConfirm={() => {
          if (regenerateConfirm) {
            generateSingleQR(regenerateConfirm.id);
          }
          setRegenerateConfirm(null);
        }}
        onCancel={() => setRegenerateConfirm(null)}
        loading={regenerateConfirm ? generatingIds.has(regenerateConfirm.id) : false}
      />
    </div>
  );
}
