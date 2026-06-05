import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Clock, MessageSquare, Package } from "lucide-react";
import { useState } from "react";

function LegalHeader() {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link to="/" className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link to="/" className="font-serif text-lg font-bold tracking-tight">
          Trend<span className="text-primary">.</span>Store
        </Link>
      </div>
    </header>
  );
}

function LegalFooter() {
  return (
    <footer className="border-t mt-16 py-8">
      <div className="max-w-3xl mx-auto px-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <Link to="/privacidad" className="hover:text-foreground transition-colors">Política de Privacidad</Link>
        <Link to="/terminos" className="hover:text-foreground transition-colors">Términos y Condiciones</Link>
        <Link to="/devoluciones" className="hover:text-foreground transition-colors">Devoluciones</Link>
        <Link to="/contacto" className="hover:text-foreground transition-colors">Contacto</Link>
        <span className="ml-auto">© {new Date().getFullYear()} Trend Store S.L.</span>
      </div>
    </footer>
  );
}

const FAQ = [
  {
    q: "¿Cuánto tarda en llegar mi pedido?",
    a: "Los pedidos se entregan en un plazo de 3 a 5 días laborables desde la confirmación del pago. Recibirás un correo con el número de seguimiento una vez que tu pedido sea enviado.",
  },
  {
    q: "¿Puedo cambiar o cancelar mi pedido?",
    a: "Si tu pedido aún no ha sido enviado, podemos modificarlo o cancelarlo. Contacta con nosotros lo antes posible a través del correo de soporte indicando tu número de pedido.",
  },
  {
    q: "¿Cómo realizo una devolución?",
    a: "Dispones de 14 días naturales desde la recepción del producto para ejercer tu derecho de desistimiento. Consulta nuestra Política de Devoluciones para ver el proceso detallado.",
  },
  {
    q: "¿El envío es realmente gratis?",
    a: "Sí, todos los pedidos incluyen envío gratuito a toda España, sin importe mínimo.",
  },
  {
    q: "¿Mi pago es seguro?",
    a: "Sí. Los pagos son procesados por Stripe, con certificación PCI DSS nivel 1. No almacenamos datos de tarjetas en nuestros servidores.",
  },
  {
    q: "¿Qué garantía tienen los productos?",
    a: "Todos los productos cuentan con garantía legal de 2 años desde la entrega, conforme a la normativa española y europea de protección al consumidor.",
  },
];

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", order: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <LegalHeader />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-xs uppercase tracking-widest text-primary mb-2">Atención al cliente</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">Contacto</h1>
        <p className="text-sm text-muted-foreground mb-10">Estamos aquí para ayudarte. Responderemos en un plazo de 24-48 horas hábiles.</p>

        {/* Tarjetas de contacto */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Mail, title: "Email", desc: "info@trendstore.es", sub: "Respuesta en 24-48h" },
            { icon: Clock, title: "Horario", desc: "Lun – Vie", sub: "9:00 – 18:00 (Madrid)" },
            { icon: Package, title: "Pedidos", desc: "devoluciones@trendstore.es", sub: "Cambios y devoluciones" },
          ].map(({ icon: Icon, title, desc, sub }) => (
            <div key={title} className="border rounded-xl p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-sm text-foreground font-medium">{desc}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>

        {/* Formulario */}
        <div className="border rounded-xl p-6 mb-12">
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-base">Envíanos un mensaje</h2>
          </div>
          {sent ? (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
              <p className="font-semibold text-primary mb-1">¡Mensaje enviado!</p>
              <p className="text-sm text-muted-foreground">Hemos recibido tu consulta. Te responderemos en un plazo de 24-48 horas hábiles.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nombre completo *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-lg px-3 h-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Correo electrónico *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full border rounded-lg px-3 h-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Número de pedido (opcional)</label>
                <input
                  value={form.order}
                  onChange={e => setForm({ ...form, order: e.target.value })}
                  className="w-full border rounded-lg px-3 h-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Ej. TS-1234567"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Mensaje *</label>
                <textarea
                  required
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  placeholder="Describe tu consulta con el mayor detalle posible..."
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Enviar mensaje
              </button>
              <p className="text-xs text-muted-foreground text-center">
                Al enviar este formulario aceptas nuestra{" "}
                <Link to="/privacidad" className="text-primary hover:underline">Política de Privacidad</Link>.
              </p>
            </form>
          )}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="font-semibold text-base mb-5">Preguntas frecuentes</h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-left hover:bg-secondary/50 transition-colors"
                >
                  <span>{item.q}</span>
                  <span className="text-muted-foreground ml-3 shrink-0">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t bg-secondary/20">
                    <p className="pt-3">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </main>
      <LegalFooter />
    </div>
  );
}
