import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface LeadStatus {
  id: string;
  name: string;
  label: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useLeadStatuses() {
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStatuses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('lead_statuses')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setStatuses(data || []);
    } catch (error) {
      console.error('Error fetching lead statuses:', error);
      toast({
        title: 'Error fetching statuses',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const createStatus = async (data: Omit<LeadStatus, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase.from('lead_statuses').insert(data);
      if (error) throw error;
      await fetchStatuses();
      toast({ title: 'Status created successfully' });
      return { error: null };
    } catch (error: any) {
      console.error('Error creating status:', error);
      toast({
        title: 'Error creating status',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateStatus = async (id: string, updates: Partial<LeadStatus>) => {
    try {
      const { error } = await supabase
        .from('lead_statuses')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      await fetchStatuses();
      toast({ title: 'Status updated successfully' });
      return { error: null };
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const deleteStatus = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lead_statuses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchStatuses();
      toast({ title: 'Status deleted successfully' });
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting status:', error);
      toast({
        title: 'Error deleting status',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const getDefaultStatus = () => statuses.find(s => s.is_default) || statuses[0];

  return {
    statuses,
    loading,
    createStatus,
    updateStatus,
    deleteStatus,
    getDefaultStatus,
    refetch: fetchStatuses,
  };
}
