import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useTikTokPixel } from '@/hooks/useTikTokPixel';
import { ArrowLeft, ShoppingCart, Truck, Shield, Star, Clock, CheckCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo, useRef } from 'react';
import ProductReviews, { getReviewStats } from '@/components/store/ProductReviews';
import RelatedProducts from '@/components/store/RelatedProducts';
import { toast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/format';

function OfferCountdown() {
  const [timeLeft, setTimeLeft] = useState(() => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return Math.floor((end.getTime() - now.getTime()) / 1000);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const h = String(Math.floor(timeLeft / 3600)).padStart(2, '0');
  const m = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0');
  const s = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
      <p className="text-sm font-medium text-destructive flex items-center gap-2">
        <Clock className="h-4 w-4" />
        La oferta termina en
      </p>
      <p className="text-2xl font-bold text-destructive mt-1 ml-6">{h}:{m}:{s}</p>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id!);
  const { addItem } = useCart();
  const { trackEvent } = useTikTokPixel();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const viewTracked = useRef(false);

  const variants = useMemo(
    () => (Array.isArray(product?.variants) ? product!.variants! : []),
    [product]
  );
  const hasVariants = variants.length > 0;
  const selectedVariant = useMemo(
    () => variants.find(v => v.id === selectedVariantId) || (hasVariants ? variants[0] : null),
    [variants, selectedVariantId, hasVariants]
  );

  useEffect(() => {
    if (hasVariants && !selectedVariantId) {
      setSelectedVariantId(variants[0].id);
    }
  }, [hasVariants, selectedVariantId, variants]);

  useEffect(() => {
    if (selectedVariant?.image && product?.images) {
      const idx = product.images.indexOf(selectedVariant.image);
      if (idx >= 0) setSelectedImage(idx);
    }
  }, [selectedVariant, product]);

  useEffect(() => {
    if (product && !viewTracked.current) {
      viewTracked.current = true;
      trackEvent('ViewContent', {
        contents: [{ content_type: 'product', content_id: product.id, content_name: product.name, price: product.price }],
        value: product.price,
        currency: 'EUR',
      });
    }
  }, [product]);
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Producto no encontrado</div>;

  const effectivePrice = selectedVariant?.price ?? product.price;
  const hasDiscount = product.compare_at_price && product.compare_at_price > effectivePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - effectivePrice) / product.compare_at_price!) * 100)
    : 0;

  const galleryImages = (() => {
    const base = product.images || [];
    if (selectedVariant?.image && !base.includes(selectedVariant.image)) {
      return [selectedVariant.image, ...base];
    }
    return base;
  })();

  const handleAddToCart = () => {
    if (hasVariants && selectedVariant && (selectedVariant.stock ?? 1) <= 0) {
      toast({ title: 'Variante agotada', variant: 'destructive' });
      return;
    }

    const variantImage = selectedVariant?.image || product.images?.[0] || '';

    addItem({
      productId: product.id,
      name: product.name,
      price: effectivePrice,
      compare_at_price: product.compare_at_price,
      image: variantImage,
      variant: selectedVariant
        ? { id: selectedVariant.id, name: selectedVariant.name, image: selectedVariant.image ?? null }
        : null,
    });
    trackEvent('AddToCart', {
      contents: [{ content_type: 'product', content_id: product.id, content_name: product.name, price: effectivePrice }],
      value: effectivePrice,
      currency: 'EUR',
    });
    navigate('/carrito');
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-50 bg-background border-b flex items-center h-14 px-4 gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
        <span className="text-sm text-muted-foreground flex-1 truncate">Detalles del producto</span>
        <button onClick={() => navigate('/carrito')} className="relative">
          <ShoppingCart className="h-5 w-5" />
        </button>
      </header>

      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {hasDiscount && (
            <span className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded">
              -{discountPercent}%
            </span>
          )}
          <div className="aspect-square bg-secondary">
            {galleryImages[selectedImage] ? (
              <img src={galleryImages[selectedImage]} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sin imagen</div>
            )}
          </div>
          {galleryImages.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 ${i === selectedImage ? 'border-primary' : 'border-transparent'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <h1 className="text-base font-semibold leading-tight">{product.name}</h1>

          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => <Star key={s} className="h-3.5 w-3.5 fill-warning text-warning" />)}
            <span className="text-xs text-muted-foreground ml-1">4,8 ({getReviewStats(product.id).total.toLocaleString('es-ES')} valoraciones)</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-price">{formatPrice(effectivePrice)}</span>
            {hasDiscount && (
              <span className="text-price-compare line-through text-sm">{formatPrice(product.compare_at_price!)}</span>
            )}
          </div>

          {hasVariants && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Variante: <span className="text-muted-foreground font-normal">{selectedVariant?.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map(v => {
                  const isSelected = v.id === selectedVariant?.id;
                  const isOutOfStock = (v.stock ?? null) !== null && v.stock! <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      disabled={isOutOfStock}
                      className={`flex items-center gap-2 border-2 rounded-xl p-1.5 pr-3 transition-colors ${
                        isSelected ? 'border-primary' : 'border-border hover:border-muted-foreground/40'
                      } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={v.name}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary shrink-0">
                        {v.image ? (
                          <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">—</div>
                        )}
                      </div>
                      <span className="text-xs font-medium">{v.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-secondary/50 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Envío gratis a toda España</span>
            </div>
            <p className="text-xs text-muted-foreground ml-6">Entrega en 5-10 días laborables</p>
          </div>

          {hasDiscount && <OfferCountdown />}

          <div className="flex items-center justify-between py-4 border-t border-b">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium text-center">Envío Gratis</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium text-center">Pago Seguro</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium text-center">Garantía 2 años</span>
            </div>
          </div>

          {product.description && (
            <div className="border-t pt-4 mt-4">
              <h2 className="font-semibold mb-2">Descripción del Producto</h2>
              <div className="text-sm text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          )}

          <ProductReviews productId={product.id} />
          <RelatedProducts productId={product.id} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 z-50">
        <div className="max-w-4xl mx-auto">
          <Button onClick={handleAddToCart} className="w-full h-12 text-base font-semibold">
            Añadir al Carrito
          </Button>
        </div>
      </div>
    </div>
  );
}
