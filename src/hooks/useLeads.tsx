import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useOrganization } from './useOrganization';
import { useToast } from './use-toast';

export type LeadStatus = 'new' | 'contacted' | 'follow_up' | 'converted' | 'lost';
export type LeadSource = 'website' | 'referral' | 'social_media' | 'email_campaign' | 'cold_call' | 'trade_show' | 'other';

export interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: LeadSource;
  status: LeadStatus;
  value: number | null;
  assigned_user_id: string | null;
  group_id: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
  created_by: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
  assigned_user?: {
    full_name: string | null;
    email: string;
  } | null;
}

export interface CreateLeadData {
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: LeadSource;
  status?: LeadStatus;
  value?: number;
  assigned_user_id?: string;
  group_id?: string;
  notes?: string;
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    if (!user) {
      setLeads([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch assigned user profiles separately
      const userIds = [...new Set((data || []).map(l => l.assigned_user_id).filter(Boolean))];
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

      const leadsWithUsers = (data || []).map(lead => ({
        ...lead,
        custom_fields: (lead.custom_fields as Record<string, unknown>) || {},
        assigned_user: lead.assigned_user_id ? profilesMap[lead.assigned_user_id] || null : null,
      })) as Lead[];

      setLeads(leadsWithUsers);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Error fetching leads',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const createLead = async (leadData: CreateLeadData) => {
    if (!user) return { error: new Error('Not authenticated') };

    const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';
    const orgId = organization?.id || DEFAULT_ORG_ID;

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...leadData,
          organization_id: orgId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchLeads();
      toast({
        title: 'Lead created',
        description: `${leadData.full_name} has been added.`,
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: 'Error creating lead',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const updateLead = async (id: string, updates: Record<string, unknown>) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;

      await fetchLeads();
      toast({
        title: 'Lead updated',
        description: 'Changes have been saved.',
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Error updating lead',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const bulkUpdateLeads = async (ids: string[], updates: Record<string, unknown>) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(updates as any)
        .in('id', ids);

      if (error) throw error;

      await fetchLeads();
      toast({
        title: 'Leads updated',
        description: `${ids.length} leads have been updated.`,
      });

      return { error: null };
    } catch (error) {
      console.error('Error bulk updating leads:', error);
      toast({
        title: 'Error updating leads',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchLeads();
      toast({
        title: 'Lead deleted',
        description: 'The lead has been removed.',
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Error deleting lead',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    return updateLead(id, { status });
  };

  return {
    leads,
    loading,
    createLead,
    updateLead,
    bulkUpdateLeads,
    deleteLead,
    updateLeadStatus,
    refetch: fetchLeads,
  };
}
