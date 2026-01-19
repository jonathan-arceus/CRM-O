-- =============================================
-- DYNAMIC LEAD STATUSES TABLE
-- =============================================
CREATE TABLE public.lead_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default statuses based on existing enum
INSERT INTO public.lead_statuses (name, label, color, sort_order, is_default) VALUES
  ('new', 'New', '#3b82f6', 1, true),
  ('contacted', 'Contacted', '#8b5cf6', 2, false),
  ('qualified', 'Qualified', '#06b6d4', 3, false),
  ('proposal', 'Proposal', '#f59e0b', 4, false),
  ('negotiation', 'Negotiation', '#ec4899', 5, false),
  ('won', 'Won', '#22c55e', 6, false),
  ('lost', 'Lost', '#ef4444', 7, false);

ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view lead statuses"
  ON public.lead_statuses FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage lead statuses"
  ON public.lead_statuses FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- =============================================
-- DYNAMIC LEAD SOURCES TABLE
-- =============================================
CREATE TABLE public.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default sources based on existing enum
INSERT INTO public.lead_sources (name, label, color, sort_order, is_default) VALUES
  ('website', 'Website', '#3b82f6', 1, true),
  ('referral', 'Referral', '#22c55e', 2, false),
  ('social', 'Social Media', '#8b5cf6', 3, false),
  ('advertisement', 'Advertisement', '#f59e0b', 4, false),
  ('cold_call', 'Cold Call', '#06b6d4', 5, false),
  ('email', 'Email Campaign', '#ec4899', 6, false),
  ('other', 'Other', '#6b7280', 7, false);

ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view lead sources"
  ON public.lead_sources FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage lead sources"
  ON public.lead_sources FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- =============================================
-- CUSTOM FIELD DEFINITIONS TABLE
-- =============================================
CREATE TABLE public.custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL UNIQUE,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'dropdown', 'textarea')),
  dropdown_options JSONB DEFAULT '[]'::jsonb,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active custom fields"
  ON public.custom_field_definitions FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage custom fields"
  ON public.custom_field_definitions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- =============================================
-- SYSTEM SETTINGS TABLE
-- =============================================
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default settings
INSERT INTO public.system_settings (setting_key, setting_value) VALUES
  ('branding', '{"crm_name": "CRM System", "logo_url": null}'::jsonb),
  ('integrations', '{"webhooks": [], "api_keys": {}}'::jsonb);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view settings"
  ON public.system_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can manage settings"
  ON public.system_settings FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- AUDIT LOG FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.log_audit_action(
  _action TEXT,
  _entity_type TEXT,
  _entity_id UUID DEFAULT NULL,
  _old_values JSONB DEFAULT NULL,
  _new_values JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (auth.uid(), _action, _entity_type, _entity_id, _old_values, _new_values)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- =============================================
-- UPDATE TIMESTAMPS TRIGGERS
-- =============================================
CREATE TRIGGER update_lead_statuses_updated_at
  BEFORE UPDATE ON public.lead_statuses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_sources_updated_at
  BEFORE UPDATE ON public.lead_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_field_definitions_updated_at
  BEFORE UPDATE ON public.custom_field_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();