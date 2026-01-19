import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type AppRole = 'super_admin' | 'admin' | 'manager' | 'agent';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  group_id: string | null;
  created_at: string;
  role?: AppRole;
  group?: {
    id: string;
    name: string;
  };
}

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    if (!user) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          group:groups(id, name)
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles if admin
      let rolesMap: Record<string, AppRole> = {};
      if (isAdmin) {
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (!rolesError && roles) {
          rolesMap = roles.reduce((acc, r) => {
            acc[r.user_id] = r.role as AppRole;
            return acc;
          }, {} as Record<string, AppRole>);
        }
      }

      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        role: rolesMap[profile.id] || 'agent',
      })) as UserProfile[];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error fetching users',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      await fetchUsers();
      toast({
        title: 'Role updated',
        description: 'User role has been changed.',
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error updating role',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateUserGroup = async (userId: string, groupId: string | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ group_id: groupId })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      toast({
        title: 'Group updated',
        description: 'User group has been changed.',
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

  const createUser = async (data: {
    email: string;
    password: string;
    fullName: string;
    role: AppRole;
    organizationId: string;
    groupId?: string | null;
  }) => {
    try {
      const { data: userId, error } = await supabase.rpc('admin_create_user', {
        _email: data.email,
        _password: data.password,
        _full_name: data.fullName,
        _role_name: data.role,
        _organization_id: data.organizationId,
        _group_id: data.groupId || null,
      });

      if (error) throw error;

      await fetchUsers();
      toast({
        title: 'User created',
        description: `User ${data.fullName} has been created successfully.`,
      });

      return { data: userId, error: null };
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error creating user',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        _user_id: userId,
      });

      if (error) throw error;

      await fetchUsers();
      toast({
        title: 'User deleted',
        description: 'The user account has been removed.',
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error deleting user',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      return { error };
    }
  };

  return {
    users,
    loading,
    createUser,
    updateUserRole,
    updateUserGroup,
    deleteUser,
    refetch: fetchUsers,
  };
}
