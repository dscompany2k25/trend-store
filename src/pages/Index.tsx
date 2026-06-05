import { useState } from 'react';
import Header from '@/components/store/Header';
import BottomNav from '@/components/store/BottomNav';
import StoreProfile from '@/components/store/StoreProfile';
import PromoBanners from '@/components/store/PromoBanners';
import StoreTabs from '@/components/store/StoreTabs';
import ProductCard from '@/components/store/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';

export default function Index() {
  const { data: products, isLoading } = useProducts();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  const filtered = products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const featured = filtered?.slice(0, 3);
  const recommended = filtered?.slice(3);

  return (
    <div className="min-h-screen bg-background pb-16">
      <Header onSearch={setSearch} />
      <StoreProfile />
      <PromoBanners />
      <StoreTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ) : filtered?.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No se ha encontrado ningún producto.</p>
            <p className="text-sm text-muted-foreground mt-1">Añade productos en el panel de administración.</p>
          </div>
        ) : (
          <>
            {featured && featured.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-sm">Productos destacados</h2>
                  <button className="text-xs text-primary font-medium">Ver todos &gt;</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {featured.map((product, i) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      rank={1}
                      showBestSeller={i === 1}
                    />
                  ))}
                </div>
              </section>
            )}

            {recommended && recommended.length > 0 && (
              <section className="mt-6">
                <h2 className="font-bold text-sm mb-3">Recomendado para ti</h2>
                <div className="grid grid-cols-2 gap-4">
                  {recommended.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {filtered && filtered.length <= 3 && filtered.length > 0 && !recommended?.length && (
              <section className="mt-6">
                <h2 className="font-bold text-sm mb-3">Recomendado para ti</h2>
                <div className="grid grid-cols-2 gap-4">
                  {filtered.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
