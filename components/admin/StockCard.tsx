'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface StockSummary {
  id: string;
  name: string;
  category: string;
  defaultUnit: string;
  shelfLifeDays: number;
  totalQty: number;
  gradeA: number;
  gradeB: number;
  batchCount: number;
  nearestExpiry: string | null;
  daysRemaining: number | null;
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'EXPIRED';
}

interface StockCardProps {
  item: StockSummary;
  onClick?: () => void;
  showDetails?: boolean;
}

const STATUS_CONFIG = {
  OK: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
    icon: 'text-green-600',
    text: 'text-green-700',
  },
  WARNING: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    icon: 'text-amber-600',
    text: 'text-amber-700',
  },
  CRITICAL: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    icon: 'text-red-600',
    text: 'text-red-700',
  },
  EXPIRED: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    badge: 'bg-gray-300 text-gray-800',
    icon: 'text-gray-500',
    text: 'text-gray-600',
  },
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  MINUMAN: { label: 'Minuman', color: 'bg-blue-100 text-blue-700' },
  SAYURAN: { label: 'Sayuran', color: 'bg-green-100 text-green-700' },
  BUAH: { label: 'Buah', color: 'bg-orange-100 text-orange-700' },
  LAINNYA: { label: 'Lainnya', color: 'bg-gray-100 text-gray-600' },
};

export function StockCard({ item, onClick, showDetails = true }: StockCardProps) {
  const config = STATUS_CONFIG[item.status];

  return (
    <div
      onClick={onClick}
      className={`${config.bg} ${config.border} border rounded-xl p-4 transition-all hover:shadow-md cursor-pointer`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
            {item.shelfLifeDays && (
              <p className="text-xs text-gray-500">
                Shelf life: {item.shelfLifeDays} hari
              </p>
            )}
            <span
              className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                CATEGORY_CONFIG[item.category]?.color ?? 'bg-gray-100 text-gray-600'
              }`}
            >
              {CATEGORY_CONFIG[item.category]?.label ?? item.category}
            </span>
          </div>
        </div>
        <span className={`px-2 py-1 ${config.badge} text-xs font-medium rounded-full`}>
          {item.daysRemaining !== null
            ? item.daysRemaining <= 0
              ? 'Kedaluwarsa'
              : item.daysRemaining === 1
                ? 'Kritis'
                : `${item.daysRemaining} hari lagi`
            : 'Baik'}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Stock</span>
          <span className={`font-mono text-lg font-bold ${config.text}`}>
            {item.totalQty.toLocaleString()} {item.defaultUnit}
          </span>
        </div>

        {showDetails && item.totalQty >= 0 && (
          <div className="pt-2 border-t border-gray-200/50 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Grade A
              </span>
              <span className="font-medium text-gray-700">
                {item.gradeA.toLocaleString()} {item.defaultUnit}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Grade B
              </span>
              <span className="font-medium text-gray-700">
                {item.gradeB.toLocaleString()} {item.defaultUnit}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm pt-1">
              <span className="text-gray-500">Exp. Terdekat</span>
              <span className={`${config.text} font-medium`}>
                {item.nearestExpiry
                  ? format(new Date(item.nearestExpiry), 'dd MMM yyyy', { locale: id })
                  : '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 mt-3 pt-2 border-t border-gray-200/50">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span>{item.batchCount} batch{item.batchCount !== 1 ? 'es' : ''}</span>
      </div>
    </div>
  );
}

interface AlertItemProps {
  name: string;
  daysRemaining: number | null;
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'EXPIRED';
}

export function AlertItem({ name, daysRemaining, status }: AlertItemProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            status === 'CRITICAL'
              ? 'bg-red-500 animate-pulse'
              : status === 'WARNING'
                ? 'bg-amber-500'
                : status === 'EXPIRED'
                  ? 'bg-gray-400'
                  : 'bg-green-500'
          }`}
        ></span>
        <span className="text-sm text-gray-700">{name}</span>
      </div>
      <span className={`text-xs font-medium ${config.text}`}>
        {daysRemaining !== null ? (daysRemaining <= 0 ? 'Kedaluwarsa' : `${daysRemaining}h`) : 'Baik'}
      </span>
    </div>
  );
}

interface AlertSummaryProps {
  critical: number;
  warning: number;
  expired: number;
  ok: number;
  onViewAll?: () => void;
}

export function AlertSummary({ critical, warning, expired, ok, onViewAll }: AlertSummaryProps) {
  const total = critical + warning + expired + ok;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Stock Alerts</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary hover:underline font-medium"
          >
            Lihat Semua
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-gray-600">Kritis</span>
          <span className="ml-auto font-bold text-red-600">{critical}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
          <span className="text-sm text-gray-600">Peringatan</span>
          <span className="ml-auto font-bold text-amber-600">{warning}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
          <span className="text-sm text-gray-600">Kedaluwarsa</span>
          <span className="ml-auto font-bold text-gray-500">{expired}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          <span className="text-sm text-gray-600">Baik</span>
          <span className="ml-auto font-bold text-green-600">{ok}</span>
        </div>
      </div>

      {total > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="flex h-full">
            {critical > 0 && (
              <div
                className="bg-red-500 h-full"
                style={{ width: `${(critical / total) * 100}%` }}
              ></div>
            )}
            {warning > 0 && (
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${(warning / total) * 100}%` }}
              ></div>
            )}
            {expired > 0 && (
              <div
                className="bg-gray-400 h-full"
                style={{ width: `${(expired / total) * 100}%` }}
              ></div>
            )}
            {ok > 0 && (
              <div
                className="bg-green-500 h-full"
                style={{ width: `${(ok / total) * 100}%` }}
              ></div>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        {total} total produk
      </p>
    </div>
  );
}
