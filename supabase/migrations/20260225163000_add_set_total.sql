-- Migration: Add set_total to catalog_products
-- Purpose: Support rendering "... ###/###" dynamically in catalog search and marketplace UI

ALTER TABLE public.catalog_products
ADD COLUMN IF NOT EXISTS set_total integer DEFAULT NULL;

COMMENT ON COLUMN public.catalog_products.set_total IS 'The total cards present in this product''s expansion/set (e.g. 102 for Base Set), used to render fractions like 4/102.';
