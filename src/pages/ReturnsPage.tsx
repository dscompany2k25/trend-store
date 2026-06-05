import { Link } from "react-router-dom";
import { ArrowLeft, Package, RefreshCw, CreditCard, Clock } from "lucide-react";

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

export default function ReturnsPage() {
  const updated = "6 de junio de 2026";

  return (
    <div className="min-h-screen bg-background">
      <LegalHeader />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-xs uppercase tracking-widest text-primary mb-2">Legal</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">Política de Devoluciones y Reembolsos</h1>
        <p className="text-sm text-muted-foreground mb-10">Última actualización: {updated}</p>

        {/* Resumen visual */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Clock, label: "14 días", sub: "para devolver" },
            { icon: Package, label: "Envío gratis", sub: "en devoluciones" },
            { icon: RefreshCw, label: "Cambio fácil", sub: "sin complicaciones" },
            { icon: CreditCard, label: "Reembolso", sub: "en 5-10 días" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="border rounded-xl p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-sm leading-relaxed text-foreground/90">

          <section>
            <h2 className="font-semibold text-base mb-3">1. Derecho de desistimiento</h2>
            <p>De conformidad con el <strong>Real Decreto Legislativo 1/2007</strong> (Ley General para la Defensa de los Consumidores y Usuarios) y la Directiva 2011/83/UE sobre derechos de los consumidores, tienes derecho a desistir del contrato en un plazo de <strong>14 días naturales</strong> sin necesidad de indicar ningún motivo.</p>
            <p className="mt-2">El plazo de desistimiento expira a los 14 días naturales del día en que tú o un tercero designado por ti (distinto del transportista) adquirió la posesión material del bien.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">2. Cómo ejercer el derecho de desistimiento</h2>
            <p>Para ejercer el derecho de desistimiento, debes notificarnos tu decisión antes de que venza el plazo indicado mediante:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>Correo electrónico a <strong>devoluciones@trendstore.es</strong> indicando: número de pedido, nombre completo, dirección y el artículo que deseas devolver.</li>
              <li>Carta postal a: Trend Store S.L., Calle Gran Vía 12, 28013 Madrid, España.</li>
            </ul>
            <p className="mt-3">Para cumplir el plazo de desistimiento, basta con que envíes la comunicación antes de que venza. Responderemos con las instrucciones de devolución en un plazo de 24-48 horas hábiles.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">3. Condiciones del producto devuelto</h2>
            <p>Para que la devolución sea aceptada, el artículo debe cumplir las siguientes condiciones:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>Estar en su estado original, sin señales de uso, daños o deterioro provocados por el cliente.</li>
              <li>Conservar el embalaje original en buen estado, con todos los accesorios, manuales y documentación incluidos.</li>
              <li>No haber sido lavado, modificado o personalizado.</li>
            </ul>
            <p className="mt-3">Si el producto se devuelve en condiciones diferentes a las indicadas, Trend Store se reserva el derecho de deducir del reembolso la depreciación del valor del bien, o rechazar la devolución según el estado del artículo.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">4. Proceso de devolución</h2>
            <ol className="mt-2 space-y-2 list-decimal pl-5">
              <li>Contacta con nuestro equipo en <strong>devoluciones@trendstore.es</strong> dentro del plazo de 14 días.</li>
              <li>Recibirás un correo con la etiqueta de devolución prepagada y las instrucciones.</li>
              <li>Empaqueta el artículo de forma segura e imprime la etiqueta proporcionada.</li>
              <li>Deposita el paquete en cualquier punto de recogida del transportista indicado.</li>
              <li>Una vez recibido e inspeccionado el artículo, tramitaremos el reembolso.</li>
            </ol>
            <p className="mt-3">Los gastos de devolución corren a cargo de Trend Store cuando se proporciona la etiqueta prepagada. En caso de que el cliente opte por un método de envío propio, los gastos correspondientes serán a su cargo.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">5. Reembolsos</h2>
            <p>Una vez recibido el artículo devuelto y verificado que cumple las condiciones indicadas, procederemos al reembolso <strong>íntegro del importe pagado</strong>, incluyendo los gastos de envío originales (si los hubiera), en un plazo máximo de <strong>14 días naturales</strong> desde la recepción de la devolución.</p>
            <p className="mt-2">El reembolso se realizará utilizando el mismo método de pago empleado en la compra original. Si el pago se realizó con tarjeta de crédito o débito, el abono podrá tardar entre 5 y 10 días hábiles adicionales en reflejarse en tu cuenta, dependiendo de tu entidad bancaria.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">6. Productos defectuosos o incorrectos</h2>
            <p>Si recibes un producto defectuoso, dañado durante el transporte o distinto al pedido, contacta con nosotros en un plazo de <strong>48 horas</strong> desde la recepción del paquete en <strong>devoluciones@trendstore.es</strong>, adjuntando fotografías del producto y el embalaje.</p>
            <p className="mt-2">En estos casos, Trend Store asumirá todos los gastos de devolución y procederá al envío de un producto nuevo o al reembolso completo, según tu preferencia, sin coste adicional para ti.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">7. Excepciones al derecho de devolución</h2>
            <p>No se aceptarán devoluciones en los siguientes casos, de acuerdo con el Art. 103 del Real Decreto Legislativo 1/2007:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>Productos personalizados o fabricados según las especificaciones del consumidor.</li>
              <li>Productos sellados que no sean aptos para ser devueltos por razones de protección de la salud o de higiene, cuyo precinto haya sido retirado.</li>
              <li>Productos que, por su naturaleza, se hayan mezclado de forma inseparable con otros.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">8. Garantía legal de los productos</h2>
            <p>Todos los productos vendidos en Trend Store cuentan con la <strong>garantía legal de conformidad de 2 años</strong> desde la fecha de entrega, conforme a lo establecido en el Real Decreto Legislativo 1/2007 y la Directiva 2019/771/UE.</p>
            <p className="mt-2">Si el producto presenta un defecto de fabricación durante ese período, tienes derecho a solicitar su reparación, sustitución, reducción del precio o resolución del contrato. Las reclamaciones por garantía deben realizarse a través de <strong>garantia@trendstore.es</strong>.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">9. Contacto</h2>
            <p>Para cualquier consulta relacionada con devoluciones o reembolsos, nuestro equipo está disponible en:</p>
            <ul className="mt-2 space-y-1 list-none pl-0">
              <li><strong>Email:</strong> devoluciones@trendstore.es</li>
              <li><strong>Horario de atención:</strong> Lunes a viernes, 9:00–18:00 (hora de Madrid)</li>
              <li><strong>Tiempo de respuesta:</strong> 24-48 horas hábiles</li>
            </ul>
          </section>

        </div>
      </main>
      <LegalFooter />
    </div>
  );
}
