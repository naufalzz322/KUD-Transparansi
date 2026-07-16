'use client';

interface ProductStats {
  id: string;
  name: string;
  unit: string;
  totalQty: number;
  gradeA: number;
  gradeB: number;
  daysCount: number;
}

interface ProductBreakdownProps {
  products: ProductStats[];
}

export function ProductBreakdown({ products }: ProductBreakdownProps) {
  if (products.length === 0) {
    return null;
  }

  const maxQty = Math.max(...products.map(p => p.totalQty));

  // Color palette for products
  const colors = [
    { bg: 'bg-primary/10', bar: 'bg-primary', text: 'text-primary' },
    { bg: 'bg-accent/10', bar: 'bg-accent', text: 'text-accent-700' },
    { bg: 'bg-status-deposited/10', bar: 'bg-status-deposited', text: 'text-green-700' },
    { bg: 'bg-amber-500/10', bar: 'bg-amber-500', text: 'text-amber-700' },
  ];

  return (
    <div className="bg-surface rounded-2xl shadow-warm border border-border p-5">
      <h3 className="font-display text-base font-medium text-text-primary mb-4">
        Ringkasan per Produk
      </h3>

      <div className="space-y-3">
        {products.map((product, index) => {
          const color = colors[index % colors.length];
          const barWidth = maxQty > 0 ? (product.totalQty / maxQty) * 100 : 0;

          return (
            <div key={product.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${color.bar}`} />
                  <span className="text-sm font-medium text-text-primary">
                    {product.name}
                  </span>
                </div>
                <span className="font-mono text-sm font-semibold text-text-primary">
                  {product.totalQty.toFixed(1)} {product.unit}
                </span>
              </div>

              {/* Progress bar */}
              <div className={`h-2 ${color.bg} rounded-full overflow-hidden`}>
                <div
                  className={`h-full ${color.bar} rounded-full transition-all duration-500`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {/* Grade breakdown */}
              <div className="flex items-center gap-4 mt-1.5 pl-4">
                {product.gradeA > 0 && (
                  <span className="text-xs text-text-muted">
                    A: <span className="font-mono text-text-secondary">{product.gradeA.toFixed(1)}</span>
                  </span>
                )}
                {product.gradeB > 0 && (
                  <span className="text-xs text-text-muted">
                    B: <span className="font-mono text-text-secondary">{product.gradeB.toFixed(1)}</span>
                  </span>
                )}
                <span className="text-xs text-text-muted">
                  {product.daysCount}x setoran
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
