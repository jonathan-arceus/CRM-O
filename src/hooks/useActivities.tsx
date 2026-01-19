import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Activity {
  id: string;
  lead_id: string | null;
  contact_id: string | null;
  user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  user?: {
    full_name: string | null;
    email: string;
  };
  lead?: {
    full_name: string;
  };
  contact?: {
    full_name: string;
  };
}

export function useActivities(id?: string, type: 'lead' | 'contact' = 'lead') {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50) as any;

      if (id) {
        if (type === 'lead') {
          query = query.eq('lead_id', id);
        } else {
          query = query.eq('contact_id', id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch related profiles, leads, and contacts separately
      const userIds = [...new Set(((data as any[]) || []).map(a => a.user_id).filter(Boolean))] as string[];
      const leadIds = [...new Set(((data as any[]) || []).map(a => a.lead_id).filter(Boolean))] as string[];
      const contactIds = [...new Set(((data as any[]) || []).map(a => a.contact_id).filter(Boolean))] as string[];

      let profilesMap: Record<string, { full_name: string | null; email: string }> = {};
      let leadsMap: Record<string, { full_name: string }> = {};
      let contactsMap: Record<string, { full_name: string }> = {};

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

      if (leadIds.length > 0) {
        const { data: leads } = await supabase
          .from('leads')
          .select('id, full_name')
          .in('id', leadIds);

        if (leads) {
          leadsMap = leads.reduce((acc, l) => {
            acc[l.id] = { full_name: l.full_name };
            return acc;
          }, {} as Record<string, { full_name: string }>);
        }
      }

      if (contactIds.length > 0) {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, full_name')
          .in('id', contactIds);

        if (contacts) {
          contactsMap = contacts.reduce((acc, c) => {
            acc[c.id] = { full_name: c.full_name };
            return acc;
          }, {} as Record<string, { full_name: string }>);
        }
      }

      const activitiesWithRelations = (data || []).map((activity: any) => ({
        ...activity,
        details: (activity.details as Record<string, unknown>) || {},
        user: activity.user_id ? profilesMap[activity.user_id] : undefined,
        lead: activity.lead_id ? leadsMap[activity.lead_id] : undefined,
        contact: activity.contact_id ? contactsMap[activity.contact_id] : undefined,
      })) as Activity[];

      setActivities(activitiesWithRelations);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [user, id, type]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const addActivity = async (action: string, details: Record<string, unknown> = {}) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const activityData: any = {
        user_id: user.id,
        action,
        details,
      };

      if (id) {
        if (type === 'lead') {
          activityData.lead_id = id;
        } else {
          activityData.contact_id = id;
        }
      }

      const { error } = await supabase
        .from('activities')
        .insert(activityData);

      if (error) throw error;

      await fetchActivities();
      return { error: null };
    } catch (error) {
      console.error('Error adding activity:', error);
      return { error };
    }
  };

  return {
    activities,
    loading,
    addActivity,
    refetch: fetchActivities,
  };
}
