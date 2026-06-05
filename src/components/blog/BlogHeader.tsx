import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, Menu, X, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { categories } from "@/data/blogPosts";
import { cn } from "@/lib/utils";

export default function BlogHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/blog?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-colors backdrop-blur",
        scrolled ? "bg-background/90 border-border" : "bg-background/70 border-transparent"
      )}
    >
      {/* Top strip */}
      <div className="hidden md:block bg-foreground text-background text-xs">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <span className="tracking-widest uppercase">Diário Editorial · Trend Loja</span>
          <span className="opacity-80">Novas leituras todas as semanas</span>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 -ml-2 text-foreground"
              onClick={() => setOpen((v) => !v)}
              aria-label="Abrir menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/blog" className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold tracking-tight">
                Trend<span className="text-primary">.</span>Diário
              </span>
              <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Editorial
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-7">
            <NavLink
              to="/blog"
              end
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium transition-colors",
                  isActive ? "text-primary" : "text-foreground hover:text-primary"
                )
              }
            >
              Início
            </NavLink>
            {categories.slice(0, 5).map((c) => (
              <NavLink
                key={c.name}
                to={`/blog?categoria=${encodeURIComponent(c.name)}`}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {c.name}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <form onSubmit={submitSearch} className="hidden lg:flex items-center bg-secondary rounded-full px-3 h-9">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Procurar artigos..."
                className="bg-transparent text-sm px-2 w-44 outline-none placeholder:text-muted-foreground"
              />
            </form>
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              Loja
            </Link>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-4 space-y-1 border-t pt-3">
            <form onSubmit={submitSearch} className="flex items-center bg-secondary rounded-full px-3 h-10 mb-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Procurar artigos..."
                className="bg-transparent text-sm px-2 flex-1 outline-none placeholder:text-muted-foreground"
              />
            </form>
            <NavLink
              to="/blog"
              end
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium"
            >
              Início
            </NavLink>
            {categories.map((c) => (
              <NavLink
                key={c.name}
                to={`/blog?categoria=${encodeURIComponent(c.name)}`}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm font-medium"
              >
                {c.name}
              </NavLink>
            ))}
            <Link to="/" onClick={() => setOpen(false)} className="block py-2 text-sm font-semibold text-primary">
              Ir para a loja →
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}