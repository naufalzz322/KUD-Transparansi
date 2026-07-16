'use client';

interface Member {
  id: string;
  memberNumber: string;
  name: string;
  phone: string;
  isActive: boolean;
  joinDate: string;
}

interface MemberTableProps {
  members: Member[];
  onEdit?: (member: Member) => void;
  onViewPortal?: (member: Member) => void;
  onGenerateQR?: (member: Member) => void;
}

export function MemberTable({
  members,
  onEdit,
  onViewPortal,
  onGenerateQR,
}: MemberTableProps) {
  return (
    <div className="bg-white rounded-lg border border-admin-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-admin-border">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
              No. Anggota
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
              Nama
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
              No. HP
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
              Status
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {members.map((member) => (
            <tr key={member.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-mono text-text-primary">
                {member.memberNumber}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-text-primary">
                {member.name}
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary">
                {member.phone}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    member.isActive
                      ? 'bg-status-deposited-bg text-status-deposited'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {member.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onViewPortal?.(member)}
                    className="p-2 text-primary hover:bg-primary-50 rounded-lg transition-colors"
                    title="Lihat Portal"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onGenerateQR?.(member)}
                    className="p-2 text-primary hover:bg-primary-50 rounded-lg transition-colors"
                    title="Generate QR"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onEdit?.(member)}
                    className="p-2 text-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {members.length === 0 && (
        <div className="px-4 py-12 text-center text-text-secondary">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>Belum ada anggota</p>
          <p className="text-sm mt-1">Tambah anggota pertama Anda</p>
        </div>
      )}
    </div>
  );
}
