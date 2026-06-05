import { Home, ShoppingCart, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';

export default function BottomNav() {
  const { totalItems } = useCart();
  const location = useLocation();

  const links = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/favoritos', icon: Heart, label: 'Favoritos' },
    { to: '/carrito', icon: ShoppingCart, label: 'Carrito', badge: totalItems },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t sm:hidden">
      <div className="flex items-center justify-around h-14">
        {links.map(({ to, icon: Icon, label, badge }) => {
          const active = location.pathname === to;
          return (
            <Link key={to} to={to} className="flex flex-col items-center gap-0.5 relative">
              <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] ${active ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{label}</span>
              {badge ? (
                <span className="absolute -top-1 right-0 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
