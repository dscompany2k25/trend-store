import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Package, Truck, MapPin, Copy, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/format';

export default function ThankYouPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    const load = async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
      setOrder(data);
      setLoading(false);
    };
    load();
  }, [orderId]);

  const copyTracking = () => {
    if (order?.tracking_code) {
      navigator.clipboard.writeText(order.tracking_code);
      toast({ title: '¡Código copiado!' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-lg font-semibold">Pedido no encontrado</p>
        <Button onClick={() => navigate('/')}>Volver a la tienda</Button>
      </div>
    );
  }

  const addr = order.shipping_address as any;
  const items = (order.items || []) as any[];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary h-1 w-full" />

      <header className="flex items-center gap-3 p-4 border-b">
        <button onClick={() => navigate('/')}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="font-semibold">Confirmación del Pedido</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6 pb-10">
        <div className="text-center space-y-3 py-6">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">¡Gracias por tu compra!</h2>
          <p className="text-muted-foreground">Tu pago se ha confirmado correctamente.</p>
        </div>

        <div className="bg-secondary rounded-xl p-4 text-center space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Número de pedido</p>
          <p className="text-lg font-bold font-mono">{order.order_number || order.id.slice(0, 8)}</p>
        </div>

        {order.tracking_code && (
          <div className="border-2 border-primary rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <p className="font-semibold">Código de Seguimiento</p>
            </div>
            <div className="flex items-center justify-between bg-accent rounded-lg p-3">
              <span className="font-mono font-bold text-lg tracking-wider">{order.tracking_code}</span>
              <button onClick={copyTracking} className="text-primary hover:text-primary/80 transition-colors">
                <Copy className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Guarda este código para hacer seguimiento de tu pedido.</p>
          </div>
        )}

        <div className="border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" /> Artículos ({items.length})
          </h3>
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              {item.image && <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                <p className="text-xs text-muted-foreground">Cant.: {item.quantity}</p>
              </div>
              <span className="text-sm font-bold text-price">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="border rounded-xl p-4 space-y-2">
          <h3 className="font-semibold">Resumen</h3>
          <div className="flex justify-between text-sm">
            <span>Subtotal</span><span>{formatPrice(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Envío</span><span>{Number(order.shipping_cost) === 0 ? 'Gratis' : formatPrice(Number(order.shipping_cost))}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Total</span><span className="text-price">{formatPrice(Number(order.total))}</span>
          </div>
        </div>

        {addr && (
          <div className="border rounded-xl p-4 space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Dirección de Envío
            </h3>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p className="font-medium text-foreground">{order.customer_name}</p>
              <p>{addr.calle}{addr.numero ? `, ${addr.numero}` : ''}{addr.piso ? ` - ${addr.piso}` : ''}</p>
              {addr.localidad && <p>{addr.localidad}</p>}
              <p>{addr.postalCode}{addr.ciudad ? ` · ${addr.ciudad}` : ''}{addr.provincia ? ` · ${addr.provincia}` : ''}</p>
              <p>📞 {order.customer_phone}</p>
              <p>✉️ {order.customer_email}</p>
            </div>
          </div>
        )}

        <div className="border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Entrega estimada</p>
            <p className="text-sm text-muted-foreground">3 a 5 días laborables</p>
          </div>
        </div>

        <Button onClick={() => navigate('/')} className="w-full h-12 text-base font-semibold">
          Seguir comprando
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          🔒 Pago procesado de forma segura
        </p>
      </div>
    </div>
  );
}
