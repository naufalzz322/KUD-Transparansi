'use client';

import { useState, useEffect } from 'react';
import { format, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useScrollLock } from '@/components/ui/useScrollLock';

interface SettlementDetail {
  id: string;
  stockItemId: string;
  stockItem: {
    id: string;
    name: string;
    defaultUnit: string;
  };
  gradeAQty: string;
  gradeBQty: string;
  priceGradeA: string;
  priceGradeB: string;
  paymentA: string;
  paymentB: string;
  totalPayment: string;
}

interface Settlement {
  id: string;
  period: string;
  totalQty: string;
  gradeAQty: string;
  gradeBQty: string;
  totalPayment: string;
  paidAmount: string;
  status: 'PENDING' | 'PARSIAL' | 'PAID';
  processedAt: string;
  member: {
    id: string;
    name: string;
    memberNumber: string;
  };
  processedBy: {
    name: string;
  };
  details: SettlementDetail[];
}

// Format number to display with dot separators (e.g., 1000000 -> "1.000.000")
const formatMoneyDisplay = (value: number): string => {
  return value.toLocaleString('id-ID');
};

// Parse formatted money string back to number (e.g., "1.000.000" -> 1000000)
const parseMoneyInput = (value: string): number => {
  const cleaned = value.replace(/\./g, '').replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
};

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; settlement: Settlement | null }>({ isOpen: false, settlement: null });
  const [bayarModal, setBayarModal] = useState<{ isOpen: boolean; settlement: Settlement | null }>({ isOpen: false, settlement: null });
  const [bayarAmount, setBayarAmount] = useState(''); // Stored as raw number string
  const [bayarDisplay, setBayarDisplay] = useState(''); // Display with dots
  const [selectedPeriod, setSelectedPeriod] = useState(() => format(new Date(), 'yyyy-MM'));
  const { addToast } = useToast();

  // Lock scroll when modals are open
  useScrollLock(bayarModal.isOpen || detailModal.isOpen);

  useEffect(() => {
    fetchSettlements();
  }, [selectedPeriod]);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/settlements?period=${selectedPeriod}`);
      const result = await response.json();
      setSettlements(result.settlements || []);
    } catch (error) {
      console.error('Failed to fetch:', error);
      addToast('Gagal mengambil data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBayar = (settlement: Settlement) => {
    setBayarModal({ isOpen: true, settlement });
    setBayarAmount('');
    setBayarDisplay('');
  };

  const confirmBayar = async () => {
    if (!bayarModal.settlement) return;
    const settlementId = bayarModal.settlement.id;
    const memberName = bayarModal.settlement.member.name;

    const amount = parseMoneyInput(bayarAmount);
    const total = Number(bayarModal.settlement.totalPayment);
    const alreadyPaid = Number(bayarModal.settlement.paidAmount || 0);
    const remaining = total - alreadyPaid;

    if (isNaN(amount) || amount < 0) {
      addToast('Masukkan jumlah yang valid', 'error');
      return;
    }

    if (amount > remaining) {
      addToast('Jumlah tidak boleh melebihi sisa pembayaran', 'error');
      return;
    }

    if (amount <= 0) {
      addToast('Masukkan jumlah pembayaran', 'error');
      return;
    }

    const newPaidAmount = alreadyPaid + amount;
    const isFullyPaid = Math.abs(newPaidAmount - total) < 1;
    const newStatus = isFullyPaid ? 'PAID' : 'PARSIAL';

    setMarkingId(settlementId);
    setBayarModal({ isOpen: false, settlement: null });

    try {
      const response = await fetch(`/api/settlements/${settlementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          paidAmount: newPaidAmount,
          paidAt: isFullyPaid ? new Date().toISOString() : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Settlement update error:', data);
        throw new Error(data.error || 'Gagal update status');
      }

      setSettlements((prev) =>
        prev.map((s) => (s.id === settlementId ? {
          ...s,
          status: newStatus as 'PENDING' | 'PARSIAL' | 'PAID',
          paidAmount: String(newPaidAmount),
        } : s))
      );
      addToast(
        isFullyPaid
          ? `Pembayaran ${memberName} lunas!`
          : `Pembayaran parsial ${formatCurrency(amount)} untuk ${memberName}`,
        'success'
      );
    } catch (err) {
      console.error('Payment error:', err);
      addToast(err instanceof Error ? err.message : 'Gagal update status', 'error');
    } finally {
      setMarkingId(null);
      setBayarAmount('');
      setBayarDisplay('');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700',
      PARSIAL: 'bg-blue-100 text-blue-700',
      PAID: 'bg-green-100 text-green-700',
    };
    const labels: Record<string, string> = {
      PENDING: 'Menunggu',
      PARSIAL: 'Parsial',
      PAID: 'Lunas',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(value));
  };

  const totalAmount = settlements.reduce((sum, s) => sum + Number(s.totalPayment), 0);
  const totalPaid = settlements.reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);

  // Generate period options (last 12 months)
  const periods = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return format(date, 'yyyy-MM');
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Settlement
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Kelola pembayaran bulanan anggota
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-text-secondary">Periode:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {periods.map((period) => (
              <option key={period} value={period}>
                {format(new Date(period + '-01'), 'MMMM yyyy', { locale: id })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {settlements.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface rounded-xl border border-border p-4 shadow-warm">
            <p className="text-sm text-text-secondary">Total Anggota</p>
            <p className="font-mono text-2xl font-bold text-text-primary mt-1">
              {settlements.length}
            </p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 shadow-warm">
            <p className="text-sm text-text-secondary">Total Tagihan</p>
            <p className="font-mono text-2xl font-bold text-text-primary mt-1">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-warm-lg">
            <p className="text-white/80 text-sm">Total Terbayar</p>
            <p className="font-mono text-2xl font-bold mt-1">
              {formatCurrency(totalPaid)}
            </p>
            <p className="text-white/60 text-xs mt-1">
              {totalAmount > 0 ? `${((totalPaid / totalAmount) * 100).toFixed(0)}%` : '0%'} dari total
            </p>
          </div>
        </div>
      )}

      {/* Settlements Table */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : settlements.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-medium text-text-primary mb-2">
            Belum ada settlements
          </h3>
          <p className="text-text-secondary mb-6">
            Klik &quot;Hitung settlements&quot; untuk menghitung pembayaran bulan {format(new Date(selectedPeriod + '-01'), 'MMMM yyyy', { locale: id })}
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-warm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-cream/50 border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Anggota</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Tagihan</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Terbayar</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {settlements.map((settlement) => {
                  const total = Number(settlement.totalPayment);
                  const paid = Number(settlement.paidAmount || 0);
                  const remaining = total - paid;
                  const paidPercent = total > 0 ? (paid / total) * 100 : 0;
                  const hasDetails = settlement.details && settlement.details.length > 0;

                  return (
                    <tr key={settlement.id} className="hover:bg-cream/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-text-primary">{settlement.member.name}</p>
                          <p className="text-xs text-text-muted">{settlement.member.memberNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm font-semibold text-text-primary">
                          {formatCurrency(total)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="space-y-1">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-mono text-sm text-green-600 font-medium">
                              {formatCurrency(paid)}
                            </span>
                            {total > 0 && (
                              <span className="text-xs text-text-muted">
                                ({paidPercent.toFixed(0)}%)
                              </span>
                            )}
                          </div>
                          {remaining > 0 && (
                            <p className="text-xs text-text-muted">
                              Sisa: {formatCurrency(remaining)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(settlement.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {hasDetails && (
                            <button
                              onClick={() => setDetailModal({ isOpen: true, settlement })}
                              className="inline-flex items-center gap-1.5 px-3 py-2 border border-border text-text-secondary text-xs font-medium rounded-lg hover:bg-cream transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Detail
                            </button>
                          )}
                          {settlement.status !== 'PAID' && remaining > 0 && (
                            <button
                              onClick={() => handleBayar(settlement)}
                              disabled={markingId === settlement.id}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                            >
                              {markingId === settlement.id ? (
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75 fill-current" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              )}
                              Bayar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bayar Modal */}
      {bayarModal.isOpen && bayarModal.settlement && (() => {
        const settlement = bayarModal.settlement;
        const total = Number(settlement.totalPayment);
        const alreadyPaid = Number(settlement.paidAmount || 0);
        const remaining = total - alreadyPaid;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setBayarModal({ isOpen: false, settlement: null })}>
            <div className="bg-surface rounded-2xl shadow-warm-lg w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-text-primary">
                      Pembayaran
                    </h3>
                    <p className="text-sm text-text-secondary">{settlement.member.name}</p>
                  </div>
                  <button
                    onClick={() => setBayarModal({ isOpen: false, settlement: null })}
                    className="p-2 hover:bg-cream rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-cream/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Total Tagihan</span>
                    <span className="font-medium">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Sudah Dibayar</span>
                    <span className="font-medium text-green-600">{formatCurrency(alreadyPaid)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="text-text-secondary font-medium">Sisa Pembayaran</span>
                    <span className="font-semibold text-primary">{formatCurrency(remaining)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Masukkan Jumlah Pembayaran
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">Rp</span>
                    <input
                      type="text"
                      value={bayarDisplay}
                      onChange={(e) => {
                        // Allow only digits
                        const rawValue = e.target.value.replace(/[^0-9]/g, '');
                        if (rawValue === '') {
                          setBayarAmount('');
                          setBayarDisplay('');
                        } else {
                          const numValue = parseInt(rawValue, 10);
                          setBayarAmount(rawValue);
                          setBayarDisplay(formatMoneyDisplay(numValue));
                        }
                      }}
                      onBlur={() => {
                        if (bayarAmount) {
                          const num = parseInt(bayarAmount, 10);
                          setBayarDisplay(formatMoneyDisplay(num));
                        }
                      }}
                      onFocus={() => {
                        // Show raw number on focus for easier editing
                        if (bayarAmount) {
                          setBayarDisplay(bayarAmount);
                        }
                      }}
                      placeholder={`0 - ${formatCurrency(remaining)}`}
                      className="w-full pl-10 pr-4 py-3 bg-cream border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-lg"
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    Isi jumlah sesuai dengan pembayaran yang diterima
                  </p>
                </div>

                {bayarAmount && parseInt(bayarAmount, 10) > 0 && (() => {
                  const amount = parseInt(bayarAmount, 10);
                  return (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <p className="text-sm text-primary">
                        {amount >= remaining ? (
                          <>
                            <span className="font-semibold">Pembayaran Lunas</span> - Status akan berubah menjadi{" "}
                            <span className="font-semibold">Lunas</span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">Pembayaran Parsial</span> - Sisa{" "}
                            <span className="font-semibold">{formatCurrency(remaining - amount)}</span> akan dicatat sebagai piutang
                          </>
                        )}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="p-4 border-t border-border flex gap-3">
                <button
                  onClick={() => setBayarModal({ isOpen: false, settlement: null })}
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl font-medium text-text-secondary hover:bg-cream transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmBayar}
                  disabled={!bayarAmount || parseInt(bayarAmount, 10) <= 0 || markingId === settlement.id}
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {markingId === settlement.id && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75 fill-current" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Bayar Sekarang
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Detail Modal */}
      {detailModal.isOpen && detailModal.settlement && (() => {
        const settlement = detailModal.settlement;
        const total = Number(settlement.totalPayment);

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetailModal({ isOpen: false, settlement: null })}>
            <div className="bg-surface rounded-2xl shadow-warm-lg w-full max-w-md flex flex-col" style={{ maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-text-primary">
                      Rincian Settlement
                    </h3>
                    <p className="text-sm text-text-secondary">{settlement.member.name} — {format(new Date(settlement.period + '-01'), 'MMMM yyyy', { locale: id })}</p>
                  </div>
                  <button
                    onClick={() => setDetailModal({ isOpen: false, settlement: null })}
                    className="p-2 hover:bg-cream rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Summary */}
                <div className="bg-cream/50 rounded-lg p-4 flex-shrink-0">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-text-muted">Grade A</p>
                      <p className="font-mono text-lg font-semibold text-green-600">{Number(settlement.gradeAQty).toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Grade B</p>
                      <p className="font-mono text-lg font-semibold text-amber-600">{Number(settlement.gradeBQty).toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Total</p>
                      <p className="font-mono text-lg font-semibold text-primary">{formatCurrency(total)}</p>
                    </div>
                  </div>
                </div>

                {/* Product Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-primary">Rincian per Produk</h4>
                  {settlement.details.map((detail) => (
                    <div key={detail.id} className="bg-cream/30 rounded-lg p-4 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium text-text-primary">{detail.stockItem.name}</p>
                        <p className="font-mono font-semibold text-primary">
                          {formatCurrency(Number(detail.totalPayment))}
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Grade A</span>
                          <span className="font-mono text-text-primary">
                            {Number(detail.gradeAQty).toFixed(1)} {detail.stockItem.defaultUnit}
                          </span>
                          <span className="text-text-muted">×</span>
                          <span className="font-mono text-text-secondary">
                            {formatCurrency(Number(detail.priceGradeA))}
                          </span>
                          <span className="text-text-muted">=</span>
                          <span className="font-mono text-green-600 font-medium">
                            {formatCurrency(Number(detail.paymentA))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">Grade B</span>
                          <span className="font-mono text-text-primary">
                            {Number(detail.gradeBQty).toFixed(1)} {detail.stockItem.defaultUnit}
                          </span>
                          <span className="text-text-muted">×</span>
                          <span className="font-mono text-text-secondary">
                            {formatCurrency(Number(detail.priceGradeB))}
                          </span>
                          <span className="text-text-muted">=</span>
                          <span className="font-mono text-green-600 font-medium">
                            {formatCurrency(Number(detail.paymentB))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-border flex-shrink-0">
                <button
                  onClick={() => setDetailModal({ isOpen: false, settlement: null })}
                  className="w-full px-4 py-2.5 border border-border rounded-xl font-medium text-text-secondary hover:bg-cream transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
