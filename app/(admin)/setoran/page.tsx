'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfDay, setHours, isAfter, isBefore, setMinutes, setSeconds } from 'date-fns';
import { id } from 'date-fns/locale';
import { BulkInputTable } from '@/components/admin/BulkInputTable';
import { DailyProgressBar } from '@/components/admin/DailyProgressBar';
import { WANotificationModal } from '@/components/admin/WANotificationModal';
import { useToast } from '@/components/ui/Toast';

interface Member {
  id: string;
  memberNumber: string;
  name: string;
  phone?: string;
}

interface StockItem {
  id: string;
  name: string;
  defaultUnit: string;
  shelfLifeDays: number;
}

interface DepositData {
  qty: number;
  grade?: string;
  isLocked?: boolean;
}

export default function SetoranPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [deposits, setDeposits] = useState<Record<string, DepositData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState<string | null>(null);
  const [waModalOpen, setWAModalOpen] = useState(false);
  const [lockHour, setLockHour] = useState(20);
  const [lockMinute, setLockMinute] = useState(0);
  const { addToast } = useToast();

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Fetch stock items on mount
  useEffect(() => {
    fetchStockItems();
  }, []);

  // Fetch members and deposits when stock item or date changes
  useEffect(() => {
    if (selectedItemId) {
      fetchData();
    }
  }, [currentDate, selectedItemId]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const result = await response.json();
      if (result.settings) {
        const lockTime = result.settings.lockTime || '20:00';
        const [hour, minute] = lockTime.split(':').map(Number);
        setLockHour(hour);
        setLockMinute(minute);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  // Check lock status
  useEffect(() => {
    const checkLockStatus = () => {
      const selectedDay = startOfDay(currentDate);
      const lockTimeDate = setSeconds(setMinutes(setHours(selectedDay, lockHour), lockMinute), 0);
      const now = new Date();

      // If selected date is in the past, always locked
      if (isBefore(selectedDay, startOfDay(new Date()))) {
        setIsLocked(true);
        setLockTimeRemaining(null);
        return;
      }

      // If selected date is today, check time
      if (format(selectedDay, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
        const locked = isAfter(now, lockTimeDate);
        setIsLocked(locked);

        if (!locked) {
          const diff = lockTimeDate.getTime() - now.getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setLockTimeRemaining(`${hours}j ${minutes}m`);
        } else {
          setLockTimeRemaining(null);
        }
      } else {
        setIsLocked(false);
        setLockTimeRemaining(null);
      }
    };

    checkLockStatus();
    const interval = setInterval(checkLockStatus, 60000);
    return () => clearInterval(interval);
  }, [currentDate, lockHour, lockMinute]);

  const fetchStockItems = async () => {
    try {
      const response = await fetch('/api/stocks');
      const result = await response.json();
      if (result.items) {
        setStockItems(result.items);
        // Auto-select first item or "Susu Sapi"
        const susuSapi = result.items.find((i: StockItem) => i.name === 'Susu Sapi');
        if (susuSapi) {
          setSelectedItemId(susuSapi.id);
        } else if (result.items.length > 0) {
          setSelectedItemId(result.items[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stock items:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      let url = `/api/deposits/today?date=${dateStr}`;
      if (selectedItemId) {
        url += `&stockItemId=${selectedItemId}`;
      }
      const response = await fetch(url);
      const result = await response.json();

      setMembers(result.members || []);
      setDeposits(result.deposits || {});
    } catch (error) {
      console.error('Failed to fetch:', error);
      addToast('Gagal mengambil data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (memberId: string, qty: number, grade?: string) => {
    if (isLocked) return;
    setDeposits((prev) => ({
      ...prev,
      [memberId]: { qty, grade },
    }));
  };

  const handleSave = async () => {
    if (isLocked) {
      addToast('Data sudah terkunci. Hubungi admin untuk membuka.', 'error');
      return;
    }

    if (!selectedItemId) {
      addToast('Pilih produk terlebih dahulu', 'error');
      return;
    }

    setSaving(true);
    try {
      const depositsArray = Object.entries(deposits).map(([memberId, data]) => ({
        memberId,
        qty: data.qty,
        grade: data.grade,
      }));

      const response = await fetch('/api/deposits/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: currentDate.toISOString(),
          stockItemId: selectedItemId,
          deposits: depositsArray,
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
        addToast('Setoran berhasil disimpan!', 'success');
        fetchData();
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      addToast('Gagal menyimpan setoran. Coba lagi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedItem = stockItems.find(i => i.id === selectedItemId);
  const totalQty = Object.values(deposits).reduce((sum, d) => sum + d.qty, 0);
  const depositedCount = Object.values(deposits).filter((d) => d.qty > 0).length;

  const waNotifications = members.map((m) => ({
    memberId: m.id,
    memberName: m.name,
    phone: m.phone || '',
    hasDeposit: (deposits[m.id]?.qty || 0) > 0,
    qty: deposits[m.id]?.qty,
    grade: deposits[m.id]?.grade,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-primary">Input Setoran</h1>
            {isLocked && (
              <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Terkunci
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary">
            {format(currentDate, 'EEEE, dd MMMM yyyy', { locale: id })}
            {lockTimeRemaining && (
              <span className="ml-2 text-amber-600">
                • Terkunci dalam {lockTimeRemaining}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={format(currentDate, 'yyyy-MM-dd')}
            onChange={(e) => setCurrentDate(new Date(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Product Selector */}
      <div className="bg-white rounded-lg border border-admin-border p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-1">Pilih Produk</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Pilih Produk --</option>
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.defaultUnit})
                </option>
              ))}
            </select>
          </div>
          {selectedItem && (
            <div className="text-sm text-text-secondary">
              <span className="font-medium">Shelf life:</span> {selectedItem.shelfLifeDays} hari
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg border border-admin-border p-4">
        <DailyProgressBar
          totalMembers={members.length}
          depositedCount={depositedCount}
        />
      </div>

      {/* Lock Warning */}
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium text-amber-800">Data Sudah Terkunci</p>
            <p className="text-sm text-amber-700 mt-1">
              Input untuk tanggal ini sudah tidak bisa diedit karena melewati jam {String(lockHour).padStart(2, '0')}:{String(lockMinute).padStart(2, '0')}.
              Hubungi admin jika perlu melakukan perubahan.
            </p>
          </div>
        </div>
      )}

      {/* Bulk Input Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : selectedItemId ? (
        <BulkInputTable
          members={members}
          existingDeposits={deposits}
          isLocked={isLocked}
          onChange={handleChange}
          totalQty={totalQty}
          unit={selectedItem?.defaultUnit}
        />
      ) : (
        <div className="bg-white rounded-lg border border-admin-border p-8 text-center">
          <p className="text-text-secondary">Pilih produk untuk mulai input setoran</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-text-secondary">
          {lastSaved && (
            <span>Terakhir disimpan: {format(lastSaved, 'HH:mm:ss')}</span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setWAModalOpen(true)}
            disabled={depositedCount === 0}
            className="px-4 py-2 border border-green-300 text-green-700 rounded-lg font-medium hover:bg-green-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Kirim WA
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 border border-gray-300 text-text-primary rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || isLocked || !selectedItemId}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      {/* WA Notification Modal */}
      <WANotificationModal
        isOpen={waModalOpen}
        onClose={() => setWAModalOpen(false)}
        notifications={waNotifications}
        unit={selectedItem?.defaultUnit}
        onSend={async (memberIds, channel) => {
          try {
            const response = await fetch('/api/notifications/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ batchIds: memberIds, channel }),
            });
            if (response.ok) {
              addToast('Notifikasi berhasil dikirim', 'success');
              setWAModalOpen(false);
            } else {
              throw new Error('Gagal mengirim');
            }
          } catch {
            addToast('Gagal mengirim notifikasi', 'error');
          }
        }}
      />
    </div>
  );
}
