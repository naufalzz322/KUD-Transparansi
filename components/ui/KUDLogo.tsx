'use client';

/**
 * KUD Logo Component - Consistent across Login, Sidebar, and QR Cards
 *
 * Design: Milk drop shape representing dairy cooperative
 * - Outer shape: Milk drop (white/cream fill with green border)
 * - Inner detail: Leaf/sprout representing growth and nature
 * - Colors: Primary green (#1B4D3E) for stroke, cream (#F0FDF4) for fill
 */

interface KUDLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function KUDLogo({ className = '', size = 'md', showLabel = false }: KUDLogoProps) {
  const sizes = {
    sm: { container: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-xs' },
    md: { container: 'w-12 h-12', icon: 'w-7 h-7', text: 'text-sm' },
    lg: { container: 'w-20 h-20', icon: 'w-12 h-12', text: 'text-lg' },
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${s.container} bg-surface rounded-xl flex items-center justify-center shadow-warm border border-border`}>
        <svg
          className={s.icon}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Milk drop shape */}
          <path
            d="M32 6C32 6 18 20 18 34C18 44 24 52 32 54C40 52 46 44 46 34C46 20 32 6 32 6Z"
            fill="#F0FDF4"
            stroke="#1B4D3E"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner leaf/sprout */}
          <path
            d="M32 22C32 22 26 28 26 34C26 38 28 42 32 44C36 42 38 38 38 34C38 28 32 22 32 22Z"
            fill="#2D6A4F"
          />
          {/* Leaf detail */}
          <path
            d="M32 28V40M28 32C30 30 32 32 32 32M36 34C34 36 32 34 32 34"
            stroke="#1B4D3E"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Label */}
      {showLabel && (
        <div>
          <p className={`font-display font-bold text-text-primary ${s.text}`}>KUD</p>
          <p className="text-xs text-text-muted">TRANSPARANSI</p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Logo - For sidebar mobile header
 */
export function KUDLogoCompact({ className = '' }: { className?: string }) {
  return (
    <div className={`w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-warm ${className}`}>
      <svg
        className="w-6 h-6 text-white"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M32 6C32 6 18 20 18 34C18 44 24 52 32 54C40 52 46 44 46 34C46 20 32 6 32 6Z"
          fill="white"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <path
          d="M32 22C32 22 26 28 26 34C26 38 28 42 32 44C36 42 38 38 38 34C38 28 32 22 32 22Z"
          fill="#1B4D3E"
        />
      </svg>
    </div>
  );
}

/**
 * QR Card Logo - Minimal version for print
 */
export function KUDLogoPrint({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2C12 2 6 10 6 14.5C6 18.09 8.69 21 12 21C15.31 21 18 18.09 18 14.5C18 10 12 2 12 2Z"/>
    </svg>
  );
}

export default KUDLogo;
