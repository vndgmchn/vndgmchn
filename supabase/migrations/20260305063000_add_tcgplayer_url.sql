-- Migration: add_tcgplayer_url_to_catalog_products
-- Description: Adds a new nullable text column to store matched TCGplayer product URLs.

ALTER TABLE public.catalog_products 
ADD COLUMN IF NOT EXISTS tcgplayer_url text;
