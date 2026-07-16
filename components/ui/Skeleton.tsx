export function SkeletonText({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-border rounded ${className}`} />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-surface rounded-2xl border border-border p-6 animate-pulse ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-border rounded-xl" />
      </div>
      <SkeletonText className="h-8 w-20 mb-2" />
      <SkeletonText className="h-4 w-24" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-cream/50">
        <SkeletonText className="h-4 w-20" />
        <SkeletonText className="h-4 flex-1" />
        <SkeletonText className="h-4 w-24" />
        <SkeletonText className="h-4 w-32" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-border/50 last:border-0">
          <SkeletonText className="h-4 w-20" />
          <div className="flex-1 space-y-2">
            <SkeletonText className="h-4 w-3/4" />
            <SkeletonText className="h-3 w-1/2" />
          </div>
          <SkeletonText className="h-4 w-24" />
          <div className="flex gap-2">
            <SkeletonText className="h-8 w-8 rounded-lg" />
            <SkeletonText className="h-8 w-8 rounded-lg" />
            <SkeletonText className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-surface rounded-xl border border-border p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <SkeletonText className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <SkeletonText className="h-4 w-1/3" />
              <SkeletonText className="h-3 w-1/2" />
            </div>
            <SkeletonText className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
