import { useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import AdminLoginPage from './AdminLoginPage';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminPixel from '@/components/admin/AdminPixel';
import AdminAccessGate from '@/components/admin/AdminAccessGate';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Package, LogOut, ShoppingCart, Eye, Shield } from 'lucide-react';

export default function AdminPage() {
  const { user, isAdmin, loading, signIn, signOut } = useAdmin();
  const [tab, setTab] = useState<'dashboard' | 'orders' | 'products' | 'pixel' | 'access'>('dashboard');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando...</div>;
  }

  if (!user) {
    return <AdminLoginPage onLogin={signIn} />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-lg font-semibold">Acceso denegado</p>
        <p className="text-sm text-muted-foreground">Tu cuenta no tiene permisos de administrador.</p>
        <Button variant="outline" onClick={signOut}>Cerrar sesión</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center justify-between h-14">
          <h1 className="font-bold text-lg">Panel de Administración</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">{user.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut} title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-2 border-b overflow-x-auto">
        <div className="flex gap-1">
          <Button variant={tab === 'dashboard' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('dashboard')}>
            <LayoutDashboard className="h-4 w-4 mr-1" /> Panel
          </Button>
          <Button variant={tab === 'orders' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('orders')}>
            <ShoppingCart className="h-4 w-4 mr-1" /> Pedidos
          </Button>
          <Button variant={tab === 'products' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('products')}>
            <Package className="h-4 w-4 mr-1" /> Productos
          </Button>
          <Button variant={tab === 'pixel' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('pixel')}>
            <Eye className="h-4 w-4 mr-1" /> Pixel
          </Button>
          <Button variant={tab === 'access' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('access')}>
            <Shield className="h-4 w-4 mr-1" /> Access Gate
          </Button>
        </div>
      </div>

      <main className="container py-6">
        {tab === 'dashboard' && <AdminDashboard />}
        {tab === 'orders' && <AdminOrders />}
        {tab === 'products' && <AdminProducts />}
        {tab === 'pixel' && <AdminPixel />}
        {tab === 'access' && <AdminAccessGate />}
      </main>
    </div>
  );
}
