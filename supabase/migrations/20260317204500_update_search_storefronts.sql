-- Safely update search_storefronts RPC to include theme_preset for themed marketplace cards.
-- Postgres requires dropping the function first when changing the RETURNS TABLE structure.

DROP FUNCTION IF EXISTS public.search_storefronts(text);

CREATE FUNCTION public.search_storefronts(query text)
RETURNS TABLE (
  user_id       uuid,
  handle        text,
  display_name  text,
  bio           text,
  avatar_url    text,
  is_public     boolean,
  theme_preset  text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  q text := lower(trim(query));
BEGIN
  RETURN QUERY
  SELECT
    p.id          AS user_id,
    p.handle,
    p.display_name,
    p.bio,
    p.avatar_url,
    p.is_public,
    p.theme_preset
  FROM public.profiles p
  WHERE
    p.is_public = true
    AND (
      p.handle        ILIKE '%' || q || '%'
      OR p.display_name ILIKE '%' || q || '%'
    )
  ORDER BY
    CASE
      WHEN p.handle = q                        THEN 0  -- exact handle match
      WHEN p.handle ILIKE q || '%'             THEN 1  -- handle prefix match
      WHEN p.display_name ILIKE q || '%'       THEN 2  -- display_name prefix match
      ELSE                                          3  -- other substring match
    END ASC,
    p.handle ASC
  LIMIT 20;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_storefronts(text) TO anon, authenticated;
