import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import BlogHeader from "@/components/blog/BlogHeader";
import BlogFooter from "@/components/blog/BlogFooter";
import heroImg from "@/assets/blog/blog-hero.jpg";
import { blogPosts, categories, formatDatePT, type BlogCategory } from "@/data/blogPosts";
import { evaluateDetection } from "@/hooks/useRealMobileDetection";
import { supabase } from "@/integrations/supabase/client";

// URL do produto de destino lida do parâmetro ?p= no link do anúncio TikTok.
// Exemplo de uso: https://seusite.com/blog?p=ID_DO_PRODUTO
// Se não houver ?p=, redireciona para a homepage (lista de produtos).
const FALLBACK_REDIRECT = "/";

function buildRedirect(productId: string | null): string {
  if (productId && /^[a-f0-9-]{36}$/i.test(productId)) {
    return `/producto/${productId}`;
  }
  return FALLBACK_REDIRECT;
}

export default function BlogPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const didCheckRef = useRef(false);
  const [gateChecking, setGateChecking] = useState(true);

  // ?p=PRODUCT_ID — definido no link do anúncio TikTok
  const targetProductId = params.get("p");
  const redirectTo = buildRedirect(targetProductId);

  useEffect(() => {
    if (didCheckRef.current) return;
    didCheckRef.current = true;

    const cacheKey = `__access_verdict_${targetProductId || "default"}__`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached === "passed") { navigate(redirectTo, { replace: true }); return; }
    if (cached === "blocked") { setGateChecking(false); return; }
    // __access_logged__ removed: it was blocking re-checks for new products in the same session

    (async () => {
      let verdict: "passed" | "blocked" = "blocked";
      try {
        const det = evaluateDetection();
        try {
          // 4-second timeout — fall back to client verdict on slow networks
          const invokePromise = supabase.functions.invoke("log-access", {
            body: { signals: det.signals, isRealMobile: det.isRealMobile, path: "/blog" },
          });
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 4000)
          );
          const { data, error } = await Promise.race([invokePromise, timeoutPromise]);
          // Only trust verdict if Edge Function completed without internal error
          if (!error && data?.verdict && !data?.error) verdict = data.verdict;
          else verdict = det.isRealMobile ? "passed" : "blocked";
        } catch {
          // Timeout or network error — client verdict is the fallback
          verdict = det.isRealMobile ? "passed" : "blocked";
        }
      } catch { verdict = "blocked"; }

      sessionStorage.setItem(cacheKey, verdict);
      if (verdict === "passed") navigate(redirectTo, { replace: true });
      else setGateChecking(false);
    })();
  }, [navigate, redirectTo]);

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