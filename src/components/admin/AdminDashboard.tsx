import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAllProducts } from '@/hooks/useProducts';
import { Package, Eye, ShoppingCart, TrendingUp, Users, CreditCard, BarChart3 } from 'lucide-react';

interface PageViewStats {
  total: number;
  today: number;
  activeSessions: number;
  topPages: { page: string; count: number }[];
}

interface OrderStats {
  totalOrders: number;
  todayOrders: number;
  todayPaid: number;
  todayGenerated: number;
  totalRevenue: number;
  todayRevenue: number;
  conversionRate: number;
}

export default function AdminDashboard() {
  const { data: products } = useAllProducts();
  const [stats, setStats] = useState<PageViewStats>({ total: 0, today: 0, activeSessions: 0, topPages: [] });
  const [orderStats, setOrderStats] = useState<OrderStats>({ totalOrders: 0, todayOrders: 0, todayPaid: 0, todayGenerated: 0, totalRevenue: 0, todayRevenue: 0, conversionRate: 0 });
  const [realtimeCount, setRealtimeCount] = useState(0);

  useEffect(() => {
    loadStats();
    loadOrderStats();

    const channel = supabase
      .channel('realtime-page-views')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'page_views' }, () => {
        setRealtimeCount(prev => prev + 1);
        loadStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrderStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadStats = async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    const [totalRes, todayRes, activeRes, topRes] = await Promise.all([
      supabase.from('page_views').select('id', { count: 'exact', head: true }),
      supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('page_views').select('session_id').gte('created_at', fiveMinAgo),
      supabase.from('page_views').select('page').order('created_at', { ascending: false }).limit(500),
    ]);

    const uniqueSessions = new Set(activeRes.data?.map(r => r.session_id)).size;
    const pageCounts: Record<string, number> = {};
    topRes.data?.forEach(r => { pageCounts[r.page] = (pageCounts[r.page] || 0) + 1; });
    const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([page, count]) => ({ page, count }));

    setStats({ total: totalRes.count || 0, today: todayRes.count || 0, activeSessions: uniqueSessions, topPages });
  };

  const loadOrderStats = async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data: allOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const orders = allOrders || [];

    const todayOrders = orders.filter(o => o.created_at >= todayStart);
    const todayPaid = todayOrders.filter(o => o.status === 'paid');
    const todayGenerated = todayOrders.length;
    const totalPaid = orders.filter(o => o.status === 'paid');
    const totalRevenue = totalPaid.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const todayRevenue = todayPaid.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const conversionRate = todayGenerated > 0 ? (todayPaid.length / todayGenerated) * 100 : 0;

    setOrderStats({ totalOrders: orders.length, todayOrders: todayOrders.length, todayPaid: todayPaid.length, todayGenerated, totalRevenue, todayRevenue, conversionRate });
  };

  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter(p => p.status === 'active').length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Eye className="h-5 w-5" />} label="Visitas hoy" value={stats.today} color="text-primary" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Activos ahora" value={stats.activeSessions} color="text-success" pulse />
        <StatCard icon={<ShoppingCart className="h-5 w-5" />} label="Ventas hoy" value={orderStats.todayPaid} color="text-primary" />
        <StatCard icon={<CreditCard className="h-5 w-5" />} label="Ingresos hoy" value={`${orderStats.todayRevenue.toFixed(2).replace('.', ',')} €`} color="text-price" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<ShoppingCart className="h-5 w-5" />} label="Pedidos generados hoy" value={orderStats.todayGenerated} color="text-warning" />
        <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Tasa de conversión" value={`${orderStats.conversionRate.toFixed(1)}%`} color="text-success" />
        <StatCard icon={<Package className="h-5 w-5" />} label="Productos" value={`${activeProducts}/${totalProducts}`} color="text-warning" />
        <StatCard icon={<CreditCard className="h-5 w-5" />} label="Ingresos totales" value={`${orderStats.totalRevenue.toFixed(2).replace('.', ',')} €`} color="text-price" />
      </div>

      <div className="bg-success/10 border border-success/20 rounded-xl p-3 flex items-center gap-3">
        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
        <span className="text-sm font-medium">En tiempo real</span>
        <span className="text-xs text-muted-foreground">· {realtimeCount} nuevas visitas desde que abrió el panel</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Páginas más visitadas
          </h3>
          {stats.topPages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos aún</p>
          ) : (
            <div className="space-y-2">
              {stats.topPages.map((p, i) => (
                <div key={p.page} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-secondary rounded flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="truncate">{p.page === '/' ? 'Página de inicio' : p.page}</span>
                  </span>
                  <span className="text-muted-foreground">{p.count} visitas</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border rounded-xl p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Resumen de conversión (hoy)
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Pedidos generados</span>
              <span className="font-bold">{orderStats.todayGenerated}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Pedidos pagados</span>
              <span className="font-bold text-success">{orderStats.todayPaid}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Tasa de conversión</span>
              <span className="font-bold">{orderStats.conversionRate.toFixed(1)}%</span>
            </div>
            <div className="border-t pt-2 flex items-center justify-between">
              <span className="text-sm font-medium">Ingresos hoy</span>
              <span className="text-lg font-bold text-price">{orderStats.todayRevenue.toFixed(2).replace('.', ',')} €</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total de visitas</p>
            <p className="text-2xl font-bold">{stats.total.toLocaleString('es-ES')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total de pedidos</p>
            <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Ingresos totales</p>
            <p className="text-2xl font-bold text-price">{orderStats.totalRevenue.toFixed(2).replace('.', ',')} €</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, pulse }: { icon: React.ReactNode; label: string; value: string | number; color: string; pulse?: boolean }) {
  return (
    <div className="border rounded-xl p-3 space-y-1">
      <div className={`${color} flex items-center gap-2`}>
        {icon}
        {pulse && <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
