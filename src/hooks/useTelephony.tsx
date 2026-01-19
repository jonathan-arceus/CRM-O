import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { usePermissions } from './usePermissions';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type TelephonyProvider = 'twilio' | 'vonage' | 'sip' | 'tel';

export interface TelephonySettings {
  id: string;
  organization_id: string;
  is_enabled: boolean;
  provider: TelephonyProvider | null;
  api_sid: string | null;
  api_token: string | null;
  api_endpoint: string | null;
}

export interface CallLog {
  id: string;
  organization_id: string;
  user_id: string;
  lead_id: string | null;
  contact_id: string | null;
  phone_number: string;
  call_status: string;
  duration_seconds: number | null;
  created_at: string;
}

export function useTelephony() {
  const [settings, setSettings] = useState<TelephonySettings | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { organization } = useOrganization();
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    if (!organization) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('telephony_settings')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();

      if (error) throw error;
      setSettings(data as TelephonySettings | null);
    } catch (error) {
      console.error('Error fetching telephony settings:', error);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  const fetchCallLogs = useCallback(async () => {
    if (!organization) return;

    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCallLogs(data || []);
    } catch (error) {
      console.error('Error fetching call logs:', error);
    }
  }, [organization]);

  useEffect(() => {
    fetchSettings();
    fetchCallLogs();
  }, [fetchSettings, fetchCallLogs]);

  const updateSettings = async (updates: Partial<TelephonySettings>) => {
    if (!organization) return { error: new Error('No organization') };

    try {
      if (settings) {
        const { error } = await supabase
          .from('telephony_settings')
          .update(updates)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('telephony_settings')
          .insert({
            organization_id: organization.id,
            ...updates,
          });

        if (error) throw error;
      }

      await fetchSettings();
      toast({ title: 'Telephony settings updated' });
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error updating settings', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  const initiateCall = async (
    phoneNumber: string,
    leadId?: string,
    contactId?: string
  ): Promise<{ success: boolean; error?: any }> => {
    if (!organization || !user) {
      return { success: false, error: new Error('Not authenticated') };
    }

    if (!hasPermission('click_to_call')) {
      toast({ title: 'Permission denied', description: 'You do not have permission to make calls.', variant: 'destructive' });
      return { success: false, error: new Error('Permission denied') };
    }

    if (!settings?.is_enabled) {
      toast({ title: 'Telephony disabled', description: 'Click-to-call is not enabled for your organization.', variant: 'destructive' });
      return { success: false, error: new Error('Telephony disabled') };
    }

    try {
      // Log the call
      const { error: logError } = await supabase
        .from('call_logs')
        .insert({
          organization_id: organization.id,
          user_id: user.id,
          lead_id: leadId || null,
          contact_id: contactId || null,
          phone_number: phoneNumber,
          call_status: 'initiated',
        });

      if (logError) throw logError;

      // Handle call based on provider
      switch (settings.provider) {
        case 'tel':
          // Simple tel: link - opens default phone app
          window.location.href = `tel:${phoneNumber}`;
          break;
        case 'twilio':
        case 'vonage':
        case 'sip':
          // For these providers, you would typically call an edge function
          // that handles the actual API call
          toast({ 
            title: 'Call initiated', 
            description: `Calling ${phoneNumber} via ${settings.provider}` 
          });
          // TODO: Implement actual provider integration via edge function
          break;
        default:
          window.location.href = `tel:${phoneNumber}`;
      }

      await fetchCallLogs();
      return { success: true };
    } catch (error: any) {
      toast({ title: 'Error initiating call', description: error.message, variant: 'destructive' });
      return { success: false, error };
    }
  };

  const canMakeCalls = (): boolean => {
    return (
      hasPermission('click_to_call') &&
      (settings?.is_enabled ?? false)
    );
  };

  return {
    settings,
    callLogs,
    loading,
    updateSettings,
    initiateCall,
    canMakeCalls,
    refetchSettings: fetchSettings,
    refetchLogs: fetchCallLogs,
  };
}
