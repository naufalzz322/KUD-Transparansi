'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

interface Settings {
  lockTime: string;
  waNotificationEnabled: string;
  adminPhone: string;
  cooperativeName: string;
}

export default function PengaturanPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    lockTime: '20:00',
    waNotificationEnabled: 'true',
    adminPhone: '',
    cooperativeName: process.env.NEXT_PUBLIC_KOPERASI_NAME || 'KUD Sumber Makmur',
  });
  const { addToast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings');
      const result = await response.json();
      if (result.settings) {
        setSettings((prev) => ({
          ...prev,
          lockTime: result.settings.lockTime || '20:00',
          waNotificationEnabled: result.settings.waNotificationEnabled || 'true',
          adminPhone: result.settings.adminPhone || '',
          cooperativeName: result.settings.cooperativeName || process.env.NEXT_PUBLIC_KOPERASI_NAME || 'KUD Sumber Makmur',
        }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsArray = [
        { key: 'lockTime', value: settings.lockTime, category: 'deposit', label: 'Jam Kunci Input' },
        { key: 'waNotificationEnabled', value: settings.waNotificationEnabled, category: 'notification', label: 'WhatsApp Notification' },
        { key: 'adminPhone', value: settings.adminPhone, category: 'notification', label: 'Nomor WA Admin' },
        { key: 'cooperativeName', value: settings.cooperativeName, category: 'general', label: 'Nama Cooperativa' },
      ];

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsArray }),
      });

      if (response.ok) {
        addToast('Pengaturan berhasil disimpan', 'success');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      addToast('Gagal menyimpan pengaturan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const [lockHour, lockMinute] = settings.lockTime.split(':');

  const handleHourChange = (hour: string) => {
    setSettings({ ...settings, lockTime: `${hour}:${lockMinute}` });
  };

  const handleMinuteChange = (minute: string) => {
    setSettings({ ...settings, lockTime: `${lockHour}:${minute}` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Pengaturan</h1>
        <p className="text-sm text-text-secondary">
          Konfigurasi sistem KUD
        </p>
      </div>

      {/* General Settings */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Umum</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Nama Cooperativa
            </label>
            <input
              type="text"
              value={settings.cooperativeName}
              onChange={(e) => setSettings({ ...settings, cooperativeName: e.target.value })}
              className="w-full max-w-md px-3 py-2 border border-border rounded-lg bg-cream text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-xs text-text-muted mt-1">
              Nama ini akan muncul di portal anggota dan notifikasi
            </p>
          </div>
        </div>
      </div>

      {/* Deposit Settings */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Pengaturan Setoran
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Jam Kunci Input
            </label>
            <div className="flex items-center gap-1">
              <select
                value={lockHour}
                onChange={(e) => handleHourChange(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-cream text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={String(i).padStart(2, '0')}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span className="text-text-primary font-bold">:</span>
              <select
                value={lockMinute}
                onChange={(e) => handleMinuteChange(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-cream text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={String(i).padStart(2, '0')}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span className="text-text-secondary text-sm ml-2">WIB</span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Setelah jam ini, setoran tidak bisa diedit
            </p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Notifikasi
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">WhatsApp Notification</p>
              <p className="text-sm text-text-secondary">
                Kirim notifikasi via Fonnte API
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.waNotificationEnabled === 'true'}
                onChange={(e) => setSettings({ ...settings, waNotificationEnabled: e.target.checked ? 'true' : 'false' })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Nomor WA Admin
            </label>
            <input
              type="text"
              value={settings.adminPhone}
              onChange={(e) => setSettings({ ...settings, adminPhone: e.target.value })}
              placeholder="628123456789"
              className="w-full max-w-md px-3 py-2 border border-border rounded-lg bg-cream text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-xs text-text-muted mt-1">
              Nomor untuk menerima notifikasi expiry dan laporan
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  );
}
