'use client';

import { format } from 'date-fns';

interface Deposit {
  depositDate: string;
  qty: number;
  unit: string;
  grade: string | null;
  notified: boolean;
}

interface DepositHistoryProps {
  deposits: Deposit[];
  month: Date;
}

export function DepositHistory({ deposits, month }: DepositHistoryProps) {
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);

  // Create array of all days with deposits
  const depositMap = new Map(
    deposits.map((d) => [format(new Date(d.depositDate), 'yyyy-MM-dd'), d])
  );

  const entries = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
    const key = format(date, 'yyyy-MM-dd');
    return depositMap.get(key) || null;
  });

  const depositCount = deposits.filter((d) => d.qty > 0).length;

  return (
    <div className="bg-surface rounded-2xl shadow-warm border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-display font-semibold text-text-primary">
          Riwayat Setoran
        </h3>
        <p className="text-sm text-text-secondary">
          {depositCount} catatan
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Tgl</th>
              <th className="px-4 py-3 text-right font-medium text-text-muted">Qty</th>
              <th className="px-4 py-3 text-center font-medium text-text-muted">Grade</th>
              <th className="px-4 py-3 text-center font-medium text-text-muted">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((deposit, index) => {
              const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              if (!deposit || deposit.qty === 0) {
                return (
                  <tr key={index} className="text-text-muted">
                    <td className="px-4 py-3">
                      {format(date, 'dd/MM')}
                    </td>
                    <td className="px-4 py-3 text-right">-</td>
                    <td className="px-4 py-3 text-center">-</td>
                    <td className="px-4 py-3 text-center text-xs">
                      {isWeekend ? 'Libur' : 'Tidak Setor'}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={index}>
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {format(date, 'dd/MM')}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text-primary font-mono">
                    {deposit.qty} {deposit.unit}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {deposit.grade ? (
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          deposit.grade === 'A'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {deposit.grade}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {deposit.notified ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
