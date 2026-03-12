-- Add soft delete tracking
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Drop existing functions to allow altering the returning TABLE schema
DROP FUNCTION IF EXISTS get_storefront_by_handle(text);
DROP FUNCTION IF EXISTS get_storefront_by_id(uuid);

-- Create or replace get_storefront_by_handle to include Scrydex metadata and filter soft-deleted items
CREATE OR REPLACE FUNCTION get_storefront_by_handle(p_handle text)
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
    cp.set_number as collector_number,
    cpc.market_price
  FROM profiles p
  LEFT JOIN inventory_items i ON p.id = i.owner_id AND i.status = 'FOR_SALE' AND i.deleted_at IS NULL
  LEFT JOIN catalog_products cp ON i.catalog_product_id = cp.id
  LEFT JOIN catalog_prices_current cpc ON cp.id = cpc.product_id
  WHERE p.handle = p_handle AND p.is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace get_storefront_by_id to include Scrydex metadata and filter soft-deleted items
CREATE OR REPLACE FUNCTION get_storefront_by_id(p_user_id uuid)
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
    cp.set_number as collector_number,
    cpc.market_price
  FROM profiles p
  LEFT JOIN inventory_items i ON p.id = i.owner_id AND i.status = 'FOR_SALE' AND i.deleted_at IS NULL
  LEFT JOIN catalog_products cp ON i.catalog_product_id = cp.id
  LEFT JOIN catalog_prices_current cpc ON cp.id = cpc.product_id
  WHERE p.id = p_user_id AND p.is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
