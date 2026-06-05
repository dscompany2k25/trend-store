ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tiktok_purchase_sent boolean NOT NULL DEFAULT false;