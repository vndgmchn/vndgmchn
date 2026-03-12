-- Create rate limiting log for Scrydex Edge Function
CREATE TABLE IF NOT EXISTS public.user_price_refresh_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    force boolean NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    count int NOT NULL DEFAULT 0
);

-- Index for fast user history lookup
CREATE INDEX IF NOT EXISTS idx_user_price_refresh_log_user_created 
ON public.user_price_refresh_log(user_id, created_at DESC);

-- RLS for log table
ALTER TABLE public.user_price_refresh_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own refresh logs" ON public.user_price_refresh_log 
FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role can orchestrate logs" ON public.user_price_refresh_log 
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ==============================================================================
-- UPDATE STOREFRONT RPCs WITH NEW PRICING PARAMS
-- ==============================================================================

DROP FUNCTION IF EXISTS public.get_storefront_by_handle(text);
DROP FUNCTION IF EXISTS public.get_storefront_by_id(uuid);

-- 1) get_storefront_by_handle
CREATE OR REPLACE FUNCTION public.get_storefront_by_handle(p_handle text)
RETURNS TABLE (
  handle text,
  display_name text,
  bio text,
  is_public boolean,
  item_id uuid,
  catalog_product_id uuid,
  title text,
  quantity integer,
  listing_price numeric,
  image_url text,
  set_name text,
  collector_number text,
  market_price numeric,
  last_updated timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.handle,
    p.display_name,
    p.bio,
    p.is_public,
    i.id as item_id,
    cp.id as catalog_product_id,
    i.title,
    i.quantity,
    i.listing_price,
    cp.image_url,
    cp.set_name,
    cp.set_number as collector_number,
    cpc.market_price,
    cpc.last_updated
  FROM profiles p
  LEFT JOIN inventory_items i ON p.id = i.owner_id AND i.status = 'FOR_SALE' AND i.deleted_at IS NULL
  LEFT JOIN catalog_products cp ON i.catalog_product_id = cp.id
  LEFT JOIN catalog_prices_current cpc ON cp.id = cpc.product_id
  WHERE p.handle = p_handle AND p.is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) get_storefront_by_id
CREATE OR REPLACE FUNCTION public.get_storefront_by_id(p_user_id uuid)
RETURNS TABLE (
  handle text,
  display_name text,
  bio text,
  is_public boolean,
  item_id uuid,
  catalog_product_id uuid,
  title text,
  quantity integer,
  listing_price numeric,
  image_url text,
  set_name text,
  collector_number text,
  market_price numeric,
  last_updated timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.handle,
    p.display_name,
    p.bio,
    p.is_public,
    i.id as item_id,
    cp.id as catalog_product_id,
    i.title,
    i.quantity,
    i.listing_price,
    cp.image_url,
    cp.set_name,
    cp.set_number as collector_number,
    cpc.market_price,
    cpc.last_updated
  FROM profiles p
  LEFT JOIN inventory_items i ON p.id = i.owner_id AND i.status = 'FOR_SALE' AND i.deleted_at IS NULL
  LEFT JOIN catalog_products cp ON i.catalog_product_id = cp.id
  LEFT JOIN catalog_prices_current cpc ON cp.id = cpc.product_id
  WHERE p.id = p_user_id AND p.is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
