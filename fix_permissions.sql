
-- Enable RLS (just in case)
ALTER TABLE public.user_dynamic_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be restrictive
DROP POLICY IF EXISTS "Authenticated users can view dynamic roles" ON public.dynamic_roles;
DROP POLICY IF EXISTS "Authenticated users can view user dynamic roles" ON public.user_dynamic_roles;

-- Create permissive policies for authenticated users
CREATE POLICY "Authenticated users can view dynamic roles" 
ON public.dynamic_roles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can view user dynamic roles" 
ON public.user_dynamic_roles FOR SELECT 
TO authenticated 
USING (true);

-- Ensure the view is accessible
GRANT SELECT ON public.user_roles TO authenticated;
