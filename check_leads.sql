-- Check if any leads exist in the database
SELECT COUNT(*) as total_leads FROM public.leads;

-- Check the most recent leads
SELECT id, full_name, email, organization_id, created_at 
FROM public.leads 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if default organization exists
SELECT id, name, slug FROM public.organizations WHERE id = '00000000-0000-0000-0000-000000000001';
