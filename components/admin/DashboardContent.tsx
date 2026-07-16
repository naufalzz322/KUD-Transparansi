'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { SkeletonText } from '@/components/ui/Skeleton';

interface StockItem {
  id: string;
  name: string;
  defaultUnit: string;
}

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

interface TodayByItem {
  stockItemId: string;
  qty: number;
  gradeA: number;
  gradeB: number;
  memberCount: number;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  MINUMAN: { label: 'Minuman', color: 'text-blue-700', bg: 'bg-blue-100' },
  SAYURAN: { label: 'Sayuran', color: 'text-green-700', bg: 'bg-green-100' },
  BUAH:    { label: 'Buah',    color: 'text-orange-700', bg: 'bg-orange-100' },
  LAINNYA: { label: 'Lainnya', color: 'text-gray-700', bg: 'bg-gray-100' },
};

const STATUS_CONFIG = {
  OK:      { badge: 'bg-green-100 text-green-800',    dot: 'bg-green-500',  label: 'Baik' },
  WARNING: { badge: 'bg-amber-100 text-amber-800',    dot: 'bg-amber-500',  label: 'Peringatan' },
  CRITICAL:{ badge: 'bg-red-100 text-red-800',        dot: 'bg-red-500 animate-pulse', label: 'Kritis' },
  EXPIRED: { badge: 'bg-gray-200 text-gray-600',      dot: 'bg-gray-400',  label: 'Kedaluwarsa' },
};

export function DashboardContent() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockSummary, setStockSummary] = useState<StockSummary[]>([]);
  const [todayByItem, setTodayByItem] = useState<Map<string, TodayByItem>>(new Map());
  const [alerts, setAlerts] = useState({ critical: 0, warning: 0, expired: 0, ok: 0 });
  const [expiringItems, setExpiringItems] = useState<StockSummary[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [uniqueTodayMembers, setUniqueTodayMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/stock/summary');
      const result = await response.json();
      if (response.ok) {
        setStockItems(result.stockItems || []);
        setStockSummary(result.stockSummary || []);
        setAlerts(result.alerts || { critical: 0, warning: 0, expired: 0, ok: 0 });
        setExpiringItems(result.expiringItems || []);
        setTotalMembers(result.totalMembers || 0);
        setUniqueTodayMembers(result.uniqueTodayMembers || 0);

        const map = new Map<string, TodayByItem>();
        (result.todayByItem || []).forEach((t: TodayByItem) => {
          map.set(t.stockItemId, t);
        });
        setTodayByItem(map);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const dateStr = format(new Date(), 'EEEE, d MMMM yyyy', { locale: id });

  // Merge stock summary with today's data
  const products = stockSummary.map((item) => ({
    ...item,
    today: todayByItem.get(item.id),
  }));

  // Products with today's deposits — sorted by qty desc
  const todayProducts = [...products]
    .filter((p) => p.today && p.today.qty > 0)
    .sort((a, b) => (b.today?.qty || 0) - (a.today?.qty || 0));

  // Products with no setoran today
  const emptyProducts = products.filter((p) => !p.today || p.today.qty === 0);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <SkeletonText className="h-9 w-32 mb-2" />
          <SkeletonText className="h-4 w-48" />
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 w-fit">
          <SkeletonText className="h-9 w-24 rounded-lg" />
          <SkeletonText className="h-9 w-32 rounded-lg" />
        </div>

        {/* Tab Content Skeleton */}
        <div className="space-y-4">
          {/* Hari Ini - Products with setoran */}
          <div>
            <SkeletonText className="h-3 w-40 mb-2" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-44 bg-surface border border-border rounded-xl p-3 animate-pulse">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <SkeletonText className="h-4 w-24 mb-1" />
                      <SkeletonText className="h-3 w-12 rounded-full" />
                    </div>
                  </div>
                  <SkeletonText className="h-7 w-16 mb-1" />
                  <SkeletonText className="h-3 w-28" />
                </div>
              ))}
            </div>
          </div>

          {/* Empty Products */}
          <div>
            <SkeletonText className="h-3 w-36 mb-2" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-44 bg-surface border border-border border-dashed rounded-xl p-3 animate-pulse">
                  <div className="mb-2">
                    <SkeletonText className="h-4 w-20 mb-1" />
                    <SkeletonText className="h-3 w-14 rounded-full" />
                  </div>
                  <SkeletonText className="h-6 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alert Pills Skeleton */}
        <div className="flex gap-2">
          <SkeletonText className="h-8 w-24 rounded-full" />
          <SkeletonText className="h-8 w-28 rounded-full" />
        </div>

        {/* Attention Section Skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <SkeletonText className="h-5 w-32" />
            <SkeletonText className="h-4 w-16" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <SkeletonText className="h-2 w-2 rounded-full" />
                  <SkeletonText className="h-4 w-24" />
                </div>
                <SkeletonText className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">
            Beranda
          </h1>
          <p className="text-text-secondary mt-1 capitalize">
            {dateStr}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'today'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:bg-cream'
          }`}
        >
          Hari Ini
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:bg-cream'
          }`}
        >
          Semua Produk
        </button>
      </div>

      {/* Tab Content */}
      {products.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-medium text-text-primary mb-2">
            Belum ada produk
          </h3>
          <p className="text-text-secondary mb-6">
            Tambahkan produk di halaman Stok
          </p>
          <Link
            href="/stok"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
          >
            Kelola Stok
          </Link>
        </div>
      ) : (
        <>
          {/* Hari Ini tab — compact horizontal scroll */}
          {activeTab === 'today' && (
            <div>
              {/* Products with setoran today */}
              {todayProducts.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-text-muted mb-2 font-medium">
                    {todayProducts.length} produk · {uniqueTodayMembers} anggota
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
                    {todayProducts.map((item) => {
                      const today = item.today!;
                      const cat = CATEGORY_CONFIG[item.category] || { label: item.category, color: 'text-gray-700', bg: 'bg-gray-100' };

                      return (
                        <div
                          key={item.id}
                          className="flex-shrink-0 w-44 bg-surface border border-border rounded-xl p-3 shadow-warm"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-text-primary truncate">
                                {item.name}
                              </h3>
                              <span className={`inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full ${cat.bg} ${cat.color}`}>
                                {cat.label}
                              </span>
                            </div>
                            {item.daysRemaining !== null && item.daysRemaining <= 3 && (
                              <span className={`text-[10px] font-bold flex-shrink-0 ${
                                item.daysRemaining <= 0 ? 'text-red-500' : 'text-amber-500'
                              }`}>
                                {item.daysRemaining <= 0 ? 'Exp' : `${item.daysRemaining}d`}
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="font-mono text-2xl font-bold text-primary leading-none">
                                {today.qty.toFixed(1)}
                              </span>
                              <span className="text-[10px] text-text-muted">{item.defaultUnit}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-green-700">
                                A: {today.gradeA.toFixed(1)}
                              </span>
                              <span className="text-[10px] text-amber-700">
                                B: {today.gradeB.toFixed(1)}
                              </span>
                              <span className="text-[10px] text-text-muted ml-auto">
                                {today.memberCount} org
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-border/60 flex gap-3">
                            <div>
                              <p className="text-[9px] text-text-muted leading-none">Stok</p>
                              <p className="font-mono text-xs font-bold text-text-primary leading-none">
                                {item.totalQty.toFixed(0)} {item.defaultUnit}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Products with no setoran today */}
              {emptyProducts.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted mb-2 font-medium">
                    Belum setor · {emptyProducts.length} produk
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
                    {emptyProducts.map((item) => {
                      const cat = CATEGORY_CONFIG[item.category] || { label: item.category, color: 'text-gray-700', bg: 'bg-gray-100' };

                      return (
                        <div
                          key={item.id}
                          className="flex-shrink-0 w-44 bg-surface border border-border border-dashed rounded-xl p-3"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-text-muted truncate">
                                {item.name}
                              </h3>
                              <span className={`inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full ${cat.bg} ${cat.color}`}>
                                {cat.label}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-border/60">
                            <div>
                              <p className="text-[9px] text-text-muted leading-none">Stok</p>
                              <p className="font-mono text-xs font-bold text-gray-400 leading-none">
                                {item.totalQty.toFixed(0)} {item.defaultUnit}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {products.length === 0 && (
                <div className="text-center py-8 text-text-muted text-sm">
                  Tidak ada setoran hari ini
                </div>
              )}
            </div>
          )}

          {/* Semua tab — full product grid */}
          {activeTab === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((item) => {
                const cat = CATEGORY_CONFIG[item.category] || { label: item.category, color: 'text-gray-700', bg: 'bg-gray-100' };
                const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.OK;
                const today = item.today;

                return (
                  <div
                    key={item.id}
                    className="bg-surface rounded-xl border border-border p-4 shadow-warm hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-text-primary truncate">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cat.bg} ${cat.color}`}>
                            {cat.label}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.badge}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                      {item.daysRemaining !== null && item.daysRemaining <= 3 && (
                        <span className={`text-xs font-medium ${
                          item.daysRemaining <= 0 ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {item.daysRemaining <= 0 ? 'Expired' : `${item.daysRemaining}d`}
                        </span>
                      )}
                    </div>

                    {/* Today's setoran */}
                    <div className="bg-cream/60 rounded-lg p-3 mb-3">
                      <p className="text-xs text-text-muted mb-1">Hari Ini</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-xl font-bold text-primary">
                          {today ? today.qty.toFixed(1) : '0.0'}
                        </span>
                        <span className="text-xs text-text-muted">{item.defaultUnit}</span>
                      </div>
                    </div>

                    {/* Total stock with Grade breakdown */}
                    <div className="pt-2 border-t border-border/60">
                      <div className="flex items-start divide-x divide-border/60">
                        {/* Stok Tersimpan */}
                        <div className="flex-1 pr-3">
                          <p className="text-[10px] text-text-muted mb-0.5">Stok</p>
                          <p className="font-mono text-base font-bold text-text-primary">
                            {item.totalQty.toFixed(0)} <span className="text-xs font-normal text-text-muted">{item.defaultUnit}</span>
                          </p>
                        </div>
                        {/* Grade A */}
                        <div className="flex-1 px-3">
                          <p className="text-[10px] text-green-700 mb-0.5">Grade A</p>
                          <p className="font-mono text-base font-bold text-green-700">
                            {item.gradeA.toFixed(1)}
                          </p>
                        </div>
                        {/* Grade B */}
                        <div className="flex-1 pl-3">
                          <p className="text-[10px] text-amber-700 mb-0.5">Grade B</p>
                          <p className="font-mono text-base font-bold text-amber-700">
                            {item.gradeB.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Stock Alerts */}
      {(alerts.critical > 0 || alerts.warning > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {alerts.critical > 0 && (
            <span className="bg-red-100 border border-red-300 text-red-800 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-medium">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {alerts.critical} Kritis
            </span>
          )}
          {alerts.warning > 0 && (
            <span className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-medium">
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
              {alerts.warning} Peringatan
            </span>
          )}
        </div>
      )}

      {/* Butuh Perhatian */}
      {expiringItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Butuh Perhatian
            </h4>
            <Link href="/stok" className="text-xs text-primary hover:underline font-medium">
              Lihat Semua
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {expiringItems.slice(0, 5).map((item) => {
              const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.OK;
              return (
                <div key={item.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${status.badge}`}>
                      {status.label}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${
                    item.daysRemaining !== null && item.daysRemaining <= 1 ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {item.daysRemaining !== null
                      ? item.daysRemaining <= 0 ? 'Expired' : `${item.daysRemaining} hari`
                      : 'OK'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
