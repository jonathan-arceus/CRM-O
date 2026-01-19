<<<<<<< HEAD
-- Check if import.csv permission exists and is assigned to super_admin role
SELECT 
  p.name as permission_name,
  p.display_name,
  dr.name as role_name,
  dr.display_name as role_display_name,
  dr.is_system_role
FROM permissions p
LEFT JOIN role_permissions rp ON rp.permission_id = p.id
LEFT JOIN dynamic_roles dr ON dr.id = rp.role_id
WHERE p.name = 'import.csv'
ORDER BY dr.name;

-- Check current user's role and permissions
SELECT 
  udr.user_id,
  dr.name as role_name,
  dr.display_name as role_display_name,
  array_agg(p.name) as permissions
FROM user_dynamic_roles udr
JOIN dynamic_roles dr ON dr.id = udr.role_id
LEFT JOIN role_permissions rp ON rp.role_id = dr.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE udr.user_id = '9e54ad6f-f966-4a61-be29-9e8a3ece7a11'  -- admin user ID from earlier
GROUP BY udr.user_id, dr.name, dr.display_name;
=======
-- Check if import.csv permission exists and is assigned to super_admin role
SELECT 
  p.name as permission_name,
  p.display_name,
  dr.name as role_name,
  dr.display_name as role_display_name,
  dr.is_system_role
FROM permissions p
LEFT JOIN role_permissions rp ON rp.permission_id = p.id
LEFT JOIN dynamic_roles dr ON dr.id = rp.role_id
WHERE p.name = 'import.csv'
ORDER BY dr.name;

-- Check current user's role and permissions
SELECT 
  udr.user_id,
  dr.name as role_name,
  dr.display_name as role_display_name,
  array_agg(p.name) as permissions
FROM user_dynamic_roles udr
JOIN dynamic_roles dr ON dr.id = udr.role_id
LEFT JOIN role_permissions rp ON rp.role_id = dr.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE udr.user_id = '9e54ad6f-f966-4a61-be29-9e8a3ece7a11'  -- admin user ID from earlier
GROUP BY udr.user_id, dr.name, dr.display_name;
>>>>>>> a429b972435d22227dbc2bcbd5e076c8cd0980bd
