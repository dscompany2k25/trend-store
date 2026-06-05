import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import BlogHeader from "@/components/blog/BlogHeader";
import BlogFooter from "@/components/blog/BlogFooter";
import heroImg from "@/assets/blog/blog-hero.jpg";
import { blogPosts, categories, formatDatePT, type BlogCategory } from "@/data/blogPosts";
import { evaluateDetection } from "@/hooks/useRealMobileDetection";
import { supabase } from "@/integrations/supabase/client";
import { useProduct, type Product } from "@/hooks/useProducts";

const FALLBACK_REDIRECT = "/";

function buildRedirect(productId: string | null): string {
  if (productId && /^[a-f0-9-]{36}$/i.test(productId)) {
    return `/producto/${productId}`;
  }
  return FALLBACK_REDIRECT;
}

// ─── Editorial content generator ────────────────────────────────────────────

type EditorialData = {
  tag: string;
  title: string;
  subtitle: string;
  intro: string;
  sections: { heading: string; body: string }[];
  pullQuote: string;
  author: string;
  readingTime: string;
};

const CATEGORY_MAP: Record<string, string> = {
  tecnología: "Tecnología",
  tecnologia: "Tecnología",
  belleza: "Belleza & Cuidado",
  hogar: "Hogar & Lifestyle",
  moda: "Moda",
  deporte: "Deporte & Bienestar",
  fitness: "Deporte & Bienestar",
  salud: "Salud & Bienestar",
  cocina: "Gastronomía",
  mascotas: "Mascotas",
  infantil: "Familia",
  electronica: "Electrónica",
  electrónica: "Electrónica",
};

function resolveTag(category: string | null): string {
  if (!category) return "Tendencias";
  const key = category.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return CATEGORY_MAP[key] ?? category;
}

function buildEditorial(product: Product): EditorialData {
  const name = product.name;
  const tag = resolveTag(product.category);
  const shortName = name.length > 35 ? name.split(" ").slice(0, 4).join(" ") : name;

  const TITLES = [
    `${shortName}: el objeto del que todo el mundo habla`,
    `Por qué el ${shortName} se ha convertido en imprescindible`,
    `${shortName} y la nueva forma de entender ${tag.toLowerCase()}`,
    `El fenómeno ${shortName} que está redefiniendo el mercado`,
    `Cómo el ${shortName} cambió la perspectiva de miles de personas`,
  ];
  const SUBTITLES = [
    `Un análisis editorial sobre el impacto cultural y práctico de uno de los productos más comentados de la temporada.`,
    `Exploramos por qué este producto ha generado tanto interés y qué dice de nosotros como consumidores modernos.`,
    `Detrás del éxito de ${shortName} hay una historia de diseño, comunidad y cambio de hábitos que merece contarse.`,
  ];
  const INTROS = [
    `Hay productos que simplemente aparecen en el mercado y, sin grandes aspavientos, se instalan en la vida cotidiana de miles de personas. El ${name} es uno de ellos. No llegó con campañas millonarias ni promesas grandiosas: llegó porque funcionaba, porque resolvía algo real, y porque quienes lo probaban no podían evitar recomendarlo.`,
    `Cuando un producto comienza a aparecer en conversaciones de amigos, en grupos de WhatsApp, en comentarios de redes sociales, suele significar una cosa: que toca algún punto relevante de la vida moderna. El ${name} ha logrado exactamente eso. Su popularidad no es fruto de la casualidad, sino de una propuesta que encaja con lo que muchas personas necesitaban, aunque no siempre supieran cómo expresarlo.`,
    `En Trend Diario llevamos tiempo siguiendo la trayectoria de productos que, sin pertenecer a grandes marcas de lujo, consiguen hacerse un hueco en la vida de las personas. El ${name} es el tipo de producto que ilustra perfectamente ese fenómeno: discreto en su llegada, contundente en su impacto.`,
  ];
  const SECTION_POOLS: { heading: string; body: string }[][] = [
    [
      {
        heading: "El contexto que lo explica todo",
        body: `Vivimos en un momento en que los consumidores son más exigentes que nunca. No se conforman con un producto que simplemente cumpla una función: quieren que ese producto encaje en su estilo de vida, que sea coherente con sus valores y que, a ser posible, les facilite la existencia sin complicarla. El ${name} nació en ese ecosistema y supo leerlo correctamente. Su diseño, su practicidad y su propuesta no son accidentales: responden a una observación cuidadosa de cómo vive la gente hoy.`,
      },
      {
        heading: "Diseño que responde a necesidades reales",
        body: `Uno de los aspectos más comentados entre quienes ya tienen el ${shortName} es la coherencia entre su diseño y su uso. No hay elementos superfluos, no hay complejidad innecesaria. Cada detalle parece pensado para que la experiencia de uso sea lo más natural posible. En un mercado saturado de opciones, esa claridad de propósito es, paradójicamente, lo más difícil de conseguir.`,
      },
    ],
    [
      {
        heading: "La comunidad detrás del producto",
        body: `Pocos fenómenos de consumo recientes han generado una comunidad tan orgánica como la que se ha formado alrededor del ${shortName}. En foros, grupos y redes sociales, los usuarios comparten experiencias, consejos de uso y, sobre todo, la satisfacción de haber encontrado algo que realmente cumple lo que promete. Esa autenticidad es difícil de fabricar y, cuando aparece, suele ser el mejor indicador de que un producto tiene recorrido real.`,
      },
      {
        heading: "Lo que dicen quienes ya lo tienen",
        body: `La mejor prueba de un producto es siempre la experiencia directa. Y en el caso del ${name}, la constante que más se repite entre los usuarios es la misma: supera las expectativas. No porque sea perfecto en términos absolutos, sino porque hace bien lo que tiene que hacer, sin complicaciones, sin frustraciones. En un mundo lleno de productos que prometen demasiado y entregan demasiado poco, eso se agradece.`,
      },
    ],
    [
      {
        heading: `${tag} en 2025: el cambio que nadie vio venir`,
        body: `El sector de ${tag.toLowerCase()} ha vivido una transformación notable en los últimos años. Los consumidores ya no buscan solo funcionalidad: buscan productos que conecten con su identidad, que sean compatibles con un ritmo de vida exigente y que, al mismo tiempo, no sacrifiquen la calidad en favor del precio. El ${shortName} encarna esa evolución de manera ejemplar, y su presencia creciente en los hogares españoles no es más que el reflejo de un cambio cultural más amplio.`,
      },
      {
        heading: "Cómo integrarlo en tu día a día",
        body: `Una de las virtudes menos reconocidas del ${name} es su versatilidad. No requiere rituales de adopción, no exige aprender nada nuevo, no interrumpe rutinas existentes: se integra. Quienes lo usan habitualmente describen un proceso de incorporación casi transparente, como si siempre hubiera estado ahí. Ese nivel de adaptabilidad es, en realidad, uno de los logros de diseño más difíciles de alcanzar.`,
      },
    ],
    [
      {
        heading: "Más allá de la tendencia",
        body: `Las tendencias van y vienen, pero algunos productos consiguen trascenderlas porque ofrecen algo que no depende del momento: utilidad genuina, durabilidad y una experiencia de uso que se mantiene relevante con el tiempo. El ${name} tiene todas las papeletas para ser uno de esos productos. Su popularidad actual no parece ser el pico de una curva descendente, sino el inicio de una presencia sostenida en el mercado.`,
      },
      {
        heading: "El detalle que marca la diferencia",
        body: `A menudo, lo que distingue a un producto verdaderamente bueno de uno simplemente correcto no es un gran elemento sino una acumulación de pequeños detalles bien resueltos. En el caso del ${shortName}, esa filosofía se percibe claramente. Cada aspecto parece haber pasado por un filtro de "¿esto realmente mejora la experiencia?", y el resultado es un conjunto coherente que se siente completo, no arbitrario.`,
      },
    ],
  ];

  const hash = [...product.id].reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0) >>> 0;
  const titleIdx = hash % TITLES.length;
  const subtitleIdx = (hash >> 3) % SUBTITLES.length;
  const introIdx = (hash >> 5) % INTROS.length;
  const sectionPoolIdx = (hash >> 7) % SECTION_POOLS.length;
  const altPoolIdx = (hash >> 9) % SECTION_POOLS.length;

  let sections = SECTION_POOLS[sectionPoolIdx];
  if (sections === SECTION_POOLS[altPoolIdx]) {
    sections = SECTION_POOLS[(sectionPoolIdx + 1) % SECTION_POOLS.length];
  }

  const PULL_QUOTES = [
    `"El ${shortName} no llegó a resolver un problema que nadie tenía. Llegó a resolver uno que todos tenían pero que nadie había sabido nombrar bien."`,
    `"Hay una generación de productos que no gritan para llamar la atención. El ${shortName} es uno de ellos: convence por lo que hace, no por lo que dice."`,
    `"Lo mejor de productos como el ${shortName} es que cuando funcionan bien, dejan de notarse. Se convierten en parte natural de tu vida."`,
  ];

  const AUTHORS = [
    "Elena Vargas — Redacción Trend Diario",
    "Carlos Mendoza — Redacción Trend Diario",
    "Sofía Reyes — Redacción Trend Diario",
    "Javier Torres — Redacción Trend Diario",
  ];

  return {
    tag,
    title: TITLES[titleIdx],
    subtitle: SUBTITLES[subtitleIdx],
    intro: INTROS[introIdx],
    sections,
    pullQuote: PULL_QUOTES[(hash >> 11) % PULL_QUOTES.length],
    author: AUTHORS[(hash >> 13) % AUTHORS.length],
    readingTime: `${4 + (hash % 4)} min de lectura`,
  };
}

// ─── ProductEditorial component ──────────────────────────────────────────────

function ProductEditorial({ product }: { product: Product }) {
  const ed = useMemo(() => buildEditorial(product), [product]);
  const today = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const related = blogPosts.slice(0, 3);

  const heroImage = product.images?.[0] ?? heroImg;
  const galleryImages = product.images?.slice(1, 3) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BlogHeader />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <span aria-hidden>/</span>
          <span className="text-primary font-medium">{ed.tag}</span>
        </nav>
      </div>

      {/* Article header */}
      <article className="container mx-auto px-4 max-w-3xl">
        <header className="py-10 md:py-14">
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">{ed.tag}</p>
          <h1 className="font-serif text-3xl md:text-5xl leading-tight tracking-tight text-foreground">
            {ed.title}
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            {ed.subtitle}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-t border-b py-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {today}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {ed.readingTime}
            </span>
            <span className="ml-auto font-medium text-foreground/70">{ed.author}</span>
          </div>
        </header>

        {/* Hero image */}
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-10 shadow-lg">
          <img
            src={heroImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <p className="text-[11px] uppercase tracking-widest text-foreground/70">{product.name}</p>
          </div>
        </div>

        {/* Intro */}
        <div className="prose prose-zinc dark:prose-invert max-w-none mb-10">
          <p className="text-base md:text-lg leading-relaxed text-foreground/80 first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none">
            {ed.intro}
          </p>
        </div>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
            {ed.sections[0].heading}
          </h2>
          <p className="text-base leading-relaxed text-foreground/80">
            {ed.sections[0].body}
          </p>
        </section>

        {/* Gallery inline (if product has extra images) */}
        {galleryImages.length > 0 && (
          <div className={`grid gap-4 mb-10 ${galleryImages.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {galleryImages.map((img, i) => (
              <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden">
                <img src={img} alt={product.name} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Pull quote */}
        <blockquote className="border-l-4 border-primary pl-6 my-10">
          <p className="font-serif text-xl md:text-2xl italic text-foreground/90 leading-relaxed">
            {ed.pullQuote}
          </p>
        </blockquote>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
            {ed.sections[1].heading}
          </h2>
          <p className="text-base leading-relaxed text-foreground/80">
            {ed.sections[1].body}
          </p>
        </section>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 py-8 border-t border-b mb-14">
          <span className="text-xs text-muted-foreground uppercase tracking-wider mr-2">Etiquetas:</span>
          {[ed.tag, "Tendencias", "Lifestyle", "Análisis"].map((t) => (
            <Link
              key={t}
              to={`/blog?q=${encodeURIComponent(t.toLowerCase())}`}
              className="text-xs px-3 py-1 rounded-full border border-border hover:border-foreground hover:text-foreground text-muted-foreground transition-colors"
            >
              {t}
            </Link>
          ))}
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="container mx-auto px-4 pb-20 max-w-5xl">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Más en Trend Diario</p>
            <h2 className="font-serif text-2xl md:text-3xl">Artículos relacionados</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-7">
            {related.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="group block">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
                  <img
                    src={post.image}
                    alt={post.imageAlt}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                  />
                </div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-primary mb-1.5">{post.category}</p>
                <h3 className="font-serif text-lg leading-snug group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDatePT(post.date)}</span>
                  <span aria-hidden>·</span>
                  <span>{post.readingTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <BlogFooter />
    </div>
  );
}

// ─── Main BlogPage ────────────────────────────────────────────────────────────

export default function BlogPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const checkedKeysRef = useRef(new Set<string>());
  const [gateChecking, setGateChecking] = useState(true);
  const [gateBlocked, setGateBlocked] = useState(false);

  const targetProductId = params.get("p");
  const redirectTo = buildRedirect(targetProductId);
  const cacheKey = `__access_verdict_${targetProductId || "default"}__`;

  const { data: editorialProduct } = useProduct(targetProductId ?? "");

  useEffect(() => {
    setGateChecking(true);
    setGateBlocked(false);

    if (checkedKeysRef.current.has(cacheKey)) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached === "passed") navigate(redirectTo, { replace: true });
      else { setGateBlocked(true); setGateChecking(false); }
      return;
    }
    checkedKeysRef.current.add(cacheKey);

    const cached = sessionStorage.getItem(cacheKey);
    if (cached === "passed") { navigate(redirectTo, { replace: true }); return; }
    if (cached === "blocked") { setGateBlocked(true); setGateChecking(false); return; }

    (async () => {
      let verdict: "passed" | "blocked" = "blocked";
      try {
        const det = evaluateDetection();
        try {
          let timeoutId: ReturnType<typeof setTimeout>;
          const invokePromise = supabase.functions.invoke("log-access", {
            body: { signals: det.signals, isRealMobile: det.isRealMobile, path: "/blog" },
          });
          invokePromise.catch(() => {});
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error("timeout")), 4000);
          });
          try {
            const { data, error } = await Promise.race([invokePromise, timeoutPromise]);
            clearTimeout(timeoutId!);
            if (!error && data?.verdict && !data?.error) verdict = data.verdict;
            else verdict = det.isRealMobile ? "passed" : "blocked";
          } catch {
            clearTimeout(timeoutId!);
            verdict = det.isRealMobile ? "passed" : "blocked";
          }
        } catch {
          verdict = det.isRealMobile ? "passed" : "blocked";
        }
      } catch { verdict = "blocked"; }

      sessionStorage.setItem(cacheKey, verdict);
      if (verdict === "passed") navigate(redirectTo, { replace: true });
      else { setGateBlocked(true); setGateChecking(false); }
    })();
  }, [navigate, redirectTo, cacheKey]);

  const activeCategory = (params.get("categoria") as BlogCategory) || null;
  const query = (params.get("q") || "").toLowerCase();

  const filtered = useMemo(() => {
    return blogPosts.filter((p) => {
      const matchCat = !activeCategory || p.category === activeCategory;
      const matchQuery =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.excerpt.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });
  }, [activeCategory, query]);

  const featured = !activeCategory && !query ? blogPosts[0] : null;
  const list = featured ? filtered.filter((p) => p.slug !== featured.slug) : filtered;

  const setCategory = (cat: BlogCategory | null) => {
    const next = new URLSearchParams(params);
    if (cat) next.set("categoria", cat);
    else next.delete("categoria");
    next.delete("q");
    setParams(next);
  };

  if (gateChecking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md">
        <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  // Gate blocked + product available → show editorial article
  if (gateBlocked && targetProductId && editorialProduct) {
    return <ProductEditorial product={editorialProduct} />;
  }

  // Gate blocked but product not yet loaded → keep spinner briefly
  if (gateBlocked && targetProductId && !editorialProduct) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md">
        <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  // No product param or gate blocked without valid ID → show regular blog
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BlogHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="container mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">
              Edición de {new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
            </p>
            <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight text-foreground">
              Historias, guías e ideas que merecen descubrirse.
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Trend Diario es el cuaderno editorial de Trend Store. Aquí compartimos perspectivas sobre tecnología, belleza, hogar, moda y la cultura detrás de lo que consumimos.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setCategory(null)}
                className={`text-xs px-4 py-2 rounded-full border transition-colors ${
                  !activeCategory
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-foreground border-border hover:border-foreground"
                }`}
              >
                Todos los artículos
              </button>
              {categories.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setCategory(c.name)}
                  className={`text-xs px-4 py-2 rounded-full border transition-colors ${
                    activeCategory === c.name
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-foreground border-border hover:border-foreground"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/3] md:aspect-[16/12] rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={heroImg}
              alt="Mesa editorial con cámara, revistas y flores"
              width={1600}
              height={700}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured && (
        <section className="container mx-auto px-4 py-14 md:py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Destacado</p>
              <h2 className="font-serif text-2xl md:text-3xl">Lectura de la semana</h2>
            </div>
          </div>
          <Link
            to={`/blog/${featured.slug}`}
            className="group grid md:grid-cols-2 gap-8 lg:gap-14 items-center"
          >
            <div className="relative aspect-[5/4] rounded-2xl overflow-hidden">
              <img
                src={featured.image}
                alt={featured.imageAlt}
                width={1280}
                height={800}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              />
              <span className="absolute top-4 left-4 bg-background/95 text-foreground text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-full">
                {featured.category}
              </span>
            </div>
            <div>
              <h3 className="font-serif text-3xl md:text-5xl leading-tight group-hover:text-primary transition-colors">
                {featured.title}
              </h3>
              <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-xl">
                {featured.excerpt}
              </p>
              <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDatePT(featured.date)}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {featured.readingTime}</span>
              </div>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Leer artículo completo <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* Grid */}
      <section className="container mx-auto px-4 pb-20">
        {(activeCategory || query) && (
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-2">
              {activeCategory ? "Sección" : "Búsqueda"}
            </p>
            <h2 className="font-serif text-3xl md:text-4xl">
              {activeCategory ?? `Resultados para "${query}"`}
            </h2>
            {activeCategory && (
              <p className="mt-3 text-muted-foreground max-w-2xl">
                {categories.find((c) => c.name === activeCategory)?.description}
              </p>
            )}
          </div>
        )}

        {list.length === 0 ? (
          <div className="text-center py-20 border rounded-2xl bg-secondary/30">
            <p className="font-serif text-2xl mb-2">Sin resultados</p>
            <p className="text-muted-foreground">Prueba otra sección o búsqueda.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {list.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="group block">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4">
                  <img
                    src={post.image}
                    alt={post.imageAlt}
                    width={1280}
                    height={800}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                  />
                </div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-primary mb-2">{post.category}</p>
                <h3 className="font-serif text-2xl leading-snug group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatDatePT(post.date)}</span>
                  <span aria-hidden>·</span>
                  <span>{post.readingTime}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <BlogFooter />
    </div>
  );
}
