'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface SettlementDetail {
  stockItemName: string;
  gradeAQty: number;
  gradeBQty: number;
  priceGradeA: number;
  priceGradeB: number;
  paymentA: number;
  paymentB: number;
  totalPayment: number;
}

interface Settlement {
  id: string;
  period: string;
  totalQty: number;
  gradeAQty: number;
  gradeBQty: number;
  totalPayment: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'PENDING' | 'PARSIAL' | 'PAID';
  processedAt: string | null;
  paidAt: string | null;
  details: SettlementDetail[];
}

export default function SetoranPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [summary, setSummary] = useState<{ totalPaid: number; totalPending: number; totalSettlements: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Get token from URL
  const token = window.location.pathname.split('/')[2];

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/settlements/${token}`);
      if (res.ok) {
        const data = await res.json();
        setSettlements(data.settlements || []);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPeriod = (period: string) => {
    try {
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return format(date, 'MMMM yyyy', { locale: idLocale });
    } catch {
      return period;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Lunas</span>;
      case 'PARSIAL':
        return <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Parsial</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">Menunggu</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Settlement
        </h2>
        <p className="text-sm text-text-secondary">
          Riwayat pembayaran settlement
        </p>
      </div>

      {/* Summary Card */}
      {summary && (
        <div className="bg-surface rounded-2xl border border-border shadow-warm p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-muted">Total Lunas</p>
              <p className="font-mono text-xl font-semibold text-green-600">
                {formatCurrency(summary.totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Sisa Tagihan</p>
              <p className="font-mono text-xl font-semibold text-amber-600">
                {formatCurrency(summary.totalPending)}
              </p>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">
            {summary.totalSettlements} periode settlement
          </p>
        </div>
      )}

      {/* Settlement List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface rounded-2xl border border-border p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : settlements.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-text-muted font-medium">Belum ada settlement</p>
          <p className="text-sm text-text-muted/70 mt-1">Settlement akan muncul setelah diproses admin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {settlements.map(settlement => (
            <div
              key={settlement.id}
              className="bg-surface rounded-2xl border border-border shadow-warm overflow-hidden"
            >
              {/* Summary Row */}
              <div
                className="p-4 cursor-pointer hover:bg-cream/50 transition-colors"
                onClick={() => setExpandedId(expandedId === settlement.id ? null : settlement.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-display font-medium text-text-primary">
                        {formatPeriod(settlement.period)}
                      </h4>
                      {getStatusBadge(settlement.status)}
                    </div>
                    <p className="text-sm text-text-secondary">
                      Total: <span className="font-mono font-medium">{settlement.totalQty.toFixed(1)} L</span>
                    </p>
                    <p className="text-sm text-text-secondary">
                      Pembayaran: <span className="font-mono font-medium text-green-600">
                        {formatCurrency(settlement.paidAmount)}
                      </span>
                      {settlement.remainingAmount > 0 && (
                        <span className="text-amber-600"> / {formatCurrency(settlement.totalPayment)}</span>
                      )}
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-text-muted transition-transform flex-shrink-0 ${expandedId === settlement.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === settlement.id && (
                <div className="border-t border-border bg-cream/30 p-4">
                  <h5 className="text-sm font-medium text-text-primary mb-3">Rincian Settlement</h5>

                  {/* Grade Summary */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-text-secondary">
                        Grade A: <span className="font-mono font-medium">{settlement.gradeAQty.toFixed(1)} L</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-sm text-text-secondary">
                        Grade B: <span className="font-mono font-medium">{settlement.gradeBQty.toFixed(1)} L</span>
                      </span>
                    </div>
                  </div>

                  {/* Product Details */}
                  {settlement.details.length > 0 && (
                    <div className="space-y-2">
                      {settlement.details.map((detail, idx) => (
                        <div key={idx} className="text-sm bg-surface rounded-lg p-3">
                          <p className="font-medium text-text-primary">{detail.stockItemName}</p>
                          <div className="flex justify-between text-xs text-text-muted mt-1">
                            <span>A: {detail.gradeAQty.toFixed(1)} L @ {formatCurrency(detail.priceGradeA)}</span>
                            <span className="font-mono">{formatCurrency(detail.paymentA)}</span>
                          </div>
                          {detail.gradeBQty > 0 && (
                            <div className="flex justify-between text-xs text-text-muted">
                              <span>B: {detail.gradeBQty.toFixed(1)} L @ {formatCurrency(detail.priceGradeB)}</span>
                              <span className="font-mono">{formatCurrency(detail.paymentB)}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Payment Date */}
                  {settlement.paidAt && (
                    <p className="text-xs text-text-muted mt-3">
                      Dibayar: {format(parseISO(settlement.paidAt), 'dd MMMM yyyy', { locale: idLocale })}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
