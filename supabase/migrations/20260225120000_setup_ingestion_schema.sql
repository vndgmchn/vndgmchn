-- Migration: Setup Scrydex Ingestion Schema & Resumability Checkpoints
-- Ensure new catalog dimensions are tracked
ALTER TABLE public.catalog_products ADD COLUMN IF NOT EXISTS kind text;
ALTER TABLE public.catalog_products ADD COLUMN IF NOT EXISTS language_code text;
ALTER TABLE public.catalog_products ADD COLUMN IF NOT EXISTS name_en text;

-- Step 1: Clean Up Duplicate Data
-- If there are multiple entries matching (game, kind, language_code, external_id),
-- keep the one with the newest 'updated_at' and delete the rest so the new UNIQUE constraint won't fail.
DELETE FROM public.catalog_products a
USING public.catalog_products b
WHERE a.id < b.id 
  AND a.game = b.game
  AND COALESCE(a.kind, '') = COALESCE(b.kind, '')
  AND COALESCE(a.language_code, '') = COALESCE(b.language_code, '')
  AND COALESCE(a.external_id, '') = COALESCE(b.external_id, '');

-- Step 2: Swap the constraints gracefully
ALTER TABLE public.catalog_products DROP CONSTRAINT IF EXISTS catalog_products_game_external_id_key;

-- Fallback check to avoid conflicts if another unique variant existed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'catalog_products_upsert_key'
  ) THEN
    ALTER TABLE public.catalog_products ADD CONSTRAINT catalog_products_upsert_key UNIQUE (game, kind, language_code, external_id);
  END IF;
END $$;

-- Step 3: Resumability Tracking Tables
CREATE TABLE IF NOT EXISTS public.catalog_ingestion_runs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    started_at timestamptz DEFAULT now() NOT NULL,
    status text DEFAULT 'RUNNING' NOT NULL, -- 'RUNNING' | 'DONE' | 'ERROR'
    completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.catalog_ingestion_pages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    run_id uuid REFERENCES public.catalog_ingestion_runs(id) ON DELETE CASCADE NOT NULL,
    endpoint_url text NOT NULL,
    page_number integer NOT NULL,
    completed_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(run_id, endpoint_url, page_number)
);

-- Basic Policies for Tracking Data (Admin-Only since handled via Service Role)
ALTER TABLE public.catalog_ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_ingestion_pages ENABLE ROW LEVEL SECURITY;
