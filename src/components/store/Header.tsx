import { Search, ShoppingCart, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const { totalItems } = useCart();
  const [query, setQuery] = useState('');

  return (
    <header className="sticky top-0 z-50 bg-background">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              className="pl-9 h-9 bg-secondary border-0 rounded-full text-sm"
              value={query}
              onChange={e => { setQuery(e.target.value); onSearch?.(e.target.value); }}
            />
          </div>
        </div>
        <Link to="/carrito" className="p-2 relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
