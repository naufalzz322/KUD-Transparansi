'use client';

import { useState, useEffect } from 'react';
import { useScrollLock } from '@/components/ui/useScrollLock';

interface StockItem {
  id: string;
  name: string;
  category: string;
  defaultUnit: string;
}

interface MemberProductAssignment {
  id: string;
  memberId: string;
  stockItemId: string;
  isPrimary: boolean;
}

interface MemberProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  memberId: string;
  memberName: string;
}

export function MemberProductModal({
  isOpen,
  onClose,
  onSave,
  memberId,
  memberName,
}: MemberProductModalProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [assignments, setAssignments] = useState<MemberProductAssignment[]>([]);
  // Pending state for visual feedback (client-side only)
  const [pendingAssignments, setPendingAssignments] = useState<Set<string>>(new Set());
  const [pendingPrimary, setPendingPrimary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lock scroll when modal is open
  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen && memberId) {
      fetchData();
    }
  }, [isOpen, memberId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stock items
      const stocksRes = await fetch('/api/stocks');
      const stocksData = await stocksRes.json();
      setStockItems(stocksData.items || []);

      // Fetch member's product assignments
      const assignRes = await fetch(`/api/member-products?memberId=${memberId}`);
      const assignData = await assignRes.json();
      setAssignments(assignData.assignments || []);

      // Initialize pending state from current DB state
      const assignedIds = new Set<string>((assignData.assignments || []).map((a: MemberProductAssignment) => a.stockItemId));
      setPendingAssignments(assignedIds);
      const primary = (assignData.assignments || []).find((a: MemberProductAssignment) => a.isPrimary);
      setPendingPrimary(primary?.stockItemId || null);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAssigned = (stockItemId: string) => {
    return pendingAssignments.has(stockItemId);
  };

  const hasChanges = () => {
    // Compare pending state with original assignments
    const originalAssigned = new Set<string>(assignments.map((a) => a.stockItemId));
    const originalPrimary = assignments.find((a) => a.isPrimary)?.stockItemId || null;

    if (pendingAssignments.size !== originalAssigned.size) return true;
    const pendingIds = Array.from(pendingAssignments);
    for (const id of pendingIds) {
      if (!originalAssigned.has(id)) return true;
    }
    if (pendingPrimary !== originalPrimary) return true;
    return false;
  };

  const toggleProduct = (stockItemId: string) => {
    // Visual feedback only - no DB operations
    setPendingAssignments((prev) => {
      const next = new Set(prev);
      if (next.has(stockItemId)) {
        next.delete(stockItemId);
        // If removing primary, clear it
        if (pendingPrimary === stockItemId) {
          setPendingPrimary(null);
        }
      } else {
        next.add(stockItemId);
        // Auto-set as primary if no primary exists
        if (!pendingPrimary) {
          setPendingPrimary(stockItemId);
        }
      }
      return next;
    });
  };

  const setPrimary = (stockItemId: string) => {
    if (pendingAssignments.has(stockItemId)) {
      setPendingPrimary(stockItemId);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Calculate changes compared to original DB state
      const originalAssigned = new Set(assignments.map((a) => a.stockItemId));
      const originalPrimary = assignments.find((a) => a.isPrimary)?.stockItemId || null;

      // Products to add (in pending but not in original)
      const pendingIds = Array.from(pendingAssignments);
      const toAdd = pendingIds.filter((id) => !originalAssigned.has(id));
      // Products to remove (in original but not in pending)
      const toRemove = assignments.filter((a) => !pendingAssignments.has(a.stockItemId));

      // Remove assignments first
      for (const assignment of toRemove) {
        await fetch(`/api/member-products?memberId=${memberId}&stockItemId=${assignment.stockItemId}`, {
          method: 'DELETE',
        });
      }

      // Add new assignments
      for (const stockItemId of toAdd) {
        await fetch('/api/member-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId,
            stockItemId,
            isPrimary: stockItemId === pendingPrimary,
          }),
        });
      }

      // Update primary for existing assignments if changed
      if (pendingPrimary !== originalPrimary) {
        // If the new primary is an existing assignment, update it
        const existingPrimaryAssignment = assignments.find((a) => a.stockItemId === pendingPrimary);
        if (existingPrimaryAssignment) {
          await fetch('/api/member-products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberId,
              stockItemId: pendingPrimary,
              isPrimary: true,
            }),
          });
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Reset to original DB state (discard pending changes)
    const assignedIds = new Set(assignments.map((a) => a.stockItemId));
    setPendingAssignments(assignedIds);
    const primary = assignments.find((a) => a.isPrimary);
    setPendingPrimary(primary?.stockItemId || null);
    onClose();
  };

  if (!isOpen) return null;

  // Group by category
  const categories = stockItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, StockItem[]>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl shadow-warm-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-display text-lg font-semibold text-text-primary">
              Produk Anggota
            </h3>
            <p className="text-sm text-text-secondary">{memberName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-cream rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Pilih produk yang boleh disetorkan oleh anggota ini.
              </p>

              {Object.entries(categories).map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-xs font-medium text-text-muted uppercase mb-2">
                    {category === 'MINUMAN' && 'Minuman'}
                    {category === 'SAYURAN' && 'Sayuran'}
                    {category === 'BUAH' && 'Buah'}
                    {category === 'LAINNYA' && 'Lainnya'}
                  </h4>
                  <div className="space-y-2">
                    {items.map((item) => {
                      const assigned = isAssigned(item.id);
                      const isPrimary = pendingPrimary === item.id;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border transition-colors ${
                            assigned
                              ? 'bg-primary/5 border-primary/30'
                              : 'bg-surface border-border hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleProduct(item.id)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  assigned
                                    ? 'bg-primary border-primary'
                                    : 'border-gray-300 hover:border-primary/50'
                                }`}
                              >
                                {assigned && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              <div>
                                <p className="font-medium text-text-primary text-sm">
                                  {item.name}
                                </p>
                                <p className="text-xs text-text-muted">
                                  {item.defaultUnit}
                                </p>
                              </div>
                            </div>

                            {assigned && (
                              <button
                                onClick={() => setPrimary(item.id)}
                                className={`text-xs px-2 py-1 rounded-full transition-colors ${
                                  isPrimary
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-text-muted hover:bg-primary/10'
                                }`}
                              >
                                {isPrimary ? 'Utama' : 'Jadikan Utama'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-border rounded-lg font-medium text-text-secondary hover:bg-cream transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
