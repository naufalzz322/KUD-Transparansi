'use client';

import { useState, useEffect } from 'react';
import { MemberStatsCard } from '@/components/portal/MemberStatsCard';
import { MonthSelector } from '@/components/portal/MonthSelector';
import { ProductBreakdown } from '@/components/portal/ProductBreakdown';
import { ProductCatalog } from '@/components/portal/ProductCatalog';
import { useToast } from '@/components/ui/Toast';

export default function DashboardPage() {
  const { addToast } = useToast();

  // Get token from URL
  const token = window.location.pathname.split('/')[2];

  const [member, setMember] = useState<{ name: string; memberNumber: string } | null>(null);
  const [stats, setStats] = useState<{
    totalQty: number;
    daysCount: number;
    avgPerDay: number;
    gradeBreakdown: { A: number; B: number };
  } | null>(null);
  const [productBreakdown, setProductBreakdown] = useState<any[]>([]);
  const [productCatalog, setProductCatalog] = useState<any[]>([]);
  const [todayData, setTodayData] = useState<{ deposited: boolean; qty: number } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterRange, setFilterRange] = useState<'today' | 'week' | 'month'>('month');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchTodayData();
  }, [currentMonth, filterRange]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const monthParam = currentMonth.toISOString().slice(0, 7);
      const response = await fetch(`/api/portal/history/${token}?month=${monthParam}&range=${filterRange}`);

      if (!response.ok) {
        throw new Error('Gagal mengambil data');
      }

      const data = await response.json();
      setMember(data.member);
      setStats(data.stats);
      setProductBreakdown(data.productBreakdown || []);

      // Fetch product catalog separately
      try {
        const catalogResponse = await fetch(`/api/portal/products/${token}`);
        if (catalogResponse.ok) {
          const catalogData = await catalogResponse.json();
          setProductCatalog(catalogData.products || []);
        }
      } catch {
        // Silently fail for catalog
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayData = async () => {
    try {
      const response = await fetch(`/api/portal/history/${token}?today=true`);
      if (response.ok) {
        const data = await response.json();
        setTodayData(data.today || { deposited: false, qty: 0 });
      }
    } catch {
      // Silently fail
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const monthParam = currentMonth.toISOString().slice(0, 7);
      const response = await fetch(`/api/portal/export/${token}?month=${monthParam}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF export error:', response.status, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const blob = await response.blob();
      console.log('Blob size:', blob.size, 'type:', blob.type);

      if (blob.size === 0) {
        throw new Error('Empty PDF response');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `riwayat-setoran-${member?.memberNumber || token}-${monthParam}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      addToast('PDF berhasil diunduh', 'success');
    } catch {
      addToast('Gagal mengunduh PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !member) {
    return (
      <div className="space-y-4">
        <div className="bg-surface rounded-2xl border border-border shadow-warm p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-12 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="h-10 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-status-critical-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-status-critical" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-status-critical font-medium mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Today's Status Card */}
      {todayData && (
        <div className={`p-4 rounded-2xl border ${
          todayData.deposited
            ? 'bg-green-50 border-green-200'
            : 'bg-accent/10 border-accent/30'
        }`}>
          <div className="flex items-center gap-3">
            {todayData.deposited ? (
              <>
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-green-800">Hari ini sudah setor!</p>
                  <p className="text-sm text-green-600">{todayData.qty} liter</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-accent-800">Belum setor hari ini</p>
                  <p className="text-sm text-accent-600">Jangan lupa input setoran</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Month Selector */}
      <MonthSelector
        currentMonth={currentMonth}
        onChange={setCurrentMonth}
      />

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'today', label: 'Hari ini' },
          { key: 'week', label: 'Minggu Ini' },
          { key: 'month', label: 'Bulan Ini' },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setFilterRange(filter.key as typeof filterRange)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-colors ${
              filterRange === filter.key
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-text-secondary hover:bg-cream'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Product Breakdown - what user deposited */}
      {productBreakdown.length > 0 && (
        <ProductBreakdown products={productBreakdown} />
      )}

      {/* Product Catalog - what KUD accepts */}
      {productCatalog.length > 0 && (
        <ProductCatalog products={productCatalog} />
      )}

      {/* Download PDF */}
      <button
        onClick={handleDownloadPDF}
        disabled={downloading}
        className="w-full py-3.5 bg-surface border border-border rounded-xl font-medium text-text-primary flex items-center justify-center gap-2 hover:bg-cream transition-colors shadow-warm disabled:opacity-50"
      >
        {downloading ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Mengunduh...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </>
        )}
      </button>
    </div>
  );
}
