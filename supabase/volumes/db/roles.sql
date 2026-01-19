-- Create roles
create role anon noinherit nologin;
create role authenticated noinherit nologin;
create role service_role noinherit nologin bypassrls;
create role supabase_admin noinherit nologin superuser;
create role supabase_auth_admin noinherit nologin nobypassrls;
create role supabase_storage_admin noinherit nologin nobypassrls;
create role dashboard_user noinherit nologin;

create role authenticator noinherit login noreplication;
grant anon to authenticator;
grant authenticated to authenticator;
grant service_role to authenticator;
grant supabase_admin to authenticator;
