'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

interface MemberProfile {
  id: string;
  name: string;
  memberNumber: string;
  phone: string;
  email: string;
  address: string;
  qrCodeData?: string;
}

export default function ProfilePage() {
  const { addToast } = useToast();

  // Get token from URL
  const token = window.location.pathname.split('/')[2];

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    phone: '',
    email: '',
    address: '',
  });

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/portal/profile/${token}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.member);
        setForm({
          phone: data.member.phone || '',
          email: data.member.email || '',
          address: data.member.address || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/portal/profile/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        addToast('Profil berhasil diperbarui', 'success');
        fetchProfile();
      } else {
        throw new Error('Gagal menyimpan');
      }
    } catch {
      addToast('Gagal menyimpan profil', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-surface rounded-2xl border border-border shadow-warm p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gray-200 rounded-2xl" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-status-critical">Gagal memuat profil</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Member Card with QR */}
      <div className="bg-surface rounded-2xl border border-border shadow-warm overflow-hidden">
        <div className="p-4 flex items-center gap-4">
          {profile.qrCodeData ? (
            <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center overflow-hidden">
              <img
                src={profile.qrCodeData}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-20 h-20 bg-cream rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
          )}
          <div>
            <h3 className="font-display text-lg font-semibold text-text-primary">
              {profile.name}
            </h3>
            <p className="font-mono text-sm text-text-secondary">
              {profile.memberNumber}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {process.env.NEXT_PUBLIC_KOPERASI_NAME || 'KUD Sumber Makmur'}
            </p>
          </div>
        </div>
      </div>

      {/* Editable Fields */}
      <div className="bg-surface rounded-2xl border border-border shadow-warm p-4">
        <h3 className="font-medium text-text-primary mb-4">Informasi Kontak</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Nomor WhatsApp</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="email@contoh.com"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Alamat</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Jl. ..."
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors shadow-warm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Menyimpan...
            </>
          ) : (
            'Simpan Perubahan'
          )}
        </button>
      </div>
    </div>
  );
}
