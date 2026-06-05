import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, Minus, Plus, Trash2, CreditCard } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StripePaymentForm from '@/components/store/StripePaymentForm';
import BizumWaiting from '@/components/store/BizumWaiting';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTikTokPixel } from '@/hooks/useTikTokPixel';
import { formatPrice } from '@/lib/format';

type Step = 'address' | 'payment' | 'confirm';

interface Address {
  name: string;
  phone: string;
  email: string;
  nif: string;
  postalCode: string;
  provincia: string;
  ciudad: string;
  localidad: string;
  calle: string;
  numero: string;
  piso: string;
}

const ADDRESS_KEY = 'trend_address';
const ORDER_KEY   = 'trend_pending_order';

function loadAddress(): Address | null {
  try {
    const raw = sessionStorage.getItem(ADDRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveAddress(addr: Address) {
  try { sessionStorage.setItem(ADDRESS_KEY, JSON.stringify(addr)); } catch {}
}

function loadPendingOrder(): { orderId: string } | null {
  try {
    const raw = sessionStorage.getItem(ORDER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function savePendingOrder(orderId: string) {
  try { sessionStorage.setItem(ORDER_KEY, JSON.stringify({ orderId })); } catch {}
}

function clearPendingOrder() {
  try { sessionStorage.removeItem(ORDER_KEY); } catch {}
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackEvent } = useTikTokPixel();

  const [step, setStep] = useState<Step>('address');
  const [addressSaved, setAddressSaved] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string>('');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [showWaiting, setShowWaiting] = useState(false);
  const [verifyingReturn, setVerifyingReturn] = useState(false);

  const savedAddr = loadAddress();
  const [address, setAddress] = useState<Address>(savedAddr ?? {
    name: '', phone: '', email: '', nif: '', postalCode: '',
    provincia: '', ciudad: '', localidad: '', calle: '', numero: '', piso: '',
  });

  const intentRef    = useRef(false);
  const preOrderIdRef = useRef<string | null>(null);
  const pendingAddrRef = useRef<Address | null>(null);
  const prevTotalRef  = useRef<number | null>(null);
  // Stable "persons buying" count — doesn't regenerate on each render
  const personsCount = useRef(Math.floor(Math.random() * 8) + 3);

  const shipping = 0;
  const total = subtotal + shipping;
  const stepIndex = step === 'address' ? 1 : step === 'payment' ? 2 : 3;

  // ── Reset PI when cart total changes after pre-creation ───────────────────
  useEffect(() => {
    if (prevTotalRef.current === null) {
      prevTotalRef.current = total;
      return;
    }
    if (prevTotalRef.current === total) return;
    prevTotalRef.current = total;

    if (preOrderIdRef.current) {
      // Mark stale draft order as cancelled
      supabase.from('orders')
        .update({ status: 'cancelled' })
        .eq('id', preOrderIdRef.current)
        .then(() => {});
      preOrderIdRef.current = null;
    }
    pendingAddrRef.current = null;
    setCurrentOrderId(null);
    setClientSecret(null);
    setPublishableKey('');
    clearPendingOrder();
    intentRef.current = false;
  }, [total]);

  // ── Pre-create order + PaymentIntent when address dialog opens ─────────────
  useEffect(() => {
    if (showAddressForm && items.length > 0) {
      preCreatePaymentIntent();
    }
  }, [showAddressForm]);

  const preCreatePaymentIntent = async () => {
    if (intentRef.current || clientSecret) return;
    intentRef.current = true;
    try {
      const { data: order, error } = await supabase.from('orders').insert({
        customer_name: 'Pendiente',
        customer_email: 'pendiente@pago.es',
        customer_phone: '+34 000000000',
        customer_nif: null,
        shipping_address: {} as any,
        items: items.map(i => ({ id: i.productId, name: i.name, price: i.price, quantity: i.quantity, image: i.image, variant: i.variant ?? null })) as any,
        subtotal,
        shipping_cost: shipping,
        total,
        status: 'draft',
        payment_method: 'stripe',
        payment_status: 'pending',
      }).select().single();

      if (error) throw error;
      preOrderIdRef.current = order.id;
      setCurrentOrderId(order.id);
      savePendingOrder(order.id);

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, amount: total }),
      });
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error);
      setClientSecret(result.client_secret);
      setPublishableKey(result.publishable_key);

      // Apply pending address if user already saved it while this was loading
      if (pendingAddrRef.current) {
        const addr = pendingAddrRef.current;
        pendingAddrRef.current = null;
        supabase.from('orders').update({
          customer_name: addr.name,
          customer_email: addr.email,
          customer_phone: addr.phone,
          customer_nif: addr.nif || null,
          shipping_address: addr as any,
          status: 'awaiting_payment',
        }).eq('id', order.id).then(({ error: e }) => {
          if (e) console.error('Failed to update order address:', e);
        });
      }
    } catch {
      intentRef.current = false;
      preOrderIdRef.current = null;
    }
  };

  // ── Handle Stripe redirect return (timeout after 30s) ─────────────────────
  useEffect(() => {
    const piId = searchParams.get('payment_intent');
    const status = searchParams.get('redirect_status');
    if (!piId) return;

    setVerifyingReturn(true);
    const pending = loadPendingOrder();
    const orderId = pending?.orderId ?? null;

    const timer = setTimeout(() => {
      toast({ title: 'Verificación tardando demasiado. Si ya pagaste, contacta soporte.', variant: 'destructive' });
      setVerifyingReturn(false);
      navigate('/carrito', { replace: true });
    }, 30000);

    const verify = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_intent_id: piId, order_id: orderId }),
        });
        const data = await res.json();
        clearTimeout(timer);
        if (data.paid) {
          clearCart();
          clearPendingOrder();
          navigate(`/gracias/${data.order_id || orderId}`, { replace: true });
          return;
        }
      } catch {
        clearTimeout(timer);
        if (status === 'succeeded') {
          clearCart();
          clearPendingOrder();
          navigate(`/gracias/${orderId}`, { replace: true });
          return;
        }
      }
      clearTimeout(timer);
      toast({ title: 'No se pudo confirmar el pago. Inténtalo de nuevo.', variant: 'destructive' });
      setVerifyingReturn(false);
      navigate('/carrito', { replace: true });
    };

    void verify();
    return () => clearTimeout(timer);
  }, []);

  // ── Change address — fully reset PI state ─────────────────────────────────
  const handleChangeAddress = () => {
    if (preOrderIdRef.current) {
      supabase.from('orders')
        .update({ status: 'cancelled' })
        .eq('id', preOrderIdRef.current)
        .then(() => {});
      preOrderIdRef.current = null;
    }
    pendingAddrRef.current = null;
    setAddressSaved(false);
    setShowAddressForm(true);
    setStep('address');
    setClientSecret(null);
    setPublishableKey('');
    setCurrentOrderId(null);
    clearPendingOrder();
    intentRef.current = false;
  };

  const bizumOverlay = showWaiting ? (
    <div className="fixed inset-0 z-[9999] bg-background overflow-y-auto">
      <BizumWaiting
        total={total}
        phone={address.phone.replace(/^\+34\s?/, '')}
        onBack={() => setShowWaiting(false)}
        orderSummary={items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price * i.quantity, image: i.image }))}
        orderId={currentOrderId || undefined}
        paymentIntentId={paymentIntentId || undefined}
        onPaymentSuccess={() => {
          clearCart();
          clearPendingOrder();
          navigate(`/gracias/${currentOrderId}`);
        }}
      />
    </div>
  ) : null;

  if (verifyingReturn) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-muted-foreground">Verificando pago...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-lg font-semibold">Tu carrito está vacío</p>
        <Button onClick={() => navigate('/')}>Seguir comprando</Button>
      </div>
    );
  }

  // ── Validations ───────────────────────────────────────────────────────────
  const handleSaveAddress = () => {
    const phoneDigits = address.phone.replace(/\D/g, '');
    if (!address.name.trim()) {
      toast({ title: 'Introduce tu nombre completo', variant: 'destructive' }); return;
    }
    if (phoneDigits.length < 9) {
      toast({ title: 'El teléfono debe tener 9 dígitos', variant: 'destructive' }); return;
    }
    if (!EMAIL_RE.test(address.email)) {
      toast({ title: 'El correo electrónico no es válido', variant: 'destructive' }); return;
    }
    if (address.postalCode.length !== 5) {
      toast({ title: 'El código postal debe tener 5 dígitos', variant: 'destructive' }); return;
    }
    if (!address.calle.trim()) {
      toast({ title: 'Introduce la calle o avenida', variant: 'destructive' }); return;
    }

    saveAddress(address);
    setAddressSaved(true);
    setShowAddressForm(false);
    setStep('payment');

    trackEvent('InitiateCheckout', {
      contents: items.map(i => ({ content_type: 'product', content_id: i.id, quantity: i.quantity, price: i.price })),
      value: total,
      currency: 'EUR',
    });

    if (preOrderIdRef.current) {
      supabase.from('orders').update({
        customer_name: address.name,
        customer_email: address.email,
        customer_phone: address.phone,
        customer_nif: address.nif || null,
        shipping_address: address as any,
        status: 'awaiting_payment',
      }).eq('id', preOrderIdRef.current).then(({ error: e }) => {
        if (e) console.error('Order address update failed:', e);
      });
    } else {
      pendingAddrRef.current = address;
      if (!intentRef.current) setTimeout(() => { handleStartPayment(); }, 0);
    }
  };

  const handleStartPayment = async () => {
    if (intentRef.current || creatingIntent || clientSecret) return;
    intentRef.current = true;
    setCreatingIntent(true);
    try {
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        customer_name: address.name,
        customer_email: address.email,
        customer_phone: address.phone,
        customer_nif: address.nif || null,
        shipping_address: address as any,
        items: items.map(i => ({ id: i.productId, name: i.name, price: i.price, quantity: i.quantity, image: i.image, variant: i.variant ?? null })) as any,
        subtotal,
        shipping_cost: shipping,
        total,
        status: 'awaiting_payment',
        payment_method: 'stripe',
        payment_status: 'pending',
      }).select().single();

      if (orderError) throw orderError;
      preOrderIdRef.current = order.id;
      setCurrentOrderId(order.id);
      savePendingOrder(order.id);

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, amount: total, email: address.email, name: address.name, phone: address.phone }),
      });

      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || 'Error al iniciar el pago');

      setClientSecret(result.client_secret);
      setPublishableKey(result.publishable_key);
    } catch (err: any) {
      toast({ title: err.message || 'Error al crear el pedido', variant: 'destructive' });
      setCurrentOrderId(null);
      preOrderIdRef.current = null;
      clearPendingOrder();
      intentRef.current = false;
    }
    setCreatingIntent(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground text-center text-sm py-2 font-medium">
        ● Últimas unidades · Stock limitado
      </div>

      <header className="flex items-center gap-3 p-4 border-b">
        <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
        <Lock className="h-4 w-4 text-muted-foreground" />
        <h1 className="font-semibold">Compra Segura</h1>
      </header>

      <div className="flex items-center justify-center gap-2 py-3 text-sm">
        <span className={`flex items-center gap-1 ${stepIndex >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${stepIndex >= 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
            {stepIndex > 1 ? '✓' : '1'}
          </span>
          Dirección
        </span>
        <span className="text-border">—</span>
        <span className={`flex items-center gap-1 ${stepIndex >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${stepIndex >= 2 ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
            {stepIndex > 2 ? '✓' : '2'}
          </span>
          Pago
        </span>
        <span className="text-border">—</span>
        <span className={`flex items-center gap-1 ${stepIndex >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${stepIndex >= 3 ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>3</span>
          Confirmar
        </span>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6 pb-40">
        {!addressSaved ? (
          <button
            onClick={() => setShowAddressForm(true)}
            className="w-full border-2 border-dashed rounded-xl p-4 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            + Añadir dirección de envío
          </button>
        ) : (
          <div className="border rounded-xl p-4 flex items-start justify-between">
            <div>
              <p className="font-semibold">{address.name}</p>
              <p className="text-sm text-muted-foreground">{address.calle}, {address.numero}</p>
              <p className="text-sm text-muted-foreground">{address.localidad}</p>
              <p className="text-sm text-muted-foreground">CP: {address.postalCode}</p>
            </div>
            <button onClick={handleChangeAddress} className="text-primary text-sm font-medium">
              Cambiar
            </button>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-3">Artículos</h3>
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 mb-3 border rounded-xl p-3">
              {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                {item.variant && (
                  <p className="text-xs text-muted-foreground mt-0.5">Variante: {item.variant.name}</p>
                )}
                <p className="text-price font-bold text-sm">{formatPrice(item.price)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 border rounded flex items-center justify-center"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 border rounded flex items-center justify-center"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="border rounded-xl p-4">
          <h3 className="font-semibold mb-2">Envío</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <div>
                <p className="text-sm font-medium">Envío Estándar</p>
                <p className="text-xs text-muted-foreground">3 a 5 días laborables</p>
              </div>
            </div>
            <span className="font-bold text-sm">GRATIS</span>
          </div>
        </div>

        <div className="border rounded-xl p-4 space-y-2">
          <h3 className="font-semibold">Resumen del pedido</h3>
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span>Envío</span><span>Gratis</span></div>
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Total</span><span className="text-price">{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>IVA incluido</span><span>Garantía de 2 años</span>
          </div>
        </div>

        {addressSaved && (
          <div className="space-y-3">
            <h3 className="font-semibold">Método de pago</h3>
            {!clientSecret ? (
              <div className="border-2 border-primary rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Tarjeta · Bizum · Apple Pay · Google Pay · Link</p>
                    <p className="text-xs text-muted-foreground">Elige tu método preferido en el siguiente paso</p>
                  </div>
                </div>
                <Button onClick={handleStartPayment} disabled={creatingIntent} className="w-full h-11">
                  {creatingIntent ? 'Cargando...' : 'Continuar al pago'}
                </Button>
              </div>
            ) : (
              <div className="border-2 border-primary rounded-xl p-4">
                <StripePaymentForm
                  clientSecret={clientSecret}
                  publishableKey={publishableKey}
                  total={total}
                  customerEmail={address.email}
                  onProcessing={(piId) => { setPaymentIntentId(piId); setShowWaiting(true); }}
                  onBizumSubmitting={() => setShowWaiting(true)}
                  onSucceeded={async (piId) => {
                    try {
                      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
                      await fetch(`https://${projectId}.supabase.co/functions/v1/verify-payment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ payment_intent_id: piId, order_id: currentOrderId }),
                      });
                    } catch {}
                    clearCart();
                    clearPendingOrder();
                    navigate(`/gracias/${currentOrderId}`);
                  }}
                  onError={(msg) => { setShowWaiting(false); toast({ title: msg, variant: 'destructive' }); }}
                />
              </div>
            )}
          </div>
        )}

        <div className="bg-secondary rounded-full py-2 text-center text-sm text-muted-foreground">
          ● {personsCount.current} personas comprando ahora
        </div>
      </div>

      {!clientSecret && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm">Total ({items.length} artículo{items.length !== 1 ? 's' : ''})</span>
            <span className="text-lg font-bold text-price">{formatPrice(total)}</span>
          </div>
          <div className="px-4 pb-4">
            <Button
              className="w-full h-12 text-base font-semibold"
              disabled={creatingIntent}
              onClick={() => {
                if (!addressSaved) { setShowAddressForm(true); return; }
                handleStartPayment();
              }}
            >
              {creatingIntent ? 'Cargando...' : addressSaved ? `Pagar ${formatPrice(total)}` : 'Añade la dirección para continuar'}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-2">Compra 100% segura y protegida</p>
          </div>
        </div>
      )}

      <Dialog open={showAddressForm} onOpenChange={(open) => { if (!open) setShowAddressForm(false); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Añadir dirección de envío</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs text-muted-foreground">Datos de contacto</Label></div>
            <Input placeholder="Nombre completo *" value={address.name} onChange={e => setAddress({...address, name: e.target.value})} />
            <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background overflow-hidden">
              <span className="px-3 h-10 flex items-center bg-secondary text-sm font-medium border-r shrink-0">+34</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="6XX XXX XXX *"
                value={address.phone.replace(/^\+34\s*/, '')}
                onChange={e => {
                  const digits = e.target.value.replace(/[^\d\s]/g, '');
                  setAddress({ ...address, phone: `+34 ${digits}`.trim() });
                }}
                className="flex-1 h-10 px-3 bg-background text-base md:text-sm placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <Input placeholder="Correo electrónico *" type="email" value={address.email} onChange={e => setAddress({...address, email: e.target.value})} />
            <Input placeholder="DNI / NIE (opcional)" value={address.nif} onChange={e => setAddress({...address, nif: e.target.value})} />
            <div><Label className="text-xs text-muted-foreground mt-2">Dirección de envío</Label></div>
            <Input
              placeholder="Código Postal (5 dígitos) *"
              maxLength={5}
              value={address.postalCode}
              onChange={e => setAddress({...address, postalCode: e.target.value.replace(/\D/g, '')})}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Provincia" value={address.provincia} onChange={e => setAddress({...address, provincia: e.target.value})} />
              <Input placeholder="Ciudad" value={address.ciudad} onChange={e => setAddress({...address, ciudad: e.target.value})} />
            </div>
            <Input placeholder="Localidad / Municipio" value={address.localidad} onChange={e => setAddress({...address, localidad: e.target.value})} />
            <Input placeholder="Calle / Avenida *" value={address.calle} onChange={e => setAddress({...address, calle: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Número" value={address.numero} onChange={e => setAddress({...address, numero: e.target.value})} />
              <Input placeholder="Piso / Puerta (opcional)" value={address.piso} onChange={e => setAddress({...address, piso: e.target.value})} />
            </div>
            <Button onClick={handleSaveAddress} className="w-full h-12">Guardar dirección</Button>
          </div>
        </DialogContent>
      </Dialog>

      {bizumOverlay}
    </div>
  );
}
