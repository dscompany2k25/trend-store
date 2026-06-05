import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Share2 } from "lucide-react";
import BlogHeader from "@/components/blog/BlogHeader";
import BlogFooter from "@/components/blog/BlogFooter";
import { getPostBySlug, getRelatedPosts, formatDatePT } from "@/data/blogPosts";
import { useEffect } from "react";

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = slug ? getPostBySlug(slug) : undefined;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [slug]);

  if (!post) return <Navigate to="/blog" replace />;

  const related = getRelatedPosts(post.slug, 3);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.excerpt, url: window.location.href });
      } catch { /* noop */ }
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BlogHeader />

      <article className="container mx-auto px-4 max-w-3xl pt-10 md:pt-16">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="h-4 w-4" /> Voltar ao diário
        </Link>

        <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">{post.category}</p>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-foreground">
          {post.title}
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">{post.excerpt}</p>

        <div className="mt-8 flex flex-wrap items-center gap-5 pb-8 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold">
              {post.author.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <p className="text-sm font-semibold">{post.author}</p>
              <p className="text-xs text-muted-foreground">{post.authorRole}</p>
            </div>
          </div>
          <span className="hidden sm:block w-px h-8 bg-border" />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDatePT(post.date)}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {post.readingTime}</span>
          </div>
          <button
            onClick={handleShare}
            className="ml-auto inline-flex items-center gap-2 text-xs font-semibold text-foreground hover:text-primary transition-colors"
          >
            <Share2 className="h-4 w-4" /> Partilhar
          </button>
        </div>
      </article>

      <div className="container mx-auto px-4 max-w-5xl mt-10">
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
          <img
            src={post.image}
            alt={post.imageAlt}
            width={1600}
            height={900}
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center italic">
          {post.imageAlt}
        </p>
      </div>

      <article className="container mx-auto px-4 max-w-3xl py-14">
        <p className="font-serif text-xl md:text-2xl leading-relaxed text-foreground first-letter:text-5xl first-letter:font-bold first-letter:text-primary first-letter:mr-2 first-letter:float-left first-letter:leading-none first-letter:mt-1">
          {post.intro}
        </p>

        <div className="mt-12 space-y-12">
          {post.sections.map((section, i) => (
            <section key={i}>
              <h2 className="font-serif text-2xl md:text-3xl tracking-tight mb-5">{section.heading}</h2>
              {section.paragraphs.map((p, j) => (
                <p key={j} className="text-base md:text-lg leading-[1.8] text-foreground/85 mb-4">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-14 border-l-4 border-primary pl-6 py-2">
          <p className="font-serif text-xl md:text-2xl italic leading-relaxed text-foreground">
            {post.conclusion}
          </p>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-2">
          {post.tags.map((t) => (
            <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-secondary text-foreground/70">
              #{t}
            </span>
          ))}
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-secondary/40 border-t">
          <div className="container mx-auto px-4 py-16">
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Continue a ler</p>
            <h2 className="font-serif text-3xl md:text-4xl mb-10">Mais do diário</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {related.map((p) => (
                <Link key={p.slug} to={`/blog/${p.slug}`} className="group block">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4">
                    <img
                      src={p.image}
                      alt={p.imageAlt}
                      width={1280}
                      height={800}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                    />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-primary mb-2">{p.category}</p>
                  <h3 className="font-serif text-xl leading-snug group-hover:text-primary transition-colors">
                    {p.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <BlogFooter />
    </div>
  );
}