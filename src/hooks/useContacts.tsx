import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Contact {
  id: string;
  lead_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  value: number | null;
  converted_at: string;
  converted_to_company: string | null;
  assigned_user_id: string | null;
  group_id: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assigned_user?: {
    full_name: string | null;
    email: string;
  } | null;
}

export interface CreateContactData {
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  value?: number;
  converted_to_company?: string;
  assigned_user_id?: string;
  group_id?: string;
  notes?: string;
  lead_id?: string;
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchContacts = useCallback(async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('converted_at', { ascending: false });

      if (error) throw error;

      // Fetch assigned user profiles
      const userIds = [...new Set((data || []).map(c => c.assigned_user_id).filter(Boolean))];
      let profilesMap: Record<string, { full_name: string | null; email: string }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = { full_name: p.full_name, email: p.email };
            return acc;
          }, {} as Record<string, { full_name: string | null; email: string }>);
        }
      }

      const contactsWithUsers = (data || []).map(contact => ({
        ...contact,
        custom_fields: (contact.custom_fields as Record<string, unknown>) || {},
        assigned_user: contact.assigned_user_id ? profilesMap[contact.assigned_user_id] || null : null,
      })) as Contact[];

      setContacts(contactsWithUsers);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const createContact = async (data: CreateContactData) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchContacts();
      toast({
        title: 'Contact created',
        description: `${data.full_name} has been added to contacts.`,
      });

      return { data: newContact, error: null };
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: 'Error creating contact',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const updateContact = async (id: string, updates: Record<string, unknown>) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;

      await fetchContacts();
      toast({
        title: 'Contact updated',
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating contact:', error);
      return { error };
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchContacts();
      toast({
        title: 'Contact deleted',
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: 'Error deleting contact',
        variant: 'destructive',
      });
      return { error };
    }
  };

  return {
    contacts,
    loading,
    createContact,
    updateContact,
    deleteContact,
    refetch: fetchContacts,
  };
}
