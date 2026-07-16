'use client';

interface Product {
  id: string;
  name: string;
  category: string;
  defaultUnit: string;
  priceGradeA: number | null;
  priceGradeB: number | null;
}

interface ProductCatalogProps {
  products: Product[];
  title?: string;
}

const categoryLabels: Record<string, string> = {
  MINUMAN: 'Minuman',
  SAYURAN: 'Sayuran',
  BUAH: 'Buah',
  LAINNYA: 'Lainnya',
};

const categoryIcons: Record<string, React.ReactNode> = {
  MINUMAN: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  SAYURAN: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  BUAH: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  LAINNYA: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
};

function formatPrice(price: number | null): string {
  if (price === null) return '-';
  return `Rp ${price.toLocaleString('id-ID')}`;
}

export function ProductCatalog({ products, title = 'Produk Diterima KUD' }: ProductCatalogProps) {
  if (products.length === 0) {
    return null;
  }

  // Group by category
  const byCategory = products.reduce((acc, product) => {
    const cat = product.category || 'LAINNYA';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Sort categories
  const categoryOrder = ['MINUMAN', 'SAYURAN', 'BUAH', 'LAINNYA'];
  const sortedCategories = Object.keys(byCategory).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  return (
    <div className="bg-surface rounded-2xl shadow-warm border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 className="font-display text-base font-medium text-text-primary">
          {title}
        </h3>
      </div>

      <div className="space-y-4">
        {sortedCategories.map((category) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-primary">
                {categoryIcons[category]}
              </span>
              <span className="text-sm font-medium text-text-secondary">
                {categoryLabels[category] || category}
              </span>
            </div>

            <div className="bg-cream rounded-xl p-3 space-y-2">
              {byCategory[category].map((product) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-primary font-medium">
                    {product.name}
                  </span>
                  <div className="flex items-center gap-4 font-mono text-xs">
                    {product.priceGradeA && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-deposited" />
                        <span className="text-text-secondary">
                          {formatPrice(product.priceGradeA)}
                        </span>
                      </span>
                    )}
                    {product.priceGradeB && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span className="text-text-secondary">
                          {formatPrice(product.priceGradeB)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-center gap-6">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-status-deposited" />
          <span className="text-xs text-text-muted">Grade A</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-xs text-text-muted">Grade B</span>
        </div>
      </div>
    </div>
  );
}
