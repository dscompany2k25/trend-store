import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Lock, ShieldCheck, Clock, Package, Truck, Smartphone, Info, Check, BadgeCheck } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import bizumLogo from '@/assets/bizum-logo.png';

interface BizumWaitingProps {
  total: number;
  phone: string;
  onBack: () => void;
  orderSummary: { name: string; quantity: number; price: number; image?: string }[];
  orderId?: string;
  paymentIntentId?: string;
  onPaymentSuccess?: () => void;
}

export default function BizumWaiting({ total, phone, onBack, orderSummary, orderId, paymentIntentId, onPaymentSuccess }: BizumWaitingProps) {
  const [timeLeft, setTimeLeft] = useState(300);
  const expiredRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          expiredRef.current = true;
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.body.classList.add('bizum-hide-stripe');
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.classList.remove('bizum-hide-stripe');
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let retries = 0;
    const MAX_RETRIES = 100; // ~5 min at 3s intervals

    const poll = setInterval(async () => {
      if (cancelled || expiredRef.current) {
        clearInterval(poll);
        return;
      }
      retries++;
      if (retries > MAX_RETRIES) {
        clearInterval(poll);
        return;
      }
      try {
        if (paymentIntentId) {
          const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
          await fetch(`https://${projectId}.supabase.co/functions/v1/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_intent_id: paymentIntentId, order_id: orderId }),
          }).catch(() => {});
        }
        const { data } = await (await import('@/integrations/supabase/client')).supabase
          .from('orders').select('payment_status, status').eq('id', orderId).single();
        if (data?.payment_status === 'completed' || data?.payment_status === 'paid' || data?.status === 'paid') {
          clearInterval(poll);
          onPaymentSuccess?.();
        }
      } catch (e) {
        console.error('BizumWaiting poll error:', e);
      }
    }, 3000);

    return () => { cancelled = true; clearInterval(poll); };
  }, [orderId, paymentIntentId, onPaymentSuccess]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const cleanPhone = phone.replace(/\D/g, '');
  const expired = timeLeft === 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary h-1 w-full" />
      <header className="flex items-center gap-3 p-4 border-b">
        <button onClick={onBack} aria-label="Volver"><ArrowLeft className="h-5 w-5" /></button>
        <Lock className="h-4 w-4 text-muted-foreground" />
        <h1 className="font-semibold">Pago Seguro</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between bg-secondary rounded-xl p-3">
          <span className="text-sm text-muted-foreground">● {expired ? 'Tiempo expirado' : 'Esperando confirmación'}</span>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="h-3 w-3" /> Cifrado
          </div>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">TOTAL A PAGAR</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-3xl font-bold">{formatPrice(total)}</p>
            <div className="text-right">
              <span className="bg-accent text-accent-foreground text-[10px] font-medium px-2 py-1 rounded">
                {expired ? 'EXPIRADO' : 'EXPIRA EN'}
              </span>
              <div className={`flex items-center justify-end gap-1 font-bold mt-1 ${expired ? 'text-destructive' : 'text-primary'}`}>
                <Clock className="h-4 w-4" />
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        {expired ? (
          <div className="border rounded-xl p-6 text-center space-y-3">
            <p className="font-semibold text-destructive">El tiempo de pago ha expirado</p>
            <p className="text-sm text-muted-foreground">Vuelve al carrito e inicia el proceso de pago de nuevo.</p>
            <button onClick={onBack} className="text-primary text-sm font-medium underline">Volver al carrito</button>
          </div>
        ) : (
          <>
            <div className="border rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-3">
                <img src={bizumLogo} alt="Bizum" className="w-10 h-10 rounded-lg object-contain" />
                <div className="flex-1">
                  <p className="font-semibold">Bizum</p>
                  <p className="text-sm text-muted-foreground">Confirma en tu móvil</p>
                </div>
                <span className="text-success text-sm">● Activo</span>
              </div>

              <div className="text-center space-y-3 py-2">
                <div className="w-16 h-16 mx-auto bg-accent rounded-2xl flex items-center justify-center relative">
                  <div className="w-8 h-12 border-2 border-primary rounded-lg" />
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">1</div>
                </div>
                <p className="font-semibold">Abre tu app del banco con Bizum</p>
                <p className="text-sm text-muted-foreground">Número asociado: +34 {cleanPhone}</p>
              </div>

              <div className="bg-accent/50 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Esperando confirmación...</p>
                  <p className="text-sm text-muted-foreground">Confirma la notificación en tu móvil</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Aprobación instantánea</span>
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> 100% seguro</span>
              </div>
            </div>

            <div className="border rounded-xl p-4">
              <p className="font-semibold text-sm mb-3 text-center">Cómo pagar</p>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-primary mb-1"><Smartphone className="h-4 w-4" /></div>
                  <span className="text-xs text-primary font-medium">Abre Bizum</span>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto bg-secondary rounded-full flex items-center justify-center mb-1"><ShieldCheck className="h-4 w-4 text-muted-foreground" /></div>
                  <span className="text-xs text-muted-foreground">Verifica</span>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto bg-secondary rounded-full flex items-center justify-center mb-1"><BadgeCheck className="h-4 w-4 text-muted-foreground" /></div>
                  <span className="text-xs text-muted-foreground">Confirma</span>
                </div>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
              <p className="font-semibold text-sm flex items-center gap-2"><Info className="h-4 w-4 text-warning" /> ¿No recibes la notificación?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Comprueba que tienes Bizum activado en tu banco y que el número +34 {cleanPhone} es el asociado a tu cuenta.
              </p>
            </div>
          </>
        )}

        <div className="border rounded-xl p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-3"><Package className="h-4 w-4 text-primary" /> Resumen del pedido</h3>
          {orderSummary.map((item, i) => (
            <div key={i} className="flex items-center gap-3 mb-2">
              {item.image && <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />}
              <div className="flex-1">
                <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                <p className="text-sm text-price">Cant.: {item.quantity} · {formatPrice(item.price)}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm border-t pt-3 mt-3 gap-3">
            <span className="flex items-start gap-2"><Truck className="h-4 w-4 text-primary mt-0.5 shrink-0" /><span>Entrega estimada<br/><strong>3 a 5 días laborables</strong></span></span>
            <span className="font-bold shrink-0">GRATIS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
