'use client';

interface MemberStatsCardProps {
  month: Date;
  totalQty: number;
  daysCount: number;
  avgPerDay: number;
  gradeBreakdown?: { A: number; B: number };
  unit?: string;
}

export function MemberStatsCard({
  month,
  totalQty,
  daysCount,
  avgPerDay,
  gradeBreakdown,
  unit = 'liter',
}: MemberStatsCardProps) {
  const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(month);

  return (
    <div className="bg-surface rounded-2xl shadow-warm border border-border p-6">
      <h3 className="font-display text-lg font-medium text-text-primary mb-4">
        {monthName}
      </h3>

      {/* Main Stats */}
      <div className="space-y-5">
        <div>
          <p className="text-sm text-text-muted mb-1">Total Setoran</p>
          <p className="font-mono text-4xl font-semibold text-primary tracking-tight">
            {totalQty.toFixed(1)}
            <span className="text-lg font-normal text-text-secondary ml-2">{unit}</span>
          </p>
        </div>

        <div className="flex gap-8">
          <div>
            <p className="text-sm text-text-muted">Hari Setor</p>
            <p className="font-mono text-xl font-semibold text-text-primary">
              {daysCount}
              <span className="text-sm font-normal text-text-muted ml-1">hari</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Rata-rata</p>
            <p className="font-mono text-xl font-semibold text-text-primary">
              {avgPerDay.toFixed(1)}
              <span className="text-sm font-normal text-text-muted ml-1">{unit}/hari</span>
            </p>
          </div>
        </div>
      </div>

      {/* Grade Breakdown */}
      {gradeBreakdown && (gradeBreakdown.A > 0 || gradeBreakdown.B > 0) && (
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-sm font-medium text-text-secondary mb-3">Ringkasan Grade</p>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-status-deposited" />
              <span className="text-sm text-text-primary font-mono">
                Grade A: <span className="font-semibold">{gradeBreakdown.A.toFixed(1)} {unit}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-sm text-text-primary font-mono">
                Grade B: <span className="font-semibold">{gradeBreakdown.B.toFixed(1)} {unit}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
