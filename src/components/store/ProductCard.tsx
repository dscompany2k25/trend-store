import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import type { Product } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/format';

function discountPercent(price: number, compareAt: number) {
  return Math.round(((compareAt - price) / compareAt) * 100);
}

function getSoldCount(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return 985 + Math.abs(hash % 10000);
}

interface ProductCardProps {
  product: Product;
  rank?: number;
  showBestSeller?: boolean;
}

export default function ProductCard({ product, rank, showBestSeller }: ProductCardProps) {
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const image = product.images?.[0];
  const soldCount = getSoldCount(product.id);

  return (
    <Link to={`/producto/${product.id}`} className="group block">
      <div className="relative aspect-square bg-secondary rounded-xl overflow-hidden mb-2">
        {image ? (
          <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Sin imagen</div>
        )}
        
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 flex-wrap z-10">
          {rank && (
            <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1 py-0.5 rounded whitespace-nowrap">
              TOP {rank}
            </span>
          )}
          {hasDiscount && (
            <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1 py-0.5 rounded whitespace-nowrap">
              {discountPercent(product.price, product.compare_at_price!)}% OFF
            </span>
          )}
        </div>
        {showBestSeller && (
          <span className="absolute bottom-1.5 left-1.5 bg-warning text-warning-foreground text-[8px] font-bold px-1.5 py-0.5 rounded z-10">
            Más Vendido
          </span>
        )}
      </div>
      
      <h3 className="text-xs font-medium leading-tight line-clamp-2 mb-1.5 min-h-[2rem] px-0.5">{product.name}</h3>
      
      <div className="space-y-0.5 px-0.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-price font-bold text-sm">{formatPrice(product.price)}</span>
        </div>
        {hasDiscount && (
          <span className="text-price-compare text-[11px] line-through">{formatPrice(product.compare_at_price!)}</span>
        )}
      </div>

      <div className="flex items-center gap-1 mt-1.5 text-[9px] text-muted-foreground px-0.5 whitespace-nowrap overflow-hidden">
        <span className="flex items-center gap-0.5 text-primary shrink-0">
          <Truck className="h-2.5 w-2.5" />
          Envío gratis
        </span>
        <span className="shrink-0">{soldCount.toLocaleString('es-ES')} vendidos</span>
      </div>
    </Link>
  );
}
