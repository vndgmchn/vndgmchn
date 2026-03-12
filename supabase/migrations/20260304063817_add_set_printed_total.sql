alter table public.catalog_products
  add column if not exists set_printed_total integer;