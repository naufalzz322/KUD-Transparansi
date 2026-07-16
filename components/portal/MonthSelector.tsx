'use client';

import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';

interface MonthSelectorProps {
  currentMonth: Date;
  onChange: (month: Date) => void;
}

export function MonthSelector({ currentMonth, onChange }: MonthSelectorProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const today = new Date();
  const isCurrentMonth = format(currentMonth, 'yyyy-MM') === format(today, 'yyyy-MM');

  const handlePrev = () => onChange(subMonths(currentMonth, 1));
  const handleNext = () => {
    const next = addMonths(currentMonth, 1);
    if (next <= today) onChange(next);
  };

  return (
    <div className="flex items-center justify-between bg-surface rounded-xl border border-border shadow-warm p-2">
      <button
        onClick={handlePrev}
        className="p-2 hover:bg-cream rounded-lg transition-colors touch-target"
        aria-label="Bulan sebelumnya"
      >
        <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="text-center flex-1">
        <span className="font-display text-base font-semibold text-text-primary">
          {format(currentMonth, 'MMMM yyyy', { locale: id })}
        </span>
        {!isCurrentMonth && (
          <button
            onClick={() => onChange(today)}
            className="block text-xs text-primary hover:underline mx-auto"
          >
            Kembali ke bulan ini
          </button>
        )}
      </div>

      <button
        onClick={handleNext}
        disabled={isCurrentMonth}
        className={`p-2 rounded-lg transition-colors touch-target ${
          isCurrentMonth
            ? 'text-text-muted cursor-not-allowed'
            : 'hover:bg-cream text-text-secondary'
        }`}
        aria-label="Bulan berikutnya"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
