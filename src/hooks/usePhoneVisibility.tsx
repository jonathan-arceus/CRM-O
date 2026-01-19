import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { usePermissions } from './usePermissions';
import { useToast } from './use-toast';

export type PhoneVisibilityMode = 'full' | 'masked' | 'hidden';

export interface PhoneVisibilitySetting {
  id: string;
  organization_id: string;
  role_id: string;
  visibility_mode: PhoneVisibilityMode;
}

export function usePhoneVisibility() {
  const [settings, setSettings] = useState<PhoneVisibilitySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const { organization } = useOrganization();
  const { userRole, isSuperAdmin, roles } = usePermissions();
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    if (!organization) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('phone_visibility_settings')
        .select('*')
        .eq('organization_id', organization.id);

      if (error) throw error;
      setSettings((data as PhoneVisibilitySetting[]) || []);
    } catch (error) {
      console.error('Error fetching phone visibility settings:', error);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getVisibilityMode = (): PhoneVisibilityMode => {
    // Super admin always sees full numbers
    if (isSuperAdmin) return 'full';

    if (!userRole || !organization) return 'masked';

    const setting = settings.find(
      s => s.role_id === userRole.id && s.organization_id === organization.id
    );

    return setting?.visibility_mode || 'masked';
  };

  const formatPhoneNumber = (phone: string | null | undefined): string => {
    if (!phone) return '';

    const mode = getVisibilityMode();

    switch (mode) {
      case 'full':
        return phone;
      case 'hidden':
        return '••••••••••';
      case 'masked':
      default:
        // Show first 3 and last 2 characters
        if (phone.length <= 5) return '•'.repeat(phone.length);
        return phone.slice(0, 3) + '•'.repeat(phone.length - 5) + phone.slice(-2);
    }
  };

  const canSeeFullNumber = (): boolean => {
    return getVisibilityMode() === 'full';
  };

  const updateVisibility = async (roleId: string, mode: PhoneVisibilityMode) => {
    if (!organization) return { error: new Error('No organization') };

    try {
      const existing = settings.find(
        s => s.role_id === roleId && s.organization_id === organization.id
      );

      if (existing) {
        const { error } = await supabase
          .from('phone_visibility_settings')
          .update({ visibility_mode: mode })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('phone_visibility_settings')
          .insert({
            organization_id: organization.id,
            role_id: roleId,
            visibility_mode: mode,
          });

        if (error) throw error;
      }

      await fetchSettings();
      toast({ title: 'Phone visibility updated' });
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error updating visibility', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  const getRoleVisibility = (roleId: string): PhoneVisibilityMode => {
    const setting = settings.find(s => s.role_id === roleId);
    return setting?.visibility_mode || 'masked';
  };

  return {
    settings,
    loading,
    formatPhoneNumber,
    canSeeFullNumber,
    getVisibilityMode,
    updateVisibility,
    getRoleVisibility,
    refetch: fetchSettings,
  };
}
