import { useState, useMemo } from 'react';
import { Star, ThumbsUp, CheckCircle } from 'lucide-react';

interface Review {
  name: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
  helpful: number;
}

const NAMES = [
  'María García','Carlos López','Ana Martínez','Jorge Rodríguez','Laura Sánchez',
  'Miguel Fernández','Sofía Torres','David Gómez','Elena Díaz','Pablo Ruiz',
  'Carmen Moreno','Álvaro Jiménez','Lucía Álvarez','Raúl Romero','Patricia Navarro',
  'Sergio Domínguez','Isabel Vargas','Adrián Castro','Beatriz Ortega','Roberto Medina',
  'Cristina Herrera','Javier Ramos','Nuria Flores','Emilio Guerrero','Marina Molina',
  'Héctor Blanco','Silvia Cabrera','Óscar Ríos','Pilar Soto','Fernando Aguilar',
  'Marta Vega','Antonio Mendoza','Rosa Castillo','Gonzalo Fuentes','Verónica Reyes',
  'Eduardo Iglesias','Natalia Peña','Rubén Suárez','Claudia Mora','Marcos Delgado',
];

const TEXTS = [
  (n: string) => `El ${n} llegó antes de lo previsto y en perfectas condiciones. Muy contento con la compra.`,
  (n: string) => `Estoy encantada con el ${n}. La calidad es exactamente la que muestran las fotos, no me esperaba que fuera tan bueno.`,
  () => 'Llegó en el plazo indicado, bien embalado y sin ningún desperfecto. Lo recomiendo sin dudarlo.',
  (n: string) => `Compré el ${n} para regalar y le encantó. Volveré a comprar sin duda.`,
  () => 'Excelente calidad-precio. Es exactamente lo que buscaba y cumple perfectamente con lo que promete.',
  (n: string) => `El ${n} es genial. Lo uso a diario y funciona de maravilla. Muy satisfecho.`,
  () => 'Super rápido el envío, llegó en 3 días. El producto es tal cual lo describen, sin sorpresas.',
  () => 'Muy buena compra. El material es resistente y la presentación muy cuidada. Repetiré.',
  (n: string) => `Llevaba tiempo buscando algo así. El ${n} cumple todas mis expectativas. 100% recomendado.`,
  () => 'Lo compré con algo de dudas pero quedé muy sorprendida. Supera lo que esperaba.',
  () => 'Buena calidad y envío rápido. El embalaje estaba perfecto, llegó sin ningún problema.',
  (n: string) => `Me lo recomendó una amiga y tiene razón, el ${n} es fantástico. Ya se lo he recomendado a más gente.`,
  () => 'Muy satisfecho con la compra. El producto es robusto y se nota que está bien fabricado.',
  () => 'Funciona exactamente como se describe. Entrega rápida y sin problemas. Muy recomendable.',
  (n: string) => `El ${n} tiene una calidad excelente. Lo uso todos los días y está perfecto.`,
  () => 'Llegó en perfectas condiciones y antes de lo esperado. Muy buena experiencia de compra.',
  () => 'Es mi segunda compra y sigo igual de satisfecha. No decepciona.',
  (n: string) => `Increíble el ${n}. No pensé que iba a ser tan bueno. Lo recomiendo a todo el mundo.`,
  () => 'Muy contenta con la compra. La relación calidad-precio es inmejorable.',
  () => 'Todo perfecto. El producto tal como se ve en las fotos y el envío rapidísimo.',
  (n: string) => `El ${n} es justo lo que necesitaba. Superó mis expectativas.`,
  () => 'Compra fácil, envío rápido y producto de calidad. ¿Qué más se puede pedir?',
  () => 'Excelente. Ya es la tercera vez que compro en esta tienda y siempre quedo satisfecho.',
  (n: string) => `El ${n} llegó bien protegido y en perfectas condiciones. Un producto de calidad.`,
  () => 'Lo recomiendo totalmente. Buen producto, buen precio y entrega sin problemas.',
  () => 'Muy buena experiencia de compra. El producto es tal cual lo anuncian, sin letra pequeña.',
  (n: string) => `Me sorprendió gratamente el ${n}. Mejor de lo que esperaba por ese precio.`,
  () => 'Todo perfecto desde el primer momento. El packaging estaba impecable.',
  () => 'Pedido recibido en tiempo y forma. Producto de muy buena calidad. Repetiré.',
  (n: string) => `El ${n} es exactamente lo que buscaba. Muy feliz con la compra.`,
  () => 'Calidad buenísima. Se nota que está bien hecho. Muy satisfecha.',
  () => 'Llegó antes de lo que ponía y en perfecto estado. Muy recomendable.',
  (n: string) => `Compré el ${n} sin muchas expectativas y me ha sorprendido muy positivamente.`,
  () => 'Producto de calidad y entrega rápida. Todo correcto, sin ningún problema.',
  () => 'Muy satisfecho. El producto es robusto y cumple exactamente lo prometido.',
  (n: string) => `El ${n} tiene una presentación muy cuidada y la calidad es excelente.`,
  () => 'Fantástico. Lo recomiendo a cualquiera que esté pensando en comprarlo.',
  () => 'Todo bien. Producto tal y como se muestra, envío sin retrasos.',
  (n: string) => `Muy contento con el ${n}. Funciona genial y el precio es muy competitivo.`,
  () => 'Excelente compra. Llegó rápido y el producto no defrauda.',
];

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateReviews(productId: string, productName: string, total = 50): Review[] {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = ((hash << 5) - hash) + productId.charCodeAt(i);
    hash |= 0;
  }
  const rand = seededRand(Math.abs(hash));
  const now = Date.now();

  return Array.from({ length: total }, (_, i) => {
    const nameIdx = Math.floor(rand() * NAMES.length);
    const textIdx = Math.floor(rand() * TEXTS.length);
    const rating = rand() < 0.75 ? 5 : 4;
    const daysAgo = Math.floor(rand() * 150) + 2;
    const date = new Date(now - daysAgo * 86400000);
    const helpful = Math.floor(rand() * 18);
    const name = NAMES[nameIdx];
    const avatar = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const shortName = productName.length > 30
      ? productName.split(' ').slice(0, 3).join(' ')
      : productName;

    return {
      name,
      avatar,
      rating,
      date: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
      text: TEXTS[textIdx](shortName),
      verified: rand() > 0.08,
      helpful,
    };
  });
}

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'xs' }) {
  const cls = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`${cls} ${s <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

interface ProductReviewsProps {
  productId: string;
  productName?: string;
}

export function getReviewStats(productId: string) {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = ((hash << 5) - hash) + productId.charCodeAt(i);
    hash |= 0;
  }
  const base = Math.abs(hash);
  const total = 900 + (base % 150);
  const five = Math.round(total * (0.75 + (base % 7) * 0.01));
  const four = total - five;
  return { total, rating: 4.8, distribution: [five, four, 0, 0, 0] };
}

const PAGE_SIZE = 10;

export default function ProductReviews({ productId, productName = 'producto' }: ProductReviewsProps) {
  const [page, setPage] = useState(1);
  const stats = useMemo(() => getReviewStats(productId), [productId]);
  const allReviews = useMemo(() => generateReviews(productId, productName, 50), [productId, productName]);
  const visible = allReviews.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < allReviews.length;
  const percentages = stats.distribution.map(d => Math.round((d / stats.total) * 100));

  return (
    <div className="border-t pt-5 mt-5">
      <h2 className="font-semibold mb-4">Valoraciones de Clientes</h2>

      {/* Resumen */}
      <div className="flex items-start gap-6 mb-6">
        <div className="text-center shrink-0">
          <p className="text-4xl font-bold">{stats.rating.toString().replace('.', ',')}</p>
          <StarRow rating={5} />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.total.toLocaleString('es-ES')} valoraciones
          </p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5,4,3,2,1].map((star, i) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-3">{star}</span>
              <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-warning rounded-full transition-all" style={{ width: `${percentages[i]}%` }} />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">{percentages[i]}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de reviews */}
      <div className="space-y-5">
        {visible.map((r, i) => (
          <div key={i} className="border-b pb-5 last:border-0">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{r.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{r.name}</span>
                  {r.verified && (
                    <span className="flex items-center gap-1 text-[10px] text-success font-medium">
                      <CheckCircle className="h-3 w-3" />
                      Compra verificada
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <StarRow rating={r.rating} size="xs" />
                  <span className="text-[11px] text-muted-foreground">{r.date}</span>
                </div>
                <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{r.text}</p>
                {r.helpful > 0 && (
                  <button className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ThumbsUp className="h-3 w-3" />
                    {r.helpful} {r.helpful === 1 ? 'persona encontró esto útil' : 'personas encontraron esto útil'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setPage(p => p + 1)}
          className="mt-5 w-full border rounded-xl py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
        >
          Ver más valoraciones ({allReviews.length - visible.length} restantes)
        </button>
      )}
    </div>
  );
}
