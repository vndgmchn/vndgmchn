-- Mission A-Search-1: Update catalog schema to align with Scrydex
DO $$ 
BEGIN
  -- Rename title to name if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'catalog_products' 
      AND column_name = 'title'
  ) AND NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'catalog_products' 
      AND column_name = 'name'
  ) THEN
    ALTER TABLE public.catalog_products RENAME COLUMN title TO name;
  END IF;

  -- Rename set_number to collector_number if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'catalog_products' 
      AND column_name = 'set_number'
  ) AND NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'catalog_products' 
      AND column_name = 'collector_number'
  ) THEN
    ALTER TABLE public.catalog_products RENAME COLUMN set_number TO collector_number;
  END IF;
END $$;

ALTER TABLE public.catalog_products ADD COLUMN IF NOT EXISTS rarity text;
