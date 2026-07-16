'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

interface MemberProfile {
  id: string;
  name: string;
  memberNumber: string;
  phone: string;
  email: string;
  address: string;
}

export default function SettingsPage() {
  const { addToast } = useToast();
  const router = useRouter();

  const token = window.location.pathname.split('/')[2];

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  // PIN change state
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/portal/profile/${token}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.member);
        setProfileForm({
          name: data.member.name || '',
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

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/portal/profile/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.member);
        addToast('Profil berhasil diperbarui', 'success');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Gagal menyimpan');
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Gagal menyimpan profil', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePin = async () => {
    setPinError('');

    if (pinForm.currentPin.length !== 6) {
      setPinError('PIN saat ini harus 6 digit');
      return;
    }
    if (pinForm.newPin.length !== 6) {
      setPinError('PIN baru harus 6 digit');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError('PIN baru tidak cocok');
      return;
    }
    if (pinForm.currentPin === pinForm.newPin) {
      setPinError('PIN baru harus berbeda dari PIN saat ini');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/portal/profile/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPin: pinForm.currentPin,
          newPin: pinForm.newPin,
        }),
      });

      if (response.ok) {
        addToast('PIN berhasil diubah', 'success');
        setShowPinForm(false);
        setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Gagal mengubah PIN');
      }
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Gagal mengubah PIN');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-surface rounded-2xl border border-border shadow-warm p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="bg-surface rounded-2xl border border-border shadow-warm overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Profil Saya
          </h2>
          <p className="text-sm text-text-secondary font-mono">
            {profile?.memberNumber}
          </p>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Nomor WhatsApp</label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="email@contoh.com"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Alamat</label>
            <textarea
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Jl. ..."
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors shadow-warm disabled:opacity-50 flex items-center justify-center gap-2"
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

      {/* Change PIN Card */}
      <div className="bg-surface rounded-2xl border border-border shadow-warm overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Ubah PIN
          </h2>
          <p className="text-sm text-text-secondary">
            Ubah PIN login untuk keamanan akun Anda
          </p>
        </div>

        <div className="p-4">
          {!showPinForm ? (
            <button
              onClick={() => setShowPinForm(true)}
              className="w-full py-3 bg-cream border border-border rounded-xl font-medium text-text-primary hover:bg-border transition-colors"
            >
              Ubah PIN
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">PIN Saat Ini</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinForm.currentPin}
                  onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary text-center tracking-widest font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="• • • • • •"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">PIN Baru</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinForm.newPin}
                  onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary text-center tracking-widest font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="• • • • • •"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Konfirmasi PIN Baru</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinForm.confirmPin}
                  onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2.5 bg-cream border border-border rounded-xl text-text-primary text-center tracking-widest font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="• • • • • •"
                />
              </div>

              {pinError && (
                <div className="p-3 bg-status-critical-bg text-status-critical text-sm rounded-xl">
                  {pinError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPinForm(false);
                    setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
                    setPinError('');
                  }}
                  className="flex-1 py-3 bg-cream border border-border rounded-xl font-medium text-text-primary hover:bg-border transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleChangePin}
                  disabled={saving || pinForm.currentPin.length < 6 || pinForm.newPin.length < 6 || pinForm.confirmPin.length < 6}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                    'Simpan PIN'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* App Info */}
      <div className="text-center py-4">
        <p className="text-xs text-text-muted">
          {process.env.NEXT_PUBLIC_KOPERASI_NAME || 'KUD Sumber Makmur'} Portal
        </p>
        <p className="text-xs text-text-muted mt-1">
          Versi 1.0.0
        </p>
      </div>
    </div>
  );
}
