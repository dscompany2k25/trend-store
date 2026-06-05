
-- Add order_number to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number text UNIQUE;

-- Create function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  today_str text;
  seq_num integer;
BEGIN
  today_str := to_char(now(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO seq_num FROM public.orders WHERE order_number LIKE 'TL-' || today_str || '-%';
  NEW.order_number := 'TL-' || today_str || '-' || lpad(seq_num::text, 4, '0');
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate order number
DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION public.generate_order_number();

-- Create pixel_settings table
CREATE TABLE public.pixel_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL DEFAULT 'tiktok',
  pixel_id text NOT NULL DEFAULT '',
  access_token text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pixel_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pixel settings"
ON public.pixel_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow edge functions to read pixel settings (for server-side events)
CREATE POLICY "Service can read pixel settings"
ON public.pixel_settings
FOR SELECT
TO anon
USING (true);

CREATE TRIGGER update_pixel_settings_updated_at
BEFORE UPDATE ON public.pixel_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
