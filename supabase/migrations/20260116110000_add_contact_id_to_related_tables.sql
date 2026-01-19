
-- Add contact_id to related tables
ALTER TABLE public.comments ADD COLUMN contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE;
ALTER TABLE public.activities ADD COLUMN contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE;
ALTER TABLE public.reminders ADD COLUMN contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE;

-- Update RLS policies for comments
DROP POLICY IF EXISTS "Users can view comments on accessible leads" ON public.comments;
CREATE POLICY "Users can view comments on accessible records"
  ON public.comments FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin(auth.uid()) OR
    (lead_id IS NOT NULL AND public.can_access_lead(auth.uid(), lead_id)) OR
    (contact_id IS NOT NULL AND (
      public.is_super_admin(auth.uid()) OR 
      EXISTS (
        SELECT 1 FROM public.contacts c 
        WHERE c.id = contact_id AND (
          c.assigned_user_id = auth.uid() OR 
          (public.is_org_admin(auth.uid()))
        )
      )
    ))
  );

DROP POLICY IF EXISTS "Users can add comments to accessible leads" ON public.comments;
CREATE POLICY "Users can add comments to accessible records"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND (
      (lead_id IS NOT NULL AND public.can_access_lead(auth.uid(), lead_id)) OR
      (contact_id IS NOT NULL AND (
        public.is_super_admin(auth.uid()) OR 
        EXISTS (
          SELECT 1 FROM public.contacts c 
          WHERE c.id = contact_id AND (
            c.assigned_user_id = auth.uid() OR 
            (public.is_org_admin(auth.uid()))
          )
        )
      ))
    )
  );

-- Update RLS policies for activities
DROP POLICY IF EXISTS "Users can view activities on accessible leads" ON public.activities;
CREATE POLICY "Users can view activities on accessible records"
  ON public.activities FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin(auth.uid()) OR
    (lead_id IS NOT NULL AND public.can_access_lead(auth.uid(), lead_id)) OR
    (contact_id IS NOT NULL AND (
      public.is_super_admin(auth.uid()) OR 
      EXISTS (
        SELECT 1 FROM public.contacts c 
        WHERE c.id = contact_id AND (
          c.assigned_user_id = auth.uid() OR 
          (public.is_org_admin(auth.uid()))
        )
      )
    ))
  );

-- Update RLS policies for reminders
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminders;
CREATE POLICY "Users can view accessible reminders"
  ON public.reminders FOR SELECT
  USING (
    user_id = auth.uid() OR 
    public.is_super_admin(auth.uid()) OR
    (lead_id IS NOT NULL AND public.can_access_lead(auth.uid(), lead_id)) OR
    (contact_id IS NOT NULL AND (
      public.is_super_admin(auth.uid()) OR 
      EXISTS (
        SELECT 1 FROM public.contacts c 
        WHERE c.id = contact_id AND (
          c.assigned_user_id = auth.uid() OR 
          (public.is_org_admin(auth.uid()))
        )
      )
    ))
  );

-- Conversion RPC
CREATE OR REPLACE FUNCTION public.convert_lead_to_contact(
  _lead_id UUID,
  _converted_to_company TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _contact_id UUID;
  _lead_record RECORD;
BEGIN
  -- 1. Get lead data
  SELECT * INTO _lead_record FROM public.leads WHERE id = _lead_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  -- 2. Create contact
  INSERT INTO public.contacts (
    lead_id,
    full_name,
    email,
    phone,
    company,
    source,
    value,
    converted_to_company,
    assigned_user_id,
    group_id,
    notes,
    custom_fields,
    created_by,
    organization_id
  ) VALUES (
    _lead_record.id,
    _lead_record.full_name,
    _lead_record.email,
    _lead_record.phone,
    _lead_record.company,
    _lead_record.source::TEXT,
    _lead_record.value,
    _converted_to_company,
    _lead_record.assigned_user_id,
    _lead_record.group_id,
    _lead_record.notes,
    _lead_record.custom_fields,
    auth.uid(),
    _lead_record.organization_id
  )
  RETURNING id INTO _contact_id;

  -- 3. Update related records
  UPDATE public.comments SET contact_id = _contact_id WHERE lead_id = _lead_id;
  UPDATE public.activities SET contact_id = _contact_id WHERE lead_id = _lead_id;
  UPDATE public.reminders SET contact_id = _contact_id WHERE lead_id = _lead_id;
  UPDATE public.call_logs SET contact_id = _contact_id WHERE lead_id = _lead_id;

  -- 4. Mark lead as converted
  UPDATE public.leads SET status = 'converted' WHERE id = _lead_id;

  -- 5. Log activity
  INSERT INTO public.activities (
    contact_id,
    user_id,
    action,
    details,
    organization_id
  ) VALUES (
    _contact_id,
    auth.uid(),
    'lead_converted',
    jsonb_build_object('lead_id', _lead_id, 'contact_id', _contact_id),
    _lead_record.organization_id
  );

  RETURN _contact_id;
END;
$$;
