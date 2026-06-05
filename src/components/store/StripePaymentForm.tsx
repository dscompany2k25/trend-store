import { useEffect, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const stripeCache: Record<string, Promise<Stripe | null>> = {};
function getStripe(publishableKey: string) {
  if (!stripeCache[publishableKey]) {
    stripeCache[publishableKey] = loadStripe(publishableKey);
  }
  return stripeCache[publishableKey];
}

interface InnerProps {
  total: number;
  customerEmail: string;
  onProcessing: (paymentIntentId: string) => void;
  onSucceeded: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  onBizumSubmitting?: () => void;
}

function InnerForm({ total, customerEmail, onProcessing, onSucceeded, onError, onBizumSubmitting }: InnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);

    // For Bizum (async redirect-based method), show the waiting overlay
    // BEFORE calling confirmPayment so any Stripe redirect/popup is hidden.
    if (selectedMethod === 'bizum') {
      onBizumSubmitting?.();
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/carrito',
        receipt_email: customerEmail || undefined,
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message || 'Error al procesar el pago');
      setSubmitting(false);
      return;
    }

    if (paymentIntent) {
      if (paymentIntent.status === 'succeeded') {
        onSucceeded(paymentIntent.id);
      } else if (paymentIntent.status === 'processing' || paymentIntent.status === 'requires_action') {
        onProcessing(paymentIntent.id);
      } else {
        onError(`Estado del pago: ${paymentIntent.status}`);
      }
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        onReady={() => setReady(true)}
        onChange={(e) => setSelectedMethod(e.value?.type || '')}
        options={{
          layout: { type: 'accordion', defaultCollapsed: false, spacedAccordionItems: true },
          defaultValues: { billingDetails: { email: customerEmail } },
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }}
      />
      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold"
        disabled={!stripe || !ready || submitting}
      >
        <Lock className="h-4 w-4 mr-2" />
        {submitting ? 'Procesando...' : `Pagar ${formatPrice(total)}`}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Pago 100% seguro · Tarjeta · Bizum · Apple Pay · Google Pay · Link
      </p>
    </form>
  );
}

interface StripePaymentFormProps {
  clientSecret: string;
  publishableKey: string;
  total: number;
  customerEmail: string;
  onProcessing: (paymentIntentId: string) => void;
  onSucceeded: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  onBizumSubmitting?: () => void;
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);

  useEffect(() => {
    if (!props.publishableKey) return;
    getStripe(props.publishableKey).then(setStripeInstance);
  }, [props.publishableKey]);

  if (!props.publishableKey) {
    return (
      <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-4 text-sm text-destructive">
        Pasarela de pago no configurada.
      </div>
    );
  }

  if (!stripeInstance) {
    return <div className="text-sm text-muted-foreground">Cargando pasarela de pago...</div>;
  }

  return (
    <Elements
      stripe={stripeInstance}
      options={{
        clientSecret: props.clientSecret,
        locale: 'es',
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#ff0040',
            borderRadius: '12px',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        },
      }}
    >
      <InnerForm {...props} />
    </Elements>
  );
}
