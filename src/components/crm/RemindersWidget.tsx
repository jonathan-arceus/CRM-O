import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { Bell, Check, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useReminders, Reminder } from '@/hooks/useReminders';
import { cn } from '@/lib/utils';

interface RemindersWidgetProps {
  id?: string;
  type?: 'lead' | 'contact';
  maxItems?: number;
}

const reminderTypeLabels: Record<string, string> = {
  follow_up: 'Follow-up',
  callback: 'Callback',
  meeting: 'Meeting',
  email: 'Send Email',
  other: 'Other',
};

export function RemindersWidget({ id, type = 'lead', maxItems = 5 }: RemindersWidgetProps) {
  const { upcomingReminders, loading, completeReminder, deleteReminder } = useReminders(id, type);

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) return 'Overdue';
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getDateBadgeVariant = (dateStr: string): 'destructive' | 'default' | 'secondary' => {
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) return 'destructive';
    if (isToday(date)) return 'default';
    return 'secondary';
  };

  const handleComplete = async (id: string) => {
    await completeReminder(id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this reminder?')) {
      await deleteReminder(id);
    }
  };

  const displayReminders = upcomingReminders.slice(0, maxItems);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Reminders
          {upcomingReminders.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {upcomingReminders.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayReminders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming reminders</p>
        ) : (
          <ScrollArea className={cn(maxItems > 3 ? 'h-[200px]' : '')}>
            <div className="space-y-3">
              {displayReminders.map((reminder) => (
                <div key={reminder.id} className="flex items-start gap-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getDateBadgeVariant(reminder.reminder_date)}>
                        {getDateLabel(reminder.reminder_date)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(reminder.reminder_date), 'h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">
                      {reminderTypeLabels[reminder.reminder_type] || reminder.reminder_type}
                    </p>
                    {reminder.lead && (
                      <p className="text-xs text-muted-foreground truncate">
                        {reminder.lead.full_name}
                      </p>
                    )}
                    {reminder.contact && (
                      <p className="text-xs text-muted-foreground truncate">
                        {reminder.contact.full_name}
                      </p>
                    )}
                    {reminder.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {reminder.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleComplete(reminder.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDelete(reminder.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
