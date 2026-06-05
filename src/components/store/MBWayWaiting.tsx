import { useEffect, useState } from 'react';
import { ArrowLeft, Lock, Shield, Clock } from 'lucide-react';
import mbwayIcon from '@/assets/mbway-icon.png';

interface MBWayWaitingProps {
  total: number;
  phone: string;
  onBack: () => void;
  orderSummary: { name: string; quantity: number; price: number; image?: string }[];
  orderId?: string;
  onPaymentSuccess?: () => void;
}

export default function MBWayWaiting({ total, phone, onBack, orderSummary, orderId, onPaymentSuccess }: MBWayWaitingProps) {
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll for payment status
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    const poll = setInterval(async () => {
      if (cancelled) return;
      try {
        const { data } = await (await import('@/integrations/supabase/client')).supabase
          .from('orders').select('payment_status, status').eq('id', orderId).single();
        console.log('Polling order status:', data?.payment_status, data?.status);
        if (data?.payment_status === 'completed' || data?.payment_status === 'paid' || data?.status === 'paid') {
          clearInterval(poll);
          onPaymentSuccess?.();
        }
      } catch (e) {
        console.error('Poll error:', e);
      }
    }, 3000);
    return () => { cancelled = true; clearInterval(poll); };
  }, [orderId, onPaymentSuccess]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary h-1 w-full" />
      <header className="flex items-center gap-3 p-4 border-b">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5" /></button>
        <Lock className="h-4 w-4 text-muted-foreground" />
        <h1 className="font-semibold">Pagamento Seguro</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between bg-secondary rounded-xl p-3">
          <span className="text-sm text-muted-foreground">● A aguardar confirmação</span>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="h-3 w-3" /> Encriptado
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">TOTAL A PAGAR</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold">{total.toFixed(2).replace('.', ',')} €</p>
            <div className="text-right">
              <span className="bg-accent text-accent-foreground text-xs font-medium px-2 py-1 rounded">EXPIRA</span>
              <div className="flex items-center gap-1 text-primary font-bold mt-1">
                <Clock className="h-4 w-4" />
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <img src={mbwayIcon} alt="MB WAY" className="w-8 h-8 rounded-lg object-contain" />
          <div>
            <p className="font-semibold">MB WAY</p>
            <p className="text-sm text-muted-foreground">Confirme no seu telemóvel</p>
          </div>
          <span className="ml-auto text-success text-sm">● Activo</span>
        </div>

        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-accent rounded-2xl flex items-center justify-center relative">
            <div className="w-8 h-12 border-2 border-primary rounded-lg" />
            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">1</div>
          </div>
          <p className="font-semibold">Abra a app MB WAY no seu telemóvel</p>
          <p className="text-sm text-muted-foreground">Número associado: +351 {phone}</p>
        </div>

        <div className="bg-accent/50 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse-slow" />
          </div>
          <div>
            <p className="font-semibold text-sm">A aguardar confirmação...</p>
            <p className="text-sm text-muted-foreground">Confirme a notificação no seu telemóvel</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">✓ Aprovação instantânea</span>
          <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> 100% seguro</span>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold flex items-center gap-2 mb-3">📦 Resumo da encomenda</h3>
          {orderSummary.map((item, i) => (
            <div key={i} className="flex items-center gap-3 mb-2">
              {item.image && <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />}
              <div className="flex-1">
                <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                <p className="text-sm text-price">Qtd: {item.quantity} · {item.price.toFixed(2).replace('.', ',')} €</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm border-t pt-3">
          <span className="flex items-center gap-2">🚚 Prazo de entrega estimado<br/><strong>3 a 5 dias úteis</strong></span>
          <span className="font-bold">GRÁTIS</span>
        </div>

        <div className="text-center space-y-2 border-t pt-4">
          <p className="font-semibold text-sm">Como pagar</p>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-primary mb-1">📱</div>
              <span className="text-xs text-primary font-medium">Abra MB WAY</span>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-secondary rounded-full flex items-center justify-center mb-1"><Shield className="h-4 w-4 text-muted-foreground" /></div>
              <span className="text-xs text-muted-foreground">Verifique</span>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-secondary rounded-full flex items-center justify-center mb-1">✓</div>
              <span className="text-xs text-muted-foreground">Confirme</span>
            </div>
          </div>
        </div>

        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
          <p className="font-semibold text-sm flex items-center gap-2">ℹ️ Não recebeu a notificação?</p>
          <p className="text-sm text-muted-foreground mt-1">
            Verifique se a app MB WAY está instalada e se o número de telemóvel {phone} está associado à sua conta.
          </p>
        </div>
      </div>
    </div>
  );
}
