-- =====================================================
-- MULTI-TENANT ARCHITECTURE WITH DYNAMIC ROLES
-- =====================================================

-- 1. Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create organization settings table
CREATE TABLE public.organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  theme_mode TEXT NOT NULL DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'custom')),
  primary_color TEXT NOT NULL DEFAULT '#8B5CF6',
  secondary_color TEXT NOT NULL DEFAULT '#6366F1',
  button_style TEXT NOT NULL DEFAULT 'rounded' CHECK (button_style IN ('rounded', 'square', 'pill')),
  layout_preference TEXT NOT NULL DEFAULT 'default',
  crm_name TEXT NOT NULL DEFAULT 'CRM System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- 3. Create phone visibility settings table
CREATE TABLE public.phone_visibility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_id UUID NOT NULL,
  visibility_mode TEXT NOT NULL DEFAULT 'masked' CHECK (visibility_mode IN ('full', 'masked', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, role_id)
);

-- 4. Create telephony settings table
CREATE TABLE public.telephony_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  provider TEXT CHECK (provider IN ('twilio', 'vonage', 'sip', 'tel')),
  api_sid TEXT,
  api_token TEXT,
  api_endpoint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create call logs table
CREATE TABLE public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  call_status TEXT NOT NULL DEFAULT 'initiated',
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create dynamic roles table (replaces enum-based roles)
CREATE TABLE public.dynamic_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  is_org_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- 7. Create permissions table
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.dynamic_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- 9. Create page visibility settings
CREATE TABLE public.page_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.dynamic_roles(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, role_id, page_path)
);

-- 10. Create user_dynamic_roles to link users with dynamic roles
CREATE TABLE public.user_dynamic_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.dynamic_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- 11. Add organization_id to existing tables
ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.contacts ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.groups ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.reminders ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.activities ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.comments ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.lead_statuses ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.lead_sources ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.custom_field_definitions ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 12. Insert default organization and migrate data
INSERT INTO public.organizations (id, name, slug) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default');

-- 13. Update existing data to belong to default organization
UPDATE public.profiles SET organization_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.leads SET organization_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.contacts SET organization_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.groups SET organization_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.reminders SET organization_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.activities SET organization_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.comments SET organization_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.lead_statuses SET organization_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.lead_sources SET organization_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.custom_field_definitions SET organization_id = '00000000-0000-0000-0000-000000000001';

-- 14. Create default organization settings
INSERT INTO public.organization_settings (organization_id, crm_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'CRM System');

-- 15. Insert default permissions
INSERT INTO public.permissions (name, display_name, category, description) VALUES
  ('leads.view', 'View Leads', 'Leads', 'View leads list and details'),
  ('leads.create', 'Create Leads', 'Leads', 'Create new leads'),
  ('leads.edit', 'Edit Leads', 'Leads', 'Edit lead information'),
  ('leads.delete', 'Delete Leads', 'Leads', 'Delete leads'),
  ('leads.change_status', 'Change Lead Status', 'Leads', 'Change lead status'),
  ('leads.assign', 'Assign Leads', 'Leads', 'Assign leads to users'),
  ('contacts.view', 'View Contacts', 'Contacts', 'View contacts list and details'),
  ('contacts.create', 'Create Contacts', 'Contacts', 'Create new contacts'),
  ('contacts.edit', 'Edit Contacts', 'Contacts', 'Edit contact information'),
  ('contacts.delete', 'Delete Contacts', 'Contacts', 'Delete contacts'),
  ('reports.view', 'View Reports', 'Reports', 'Access reports and analytics'),
  ('reports.export', 'Export Reports', 'Reports', 'Export report data'),
  ('users.view', 'View Users', 'Users', 'View users list'),
  ('users.manage', 'Manage Users', 'Users', 'Create, edit, and delete users'),
  ('users.assign_roles', 'Assign Roles', 'Users', 'Assign roles to users'),
  ('groups.view', 'View Groups', 'Groups', 'View groups list'),
  ('groups.manage', 'Manage Groups', 'Groups', 'Create, edit, and delete groups'),
  ('settings.view', 'View Settings', 'Settings', 'View system settings'),
  ('settings.manage', 'Manage Settings', 'Settings', 'Manage system settings'),
  ('settings.telephony', 'Manage Telephony', 'Settings', 'Configure telephony settings'),
  ('settings.branding', 'Manage Branding', 'Settings', 'Configure branding and theme'),
  ('settings.phone_visibility', 'Manage Phone Visibility', 'Settings', 'Configure phone number visibility'),
  ('import.csv', 'Import CSV', 'Import', 'Upload leads via CSV'),
  ('click_to_call', 'Click to Call', 'Telephony', 'Make calls using click-to-call');

-- 16. Create default dynamic roles for default org
INSERT INTO public.dynamic_roles (id, organization_id, name, display_name, description, is_system_role, is_org_admin) VALUES
  ('00000000-0000-0000-0001-000000000001', NULL, 'super_admin', 'Super Admin', 'Full system access', true, true),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'admin', 'Admin', 'Organization administrator', false, true),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'manager', 'Manager', 'Team manager with group access', false, false),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'agent', 'Agent', 'Standard user with limited access', false, false);

-- 17. Assign all permissions to super_admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0001-000000000001', id FROM public.permissions;

-- 18. Assign admin permissions (all except system settings)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0001-000000000002', id FROM public.permissions 
WHERE name NOT IN ('settings.manage', 'settings.branding');

-- 19. Assign manager permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0001-000000000003', id FROM public.permissions 
WHERE name IN ('leads.view', 'leads.create', 'leads.edit', 'leads.change_status', 'leads.assign', 
               'contacts.view', 'contacts.create', 'contacts.edit', 'reports.view', 
               'users.view', 'groups.view', 'click_to_call');

-- 20. Assign agent permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0001-000000000004', id FROM public.permissions 
WHERE name IN ('leads.view', 'leads.edit', 'leads.change_status', 'contacts.view', 'click_to_call');

-- 21. Migrate existing user_roles to user_dynamic_roles
INSERT INTO public.user_dynamic_roles (user_id, organization_id, role_id)
SELECT 
  ur.user_id,
  '00000000-0000-0000-0000-000000000001',
  CASE 
    WHEN ur.role = 'super_admin' THEN '00000000-0000-0000-0001-000000000001'::UUID
    WHEN ur.role = 'admin' THEN '00000000-0000-0000-0001-000000000002'::UUID
    WHEN ur.role = 'manager' THEN '00000000-0000-0000-0001-000000000003'::UUID
    ELSE '00000000-0000-0000-0001-000000000004'::UUID
  END
FROM public.user_roles ur;

-- 22. Create helper functions for multi-tenant access

-- Get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = _user_id
$$;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_dynamic_roles udr
    JOIN public.dynamic_roles dr ON dr.id = udr.role_id
    WHERE udr.user_id = _user_id AND dr.name = 'super_admin' AND dr.is_system_role = true
  )
$$;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_dynamic_roles udr
    JOIN public.role_permissions rp ON rp.role_id = udr.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE udr.user_id = _user_id AND p.name = _permission
  ) OR public.is_super_admin(_user_id)
$$;

-- Get user's dynamic role for their org
CREATE OR REPLACE FUNCTION public.get_user_dynamic_role(_user_id UUID)
RETURNS public.dynamic_roles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dr.* FROM public.user_dynamic_roles udr
  JOIN public.dynamic_roles dr ON dr.id = udr.role_id
  WHERE udr.user_id = _user_id
  LIMIT 1
$$;

-- Check if user can access organization data
CREATE OR REPLACE FUNCTION public.can_access_organization(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id) OR 
         (SELECT organization_id FROM public.profiles WHERE id = _user_id) = _org_id
$$;

-- 23. Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_visibility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telephony_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dynamic_roles ENABLE ROW LEVEL SECURITY;

-- 24. RLS Policies for organizations
CREATE POLICY "Super admins can manage all organizations" ON public.organizations
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view their organization" ON public.organizations
  FOR SELECT USING (id = public.get_user_organization_id(auth.uid()));

-- 25. RLS Policies for organization_settings
CREATE POLICY "Super admins can manage all org settings" ON public.organization_settings
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view their org settings" ON public.organization_settings
  FOR SELECT USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Org admins can update their org settings" ON public.organization_settings
  FOR UPDATE USING (
    organization_id = public.get_user_organization_id(auth.uid()) 
    AND public.has_permission(auth.uid(), 'settings.branding')
  );

-- 26. RLS Policies for phone_visibility_settings
CREATE POLICY "Super admins can manage all phone visibility" ON public.phone_visibility_settings
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage org phone visibility" ON public.phone_visibility_settings
  FOR ALL USING (
    organization_id = public.get_user_organization_id(auth.uid()) 
    AND public.has_permission(auth.uid(), 'settings.phone_visibility')
  );

CREATE POLICY "Users can view their org phone visibility" ON public.phone_visibility_settings
  FOR SELECT USING (organization_id = public.get_user_organization_id(auth.uid()));

-- 27. RLS Policies for telephony_settings
CREATE POLICY "Super admins can manage all telephony" ON public.telephony_settings
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage org telephony" ON public.telephony_settings
  FOR ALL USING (
    organization_id = public.get_user_organization_id(auth.uid()) 
    AND public.has_permission(auth.uid(), 'settings.telephony')
  );

CREATE POLICY "Users can view their org telephony" ON public.telephony_settings
  FOR SELECT USING (organization_id = public.get_user_organization_id(auth.uid()));

-- 28. RLS Policies for call_logs
CREATE POLICY "Super admins can view all call logs" ON public.call_logs
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view org call logs" ON public.call_logs
  FOR SELECT USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create call logs" ON public.call_logs
  FOR INSERT WITH CHECK (
    user_id = auth.uid() 
    AND organization_id = public.get_user_organization_id(auth.uid())
    AND public.has_permission(auth.uid(), 'click_to_call')
  );

-- 29. RLS Policies for dynamic_roles
CREATE POLICY "Super admins can manage all roles" ON public.dynamic_roles
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view system roles" ON public.dynamic_roles
  FOR SELECT USING (is_system_role = true);

CREATE POLICY "Users can view their org roles" ON public.dynamic_roles
  FOR SELECT USING (organization_id = public.get_user_organization_id(auth.uid()));

-- 30. RLS Policies for permissions
CREATE POLICY "Everyone can view permissions" ON public.permissions
  FOR SELECT USING (true);

-- 31. RLS Policies for role_permissions
CREATE POLICY "Super admins can manage role permissions" ON public.role_permissions
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view role permissions" ON public.role_permissions
  FOR SELECT USING (true);

-- 32. RLS Policies for page_visibility
CREATE POLICY "Super admins can manage all page visibility" ON public.page_visibility
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view their org page visibility" ON public.page_visibility
  FOR SELECT USING (organization_id = public.get_user_organization_id(auth.uid()));

-- 33. RLS Policies for user_dynamic_roles
CREATE POLICY "Super admins can manage all user roles" ON public.user_dynamic_roles
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can manage their org user roles" ON public.user_dynamic_roles
  FOR ALL USING (
    organization_id = public.get_user_organization_id(auth.uid())
    AND public.has_permission(auth.uid(), 'users.assign_roles')
  );

CREATE POLICY "Users can view their own role" ON public.user_dynamic_roles
  FOR SELECT USING (user_id = auth.uid());

-- 34. Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phone_visibility_settings_updated_at
  BEFORE UPDATE ON public.phone_visibility_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telephony_settings_updated_at
  BEFORE UPDATE ON public.telephony_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dynamic_roles_updated_at
  BEFORE UPDATE ON public.dynamic_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_visibility_updated_at
  BEFORE UPDATE ON public.page_visibility
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 35. Create indexes for performance
CREATE INDEX idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX idx_leads_organization_id ON public.leads(organization_id);
CREATE INDEX idx_contacts_organization_id ON public.contacts(organization_id);
CREATE INDEX idx_groups_organization_id ON public.groups(organization_id);
CREATE INDEX idx_user_dynamic_roles_user_id ON public.user_dynamic_roles(user_id);
CREATE INDEX idx_user_dynamic_roles_org_id ON public.user_dynamic_roles(organization_id);
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_call_logs_organization_id ON public.call_logs(organization_id);
CREATE INDEX idx_page_visibility_org_role ON public.page_visibility(organization_id, role_id);