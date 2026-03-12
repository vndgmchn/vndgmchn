alter table public.catalog_products
  add column if not exists set_name_en text,
  add column if not exists search_name_en text,
  add column if not exists search_set_en text,
  add column if not exists op_cost text,
  add column if not exists op_power text,
  add column if not exists op_counter text,
  add column if not exists op_attribute text,
  add column if not exists op_type text,
  add column if not exists op_colors text[];