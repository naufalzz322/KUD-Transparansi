'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/components/ui/Toast';

interface StockItem {
  id: string;
  name: string;
  defaultUnit: string;
}

interface MonthlyStats {
  totalQty: number;
  avgPerDay: number;
  activeDays: number;
  totalDepositors: number;
  activeMembersCount: number;
  gradeA: number;
  gradeB: number;
}

interface DailyData {
  date: string;
  dayLabel: string;
  dayName: string;
  qty: number;
  depositorCount: number;
  isWeekend: boolean;
  isFuture?: boolean;
}

interface MemberBreakdown {
  id: string;
  name: string;
  memberNumber: string;
  totalQty: number;
  daysCount: number;
  avgPerDay: number;
  gradeA: number;
  gradeB: number;
}

interface ItemBreakdown {
  id: string;
  name: string;
  unit: string;
  totalQty: number;
  gradeA: number;
  gradeB: number;
  daysCount: number;
}

interface ReportData {
  month: string;
  monthName: string;
  unit: string;
  stockItems: StockItem[];
  itemBreakdown: ItemBreakdown[];
  stats: MonthlyStats;
  dailyData: DailyData[];
  memberBreakdown: MemberBreakdown[];
}

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

type TabKey = 'grafik' | 'anggota';

export default function LaporanPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabKey>('grafik');
  const { addToast } = useToast();

  const tabs = [
    { key: 'grafik' as TabKey, label: 'Grafik' },
    { key: 'anggota' as TabKey, label: 'Per-Anggota' },
  ];

  useEffect(() => {
    fetchReport();
  }, [currentMonth, selectedItemId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const monthStr = format(currentMonth, 'yyyy-MM');
      let url = `/api/reports/monthly?month=${monthStr}`;
      if (selectedItemId) {
        url += `&itemId=${selectedItemId}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        setReport(null);
      }
    } catch (error) {
      console.error('Gagal mengambil data laporan:', error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    setCurrentMonth(newDate);
  };

  const handleMonthChange = (month: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(month);
    setCurrentMonth(newDate);
  };

  const currentYear = new Date().getFullYear();

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    setActiveTab('grafik');
  };

  const handleSelectAll = () => {
    setSelectedItemId('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Laporan</h1>
          <p className="text-sm text-text-secondary">
            {selectedItemId
              ? `Detail: ${report?.stockItems?.find(i => i.id === selectedItemId)?.name || 'Produk'}`
              : 'Rekap bulanan stok dan setoran'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedItemId && (
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 border border-border rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Semua Produk
            </button>
          )}
          <select
            value={selectedItemId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedItemId(val);
              if (val) setActiveTab('grafik');
            }}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
          >
            <option value="">Semua Produk</option>
            {report?.stockItems?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.defaultUnit})
              </option>
            ))}
          </select>
          <input
            type="number"
            value={format(currentMonth, 'yyyy')}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            min={2025}
            max={currentYear + 1}
            className="w-24 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
          />
          <select
            value={format(currentMonth, 'MM')}
            onChange={(e) => handleMonthChange(parseInt(e.target.value) - 1)}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={String(m.value + 1).padStart(2, '0')}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary Stats - Only show when product is selected */}
          {selectedItemId && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface rounded-xl border border-border p-4">
                <p className="text-sm text-text-secondary">Total Setoran</p>
                <p className="text-2xl font-bold text-primary font-mono mt-1">
                  {report.stats.totalQty.toLocaleString()}
                  <span className="text-sm font-normal text-text-muted ml-1">{report.unit}</span>
                </p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4">
                <p className="text-sm text-text-secondary">Rata-rata/Hari</p>
                <p className="text-2xl font-bold text-primary font-mono mt-1">
                  {report.stats.avgPerDay.toFixed(0)}
                  <span className="text-sm font-normal text-text-muted ml-1">{report.unit}</span>
                </p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4">
                <p className="text-sm text-text-secondary">Total Anggota</p>
                <p className="text-2xl font-bold text-primary font-mono mt-1">
                  {report.stats.totalDepositors}
                  <span className="text-sm font-normal text-text-muted ml-1">orang</span>
                </p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4">
                <p className="text-sm text-text-secondary">Hari Aktif</p>
                <p className="text-2xl font-bold text-primary font-mono mt-1">
                  {report.stats.activeDays}
                  <span className="text-sm font-normal text-text-muted ml-1">hari</span>
                </p>
              </div>
            </div>
          )}

          {/* Tabs - Only show when product is selected */}
          {selectedItemId && (
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <div className="flex border-b border-border overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.key
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-text-secondary hover:text-text-primary hover:bg-cream'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Grafik Tab - Daily Chart */}
                {activeTab === 'grafik' && (
                  <div>
                    <div className="mb-4 text-sm text-text-secondary">
                      Data harian:{' '}
                      <span className="font-medium text-text-primary">
                        {report.monthName}
                      </span>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={report.dailyData.filter((d) => !d.isFuture)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="dayLabel" stroke="#6B7280" fontSize={12} tickLine={false} />
                          <YAxis stroke="#6B7280" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                            }}
                            labelFormatter={(label, payload) => {
                              if (payload && payload[0]) {
                                const data = payload[0].payload;
                                return `${data.dayName}, ${data.date}`;
                              }
                              return label;
                            }}
                            formatter={(value: number) => [
                              `${value.toLocaleString()} ${report.unit}`,
                              'Total',
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="qty"
                            stroke="#1B4D3E"
                            fill="#1B4D3E"
                            fillOpacity={0.2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Per-Anggota Tab */}
                {activeTab === 'anggota' && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-semibold text-text-primary">Rekap per Anggota</h3>
                      <span className="text-sm text-text-secondary">
                        {report.memberBreakdown.length} anggota menyetor
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-sm text-text-muted border-b border-border">
                            <th className="pb-3 font-medium">No.</th>
                            <th className="pb-3 font-medium">Nama</th>
                            <th className="pb-3 font-medium text-right">Total ({report.unit})</th>
                            <th className="pb-3 font-medium text-right">Hari</th>
                            <th className="pb-3 font-medium text-right">Rata-rata</th>
                            <th className="pb-3 font-medium text-right">Grade A</th>
                            <th className="pb-3 font-medium text-right">Grade B</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {report.memberBreakdown.length > 0 ? (
                            report.memberBreakdown.map((m, i) => (
                              <tr key={m.id} className="text-sm hover:bg-cream/30 transition-colors">
                                <td className="py-3 text-text-muted">{i + 1}</td>
                                <td className="py-3">
                                  <p className="font-medium text-text-primary">{m.name}</p>
                                  <p className="text-xs text-text-muted font-mono">{m.memberNumber}</p>
                                </td>
                                <td className="py-3 text-right font-mono font-medium text-text-primary">
                                  {m.totalQty.toLocaleString()}
                                </td>
                                <td className="py-3 text-right text-text-secondary">
                                  {m.daysCount}
                                </td>
                                <td className="py-3 text-right text-text-secondary font-mono">
                                  {m.avgPerDay.toFixed(1)}
                                </td>
                                <td className="py-3 text-right">
                                  <span className="inline-flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    <span className="font-mono text-green-600">{m.gradeA.toLocaleString()}</span>
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <span className="inline-flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span className="font-mono text-amber-600">{m.gradeB.toLocaleString()}</span>
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-text-muted">
                                Belum ada data setoran bulan ini
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Cards - Only show when all products */}
          {!selectedItemId && (
            <div className="bg-surface rounded-xl border border-border p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-text-primary text-lg">Rekap per Produk</h3>
                <p className="text-sm text-text-secondary mt-1">
                  {report.itemBreakdown.length} produk
                </p>
              </div>

              {/* Product Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {report.itemBreakdown.map((item) => {
                  const itemAPct = item.gradeA + item.gradeB > 0
                    ? (item.gradeA / (item.gradeA + item.gradeB)) * 100
                    : 0;
                  const itemBPct = item.gradeA + item.gradeB > 0
                    ? (item.gradeB / (item.gradeA + item.gradeB)) * 100
                    : 0;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item.id)}
                      className="bg-cream/50 rounded-xl border border-border p-4 text-left hover:border-primary hover:shadow-lg transition-all group relative overflow-hidden"
                    >
                      {/* Hover overlay hint */}
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="bg-primary text-white text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Lihat Detail
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-surface text-text-muted px-2 py-0.5 rounded-full">
                            {item.unit}
                          </span>
                          {/* Arrow indicator */}
                          <svg className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <p className="font-mono text-2xl font-bold text-primary">
                        {item.totalQty.toLocaleString()}
                        <span className="text-sm font-normal text-text-muted ml-1">{item.unit}</span>
                      </p>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-text-secondary">Grade A</span>
                          </div>
                          <span className="font-medium text-green-600">
                            {item.gradeA.toLocaleString()} ({itemAPct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${itemAPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span className="text-text-secondary">Grade B</span>
                          </div>
                          <span className="font-medium text-amber-600">
                            {item.gradeB.toLocaleString()} ({itemBPct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${itemBPct}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-text-muted mt-3 pt-2 border-t border-border">
                        {item.daysCount} hari menyetor
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <p className="text-text-secondary">Gagal memuat laporan</p>
          <button onClick={fetchReport} className="mt-4 text-primary hover:underline">
            Coba lagi
          </button>
        </div>
      )}
    </div>
  );
}
