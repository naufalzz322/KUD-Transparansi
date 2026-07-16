'use client';

import { useState } from 'react';

interface BulkInputTableProps {
  members: Array<{
    id: string;
    memberNumber: string;
    name: string;
  }>;
  existingDeposits?: Record<string, { qty: number; grade?: string }>;
  isLocked?: boolean;
  onChange: (memberId: string, qty: number, grade?: string) => void;
  totalQty: number;
  unit?: string;
}

export function BulkInputTable({
  members,
  existingDeposits,
  isLocked = false,
  onChange,
  totalQty,
  unit = 'unit',
}: BulkInputTableProps) {
  const [focusedRow, setFocusedRow] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-lg border border-admin-border overflow-hidden">
      {/* Desktop Table Header */}
      <div className="hidden md:grid grid-cols-[50px_1fr_120px_100px_80px_80px] gap-2 px-4 py-3 bg-gray-50 border-b border-admin-border text-sm font-medium text-text-secondary">
        <div>No</div>
        <div>Nama Anggota</div>
        <div>No. Anggota</div>
        <div>Qty ({unit.toUpperCase()})</div>
        <div>Grade</div>
        <div>Status</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-admin-border">
        {members.map((member, index) => {
          const deposit = existingDeposits?.[member.id];
          const hasDeposit = deposit && deposit.qty > 0;
          const locked = isLocked;
          const isFocused = focusedRow === member.id;

          return (
            <div
              key={member.id}
              className={`p-3 md:p-0 md:grid md:grid-cols-[50px_1fr_120px_100px_80px_80px] md:gap-2 md:px-4 md:py-3 md:items-center transition-colors ${
                hasDeposit
                  ? 'bg-primary-50 md:bg-primary-50 border-l-4 md:border-l-4 border-l-primary-200'
                  : 'bg-white border-l-4 md:border-l-4 border-l-transparent'
              } ${locked ? 'opacity-60 bg-gray-50' : ''} ${
                isFocused ? 'ring-2 ring-primary ring-inset' : ''
              }`}
              onFocus={() => setFocusedRow(member.id)}
              onBlur={() => setFocusedRow(null)}
            >
              {/* Desktop Row Number */}
              <div className="hidden md:block text-sm text-text-secondary">{index + 1}</div>

              {/* Mobile Card Layout */}
              <div className="md:hidden flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary text-xs font-medium rounded-full">
                      {index + 1}
                    </span>
                    <span className="font-medium text-text-primary truncate">{member.name}</span>
                  </div>
                  <span className="text-xs text-text-secondary font-mono">{member.memberNumber}</span>
                </div>
                {/* Status */}
                <div>
                  {hasDeposit ? (
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-status-deposited-bg text-status-deposited rounded-full">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-400 rounded-full">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>

              {/* Desktop: Name */}
              <div className="hidden md:block font-medium text-text-primary">{member.name}</div>

              {/* Desktop: Member Number */}
              <div className="hidden md:block text-sm text-text-secondary">{member.memberNumber}</div>

              {/* Qty Input - Mobile: full width */}
              <div className="w-full mb-2 md:mb-0">
                <label className="md:hidden text-xs text-text-secondary mb-1 block">Qty ({unit})</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  disabled={locked}
                  defaultValue={deposit?.qty || ''}
                  placeholder="0"
                  className={`w-full px-3 py-2 md:py-2 border rounded-lg text-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                    locked
                      ? 'bg-gray-100 cursor-not-allowed'
                      : hasDeposit
                      ? 'border-primary-200 bg-white'
                      : 'border-gray-200 bg-white'
                  }`}
                  onChange={(e) => {
                    const qty = parseFloat(e.target.value) || 0;
                    const currentGrade = deposit?.grade;
                    onChange(member.id, qty, currentGrade);
                  }}
                />
              </div>

              {/* Grade Select */}
              <div className="w-full md:w-auto mb-2 md:mb-0">
                <label className="md:hidden text-xs text-text-secondary mb-1 block">Grade</label>
                <select
                  disabled={locked}
                  defaultValue={deposit?.grade || ''}
                  className={`w-full px-2 py-2 md:py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                    locked
                      ? 'bg-gray-100 cursor-not-allowed'
                      : 'border-gray-200 bg-white'
                  }`}
                  onChange={(e) => {
                    const grade = e.target.value as 'A' | 'B' | '';
                    const currentQty = deposit?.qty || 0;
                    onChange(member.id, currentQty, grade === '' ? undefined : (grade as 'A' | 'B'));
                  }}
                >
                  <option value="">-</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                </select>
              </div>

              {/* Desktop Status */}
              <div className="hidden md:flex items-center justify-center">
                {hasDeposit ? (
                  <span className="inline-flex items-center gap-1 text-status-deposited font-medium">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-status-not-deposited">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with Total */}
      <div className="px-4 py-3 md:py-4 bg-gray-50 border-t border-admin-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <span>
              Total {(existingDeposits ? members.filter((m) => (existingDeposits[m.id]?.qty ?? 0) > 0).length : 0)} / {members.length} anggota
            </span>
          </div>
          <div className="text-base md:text-lg font-bold text-primary">
            Total: {totalQty.toFixed(1)} {unit}
          </div>
        </div>
      </div>
    </div>
  );
}
