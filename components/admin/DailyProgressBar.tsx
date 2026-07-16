'use client';

interface DailyProgressBarProps {
  totalMembers: number;
  depositedCount: number;
  yesterdayCount?: number;
}

export function DailyProgressBar({
  totalMembers,
  depositedCount,
  yesterdayCount,
}: DailyProgressBarProps) {
  const percentage = totalMembers > 0 ? (depositedCount / totalMembers) * 100 : 0;
  const diff = yesterdayCount !== undefined ? depositedCount - yesterdayCount : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">
          Progress Hari Ini
        </span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-primary">
            {depositedCount} / {totalMembers}
          </span>
          {diff !== undefined && (
            <span
              className={`text-xs font-medium ${
                diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {diff > 0 ? `↑ ${diff}` : diff < 0 ? `↓ ${Math.abs(diff)}` : ''}
            </span>
          )}
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-text-secondary">
        <span>
          {totalMembers - depositedCount} belum setor
        </span>
        <span>
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
