-- Create roles
create role anon noinherit nologin;
create role authenticated noinherit nologin;
create role service_role noinherit nologin bypassrls;
create role supabase_admin noinherit nologin superuser;
create role supabase_auth_admin noinherit login password 'your-super-secret-password' nobypassrls;
create role supabase_storage_admin noinherit login password 'your-super-secret-password' nobypassrls;
create role dashboard_user noinherit nologin;

create role authenticator noinherit login password 'your-super-secret-password' noreplication;
grant anon to authenticator;
grant authenticated to authenticator;
grant service_role to authenticator;
grant supabase_admin to authenticator;
