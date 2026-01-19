import { Badge } from '@/components/ui/badge';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';

interface LeadStatusBadgeProps {
  status: string;
}

// Fallback color mapping for common status names
const fallbackColors: Record<string, string> = {
  new: 'hsl(var(--status-new))',
  contacted: 'hsl(var(--status-contacted))',
  follow_up: 'hsl(var(--status-followup))',
  converted: 'hsl(var(--status-converted))',
  lost: 'hsl(var(--status-lost))',
};

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const { statuses } = useLeadStatuses();
  
  const statusConfig = statuses.find(s => s.name === status);
  const label = statusConfig?.label || status.replace('_', ' ');
  const color = statusConfig?.color || fallbackColors[status] || '#6b7280';

  return (
    <Badge
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: `${color}40`,
      }}
      className="border font-medium"
    >
      {label}
    </Badge>
  );
}
