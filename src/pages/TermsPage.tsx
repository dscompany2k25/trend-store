import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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

export default function TermsPage() {
  const updated = "6 de junio de 2026";

  return (
    <div className="min-h-screen bg-background">
      <LegalHeader />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-xs uppercase tracking-widest text-primary mb-2">Legal</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-muted-foreground mb-10">Última actualización: {updated}</p>

        <div className="prose prose-sm max-w-none space-y-8 text-sm leading-relaxed text-foreground/90">

          <section>
            <h2 className="font-semibold text-base mb-3">1. Información general</h2>
            <p>Estos Términos y Condiciones regulan el uso del sitio web y los servicios de venta online ofrecidos por <strong>Trend Store S.L.</strong> (en adelante, "Trend Store"), con domicilio en Calle Gran Vía 12, 28013 Madrid, España, y CIF B-XXXXXXXX.</p>
            <p className="mt-2">Al realizar una compra en nuestra tienda, aceptas íntegramente estos Términos y Condiciones. Si no estás de acuerdo con alguno de los puntos, te rogamos que no realices ningún pedido.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">2. Productos y disponibilidad</h2>
            <p>Todos los productos ofrecidos en Trend Store están sujetos a disponibilidad de stock. Nos reservamos el derecho de modificar, retirar o descatalogar cualquier producto sin previo aviso.</p>
            <p className="mt-2">Las imágenes de los productos tienen carácter orientativo. Aunque nos esforzamos por reflejar fielmente el aspecto real de cada artículo, pueden existir ligeras diferencias de color debidas a la configuración de pantalla del dispositivo del usuario.</p>
            <p className="mt-2">En caso de que un producto adquirido no esté disponible, te notificaremos por correo electrónico y procederemos al reembolso íntegro del importe abonado en un plazo máximo de 14 días.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">3. Precios e impuestos</h2>
            <p>Todos los precios mostrados en la tienda están expresados en euros (€) e incluyen el IVA aplicable conforme a la legislación española vigente. Los gastos de envío, cuando los haya, se indicarán de forma clara antes de confirmar el pedido.</p>
            <p className="mt-2">Trend Store se reserva el derecho de modificar los precios en cualquier momento. No obstante, el precio aplicable será siempre el vigente en el momento en que el pedido quede confirmado.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">4. Proceso de compra</h2>
            <p>El proceso de compra comprende los siguientes pasos:</p>
            <ol className="mt-2 space-y-1 list-decimal pl-5">
              <li>Selección del producto y variante deseados.</li>
              <li>Adición al carrito y revisión del resumen del pedido.</li>
              <li>Introducción de los datos de envío.</li>
              <li>Selección del método de pago y confirmación del pedido.</li>
              <li>Recepción del correo electrónico de confirmación.</li>
            </ol>
            <p className="mt-3">El contrato de compraventa se perfecciona en el momento en que recibes el correo electrónico de confirmación del pedido. Hasta ese momento, Trend Store podrá rechazar o cancelar cualquier pedido.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">5. Métodos de pago</h2>
            <p>Aceptamos los siguientes métodos de pago:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li>Tarjeta de crédito o débito (Visa, Mastercard, American Express)</li>
              <li>Bizum</li>
              <li>Apple Pay</li>
              <li>Google Pay</li>
              <li>Link (Stripe)</li>
            </ul>
            <p className="mt-3">Los pagos son procesados de forma segura por <strong>Stripe, Inc.</strong>, proveedor de servicios de pago con certificación PCI DSS nivel 1. Trend Store no almacena datos completos de tarjetas de crédito en ningún momento.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">6. Envío y entrega</h2>
            <p>Realizamos envíos a toda España peninsular, Baleares, Canarias, Ceuta y Melilla. El plazo de entrega estimado es de <strong>3 a 5 días laborables</strong> desde la confirmación del pago.</p>
            <p className="mt-2">Los plazos de entrega son orientativos y pueden verse afectados por circunstancias ajenas a Trend Store (transportistas, festivos, incidencias logísticas). En ningún caso Trend Store será responsable de los retrasos imputables a terceros.</p>
            <p className="mt-2">El envío es <strong>gratuito</strong> en todos los pedidos realizados a través de nuestra tienda online, sin importe mínimo.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">7. Derecho de desistimiento y devoluciones</h2>
            <p>De conformidad con el Real Decreto Legislativo 1/2007, de 16 de noviembre, dispones de un plazo de <strong>14 días naturales</strong> desde la recepción del producto para ejercer tu derecho de desistimiento sin necesidad de justificación.</p>
            <p className="mt-2">Para más información sobre el proceso de devolución, plazos y condiciones, consulta nuestra <Link to="/devoluciones" className="text-primary hover:underline">Política de Devoluciones</Link>.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">8. Garantía legal</h2>
            <p>Todos los productos vendidos en Trend Store están cubiertos por la garantía legal de conformidad de <strong>2 años</strong> desde la fecha de entrega, de acuerdo con el Real Decreto Legislativo 1/2007 y la Directiva 2019/771/UE.</p>
            <p className="mt-2">En caso de defecto de conformidad, el consumidor tendrá derecho a la reparación, sustitución, reducción del precio o resolución del contrato, según corresponda.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">9. Propiedad intelectual</h2>
            <p>Todos los contenidos de este sitio web (textos, imágenes, logotipos, diseño, código fuente) son propiedad de Trend Store S.L. o de sus licenciantes, y están protegidos por la legislación española e internacional sobre propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o uso sin autorización expresa.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">10. Resolución de disputas en línea</h2>
            <p>De acuerdo con el Reglamento (UE) 524/2013, la Comisión Europea pone a disposición de los consumidores europeos una plataforma de resolución de litigios en línea (ODR), accesible en: <strong>ec.europa.eu/consumers/odr</strong>.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">11. Legislación aplicable y jurisdicción</h2>
            <p>Estos Términos y Condiciones se rigen por la legislación española. Para la resolución de cualquier controversia que pudiera derivarse de su interpretación o aplicación, las partes se someten a los juzgados y tribunales del domicilio del consumidor, de conformidad con la normativa de protección de consumidores y usuarios vigente.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">12. Contacto</h2>
            <p>Para cualquier consulta relacionada con estos Términos y Condiciones, puedes contactarnos en <strong>info@trendstore.es</strong> o a través de nuestra <Link to="/contacto" className="text-primary hover:underline">página de contacto</Link>.</p>
          </section>

        </div>
      </main>
      <LegalFooter />
    </div>
  );
}
