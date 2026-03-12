-- Drop existing functions to allow altering the returning TABLE schema
DROP FUNCTION IF EXISTS public.get_storefront_by_handle(text);
DROP FUNCTION IF EXISTS public.get_storefront_by_id(uuid);

-- Create or replace get_storefront_by_handle to include Scrydex metadata
CREATE OR REPLACE FUNCTION public.get_storefront_by_handle(p_handle text)
RETURNS TABLE (
  handle text,
  display_name text,
  bio text,
  is_public boolean,
  item_id uuid,
  title text,
  quantity integer,
  listing_price numeric,
  image_url text,
  set_name text,
  collector_number text,
  market_price numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.handle,
    p.display_name,
    p.bio,
    p.is_public,
    i.id as item_id,
    i.title,
    i.quantity,
    i.listing_price,
    cp.image_url,
    cp.set_name,
    cp.collector_number,
    cpc.market_price
  FROM public.profiles p
  LEFT JOIN public.inventory_items i ON p.id = i.owner_id AND i.status = 'FOR_SALE' AND i.deleted_at IS NULL
  LEFT JOIN public.catalog_products cp ON i.catalog_product_id = cp.id
  LEFT JOIN public.catalog_prices_current cpc ON cp.id = cpc.product_id
  WHERE p.handle = p_handle AND p.is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_storefront_by_handle(text) TO anon, authenticated;

-- Create or replace get_storefront_by_id to include Scrydex metadata
CREATE OR REPLACE FUNCTION public.get_storefront_by_id(p_user_id uuid)
RETURNS TABLE (
  handle text,
  display_name text,
  bio text,
  is_public boolean,
  item_id uuid,
  title text,
  quantity integer,
  listing_price numeric,
  image_url text,
  set_name text,
  collector_number text,
  market_price numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.handle,
    p.display_name,
    p.bio,
    p.is_public,
    i.id as item_id,
    i.title,
    i.quantity,
    i.listing_price,
    cp.image_url,
    cp.set_name,
    cp.collector_number,
    cpc.market_price
  FROM public.profiles p
  LEFT JOIN public.inventory_items i ON p.id = i.owner_id AND i.status = 'FOR_SALE' AND i.deleted_at IS NULL
  LEFT JOIN public.catalog_products cp ON i.catalog_product_id = cp.id
  LEFT JOIN public.catalog_prices_current cpc ON cp.id = cpc.product_id
  WHERE p.id = p_user_id AND p.is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_storefront_by_id(uuid) TO anon, authenticated;
