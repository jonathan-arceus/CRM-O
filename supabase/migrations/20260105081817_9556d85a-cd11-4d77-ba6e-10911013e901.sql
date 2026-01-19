-- Create reminders table for follow-up/callback reminders
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'follow_up',
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contacts table for converted leads
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT NOT NULL DEFAULT 'other',
  value NUMERIC,
  converted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_to_company TEXT,
  assigned_user_id UUID,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Reminders RLS policies
CREATE POLICY "Users can view their own reminders"
  ON public.reminders FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create reminders"
  ON public.reminders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reminders"
  ON public.reminders FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reminders"
  ON public.reminders FOR DELETE
  USING (user_id = auth.uid());

-- Contacts RLS policies (similar to leads)
CREATE POLICY "Users can view accessible contacts"
  ON public.contacts FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    (has_role(auth.uid(), 'manager') AND group_id = get_user_group_id(auth.uid())) OR 
    assigned_user_id = auth.uid()
  );

CREATE POLICY "Authenticated users can create contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update accessible contacts"
  ON public.contacts FOR UPDATE
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    (has_role(auth.uid(), 'manager') AND group_id = get_user_group_id(auth.uid())) OR 
    assigned_user_id = auth.uid()
  );

CREATE POLICY "Admins can delete contacts"
  ON public.contacts FOR DELETE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on reminders
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on contacts
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();