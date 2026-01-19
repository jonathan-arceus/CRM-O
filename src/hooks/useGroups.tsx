import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('name');

      if (error) throw error;

      // Get member counts
      const { data: profiles } = await supabase
        .from('profiles')
        .select('group_id');

      const memberCounts: Record<string, number> = {};
      (profiles || []).forEach(p => {
        if (p.group_id) {
          memberCounts[p.group_id] = (memberCounts[p.group_id] || 0) + 1;
        }
      });

      const groupsWithCounts = (data || []).map(group => ({
        ...group,
        member_count: memberCounts[group.id] || 0,
      }));

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: 'Error fetching groups',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (name: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .insert({ name, description })
        .select()
        .single();

      if (error) throw error;

      await fetchGroups();
      toast({
        title: 'Group created',
        description: `${name} has been created.`,
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error creating group',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const updateGroup = async (id: string, updates: Partial<Group>) => {
    try {
      const { error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchGroups();
      toast({
        title: 'Group updated',
        description: 'Changes have been saved.',
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: 'Error updating group',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchGroups();
      toast({
        title: 'Group deleted',
        description: 'The group has been removed.',
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Error deleting group',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return { error };
    }
  };

  return {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    refetch: fetchGroups,
  };
}
