'use client';

import { useState, useEffect, useMemo } from 'react';
import { MemberFormModal } from '@/components/admin/MemberFormModal';
import { PortalTokenModal } from '@/components/admin/PortalTokenModal';
import { PINSetupModal } from '@/components/admin/PINSetupModal';
import { MemberProductModal } from '@/components/admin/MemberProductModal';
import { useToast } from '@/components/ui/Toast';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Member {
  id: string;
  memberNumber: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  joinDate: string;
  portalToken?: string;
  qrCodeData?: string;
}

type FilterStatus = 'all' | 'active' | 'inactive';

export default function AnggotaPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [portalMember, setPortalMember] = useState<Member | null>(null);

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinMember, setPinMember] = useState<Member | null>(null);

  const [memberProductModalOpen, setMemberProductModalOpen] = useState(false);
  const [memberProductMember, setMemberProductMember] = useState<Member | null>(null);

  const { addToast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      const result = await response.json();
      setMembers(result.members || []);
    } catch (error) {
      console.error('Failed to fetch:', error);
      addToast('Gagal mengambil data anggota', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (statusFilter === 'active' && !member.isActive) return false;
      if (statusFilter === 'inactive' && member.isActive) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          member.name.toLowerCase().includes(query) ||
          member.memberNumber.toLowerCase().includes(query) ||
          member.phone.includes(query)
        );
      }

      return true;
    });
  }, [members, searchQuery, statusFilter]);

  const handleAddNew = () => {
    setSelectedMember(null);
    setFormMode('create');
    setFormModalOpen(true);
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setFormMode('edit');
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (data: { id?: string; memberNumber: string; name: string; phone: string; email?: string; isActive: boolean; joinDate?: string }) => {
    try {
      const url = formMode === 'create' ? '/api/members' : `/api/members/${data.id}`;
      const method = formMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal menyimpan');
      }

      addToast(formMode === 'create' ? 'Anggota berhasil ditambahkan' : 'Anggota berhasil diperbarui', 'success');
      fetchMembers();
    } catch (err) {
      throw err;
    }
  };

  const handleViewPortal = async (member: Member) => {
    // Fetch latest member data to get updated qrCodeData
    try {
      const response = await fetch(`/api/members/${member.id}`);
      if (response.ok) {
        const data = await response.json();
        setPortalMember(data.member);
      } else {
        setPortalMember(member);
      }
    } catch {
      setPortalMember(member);
    }
    setPortalModalOpen(true);
  };

  const handleRegenerateToken = async (memberId: string) => {
    try {
      const response = await fetch(`/api/members/${memberId}/portal`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Gagal generate ulang');

      const result = await response.json();
      addToast(result.message || 'Link portal berhasil di-generate ulang', 'success');

      if (portalMember?.id === memberId) {
        setPortalMember({ ...portalMember, portalToken: result.member.portalToken, qrCodeData: result.member.qrCodeData });
      }
      setPortalModalOpen(false);
      fetchMembers();
    } catch {
      addToast('Gagal generate ulang link portal', 'error');
    }
  };

  const handleSetupPIN = (member: Member) => {
    setPinMember(member);
    setPinModalOpen(true);
  };

  const handlePINSubmit = async (pin: string) => {
    if (!pinMember) return;
    try {
      const response = await fetch(`/api/members/${pinMember.id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!response.ok) throw new Error('Gagal mengatur PIN');
      addToast(`PIN untuk ${pinMember.name} berhasil diatur`, 'success');
    } catch {
      throw new Error('Gagal mengatur PIN');
    }
  };

  const handleManageProducts = (member: Member) => {
    setMemberProductMember(member);
    setMemberProductModalOpen(true);
  };

  const statusCounts = useMemo(() => ({
    all: members.length,
    active: members.filter((m) => m.isActive).length,
    inactive: members.filter((m) => !m.isActive).length,
  }), [members]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Kelola Anggota"
        description={`${members.length} anggota terdaftar`}
        actions={
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors shadow-warm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Anggota
          </button>
        }
      />

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama, nomor anggota, atau HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex bg-surface border border-border rounded-xl p-1">
          {(['all', 'active', 'inactive'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {status === 'all' && 'Semua'}
              {status === 'active' && 'Aktif'}
              {status === 'inactive' && 'Nonaktif'}
              <span className={`ml-1.5 text-xs ${statusFilter === status ? 'opacity-80' : 'opacity-60'}`}>
                {statusCounts[status]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Member Table */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : filteredMembers.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-medium text-text-primary mb-2">
            {searchQuery ? 'Tidak ada hasil' : 'Belum ada anggota'}
          </h3>
          <p className="text-text-secondary mb-6">
            {searchQuery
              ? `Tidak ditemukan anggota dengan "${searchQuery}"`
              : 'Tambahkan anggota pertama Anda untuk memulai'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Anggota
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-warm">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-cream/50 border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">No. Anggota</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Kontak</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Bergabung</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-cream/30 transition-colors">
                    <td className="px-4 py-3"><span className="font-mono text-sm font-medium text-primary">{member.memberNumber}</span></td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">{member.name}</p>
                      {member.email && <p className="text-xs text-text-muted">{member.email}</p>}
                    </td>
                    <td className="px-4 py-3"><p className="text-sm text-text-secondary">{member.phone}</p></td>
                    <td className="px-4 py-3"><p className="text-sm text-text-secondary">{format(new Date(member.joinDate), 'dd MMM yyyy', { locale: id })}</p></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${member.isActive ? 'bg-status-deposited-bg text-status-deposited' : 'bg-gray-100 text-gray-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${member.isActive ? 'bg-status-deposited' : 'bg-gray-400'}`} />
                        {member.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleViewPortal(member)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                          <span className="hidden lg:inline">Portal</span>
                        </button>
                        <button onClick={() => handleSetupPIN(member)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                          <span className="hidden lg:inline">PIN</span>
                        </button>
                        <button onClick={() => handleManageProducts(member)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                          <span className="hidden lg:inline">Produk</span>
                        </button>
                        <button onClick={() => handleEdit(member)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-cream rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          <span className="hidden lg:inline">Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border">
            {filteredMembers.map((member) => (
              <div key={member.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-primary">{member.memberNumber}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${member.isActive ? 'bg-status-deposited-bg text-status-deposited' : 'bg-gray-100 text-gray-600'}`}>
                        {member.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="font-medium text-text-primary mt-1">{member.name}</p>
                    <p className="text-sm text-text-muted">{member.phone}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleViewPortal(member)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-primary bg-primary/10 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    Portal
                  </button>
                  <button onClick={() => handleSetupPIN(member)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-accent bg-accent/10 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    PIN
                  </button>
                  <button onClick={() => handleManageProducts(member)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    Produk
                  </button>
                  <button onClick={() => handleEdit(member)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-secondary bg-cream rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result count */}
      {filteredMembers.length > 0 && (
        <p className="text-sm text-text-muted text-center">
          Menampilkan {filteredMembers.length} dari {members.length} anggota
          {searchQuery && ` untuk "${searchQuery}"`}
        </p>
      )}

      {/* Modals */}
      <MemberFormModal isOpen={formModalOpen} onClose={() => setFormModalOpen(false)} onSubmit={handleFormSubmit} member={selectedMember} mode={formMode} />
      <PortalTokenModal isOpen={portalModalOpen} onClose={() => setPortalModalOpen(false)} member={portalMember} onRegenerate={handleRegenerateToken} />
      <PINSetupModal isOpen={pinModalOpen} onClose={() => setPinModalOpen(false)} memberName={pinMember?.name || ''} onSetup={handlePINSubmit} />
      <MemberProductModal
        isOpen={memberProductModalOpen}
        onClose={() => setMemberProductModalOpen(false)}
        onSave={fetchMembers}
        memberId={memberProductMember?.id || ''}
        memberName={memberProductMember?.name || ''}
      />
    </div>
  );
}
