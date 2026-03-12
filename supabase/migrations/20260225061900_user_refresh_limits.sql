-- Create table to track user refresh rate limits
CREATE TABLE IF NOT EXISTS public.user_refresh_limits (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  refresh_count integer DEFAULT 0 NOT NULL,
  last_refresh_date date DEFAULT CURRENT_DATE NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_refresh_limits ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own limits
DROP POLICY IF EXISTS "Users can view their own refresh limits" ON public.user_refresh_limits;
CREATE POLICY "Users can view their own refresh limits" 
ON public.user_refresh_limits 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Service role can do everything
DROP POLICY IF EXISTS "Service role can manage refresh limits" ON public.user_refresh_limits;
CREATE POLICY "Service role can manage refresh limits" 
ON public.user_refresh_limits 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
