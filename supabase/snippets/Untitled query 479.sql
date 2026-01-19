
-- 1. Helper Function: is_org_admin
-- Checks if a user has a dynamic role with is_org_admin = true
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_dynamic_roles udr
    JOIN public.dynamic_roles dr ON dr.id = udr.role_id
    WHERE udr.user_id = _user_id AND dr.is_org_admin = true
  ) OR public.is_super_admin(_user_id)
$$;

-- 2. Ensure contact_id columns exist (Idempotent)
DO $$ 
BEGIN
    -- Add contact_id to comments if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'contact_id') THEN
        ALTER TABLE public.comments ADD COLUMN contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE;
    END IF;

    -- Add contact_id to activities if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'contact_id') THEN
        ALTER TABLE public.activities ADD COLUMN contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE;
    END IF;

    -- Add contact_id to reminders if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reminders' AND column_name = 'contact_id') THEN
        ALTER TABLE public.reminders ADD COLUMN contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Redefine has_role (app_role version) safely
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_dynamic_roles udr
    JOIN public.dynamic_roles dr ON dr.id = udr.role_id
    WHERE udr.user_id = _user_id AND dr.name = _role::TEXT
  ) OR public.is_super_admin(_user_id)
$$;

-- 4. New version of has_role (TEXT version)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_dynamic_roles udr
    JOIN public.dynamic_roles dr ON dr.id = udr.role_id
    WHERE udr.user_id = _user_id AND dr.name = _role_name
  ) OR public.is_super_admin(_user_id)
$$;

-- 5. Helper: get_user_role_name
CREATE OR REPLACE FUNCTION public.get_user_role_name(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dr.name FROM public.user_dynamic_roles udr
  JOIN public.dynamic_roles dr ON dr.id = udr.role_id
  WHERE udr.user_id = _user_id
  LIMIT 1
$$;

-- 6. Fix can_access_lead
CREATE OR REPLACE FUNCTION public.can_access_lead(_user_id UUID, _lead_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_org_id UUID;
  _user_group_id UUID;
  _lead_org_id UUID;
  _lead_group_id UUID;
  _lead_assigned_user_id UUID;
  _role_name TEXT;
  _is_super_admin BOOLEAN;
BEGIN
  _is_super_admin := public.is_super_admin(_user_id);
  IF _is_super_admin THEN RETURN TRUE; END IF;

  SELECT organization_id, group_id INTO _user_org_id, _user_group_id 
  FROM public.profiles WHERE id = _user_id;
  
  _role_name := public.get_user_role_name(_user_id);

  SELECT organization_id, group_id, assigned_user_id 
  INTO _lead_org_id, _lead_group_id, _lead_assigned_user_id 
  FROM public.leads WHERE id = _lead_id;

  IF _user_org_id IS NULL OR _user_org_id != _lead_org_id THEN
    RETURN FALSE;
  END IF;

  IF public.is_org_admin(_user_id) THEN
    RETURN TRUE;
  END IF;

  IF _role_name = 'manager' AND _user_group_id = _lead_group_id THEN
    RETURN TRUE;
  END IF;

  IF _lead_assigned_user_id = _user_id THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 7. Final refined convert_lead_to_contact RPC
CREATE OR REPLACE FUNCTION public.convert_lead_to_contact(
  _lead_id UUID,
  _converted_to_company TEXT DEFAULT NULL,
  _target_organization_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _contact_id UUID;
  _lead_record RECORD;
  _current_user_id UUID;
  _org_id UUID;
BEGIN
  SELECT * INTO _lead_record FROM public.leads WHERE id = _lead_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;

  _current_user_id := auth.uid();
  _org_id := COALESCE(_target_organization_id, _lead_record.organization_id);

  INSERT INTO public.contacts (
    lead_id, full_name, email, phone, company, source, value,
    converted_at, converted_to_company, assigned_user_id, group_id,
    notes, custom_fields, created_by, organization_id
  ) VALUES (
    _lead_record.id, _lead_record.full_name, _lead_record.email, _lead_record.phone,
    _lead_record.company, _lead_record.source::TEXT, _lead_record.value,
    now(), _converted_to_company, _lead_record.assigned_user_id, _lead_record.group_id,
    _lead_record.notes, _lead_record.custom_fields, _current_user_id, _org_id
  )
  RETURNING id INTO _contact_id;

  UPDATE public.comments SET contact_id = _contact_id, organization_id = _org_id WHERE lead_id = _lead_id;
  UPDATE public.activities SET contact_id = _contact_id, organization_id = _org_id WHERE lead_id = _lead_id;
  UPDATE public.reminders SET contact_id = _contact_id, organization_id = _org_id WHERE lead_id = _lead_id;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'call_logs' AND column_name = 'contact_id') THEN
    UPDATE public.call_logs SET contact_id = _contact_id, organization_id = _org_id WHERE lead_id = _lead_id;
  END IF;

  UPDATE public.leads SET status = 'converted' WHERE id = _lead_id;

  INSERT INTO public.activities (
    contact_id, user_id, action, details, organization_id
  ) VALUES (
    _contact_id, _current_user_id, 'lead_converted',
    jsonb_build_object('lead_id', _lead_id, 'contact_id', _contact_id, 'lead_name', _lead_record.full_name, 'target_organization_id', _org_id),
    _org_id
  );

  RETURN _contact_id;
END;
$$;
