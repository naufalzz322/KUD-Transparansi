'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { KUDLogoPrint } from '@/components/ui/KUDLogo';

interface MemberQR {
  id: string;
  memberNumber: string;
  name: string;
  phone: string;
  qrCodeData: string | null;
}

function QRPrintContent() {
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<MemberQR[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const memberIds = searchParams.get('members');
    if (memberIds) {
      fetchMembers(memberIds.split(','));
    }
  }, [searchParams]);

  const fetchMembers = async (ids: string[]) => {
    try {
      const response = await fetch('/api/members');
      if (response.ok) {
        const data = await response.json();
        const filtered = (data.members || []).filter((m: MemberQR) => ids.includes(m.id));
        setMembers(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const maskPhone = (phone: string) => {
    if (phone.length <= 8) return phone;
    return phone.slice(0, 4) + '-xxxx-' + phone.slice(-4);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat kartu QR...</p>
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <p className="text-gray-600 mb-4">Tidak ada kartu QR untuk dicetak</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Screen UI - Hidden when printing */}
      <div className="min-h-screen bg-gray-100 print:hidden">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-800">Cetak Kartu QR Anggota</h1>
                <p className="text-sm text-gray-500">{members.length} kartu siap dicetak</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Cetak Sekarang
                </button>
                <button
                  onClick={() => window.close()}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>

          {/* Preview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <div key={member.id} className="bg-white rounded-2xl overflow-hidden shadow-md">
                {/* Card Preview Header */}
                <div className="bg-gradient-to-r from-green-800 to-green-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <KUDLogoPrint className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">KUD TRANSPARANSI</p>
                      <p className="text-white/70 text-sm">Kartu Anggota</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <div className="flex gap-4">
                    <div className="bg-gray-100 rounded-xl p-2 flex items-center justify-center">
                      {member.qrCodeData ? (
                        <img src={member.qrCodeData} alt="QR" className="w-28 h-28" />
                      ) : (
                        <div className="w-28 h-28 bg-gray-200 rounded-xl flex items-center justify-center">
                          <span className="text-gray-400 text-sm">No QR</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="font-bold text-gray-900 text-lg">{member.name}</p>
                      <p className="text-gray-500 text-sm mt-1">No. {member.memberNumber}</p>
                      <p className="text-gray-400 text-sm">{maskPhone(member.phone)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-medium text-amber-800 mb-2">Petunjuk Cetak:</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>Gunakan kertas HVS atau F4 untuk hasil terbaik</li>
              <li>Pastikan printer diatur untuk mencetak Gambar (Image)</li>
              <li>Potong kartu sesuai garis batas setelah mencetak</li>
              <li>Laminating kartu akan membuatnya lebih tahan lama</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Print Layout - Credit Card Proportions */}
      <div className="hidden print:block">
        {/* Print container with proper margins */}
        <div className="p-4">
          {/* Header for print */}
          <div className="text-center mb-4">
            <p className="font-bold text-lg">Kartu QR Portal Anggota - KUD Transparansi</p>
            <p className="text-xs text-gray-600">Dicetak: {new Date().toLocaleDateString('id-ID')}</p>
          </div>

          {/* Cards Grid - 2 columns for credit card ratio */}
          <div className="grid grid-cols-2 gap-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="border-4 border-green-800 rounded-xl overflow-hidden"
                style={{
                  pageBreakInside: 'avoid',
                  width: '86mm',
                  height: '54mm',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {/* Top colored bar with logo */}
                <div
                  className="h-10 bg-green-800 px-3 flex items-center justify-between"
                  style={{ backgroundColor: '#1B4D3E' }}
                >
                  <div className="flex items-center gap-2">
                    {/* Logo */}
                    <KUDLogoPrint className="w-6 h-6 text-white" />
                    <div className="text-white">
                      <p className="font-bold text-sm leading-none">KUD</p>
                      <p className="text-[8px] opacity-80 leading-none">TRANSPARANSI</p>
                    </div>
                  </div>
                  <div className="text-right text-white">
                    <p className="font-bold text-[10px] leading-none">KARTU ANGGOTA</p>
                    <p className="text-[8px] opacity-80 leading-none">Portal QR</p>
                  </div>
                </div>

                {/* Card body */}
                <div
                  className="h-[calc(100%-40px)] px-3 py-2 flex"
                  style={{ backgroundColor: '#F5F0E8' }}
                >
                  {/* QR Code */}
                  <div className="flex-shrink-0 bg-white rounded-lg p-1 border border-gray-200">
                    {member.qrCodeData ? (
                      <img src={member.qrCodeData} alt="QR" className="w-16 h-16" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-[8px]">No QR</span>
                      </div>
                    )}
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 pl-3 flex flex-col justify-center">
                    <p className="font-bold text-gray-900 text-sm leading-tight truncate">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      No. Anggota: <span className="font-medium">{member.memberNumber}</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {maskPhone(member.phone)}
                    </p>
                    <div className="mt-1 pt-1 border-t border-gray-300">
                      <p className="text-[8px] text-gray-500 leading-tight">
                        Scan QR atau kunjungi portal untuk melihat riwayat setoran
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-[10px] text-gray-600">
              Simpan kartu ini di tempat yang aman | KUD Transparansi
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function QRPrintPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <QRPrintContent />
    </Suspense>
  );
}
