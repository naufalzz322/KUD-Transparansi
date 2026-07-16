'use client';

import Image from 'next/image';

interface QRCardProps {
  memberName: string;
  memberNumber: string;
  qrDataUrl: string;
  cooperativaName?: string;
}

export function QRCard({
  memberName,
  memberNumber,
  qrDataUrl,
  cooperativaName = 'KUD Sumber Makmur',
}: QRCardProps) {
  return (
    <div className="w-[8.5cm] h-[5.5cm] border-2 border-primary rounded-lg p-3 bg-white shadow-sm">
      <div className="flex items-start gap-2 h-full">
        {/* QR Code */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 bg-white border border-gray-200 rounded">
            <Image
              src={qrDataUrl}
              alt="QR Code"
              width={80}
              height={80}
              className="w-full h-full object-contain"
              unoptimized
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs font-bold text-primary truncate">{cooperativaName}</span>
          </div>

          <div className="w-px h-px bg-gray-300 my-1" />

          <h3 className="font-semibold text-sm text-text-primary truncate">
            {memberName}
          </h3>
          <p className="text-xs text-text-secondary font-mono">
            No. {memberNumber}
          </p>

          <div className="mt-auto pt-2">
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Scan untuk cek setoran Anda
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
