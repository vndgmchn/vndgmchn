alter table public.catalog_prices_current
  add column if not exists source text;