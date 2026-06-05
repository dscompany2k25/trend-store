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

export default function PrivacyPage() {
  const updated = "6 de junio de 2026";

  return (
    <div className="min-h-screen bg-background">
      <LegalHeader />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-xs uppercase tracking-widest text-primary mb-2">Legal</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">Política de Privacidad</h1>
        <p className="text-sm text-muted-foreground mb-10">Última actualización: {updated}</p>

        <div className="prose prose-sm max-w-none space-y-8 text-sm leading-relaxed text-foreground/90">

          <section>
            <h2 className="font-semibold text-base mb-3">1. Responsable del tratamiento</h2>
            <p>El responsable del tratamiento de los datos personales recogidos a través de este sitio web es:</p>
            <ul className="mt-2 space-y-1 list-none pl-0">
              <li><strong>Razón social:</strong> Trend Store S.L.</li>
              <li><strong>CIF:</strong> B-XXXXXXXX</li>
              <li><strong>Domicilio:</strong> Calle Gran Vía 12, 28013 Madrid, España</li>
              <li><strong>Correo electrónico:</strong> privacidad@trendstore.es</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">2. Datos que recopilamos</h2>
            <p>Recopilamos los siguientes tipos de datos personales:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Datos de identificación:</strong> nombre completo, correo electrónico, número de teléfono.</li>
              <li><strong>Datos de envío:</strong> dirección postal, código postal, ciudad y provincia.</li>
              <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas, tiempo de visita.</li>
              <li><strong>Datos de transacción:</strong> historial de pedidos, método de pago (no almacenamos datos completos de tarjeta).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">3. Finalidad y base jurídica del tratamiento</h2>
            <div className="space-y-3">
              <div>
                <p className="font-medium">a) Gestión de pedidos y envíos</p>
                <p className="text-muted-foreground mt-1">Base jurídica: ejecución de un contrato (Art. 6.1.b RGPD). Los datos se utilizan para procesar tu pedido, coordinar el envío y gestionar posibles incidencias.</p>
              </div>
              <div>
                <p className="font-medium">b) Comunicaciones comerciales</p>
                <p className="text-muted-foreground mt-1">Base jurídica: consentimiento (Art. 6.1.a RGPD). Solo enviaremos comunicaciones comerciales si has prestado tu consentimiento expreso. Puedes retirar tu consentimiento en cualquier momento.</p>
              </div>
              <div>
                <p className="font-medium">c) Análisis y publicidad</p>
                <p className="text-muted-foreground mt-1">Base jurídica: interés legítimo (Art. 6.1.f RGPD). Utilizamos herramientas de análisis y plataformas publicitarias (incluyendo el Píxel de TikTok) para medir el rendimiento de nuestras campañas y mejorar la experiencia de usuario.</p>
              </div>
              <div>
                <p className="font-medium">d) Cumplimiento de obligaciones legales</p>
                <p className="text-muted-foreground mt-1">Base jurídica: obligación legal (Art. 6.1.c RGPD). Conservamos determinados datos para cumplir con las obligaciones fiscales, contables y legales vigentes.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">4. Píxel de TikTok y herramientas de seguimiento</h2>
            <p>Este sitio web utiliza el <strong>Píxel de TikTok</strong>, una herramienta de análisis proporcionada por TikTok Technology Limited. Esta herramienta recoge información sobre tu actividad en nuestro sitio (páginas vistas, productos consultados, acciones de compra) con el fin de medir el rendimiento de nuestros anuncios y personalizar la publicidad.</p>
            <p className="mt-2">Los datos recogidos por el Píxel de TikTok se transfieren a los servidores de TikTok, que pueden estar ubicados fuera del Espacio Económico Europeo. TikTok actúa como responsable independiente del tratamiento de dichos datos. Puedes consultar la política de privacidad de TikTok en <strong>tiktok.com/legal/privacy-policy</strong>.</p>
            <p className="mt-2">Si deseas limitar el seguimiento de TikTok, puedes gestionar tus preferencias publicitarias en la configuración de tu cuenta de TikTok o rechazar el uso de cookies no esenciales a través de nuestro banner de cookies.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">5. Conservación de los datos</h2>
            <p>Conservamos tus datos durante el tiempo estrictamente necesario para cada finalidad:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Datos de pedidos:</strong> 5 años desde la fecha de la última compra (obligación fiscal).</li>
              <li><strong>Datos de análisis y publicidad:</strong> máximo 13 meses desde su recogida.</li>
              <li><strong>Datos de comunicaciones comerciales:</strong> hasta que retires tu consentimiento.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">6. Cesión de datos a terceros</h2>
            <p>No vendemos ni cedemos tus datos personales a terceros, salvo en los siguientes supuestos necesarios para la prestación del servicio:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Procesadores de pago:</strong> Stripe, Inc. (para el procesamiento de pagos con tarjeta y Bizum).</li>
              <li><strong>Proveedores logísticos:</strong> empresas de mensajería encargadas del envío de tus pedidos.</li>
              <li><strong>Plataformas publicitarias:</strong> TikTok Technology Limited (Píxel de TikTok, en la medida descrita en el punto 4).</li>
              <li><strong>Proveedores de infraestructura:</strong> Supabase, Inc. (base de datos y servicios backend, con sede en EE.UU., sujeta a garantías adecuadas).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">7. Tus derechos</h2>
            <p>Como titular de los datos, tienes los siguientes derechos reconocidos por el RGPD:</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><strong>Acceso:</strong> conocer qué datos tratamos sobre ti.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
              <li><strong>Oposición:</strong> oponerte al tratamiento basado en interés legítimo.</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado y de uso común.</li>
              <li><strong>Limitación:</strong> solicitar que suspendamos el tratamiento de tus datos.</li>
            </ul>
            <p className="mt-3">Para ejercer estos derechos, envía un correo a <strong>privacidad@trendstore.es</strong> indicando tu nombre, el derecho que deseas ejercer y una copia de tu documento de identidad. Responderemos en el plazo máximo de 30 días.</p>
            <p className="mt-2">Si consideras que el tratamiento de tus datos vulnera la normativa vigente, puedes presentar una reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong> en www.aepd.es.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">8. Seguridad de los datos</h2>
            <p>Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos personales frente al acceso no autorizado, la pérdida, la alteración o la divulgación. Las comunicaciones entre tu navegador y nuestros servidores se realizan mediante cifrado SSL/TLS.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-3">9. Cambios en esta política</h2>
            <p>Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos los cambios relevantes mediante un aviso visible en el sitio web o por correo electrónico si disponemos de él. La fecha de la última actualización siempre estará visible al inicio de esta página.</p>
          </section>

        </div>
      </main>
      <LegalFooter />
    </div>
  );
}
