import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  id: string;
  organization_id: string;
  theme_mode: 'light' | 'dark' | 'custom';
  primary_color: string;
  secondary_color: string;
  button_style: 'rounded' | 'square' | 'pill';
  layout_preference: string;
  crm_name: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  settings: OrganizationSettings | null;
  organizations: Organization[];
  loading: boolean;
  refetch: () => Promise<void>;
  createOrganization: (name: string, slug: string) => Promise<{ data: Organization | null; error: any }>;
  updateOrganization: (id: string, updates: Partial<Organization>) => Promise<{ error: any }>;
  deleteOrganization: (id: string) => Promise<{ error: any }>;
  updateSettings: (updates: Partial<OrganizationSettings>) => Promise<{ error: any }>;
  uploadLogo: (file: File) => Promise<{ publicUrl: string | null; error: any }>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchOrganizations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  }, []);

  const fetchCurrentOrganization = useCallback(async () => {
    try {
      const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';
      let orgIdToFetch = DEFAULT_ORG_ID;

      if (user) {
        console.log('[useOrganization] fetchCurrentOrganization started for user:', user.id);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) console.error('[useOrganization] Profile fetch error:', profileError);
        console.log('[useOrganization] Profile found:', profile);

        if (profile?.organization_id) {
          orgIdToFetch = profile.organization_id;
        }
      }

      console.log('[useOrganization] Using organization_id:', orgIdToFetch);

      // Fetch the organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgIdToFetch)
        .maybeSingle();

      if (orgError) console.error('[useOrganization] Organization fetch error:', orgError);
      console.log('[useOrganization] Organization result:', org);

      if (org) {
        setOrganization(org as Organization);

        // Fetch settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('organization_settings')
          .select('*')
          .eq('organization_id', org.id)
          .maybeSingle();

        if (settingsError) console.error('[useOrganization] Settings fetch error:', settingsError);
        console.log('[useOrganization] Settings result:', settingsData);

        if (settingsData) {
          setSettings(settingsData as OrganizationSettings);
        } else {
          console.warn('[useOrganization] No settings found for organization:', org.id);
        }
      } else {
        console.warn('[useOrganization] No organization found for id:', orgIdToFetch);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCurrentOrganization();
    fetchOrganizations();
  }, [fetchCurrentOrganization, fetchOrganizations]);

  const refetch = async () => {
    await Promise.all([fetchCurrentOrganization(), fetchOrganizations()]);
  };

  const createOrganization = async (name: string, slug: string) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert({ name, slug })
        .select()
        .single();

      if (error) throw error;

      // Create settings for new org
      await supabase
        .from('organization_settings')
        .insert({ organization_id: data.id });

      // Create default roles for new org
      const defaultRoles = [
        { organization_id: data.id, name: 'admin', display_name: 'Admin', is_org_admin: true },
        { organization_id: data.id, name: 'manager', display_name: 'Manager', is_org_admin: false },
        { organization_id: data.id, name: 'agent', display_name: 'Agent', is_org_admin: false },
      ];
      await supabase.from('dynamic_roles').insert(defaultRoles);

      await fetchOrganizations();
      toast({ title: 'Organization created successfully' });
      return { data: data as Organization, error: null };
    } catch (error: any) {
      toast({ title: 'Error creating organization', description: error.message, variant: 'destructive' });
      return { data: null, error };
    }
  };

  const updateOrganization = async (id: string, updates: Partial<Organization>) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchOrganizations();
      if (organization?.id === id) {
        await fetchCurrentOrganization();
      }
      toast({ title: 'Organization updated successfully' });
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error updating organization', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  const deleteOrganization = async (id: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchOrganizations();
      toast({ title: 'Organization deleted successfully' });
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error deleting organization', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  const updateSettings = async (updates: Partial<OrganizationSettings>) => {
    console.log('[useOrganization] Starting updateSettings', { organization, updates });
    if (!organization) {
      console.error('[useOrganization] Update failed: No organization in context');
      return { error: new Error('No organization') };
    }

    try {
      console.log('[useOrganization] Calling Supabase update for organization_id:', organization.id);
      const { error } = await supabase
        .from('organization_settings')
        .update(updates)
        .eq('organization_id', organization.id);

      if (error) {
        console.error('[useOrganization] Supabase error updating settings:', error);
        throw error;
      }

      console.log('[useOrganization] Settings updated successfully in database, refetching...');
      await fetchCurrentOrganization();
      toast({ title: 'Settings updated successfully' });
      return { error: null };
    } catch (error: any) {
      console.error('[useOrganization] Fatal error updating settings:', error);
      toast({ title: 'Error updating settings', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  const uploadLogo = async (file: File) => {
    if (!organization) {
      return { publicUrl: null, error: new Error('No organization in context') };
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}-${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // 3. Update Organization Table
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      await fetchCurrentOrganization();
      toast({ title: 'Logo updated successfully' });
      return { publicUrl, error: null };
    } catch (error: any) {
      console.error('[useOrganization] Error uploading logo:', error);
      toast({
        title: 'Error uploading logo',
        description: error.message,
        variant: 'destructive'
      });
      return { publicUrl: null, error };
    }
  };

  return (
    <OrganizationContext.Provider value={{
      organization,
      settings,
      organizations,
      loading,
      refetch,
      createOrganization,
      updateOrganization,
      deleteOrganization,
      updateSettings,
      uploadLogo,
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
