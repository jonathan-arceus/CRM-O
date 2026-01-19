import { format } from 'date-fns';
import { History, User, Settings, Database, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuditLogs, AuditLog } from '@/hooks/useAuditLogs';

const actionIcons: Record<string, React.ReactNode> = {
  create: <Database className="w-4 h-4 text-green-500" />,
  update: <Settings className="w-4 h-4 text-blue-500" />,
  delete: <FileText className="w-4 h-4 text-red-500" />,
  default: <History className="w-4 h-4 text-muted-foreground" />,
};

const getActionIcon = (action: string) => {
  if (action.includes('create') || action.includes('add')) return actionIcons.create;
  if (action.includes('update') || action.includes('change')) return actionIcons.update;
  if (action.includes('delete') || action.includes('remove')) return actionIcons.delete;
  return actionIcons.default;
};

const formatAction = (action: string) => {
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function AuditLogViewer() {
  const { logs, loading } = useAuditLogs();

  if (loading) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="w-5 h-5" />
          <div>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>Track all system changes and actions.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No audit logs available.
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="mt-0.5">{getActionIcon(log.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{formatAction(log.action)}</span>
                      <Badge variant="outline" className="text-xs">
                        {log.entity_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{log.user?.full_name || log.user?.email || 'System'}</span>
                      <span>•</span>
                      <span>{format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    {log.new_values && Object.keys(log.new_values).length > 0 && (
                      <div className="mt-2 p-2 bg-background rounded text-xs font-mono overflow-x-auto">
                        {JSON.stringify(log.new_values, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
