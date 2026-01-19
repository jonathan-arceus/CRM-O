import { format } from 'date-fns';
import { Mail, Phone, GripVertical } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Lead, useLeads } from '@/hooks/useLeads';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { useLeadSources } from '@/hooks/useLeadSources';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PipelineBoardProps {
  onSelectLead?: (lead: Lead) => void;
}

export function PipelineBoard({ onSelectLead }: PipelineBoardProps) {
  const { leads, loading, updateLeadStatus } = useLeads();
  const { statuses, loading: statusesLoading } = useLeadStatuses();
  const { sources } = useLeadSources();

  const getLeadsByStatus = (statusName: string) => {
    return leads.filter((lead) => lead.status === statusName);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSourceLabel = (sourceName: string) => {
    const source = sources.find(s => s.name === sourceName);
    return source?.label || sourceName.replace('_', ' ');
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, statusName: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      await updateLeadStatus(leadId, statusName as any);
    }
  };

  if (loading || statusesLoading) {
    return (
      <div className="flex gap-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-72 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 p-4 min-w-max">
        {statuses.map((column) => {
          const columnLeads = getLeadsByStatus(column.name);
          return (
            <div
              key={column.id}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.name)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-semibold text-foreground">{column.label}</h3>
                  <span className="text-sm text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                    {columnLeads.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="kanban-card group cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onClick={() => onSelectLead?.(lead)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(lead.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {lead.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getSourceLabel(lead.source)}
                          </p>
                        </div>
                      </div>
                      <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="space-y-1.5">
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      {lead.assigned_user && (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-[10px] bg-secondary">
                              {getInitials(lead.assigned_user.full_name || lead.assigned_user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {(lead.assigned_user.full_name || lead.assigned_user.email).split(' ')[0]}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(lead.created_at), 'MMM d')}
                      </span>
                    </div>
                  </div>
                ))}

                {columnLeads.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
                    Drop leads here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
