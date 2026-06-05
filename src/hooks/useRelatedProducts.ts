import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from './useProducts';

export function useRelatedProducts(productId: string) {
  return useQuery({
    queryKey: ['related-products', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('related_products')
        .select('related_product_id, sort_order')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });
      if (error) throw error;

      if (!data || data.length === 0) return [] as Product[];

      const ids = data.map(r => r.related_product_id);
      const { data: products, error: pError } = await supabase
        .from('products')
        .select('*')
        .in('id', ids)
        .eq('status', 'active');
      if (pError) throw pError;

      // Sort by the order defined in related_products
      const orderMap = new Map(data.map(r => [r.related_product_id, r.sort_order]));
      return ((products as unknown) as Product[]).sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));
    },
    enabled: !!productId,
  });
}

export function useSetRelatedProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, relatedIds }: { productId: string; relatedIds: string[] }) => {
      // Delete existing
      await supabase.from('related_products').delete().eq('product_id', productId);
      // Insert new
      if (relatedIds.length > 0) {
        const rows = relatedIds.map((id, i) => ({
          product_id: productId,
          related_product_id: id,
          sort_order: i,
        }));
        const { error } = await supabase.from('related_products').insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: (_, { productId }) => {
      qc.invalidateQueries({ queryKey: ['related-products', productId] });
    },
  });
}
