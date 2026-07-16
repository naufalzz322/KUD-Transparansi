'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useToast } from '@/components/ui/Toast';

type ExportCategory = 'setoran' | 'anggota' | 'stok' | 'settlement' | 'transaksi';

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  format: string[];
  hasDateRange: boolean;
  hasPreview: boolean;
}

interface ExportHistory {
  category: string;
  title: string;
  date: string;
  format: string;
}

const EXPORT_HISTORY_KEY = 'kud_export_history';

const EXPORT_CATEGORIES: ExportOption[] = [
  {
    id: 'setoran',
    title: 'Laporan Setoran',
    description: 'Rekap setoran bulanan dengan breakdown Grade A/B per produk',
    format: ['CSV', 'XLSX'],
    hasDateRange: true,
    hasPreview: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'anggota',
    title: 'Data Anggota',
    description: 'Daftar anggota KUD dengan informasi kontak dan status',
    format: ['CSV', 'XLSX'],
    hasDateRange: false,
    hasPreview: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: 'stok',
    title: 'Stok Inventory',
    description: 'Stok barang saat ini dengan tanggal kadaluarsa',
    format: ['CSV', 'XLSX'],
    hasDateRange: false,
    hasPreview: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'settlement',
    title: 'Pencairan Settlement',
    description: 'Data settlement untuk software akuntansi (Jurnal, Mekar, dll)',
    format: ['XLSX'],
    hasDateRange: true,
    hasPreview: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'transaksi',
    title: 'Riwayat Transaksi',
    description: 'Riwayat setoran lengkap dengan tanggal dan detail',
    format: ['CSV', 'XLSX'],
    hasDateRange: true,
    hasPreview: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

const MONTHS = [
  { value: 0, label: 'Januari' },
  { value: 1, label: 'Februari' },
  { value: 2, label: 'Maret' },
  { value: 3, label: 'April' },
  { value: 4, label: 'Mei' },
  { value: 5, label: 'Juni' },
  { value: 6, label: 'Juli' },
  { value: 7, label: 'Agustus' },
  { value: 8, label: 'September' },
  { value: 9, label: 'Oktober' },
  { value: 10, label: 'November' },
  { value: 11, label: 'Desember' },
];

export default function ExportPage() {
  const [activeCategory, setActiveCategory] = useState<ExportCategory>('setoran');
  const [selectedFormat, setSelectedFormat] = useState<string>('XLSX');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });
  const { addToast } = useToast();

  const currentCategory = EXPORT_CATEGORIES.find(c => c.id === activeCategory);

  // Load export history
  useEffect(() => {
    const stored = localStorage.getItem(EXPORT_HISTORY_KEY);
    if (stored) {
      setExportHistory(JSON.parse(stored));
    }
  }, []);

  // Set default format based on category
  useEffect(() => {
    if (currentCategory) {
      setSelectedFormat(currentCategory.format[0]);
      setPreviewData(null);
    }
  }, [activeCategory]);

  // Fetch preview data
  useEffect(() => {
    const fetchPreview = async () => {
      if (!currentCategory?.hasPreview) {
        setPreviewData(null);
        return;
      }

      setLoading(true);
      try {
        let url = '/api/export/preview?type=' + activeCategory;

        if (currentCategory.hasDateRange) {
          url += `&start=${format(dateRange.start, 'yyyy-MM-dd')}&end=${format(dateRange.end, 'yyyy-MM-dd')}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setPreviewData(data);
        }
      } catch (error) {
        console.error('Preview error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [activeCategory, dateRange, currentCategory]);

  // Save to history
  const saveToHistory = useCallback((category: string, title: string, format: string) => {
    const newEntry: ExportHistory = {
      category,
      title,
      date: new Date().toISOString(),
      format,
    };
    const updated = [newEntry, ...exportHistory.slice(0, 9)];
    setExportHistory(updated);
    localStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(updated));
  }, [exportHistory]);

  const handleExport = async () => {
    setExporting(true);
    try {
      let url = `/api/export/${activeCategory}`;
      const filename = `${activeCategory}-${format(new Date(), 'yyyyMMdd-HHmm')}`;

      const params = new URLSearchParams();

      if (currentCategory?.hasDateRange) {
        params.append('start', format(dateRange.start, 'yyyy-MM-dd'));
        params.append('end', format(dateRange.end, 'yyyy-MM-dd'));
      }

      params.append('format', selectedFormat.toLowerCase());

      url += '?' + params.toString();

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = fileUrl;

      // Determine extension
      const ext = selectedFormat.toLowerCase() === 'csv' ? 'csv' : 'xlsx';
      a.download = `${filename}.${ext}`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(fileUrl);
      document.body.removeChild(a);

      // Save to history
      saveToHistory(activeCategory, currentCategory?.title || '', selectedFormat);

      // Show success
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      addToast('Export berhasil! File sedang diunduh.', 'success');
    } catch (error) {
      console.error('Export error:', error);
      addToast('Gagal mengekspor data', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleQuickDate = (monthsAgo: number) => {
    const date = subMonths(new Date(), monthsAgo);
    setSelectedMonth(date);
    setDateRange({
      start: startOfMonth(date),
      end: endOfMonth(date),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Export Data</h1>
          <p className="text-sm text-text-secondary">
            Ekspor data ke format CSV atau Excel
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {EXPORT_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id as ExportCategory)}
              className={`flex items-center gap-3 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-text-secondary hover:text-text-primary hover:bg-cream'
              }`}
            >
              <span className={activeCategory === category.id ? 'text-primary' : 'text-text-muted'}>
                {category.icon}
              </span>
              {category.title}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Category Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              activeCategory === 'setoran' ? 'bg-primary/10 text-primary' :
              activeCategory === 'anggota' ? 'bg-blue-50 text-blue-600' :
              activeCategory === 'stok' ? 'bg-amber-50 text-amber-600' :
              activeCategory === 'settlement' ? 'bg-green-50 text-green-600' :
              'bg-purple-50 text-purple-600'
            }`}>
              {currentCategory?.icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {currentCategory?.title}
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                {currentCategory?.description}
              </p>
            </div>
          </div>

          {/* Date Range (if applicable) */}
          {currentCategory?.hasDateRange && (
            <div className="bg-cream/50 rounded-xl border border-border p-5 mb-6">
              <h3 className="text-sm font-medium text-text-primary mb-4">Pilih Periode</h3>

              {/* Quick Select */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => handleQuickDate(0)}
                  className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
                >
                  Bulan Ini
                </button>
                <button
                  onClick={() => handleQuickDate(1)}
                  className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
                >
                  Bulan Lalu
                </button>
                <button
                  onClick={() => handleQuickDate(2)}
                  className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
                >
                  2 Bulan Lalu
                </button>
                <button
                  onClick={() => handleQuickDate(3)}
                  className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
                >
                  3 Bulan Lalu
                </button>
              </div>

              {/* Manual Select */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Dari:</span>
                  <input
                    type="date"
                    value={format(dateRange.start, 'yyyy-MM-dd')}
                    onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                    className="px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Sampai:</span>
                  <input
                    type="date"
                    value={format(dateRange.end, 'yyyy-MM-dd')}
                    onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                    className="px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Format Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-text-primary mb-3">Format File</h3>
            <div className="flex gap-3">
              {currentCategory?.format.map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedFormat === fmt
                      ? 'bg-primary text-white shadow-warm'
                      : 'bg-cream/50 border border-border text-text-secondary hover:border-primary hover:text-primary'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {currentCategory?.hasPreview && (
            <div className="bg-cream/50 rounded-xl border border-border p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <h3 className="font-medium text-text-primary">Preview Data</h3>
                <span className="text-xs text-text-muted ml-auto">
                  {previewData?.count || 0} {activeCategory === 'anggota' ? 'anggota' : activeCategory === 'stok' ? 'item' : 'record'}
                  {' · '}menampilkan 10 data pertama
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : previewData ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {previewData.stats?.map((stat: { label: string; value: string }, i: number) => (
                      <div key={i} className="bg-surface rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-primary font-mono">{stat.value}</p>
                        <p className="text-xs text-text-muted mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Data Table Preview */}
                  {previewData.rows && previewData.rows.length > 0 ? (
                    <div className="bg-surface rounded-lg border border-border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-cream/50">
                              {previewData.headers?.map((header: string, i: number) => (
                                <th key={i} className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {previewData.rows.map((row: any, rowIndex: number) => (
                              <tr key={rowIndex} className="hover:bg-cream/30 transition-colors">
                                {Object.values(row).map((value: any, cellIndex: number) => (
                                  <td key={cellIndex} className="px-4 py-2.5 text-text-primary">
                                    {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted text-center py-4">Tidak ada data untuk periode ini</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-text-muted text-center py-4">Tidak ada data untuk periode ini</p>
              )}
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting || (currentCategory?.hasPreview && !previewData?.count)}
            className="relative px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {showSuccess ? (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Berhasil!
              </span>
            ) : exporting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Mengekspor...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export {selectedFormat}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="font-semibold text-text-primary">Riwayat Export</h2>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem(EXPORT_HISTORY_KEY);
                setExportHistory([]);
                addToast('Riwayat export telah dihapus', 'info');
              }}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Hapus semua
            </button>
          </div>

          <div className="space-y-2">
            {exportHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-cream/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-medium text-green-600">{item.format}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.title}</p>
                    <p className="text-xs text-text-muted">
                      {format(new Date(item.date), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
