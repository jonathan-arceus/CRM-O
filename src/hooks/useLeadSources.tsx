import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface LeadSource {
  id: string;
  name: string;
  label: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useLeadSources() {
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSources = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error fetching lead sources:', error);
      toast({
        title: 'Error fetching sources',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const createSource = async (data: Omit<LeadSource, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase.from('lead_sources').insert(data);
      if (error) throw error;
      await fetchSources();
      toast({ title: 'Source created successfully' });
      return { error: null };
    } catch (error: any) {
      console.error('Error creating source:', error);
      toast({
        title: 'Error creating source',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateSource = async (id: string, updates: Partial<LeadSource>) => {
    try {
      const { error } = await supabase
        .from('lead_sources')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      await fetchSources();
      toast({ title: 'Source updated successfully' });
      return { error: null };
    } catch (error: any) {
      console.error('Error updating source:', error);
      toast({
        title: 'Error updating source',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const deleteSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lead_sources')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchSources();
      toast({ title: 'Source deleted successfully' });
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting source:', error);
      toast({
        title: 'Error deleting source',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const getDefaultSource = () => sources.find(s => s.is_default) || sources[0];

  return {
    sources,
    loading,
    createSource,
    updateSource,
    deleteSource,
    getDefaultSource,
    refetch: fetchSources,
  };
}
