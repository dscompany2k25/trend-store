
CREATE TABLE public.related_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  related_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, related_product_id)
);

ALTER TABLE public.related_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Related products viewable by everyone"
ON public.related_products FOR SELECT
USING (true);

CREATE POLICY "Admins can manage related products"
ON public.related_products FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
