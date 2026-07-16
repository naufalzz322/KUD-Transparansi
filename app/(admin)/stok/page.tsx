'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { StockCard } from '@/components/admin/StockCard';
import { useScrollLock } from '@/components/ui/useScrollLock';

interface StockItem {
  id: string;
  name: string;
  category: string;
  defaultUnit: string;
  shelfLifeDays: number;
  priceGradeA: number | null;
  priceGradeB: number | null;
  totalQty: number;
  gradeA: number;
  gradeB: number;
  batchCount: number;
  expiredBatchCount: number;
  nearestExpiry: string | null;
  daysRemaining: number | null;
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'EXPIRED';
}

export default function StokPerishablePage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [statusCounts, setStatusCounts] = useState({ ok: 0, warning: 0, critical: 0, expired: 0, total: 0 });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; itemId: string | null; itemName: string }>({ isOpen: false, itemId: null, itemName: '' });
  const { addToast } = useToast();

  // Lock scroll when modals are open
  useScrollLock(deleteModal.isOpen || showForm);

  // Form state for new stock item
  const [formData, setFormData] = useState({
    name: '',
    category: 'MINUMAN',
    defaultUnit: 'liter',
    shelfLifeDays: '3',
    priceGradeA: '',
    priceGradeB: '',
  });

  useEffect(() => {
    fetchStocks();
  }, [filter]);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      let url = '/api/stocks';
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      const response = await fetch(url);
      const result = await response.json();

      if (result.items) {
        setItems(result.items);
        setStatusCounts({
          ok: result.byStatus?.ok || 0,
          warning: result.byStatus?.warning || 0,
          critical: result.byStatus?.critical || 0,
          expired: result.byStatus?.expired || 0,
          total: result.totalAll || result.items?.length || 0,
        });
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
      addToast('Gagal mengambil data stok', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal menambah produk');
      }

      addToast('Produk berhasil ditambahkan', 'success');
      setShowForm(false);
      setFormData({
        name: '',
        category: 'MINUMAN',
        defaultUnit: 'liter',
        shelfLifeDays: '3',
        priceGradeA: '',
        priceGradeB: '',
      });
      fetchStocks();
    } catch (error: any) {
      addToast(error.message || 'Gagal menambahkan produk', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.itemId) return;

    try {
      const response = await fetch(`/api/stocks?id=${deleteModal.itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Gagal menghapus');

      addToast('Produk berhasil dihapus', 'success');
      setDeleteModal({ isOpen: false, itemId: null, itemName: '' });
      fetchStocks();
    } catch (error) {
      addToast('Gagal menghapus produk', 'error');
    }
  };

  const openDeleteModal = (itemId: string, itemName: string) => {
    setDeleteModal({ isOpen: true, itemId, itemName });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      MINUMAN: 'Minuman',
      SAYURAN: 'Sayuran',
      BUAH: 'Buah',
      LAINNYA: 'Lainnya',
    };
    return labels[category] || category;
  };

  const filterOptions = [
    { key: 'all', label: 'Semua', count: statusCounts.total, color: 'primary' },
    { key: 'OK', label: 'Baik', count: statusCounts.ok, color: 'green' },
    { key: 'WARNING', label: 'Peringatan', count: statusCounts.warning, color: 'amber' },
    { key: 'CRITICAL', label: 'Kritis', count: statusCounts.critical, color: 'red' },
    { key: 'EXPIRED', label: 'Kedaluwarsa', count: statusCounts.expired, color: 'gray' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Stok
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Kelola stok dan pantau expiry
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors shadow-warm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Produk
        </button>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {filterOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => setFilter(option.key)}
            className={`p-4 rounded-xl border transition-all ${
              filter === option.key
                ? option.color === 'primary'
                  ? 'bg-primary text-white border-primary'
                  : option.color === 'green'
                    ? 'bg-green-500 text-white border-green-500'
                    : option.color === 'amber'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : option.color === 'red'
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-gray-500 text-white border-gray-500'
                : 'bg-surface border-border hover:border-primary/30'
            }`}
          >
            <p className="text-2xl font-bold">{option.count}</p>
            <p className={`text-xs ${filter === option.key ? 'text-white/80' : 'text-text-secondary'}`}>
              {option.label}
            </p>
          </button>
        ))}
      </div>

      {/* Stock Items Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-medium text-text-primary mb-2">
            Tidak ada produk
          </h3>
          <p className="text-text-secondary mb-6">
            Tambahkan produk pertama Anda
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Produk
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              <StockCard item={item} />
              <button
                onClick={() => openDeleteModal(item.id, item.name)}
                className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-red-50 hover:text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title="Hapus produk"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Hapus Produk"
        message={`Yakin ingin menghapus "${deleteModal.itemName}"? Semua batch terkait juga akan dihapus.`}
        confirmText="Hapus"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, itemId: null, itemName: '' })}
      />

      {/* Add Product Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-surface rounded-2xl shadow-warm-lg w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-text-primary">
                  Tambah Produk Baru
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-cream rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Susu Sapi"
                  className="w-full px-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="MINUMAN">Minuman</option>
                  <option value="SAYURAN">Sayuran</option>
                  <option value="BUAH">Buah</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Satuan Default
                  </label>
                  <select
                    value={formData.defaultUnit}
                    onChange={(e) => setFormData({ ...formData, defaultUnit: e.target.value })}
                    className="w-full px-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="liter">liter</option>
                    <option value="kg">kg</option>
                    <option value="gram">gram</option>
                    <option value="pcs">pcs</option>
                    <option value="box">box</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Shelf Life (hari)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.shelfLifeDays}
                    onChange={(e) => setFormData({ ...formData, shelfLifeDays: e.target.value })}
                    className="w-full px-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Harga Grade A
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">Rp</span>
                    <input
                      type="number"
                      value={formData.priceGradeA}
                      onChange={(e) => setFormData({ ...formData, priceGradeA: e.target.value })}
                      placeholder="6500"
                      className="w-full pl-10 pr-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Harga Grade B
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">Rp</span>
                    <input
                      type="number"
                      value={formData.priceGradeB}
                      onChange={(e) => setFormData({ ...formData, priceGradeB: e.target.value })}
                      placeholder="5500"
                      className="w-full pl-10 pr-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl font-medium text-text-secondary hover:bg-cream transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
