import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  category: string;
  description: string | null;
}

export interface DynamicRole {
  id: string;
  organization_id: string | null;
  name: string;
  display_name: string;
  description: string | null;
  is_system_role: boolean;
  is_org_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleWithPermissions extends DynamicRole {
  permissions: Permission[];
}

export interface PageVisibility {
  id: string;
  organization_id: string;
  role_id: string;
  page_path: string;
  is_visible: boolean;
}

interface PermissionsContextType {
  permissions: Permission[];
  roles: RoleWithPermissions[];
  userRole: DynamicRole | null;
  userPermissions: string[];
  pageVisibility: PageVisibility[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  canViewPage: (path: string) => boolean;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  createRole: (role: Partial<DynamicRole>) => Promise<{ data: DynamicRole | null; error: any }>;
  updateRole: (id: string, updates: Partial<DynamicRole>) => Promise<{ error: any }>;
  deleteRole: (id: string) => Promise<{ error: any }>;
  setRolePermissions: (roleId: string, permissionIds: string[]) => Promise<{ error: any }>;
  setPageVisibility: (roleId: string, pagePath: string, isVisible: boolean) => Promise<{ error: any }>;
  assignRoleToUser: (userId: string, roleId: string, organizationId: string) => Promise<{ error: any }>;
  refetch: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [userRole, setUserRole] = useState<DynamicRole | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [pageVisibilityState, setPageVisibilityState] = useState<PageVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPermissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('dynamic_roles')
        .select('*')
        .order('created_at', { ascending: true });

      if (rolesError) throw rolesError;

      // Fetch role permissions
      const { data: rolePerms } = await supabase
        .from('role_permissions')
        .select('role_id, permission_id');

      const { data: allPerms } = await supabase
        .from('permissions')
        .select('*');

      const rolesWithPerms = (rolesData || []).map(role => {
        const rolePermIds = (rolePerms || [])
          .filter(rp => rp.role_id === role.id)
          .map(rp => rp.permission_id);
        const perms = (allPerms || []).filter(p => rolePermIds.includes(p.id));
        return { ...role, permissions: perms } as RoleWithPermissions;
      });

      setRoles(rolesWithPerms);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  }, []);

  const fetchUserRole = useCallback(async () => {
    if (!user) {
      setUserRole(null);
      setUserPermissions([]);
      setLoading(false);
      return;
    }

    try {
      // Get user's dynamic role
      const { data: userDynamicRole } = await supabase
        .from('user_dynamic_roles')
        .select('role_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userDynamicRole) {
        const { data: roleData } = await supabase
          .from('dynamic_roles')
          .select('*')
          .eq('id', userDynamicRole.role_id)
          .maybeSingle();

        if (roleData) {
          setUserRole(roleData as DynamicRole);

          // Fetch permissions for this role
          const { data: rolePerms } = await supabase
            .from('role_permissions')
            .select('permission_id')
            .eq('role_id', roleData.id);

          if (rolePerms && rolePerms.length > 0) {
            const { data: perms } = await supabase
              .from('permissions')
              .select('name')
              .in('id', rolePerms.map(rp => rp.permission_id));

            setUserPermissions((perms || []).map(p => p.name));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPageVisibilityFn = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('page_visibility')
        .select('*');

      if (error) throw error;
      setPageVisibilityState((data as PageVisibility[]) || []);
    } catch (error) {
      console.error('Error fetching page visibility:', error);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
    fetchRoles();
    fetchUserRole();
    fetchPageVisibilityFn();
  }, [fetchPermissions, fetchRoles, fetchUserRole, fetchPageVisibilityFn]);

  const refetch = async () => {
    await Promise.all([fetchPermissions(), fetchRoles(), fetchUserRole(), fetchPageVisibilityFn()]);
  };

  const isSuperAdmin = userRole?.name === 'super_admin' && userRole?.is_system_role === true;
  const isOrgAdmin = isSuperAdmin || (userRole?.is_org_admin === true);

  const hasPermission = (permission: string): boolean => {
    if (isSuperAdmin) return true;
    return userPermissions.includes(permission);
  };

  const canViewPage = (path: string): boolean => {
    if (isSuperAdmin) return true;
    if (!userRole) return false;

    const visibility = pageVisibilityState.find(
      pv => pv.role_id === userRole.id && pv.page_path === path
    );

    // If no visibility record exists, default to visible
    return visibility?.is_visible ?? true;
  };

  const createRole = async (roleData: Partial<DynamicRole>) => {
    try {
      const insertData = {
        name: roleData.name!,
        display_name: roleData.display_name!,
        description: roleData.description,
        organization_id: roleData.organization_id,
        is_system_role: roleData.is_system_role ?? false,
        is_org_admin: roleData.is_org_admin ?? false,
      };
      const { data, error } = await supabase
        .from('dynamic_roles')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      await fetchRoles();
      toast({ title: 'Role created successfully' });
      return { data: data as DynamicRole, error: null };
    } catch (error: any) {
      toast({ title: 'Error creating role', description: error.message, variant: 'destructive' });
      return { data: null, error };
    }
  };

  const updateRole = async (id: string, updates: Partial<DynamicRole>) => {
    try {
      const { error } = await supabase
        .from('dynamic_roles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchRoles();
      toast({ title: 'Role updated successfully' });
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error updating role', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  const deleteRole = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dynamic_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchRoles();
      toast({ title: 'Role deleted successfully' });
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error deleting role', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  const setRolePermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      // Delete existing permissions
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      // Insert new permissions
      if (permissionIds.length > 0) {
        const { error } = await supabase
          .from('role_permissions')
          .insert(permissionIds.map(permissionId => ({
            role_id: roleId,
            permission_id: permissionId,
          })));

        if (error) throw error;
      }

      await fetchRoles();
      toast({ title: 'Permissions updated successfully' });
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error updating permissions', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  const setPageVisibility = async (roleId: string, pagePath: string, isVisible: boolean) => {
    try {
      const { data: existing } = await supabase
        .from('page_visibility')
        .select('id')
        .eq('role_id', roleId)
        .eq('page_path', pagePath)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('page_visibility')
          .update({ is_visible: isVisible })
          .eq('id', existing.id);
      } else {
        // Get organization_id from role
        const { data: role } = await supabase
          .from('dynamic_roles')
          .select('organization_id')
          .eq('id', roleId)
          .single();

        if (role?.organization_id) {
          await supabase
            .from('page_visibility')
            .insert({
              organization_id: role.organization_id,
              role_id: roleId,
              page_path: pagePath,
              is_visible: isVisible,
            });
        }
      }

      await fetchPageVisibilityFn();
      toast({ title: 'Page visibility updated' });
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error updating page visibility', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  const assignRoleToUser = async (userId: string, roleId: string, organizationId: string) => {
    try {
      const { data: existing } = await supabase
        .from('user_dynamic_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_dynamic_roles')
          .update({ role_id: roleId })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_dynamic_roles')
          .insert({ user_id: userId, role_id: roleId, organization_id: organizationId });
      }

      toast({ title: 'Role assigned successfully' });
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error assigning role', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  return (
    <PermissionsContext.Provider value={{
      permissions,
      roles,
      userRole,
      userPermissions,
      pageVisibility: pageVisibilityState,
      loading,
      hasPermission,
      canViewPage,
      isSuperAdmin,
      isOrgAdmin,
      createRole,
      updateRole,
      deleteRole,
      setRolePermissions,
      setPageVisibility,
      assignRoleToUser,
      refetch,
    }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
