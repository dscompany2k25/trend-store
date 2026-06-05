
-- Add tracking_code column
ALTER TABLE public.orders ADD COLUMN tracking_code text;

-- Create function to generate tracking code
CREATE OR REPLACE FUNCTION public.generate_tracking_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  digits text := '';
  letter text;
  i integer;
BEGIN
  FOR i IN 1..11 LOOP
    digits := digits || floor(random() * 10)::integer::text;
  END LOOP;
  letter := chr(65 + floor(random() * 26)::integer);
  NEW.tracking_code := 'PT' || digits || letter;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate tracking code on insert
CREATE TRIGGER generate_order_tracking_code
BEFORE INSERT ON public.orders
FOR EACH ROW
WHEN (NEW.tracking_code IS NULL)
EXECUTE FUNCTION public.generate_tracking_code();
