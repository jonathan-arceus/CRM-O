
DROP VIEW IF EXISTS public.user_roles;
DROP TABLE IF EXISTS public.user_roles;

CREATE VIEW public.user_roles AS
SELECT 
  udr.id,
  udr.user_id,
  dr.name as role 
FROM public.user_dynamic_roles udr
JOIN public.dynamic_roles dr ON dr.id = udr.role_id;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.user_roles TO anon;
GRANT SELECT ON public.user_roles TO service_role;
