import { format } from 'date-fns';
import { useActivities } from '@/hooks/useActivities';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function RecentActivity() {
  const { activities, loading } = useActivities();

  const getActivityStyle = (action: string) => {
    switch (action) {
      case 'lead_created':
        return 'bg-status-new/20 border-status-new';
      case 'status_changed':
        return 'bg-status-followup/20 border-status-followup';
      case 'comment_added':
        return 'bg-primary/20 border-primary';
      case 'lead_assigned':
        return 'bg-status-contacted/20 border-status-contacted';
      default:
        return 'bg-muted border-border';
    }
  };

  const getActivityLabel = (action: string, details: Record<string, unknown>) => {
    switch (action) {
      case 'lead_created':
        return `created lead "${details.lead_name || 'Unknown'}"`;
      case 'status_changed':
        return `changed status from ${details.from} to ${details.to}`;
      case 'lead_assigned':
        return 'assigned a lead';
      case 'comment_added':
        return 'added a comment';
      default:
        return action.replace(/_/g, ' ');
    }
  };

  if (loading) {
    return (
      <div className="crm-card">
        <div className="crm-card-header">
          <h3 className="font-semibold text-foreground">Recent Activity</h3>
        </div>
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="crm-card">
      <div className="crm-card-header">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
      </div>
      <div className="p-4">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No activity yet
          </p>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 6).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full mt-2 border-2',
                    getActivityStyle(activity.action)
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">
                      {activity.user?.full_name || activity.user?.email || 'System'}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {getActivityLabel(activity.action, activity.details)}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {activity.lead?.full_name && (
                      <>
                        <span className="text-xs text-muted-foreground">
                          {activity.lead.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                      </>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
