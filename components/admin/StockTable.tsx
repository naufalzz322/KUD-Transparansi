'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Stock {
  id: string;
  productName: string;
  batchNumber: string;
  qty: number;
  unit: string;
  expiryDate: string;
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'EXPIRED';
  daysRemaining?: number;
}

interface StockTableProps {
  stocks: Stock[];
  onAcknowledge?: (stockId: string) => void;
  onDelete?: (stockId: string) => void;
  onDiscard?: (stockId: string) => void;
}

export function StockTable({ stocks, onAcknowledge, onDelete, onDiscard }: StockTableProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'OK':
        return 'border-green-200 bg-green-50/50';
      case 'WARNING':
        return 'border-amber-200 bg-amber-50/50';
      case 'CRITICAL':
        return 'border-red-200 bg-red-50/50';
      case 'EXPIRED':
        return 'border-gray-300 bg-gray-100/50';
      default:
        return 'border-border';
    }
  };

  const getStatusBadge = (status: string, daysRemaining?: number) => {
    switch (status) {
      case 'OK':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            OK
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            ⚠️ {daysRemaining} HARI
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 animate-pulse">
            🔴 BESOK
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600 line-through">
            EXPIRED
          </span>
        );
      default:
        return null;
    }
  };

  if (stocks.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-12 text-center">
        <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="font-display text-lg font-medium text-text-primary mb-2">
          Tidak ada stok
        </h3>
        <p className="text-text-secondary">
          Tambahkan stok pertama Anda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stocks.map((stock) => (
        <div
          key={stock.id}
          className={`bg-surface rounded-xl border p-4 ${getStatusStyle(stock.status)}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h4 className={`font-semibold text-text-primary ${stock.status === 'EXPIRED' ? 'line-through opacity-60' : ''}`}>
                  {stock.productName}
                </h4>
                {getStatusBadge(stock.status, stock.daysRemaining)}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
                <span>Batch: {stock.batchNumber}</span>
                <span>{stock.qty} {stock.unit}</span>
                <span>Exp: {format(new Date(stock.expiryDate), 'dd MMM yyyy', { locale: id })}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {stock.status === 'WARNING' && onAcknowledge && (
                <button
                  onClick={() => onAcknowledge(stock.id)}
                  className="px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                >
                  Acknowledge
                </button>
              )}
              {stock.status === 'CRITICAL' && onDiscard && (
                <button
                  onClick={() => onDiscard(stock.id)}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Buang
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(stock.id)}
                  className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
