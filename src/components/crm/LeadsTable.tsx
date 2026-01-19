import { useState } from 'react';
import { format } from 'date-fns';
import {
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  Bell,
  UserCheck,
  CheckSquare,
  Users2,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LeadStatusBadge } from './LeadStatusBadge';
import { LeadDialog } from './LeadDialog';
import { useLeads, Lead } from '@/hooks/useLeads';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { useLeadSources } from '@/hooks/useLeadSources';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { Skeleton } from '@/components/ui/skeleton';

interface LeadsTableProps {
  onSelectLead?: (lead: Lead) => void;
}

export function LeadsTable({ onSelectLead }: LeadsTableProps) {
  const {
    leads,
    loading,
    createLead,
    updateLead,
    bulkUpdateLeads,
    deleteLead,
    updateLeadStatus,
    refetch: fetchLeads,
  } = useLeads();
  const { statuses } = useLeadStatuses();
  const { sources } = useLeadSources();
  const { isAdmin } = useAuth();
  const { users } = useUsers();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isAssigningBulk, setIsAssigningBulk] = useState(false);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (lead.phone?.includes(searchQuery) ?? false);

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this lead?')) {
      await deleteLead(id);
    }
  };

  const handleEdit = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setEditingLead(lead);
    setEditDialogOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const toggleSelectLead = (e: React.MouseEvent | boolean, id: string) => {
    if (typeof e !== 'boolean') e.stopPropagation();
    const newSelected = new Set(selectedLeadIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeadIds(newSelected);
  };

  const handleBulkAssign = async (userId: string) => {
    setIsAssigningBulk(true);
    const targetUserId = userId === 'unassigned' ? null : userId;

    try {
      await bulkUpdateLeads(Array.from(selectedLeadIds), { assigned_user_id: targetUserId });
      setSelectedLeadIds(new Set());
    } finally {
      setIsAssigningBulk(false);
    }
  };

  const getSourceLabel = (sourceName: string) => {
    const source = sources.find(s => s.name === sourceName);
    return source?.label || sourceName.replace('_', ' ');
  };

  if (loading) {
    return (
      <div className="crm-card animate-slide-up">
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="crm-card animate-slide-up">
      {/* Header */}
      <div className="crm-card-header">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search leads by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.name}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.name}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="crm-table">
          <thead>
            <tr>
              <th className="w-10">
                <Checkbox
                  checked={filteredLeads.length > 0 && selectedLeadIds.size === filteredLeads.length}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th>Lead</th>
              <th>Contact</th>
              <th>Source</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Created</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  No leads found. Add your first lead to get started.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    lead.status === 'converted' && "opacity-60 grayscale-[0.5]",
                    selectedLeadIds.has(lead.id) && "bg-primary/5"
                  )}
                  onClick={() => onSelectLead?.(lead)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedLeadIds.has(lead.id)}
                      onCheckedChange={() => toggleSelectLead(true, lead.id)}
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(lead.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium text-foreground">{lead.full_name}</span>
                        {lead.company && (
                          <p className="text-sm text-muted-foreground">{lead.company}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="text-sm">{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="text-sm">{lead.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="text-sm text-muted-foreground">
                      {getSourceLabel(lead.source)}
                    </span>
                  </td>
                  <td>
                    <LeadStatusBadge status={lead.status} />
                  </td>
                  <td>
                    {lead.assigned_user && (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                            {getInitials(lead.assigned_user.full_name || lead.assigned_user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {lead.assigned_user.full_name || lead.assigned_user.email}
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(lead.created_at), 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelectLead?.(lead); }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleEdit(e, lead)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Lead
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => handleDelete(e, lead.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Lead
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Action Bar */}
      {selectedLeadIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
          <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-primary-foreground/20">
            <div className="flex items-center gap-2 border-r border-primary-foreground/20 pr-6">
              <CheckSquare className="w-5 h-5" />
              <span className="font-semibold">{selectedLeadIds.size} Leads Selected</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium opacity-90">Assign to:</span>
              <Select onValueChange={handleBulkAssign} disabled={isAssigningBulk}>
                <SelectTrigger className="w-[180px] bg-primary-foreground text-primary border-none h-9">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-white/10"
                onClick={() => setSelectedLeadIds(new Set())}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredLeads.length} of {leads.length} leads
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
      <LeadDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        lead={editingLead}
      />
    </div>
  );
}
