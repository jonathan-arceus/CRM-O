import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
  user?: {
    email: string;
    full_name: string | null;
  };
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async (limit = 100) => {
    try {
      // Fetch audit logs
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (logsError) throw logsError;

      // Fetch user profiles for the logs
      const userIds = [...new Set((logsData || []).map(l => l.user_id).filter(Boolean))] as string[];
      
      let usersMap: Record<string, { email: string; full_name: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        
        (profiles || []).forEach(p => {
          usersMap[p.id] = { email: p.email, full_name: p.full_name };
        });
      }

      const logsWithUsers: AuditLog[] = (logsData || []).map(log => ({
        ...log,
        old_values: log.old_values as Record<string, any> | null,
        new_values: log.new_values as Record<string, any> | null,
        user: log.user_id ? usersMap[log.user_id] : undefined,
      }));

      setLogs(logsWithUsers);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      // Silent fail for audit logs - don't show error toast
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const logAction = async (
    action: string,
    entityType: string,
    entityId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ) => {
    try {
      await supabase.rpc('log_audit_action', {
        _action: action,
        _entity_type: entityType,
        _entity_id: entityId || null,
        _old_values: oldValues || null,
        _new_values: newValues || null,
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  return {
    logs,
    loading,
    logAction,
    refetch: fetchLogs,
  };
}
