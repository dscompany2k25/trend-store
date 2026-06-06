import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('store', 'v1')
      .order('created_at', { ascending: false })
      .limit(100);
    setOrders(data || []);
    setLoading(false);
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-success/10 text-success border-success/20">Pagado</Badge>;
      case 'awaiting_payment': return <Badge className="bg-warning/10 text-warning border-warning/20">En espera</Badge>;
      case 'payment_failed': return <Badge variant="destructive">Fallido</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Pedidos ({orders.length})</h2>
        <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </Button>
      </div>

      {orders.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">Aún no hay pedidos</p>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Seguimiento</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(o => {
                  const addr = o.shipping_address as any;
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{(o as any).order_number || o.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs">{formatDate(o.created_at)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{o.customer_name}</p>
                          {addr && <p className="text-xs text-muted-foreground">{addr.rua}, {addr.postalCode}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{(o as any).tracking_code || '—'}</TableCell>
                      <TableCell className="text-sm">{o.customer_phone}</TableCell>
                      <TableCell className="text-xs">{o.customer_email}</TableCell>
                      <TableCell className="font-bold text-price">{Number(o.total).toFixed(2).replace('.', ',')} €</TableCell>
                      <TableCell>{statusLabel(o.status)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
