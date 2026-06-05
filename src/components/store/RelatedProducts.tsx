import { Link } from 'react-router-dom';
import { useRelatedProducts } from '@/hooks/useRelatedProducts';
import { formatPrice } from '@/lib/format';

function discountPercent(price: number, compareAt: number) {
  return Math.round(((compareAt - price) / compareAt) * 100);
}

interface RelatedProductsProps {
  productId: string;
}

export default function RelatedProducts({ productId }: RelatedProductsProps) {
  const { data: products, isLoading } = useRelatedProducts(productId);

  if (isLoading || !products || products.length === 0) return null;

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Productos Relacionados</h2>
        <Link to="/" className="text-xs text-primary font-medium">Ver todos &gt;</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {products.map(product => {
          const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
          const image = product.images?.[0];
          return (
            <Link key={product.id} to={`/producto/${product.id}`} className="shrink-0 w-32">
              <div className="relative aspect-square bg-secondary rounded-xl overflow-hidden mb-1.5">
                {image ? (
                  <img src={image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Sin imagen</div>
                )}
                {hasDiscount && (
                  <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {discountPercent(product.price, product.compare_at_price!)}% OFF
                  </span>
                )}
              </div>
              <h3 className="text-xs font-medium leading-tight line-clamp-2 mb-1">{product.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-price font-bold text-xs">{formatPrice(product.price)}</span>
              </div>
              {hasDiscount && (
                <span className="text-price-compare text-[10px] line-through">{formatPrice(product.compare_at_price!)}</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
