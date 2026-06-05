import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Mail, ArrowRight } from "lucide-react";
import { categories } from "@/data/blogPosts";
import { useState } from "react";

export default function BlogFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="bg-foreground text-background mt-24">
      {/* Newsletter band */}
      <div className="border-b border-background/10">
        <div className="container mx-auto px-4 py-14 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary/90 mb-3">Newsletter</p>
            <h3 className="font-serif text-3xl md:text-4xl leading-tight max-w-md">
              As melhores leituras, uma vez por semana.
            </h3>
            <p className="mt-3 text-sm text-background/70 max-w-md">
              Receba os artigos editoriais, guias práticos e tendências selecionadas pela nossa redação. Sem spam, sem ruído.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="w-full">
            {subscribed ? (
              <div className="bg-background/5 border border-background/10 rounded-full px-5 py-4 text-sm">
                Obrigado por subscrever — confirme no seu email.
              </div>
            ) : (
              <div className="flex items-center bg-background/5 border border-background/10 rounded-full pl-5 pr-1 h-14 focus-within:border-primary transition-colors">
                <Mail className="h-4 w-4 text-background/60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="o-seu-email@exemplo.com"
                  className="bg-transparent flex-1 px-3 text-sm outline-none placeholder:text-background/40"
                />
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground rounded-full h-12 px-5 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  Subscrever
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
            <p className="mt-3 text-xs text-background/50">
              Ao subscrever, aceita a nossa política de privacidade.
            </p>
          </form>
        </div>
      </div>

      {/* Main links */}
      <div className="container mx-auto px-4 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link to="/blog" className="font-serif text-2xl font-bold">
            Trend<span className="text-primary">.</span>Diário
          </Link>
          <p className="mt-4 text-sm text-background/60 max-w-xs leading-relaxed">
            O caderno editorial da Trend Loja. Histórias, guias e perspetivas sobre o que vale a pena descobrir.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a href="#" aria-label="Instagram" className="p-2 rounded-full bg-background/5 hover:bg-primary hover:text-primary-foreground transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Facebook" className="p-2 rounded-full bg-background/5 hover:bg-primary hover:text-primary-foreground transition-colors">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" aria-label="YouTube" className="p-2 rounded-full bg-background/5 hover:bg-primary hover:text-primary-foreground transition-colors">
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-background/40 mb-4">Secções</p>
          <ul className="space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.name}>
                <Link
                  to={`/blog?categoria=${encodeURIComponent(c.name)}`}
                  className="text-background/80 hover:text-primary transition-colors"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-background/40 mb-4">Loja</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="text-background/80 hover:text-primary transition-colors">Produtos</Link></li>
            <li><Link to="/carrinho" className="text-background/80 hover:text-primary transition-colors">Carrinho</Link></li>
            <li><Link to="/" className="text-background/80 hover:text-primary transition-colors">Novidades</Link></li>
            <li><Link to="/" className="text-background/80 hover:text-primary transition-colors">Promoções</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-background/40 mb-4">Legal</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/contacto" className="text-background/80 hover:text-primary transition-colors">Contacto</Link></li>
            <li><Link to="/privacidad" className="text-background/80 hover:text-primary transition-colors">Política de Privacidad</Link></li>
            <li><Link to="/terminos" className="text-background/80 hover:text-primary transition-colors">Términos y Condiciones</Link></li>
            <li><Link to="/devoluciones" className="text-background/80 hover:text-primary transition-colors">Devoluciones</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-background/50">
          <p>© {new Date().getFullYear()} Trend Loja. Todos os direitos reservados.</p>
          <p>Feito com cuidado em Portugal.</p>
        </div>
      </div>
    </footer>
  );
}