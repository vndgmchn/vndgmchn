-- Fix storefront RPCs:
-- 1) Replace cp.set_number (does not exist) with cp.collector_number
-- 2) Add set_total to RETURNS TABLE and SELECT
-- 3) Add set_printed_total to RETURNS TABLE and SELECT

DROP FUNCTION IF EXISTS public.get_storefront_by_handle(text);
DROP FUNCTION IF EXISTS public.get_storefront_by_id(uuid);

-- ============================================================
-- get_storefront_by_handle
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_storefront_by_handle(p_handle text)
RETURNS TABLE (
  handle             text,
  display_name       text,
  bio                text,
  is_public          boolean,
  item_id            uuid,
  catalog_product_id uuid,
  title              text,
  quantity           integer,
  listing_price      numeric,
  image_url          text,
  set_name           text,
  collector_number   text,
  set_total          integer,
  set_printed_total  integer,
  market_price       numeric,
  last_updated       timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.handle,
    p.display_name,
    p.bio,
    p.is_public,
    i.id            AS item_id,
    cp.id           AS catalog_product_id,
    i.title,
    i.quantity,
    i.listing_price,
    cp.image_url,
    cp.set_name,
    cp.collector_number,
    cp.set_total,
    cp.set_printed_total,
    cpc.market_price,
    cpc.last_updated
  FROM public.profiles p
  LEFT JOIN public.inventory_items i
    ON p.id = i.owner_id
    AND i.status = 'FOR_SALE'
    AND i.deleted_at IS NULL
  LEFT JOIN public.catalog_products cp
    ON i.catalog_product_id = cp.id
  LEFT JOIN public.catalog_prices_current cpc
    ON cp.id = cpc.product_id
  WHERE p.handle = p_handle
    AND p.is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_storefront_by_handle(text) TO anon, authenticated;

-- ============================================================
-- get_storefront_by_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_storefront_by_id(p_user_id uuid)
RETURNS TABLE (
  handle             text,
  display_name       text,
  bio                text,
  is_public          boolean,
  item_id            uuid,
  catalog_product_id uuid,
  title              text,
  quantity           integer,
  listing_price      numeric,
  image_url          text,
  set_name           text,
  collector_number   text,
  set_total          integer,
  set_printed_total  integer,
  market_price       numeric,
  last_updated       timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.handle,
    p.display_name,
    p.bio,
    p.is_public,
    i.id            AS item_id,
    cp.id           AS catalog_product_id,
    i.title,
    i.quantity,
    i.listing_price,
    cp.image_url,
    cp.set_name,
    cp.collector_number,
    cp.set_total,
    cp.set_printed_total,
    cpc.market_price,
    cpc.last_updated
  FROM public.profiles p
  LEFT JOIN public.inventory_items i
    ON p.id = i.owner_id
    AND i.status = 'FOR_SALE'
    AND i.deleted_at IS NULL
  LEFT JOIN public.catalog_products cp
    ON i.catalog_product_id = cp.id
  LEFT JOIN public.catalog_prices_current cpc
    ON cp.id = cpc.product_id
  WHERE p.id = p_user_id
    AND p.is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_storefront_by_id(uuid) TO anon, authenticated;
