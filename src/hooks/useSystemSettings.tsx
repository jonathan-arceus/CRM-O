import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface BrandingSettings {
  crm_name: string;
  logo_url: string | null;
}

interface IntegrationSettings {
  webhooks: { name: string; url: string; enabled: boolean }[];
  api_keys: Record<string, string>;
}

export interface SystemSettings {
  branding: BrandingSettings;
  integrations: IntegrationSettings;
}

const defaultSettings: SystemSettings = {
  branding: { crm_name: 'CRM System', logo_url: null },
  integrations: { webhooks: [], api_keys: {} },
};

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;

      const settingsMap: SystemSettings = { ...defaultSettings };
      
      (data || []).forEach(row => {
        if (row.setting_key === 'branding' && row.setting_value) {
          const val = row.setting_value as unknown as BrandingSettings;
          if (val.crm_name !== undefined) {
            settingsMap.branding = val;
          }
        } else if (row.setting_key === 'integrations' && row.setting_value) {
          const val = row.setting_value as unknown as IntegrationSettings;
          if (val.webhooks !== undefined) {
            settingsMap.integrations = val;
          }
        }
      });

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching system settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateBranding = async (updates: Partial<BrandingSettings>) => {
    try {
      const newBranding = { ...settings.branding, ...updates };
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: newBranding })
        .eq('setting_key', 'branding');
      
      if (error) throw error;
      
      setSettings(prev => ({ ...prev, branding: newBranding }));
      toast({ title: 'Branding updated successfully' });
      return { error: null };
    } catch (error: any) {
      console.error('Error updating branding:', error);
      toast({
        title: 'Error updating branding',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateIntegrations = async (updates: Partial<IntegrationSettings>) => {
    try {
      const newIntegrations = { ...settings.integrations, ...updates };
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: newIntegrations })
        .eq('setting_key', 'integrations');
      
      if (error) throw error;
      
      setSettings(prev => ({ ...prev, integrations: newIntegrations }));
      toast({ title: 'Integrations updated successfully' });
      return { error: null };
    } catch (error: any) {
      console.error('Error updating integrations:', error);
      toast({
        title: 'Error updating integrations',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  return {
    settings,
    loading,
    updateBranding,
    updateIntegrations,
    refetch: fetchSettings,
  };
}
