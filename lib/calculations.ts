import { Decimal } from '@prisma/client/runtime/library';
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Deposit {
  qty: Decimal | number;
  depositDate: Date;
  grade: string | null;
}

interface MemberStats {
  totalQty: number;
  daysCount: number;
  avgPerDay: number;
  gradeBreakdown: {
    A: number;
    B: number;
  };
  dailyData: Array<{
    date: Date;
    qty: number;
    hasDeposit: boolean;
  }>;
}

export function calculateMemberStats(deposits: Deposit[], month: Date): MemberStats {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  let totalQty = 0;
  let daysCount = 0;
  let gradeA = 0;
  let gradeB = 0;

  const dailyData = daysInMonth.map((day) => {
    const deposit = deposits.find(
      (d) => format(new Date(d.depositDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );

    const qty = deposit ? Number(deposit.qty) : 0;

    if (qty > 0 && deposit) {
      totalQty += qty;
      daysCount++;

      if (deposit.grade === 'A') gradeA += qty;
      else if (deposit.grade === 'B') gradeB += qty;
    }

    return {
      date: day,
      qty,
      hasDeposit: qty > 0,
    };
  });

  return {
    totalQty,
    daysCount,
    avgPerDay: daysCount > 0 ? totalQty / daysCount : 0,
    gradeBreakdown: {
      A: gradeA,
      B: gradeB,
    },
    dailyData,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDecimal(value: Decimal | number, decimals: number = 2): string {
  return Number(value).toFixed(decimals);
}
