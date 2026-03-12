-- Migration to finalize market price caching and snapshots

-- ==============================================================================
-- 1) CURRENT PRICES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.catalog_prices_current (
    product_id uuid PRIMARY KEY REFERENCES public.catalog_products(id) ON DELETE CASCADE,
    market_price numeric NOT NULL DEFAULT 0,
    currency text NOT NULL DEFAULT 'USD',
    last_updated timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
    -- Ensure existing table handles new defaults/constraints safely
    UPDATE public.catalog_prices_current SET currency = 'USD' WHERE currency IS NULL;
    
    ALTER TABLE public.catalog_prices_current ALTER COLUMN currency SET DEFAULT 'USD';
    ALTER TABLE public.catalog_prices_current ALTER COLUMN currency SET NOT NULL;
    
    ALTER TABLE public.catalog_prices_current ALTER COLUMN market_price SET DEFAULT 0;
END $$;

-- ==============================================================================
-- 2) PRICE SNAPSHOTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.catalog_price_snapshots (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.catalog_products(id) ON DELETE CASCADE,
    market_price numeric NOT NULL,
    captured_at timestamptz NOT NULL DEFAULT now()
);

-- Safely rename 'recorded_at' to 'captured_at' if it exists from older schema versions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'catalog_price_snapshots' 
        AND column_name = 'recorded_at'
    ) THEN
        ALTER TABLE public.catalog_price_snapshots RENAME COLUMN recorded_at TO captured_at;
    END IF;
END $$;

-- ==============================================================================
-- 3) INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_catalog_prices_current_last_updated 
ON public.catalog_prices_current(last_updated);

CREATE INDEX IF NOT EXISTS idx_catalog_price_snapshots_product_as_of
ON public.catalog_price_snapshots(product_id, as_of DESC);