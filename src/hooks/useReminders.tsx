import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Reminder {
  id: string;
  lead_id: string | null;
  contact_id: string | null;
  user_id: string;
  reminder_type: string;
  reminder_date: string;
  notes: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  lead?: {
    full_name: string;
    company: string | null;
  } | null;
  contact?: {
    full_name: string;
    company: string | null;
  } | null;
}

export interface CreateReminderData {
  lead_id?: string;
  contact_id?: string;
  reminder_type: string;
  reminder_date: string;
  notes?: string;
}

export function useReminders(id?: string, type: 'lead' | 'contact' = 'lead') {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReminders = useCallback(async () => {
    if (!user) {
      setReminders([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('reminders')
        .select('*')
        .order('reminder_date', { ascending: true });

      if (id) {
        if (type === 'lead') {
          query = query.eq('lead_id', id);
        } else {
          query = query.eq('contact_id', id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch lead info
      const leadIds = [...new Set((data || []).map(r => r.lead_id).filter(Boolean))];
      const contactIds = [...new Set((data || []).map(r => r.contact_id).filter(Boolean))];

      let leadsMap: Record<string, { full_name: string; company: string | null }> = {};
      let contactsMap: Record<string, { full_name: string; company: string | null }> = {};

      if (leadIds.length > 0) {
        const { data: leads } = await supabase
          .from('leads')
          .select('id, full_name, company')
          .in('id', leadIds);

        if (leads) {
          leadsMap = leads.reduce((acc, l) => {
            acc[l.id] = { full_name: l.full_name, company: l.company };
            return acc;
          }, {} as Record<string, { full_name: string; company: string | null }>);
        }
      }

      if (contactIds.length > 0) {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, full_name, company')
          .in('id', contactIds);

        if (contacts) {
          contactsMap = contacts.reduce((acc, c) => {
            acc[c.id] = { full_name: c.full_name, company: c.company };
            return acc;
          }, {} as Record<string, { full_name: string; company: string | null }>);
        }
      }

      const remindersWithRelations = (data || []).map(reminder => ({
        ...reminder,
        lead: reminder.lead_id ? leadsMap[reminder.lead_id] || null : null,
        contact: reminder.contact_id ? contactsMap[reminder.contact_id] || null : null,
      })) as Reminder[];

      setReminders(remindersWithRelations);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  }, [user, id, type]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const createReminder = async (data: CreateReminderData) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('reminders')
        .insert({
          ...data,
          user_id: user.id,
        });

      if (error) throw error;

      await fetchReminders();
      toast({
        title: 'Reminder created',
        description: 'You will be reminded on the scheduled date.',
      });

      return { error: null };
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast({
        title: 'Error creating reminder',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchReminders();
      return { error: null };
    } catch (error) {
      console.error('Error updating reminder:', error);
      return { error };
    }
  };

  const completeReminder = async (id: string) => {
    return updateReminder(id, { is_completed: true });
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchReminders();
      toast({
        title: 'Reminder deleted',
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting reminder:', error);
      return { error };
    }
  };

  // Get upcoming reminders (not completed, in the future or today)
  const upcomingReminders = reminders.filter(r => !r.is_completed);
  const overdueReminders = reminders.filter(r => !r.is_completed && new Date(r.reminder_date) < new Date());

  return {
    reminders,
    upcomingReminders,
    overdueReminders,
    loading,
    createReminder,
    updateReminder,
    completeReminder,
    deleteReminder,
    refetch: fetchReminders,
  };
}
