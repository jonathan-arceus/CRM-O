-- Check profile of super admin
SELECT id, email, organization_id FROM public.profiles WHERE email = 'admin@example.com';

-- Check roles of super admin
SELECT udr.*, dr.name as role_name 
FROM public.user_dynamic_roles udr
JOIN public.dynamic_roles dr ON dr.id = udr.role_id
WHERE udr.user_id = (SELECT id FROM public.profiles WHERE email = 'admin@example.com');

-- Check if organization_settings exists for the default org
SELECT * FROM public.organization_settings WHERE organization_id = '00000000-0000-0000-0000-000000000001';
