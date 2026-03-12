-- Create universal product catalog
CREATE TABLE IF NOT EXISTS public.catalog_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game text NOT NULL, -- 'POKEMON' | 'ONE_PIECE'
  external_id text NOT NULL, -- e.g. "xy1-1", "OP01-001"
  title text NOT NULL,
  set_name text,
  set_number text,
  image_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(game, external_id)
);

-- Store current marketplace prices mapped to catalog products
CREATE TABLE IF NOT EXISTS public.catalog_prices_current (
  product_id uuid REFERENCES public.catalog_products(id) ON DELETE CASCADE PRIMARY KEY,
  market_price numeric NOT NULL,
  currency text DEFAULT 'USD',
  last_updated timestamp with time zone DEFAULT now() NOT NULL
);

-- Store snapshots of pricing for analytics/graphs
CREATE TABLE IF NOT EXISTS public.catalog_price_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.catalog_products(id) ON DELETE CASCADE NOT NULL,
  market_price numeric NOT NULL,
  recorded_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Setup trigger to update `updated_at` on catalog_products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_catalog_products_modtime
BEFORE UPDATE ON public.catalog_products
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Update Inventory Items to link back to the catalog 
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS catalog_product_id uuid REFERENCES public.catalog_products(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS game text;

-- Add RLS Policies for Catalog Products (read-only for all users)
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view catalog products" ON public.catalog_products FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Service role can insert catalog products" ON public.catalog_products FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update catalog products" ON public.catalog_products FOR UPDATE TO service_role USING (true);

-- Add RLS Policies for Current Prices (read-only for all users)
ALTER TABLE public.catalog_prices_current ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view current prices" ON public.catalog_prices_current FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Service role can insert current prices" ON public.catalog_prices_current FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update current prices" ON public.catalog_prices_current FOR UPDATE TO service_role USING (true);

-- Add RLS Policies for Price Snapshots (read-only for all users)
ALTER TABLE public.catalog_price_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view price snapshots" ON public.catalog_price_snapshots FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Service role can insert price snapshots" ON public.catalog_price_snapshots FOR INSERT TO service_role WITH CHECK (true);
