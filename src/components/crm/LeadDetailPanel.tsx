import { useState } from 'react';
import { format } from 'date-fns';
import {
  X,
  Mail,
  Phone,
  Building,
  Calendar,
  DollarSign,
  MessageSquare,
  Send,
  Trash2,
  Bell,
  UserCheck,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LeadStatusBadge } from './LeadStatusBadge';
import { Lead, LeadStatus, useLeads } from '@/hooks/useLeads';
import { useComments } from '@/hooks/useComments';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { AddReminderDialog } from './AddReminderDialog';
import { RemindersWidget } from './RemindersWidget';
import { ConvertLeadDialog } from './ConvertLeadDialog';

interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
}

const statuses: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

export function LeadDetailPanel({ lead, onClose }: LeadDetailPanelProps) {
  const { updateLead, refetch } = useLeads();
  const { comments, addComment, deleteComment, loading: commentsLoading } = useComments(lead.id);
  const { activities, addActivity, loading: activitiesLoading } = useActivities(lead.id);
  const { user } = useAuth();
  const { users } = useUsers();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const isConverted = lead.status === 'converted';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  const handleStatusChange = async (status: LeadStatus) => {
    const oldStatus = lead.status;
    if (status === 'converted') {
      setConvertDialogOpen(true);
    } else {
      const { error } = await updateLead(lead.id, { status });
      if (!error) {
        await addActivity('status_changed', { from: oldStatus, to: status });
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    await addComment(newComment);
    setNewComment('');
    setIsSubmitting(false);
  };

  const handleDeleteComment = async (id: string) => {
    if (confirm('Delete this comment?')) {
      await deleteComment(id);
    }
  };

  const getActivityLabel = (action: string, details: Record<string, unknown>) => {
    switch (action) {
      case 'lead_created':
        return 'Lead created';
      case 'status_changed':
        return `Status changed from ${details.from} to ${details.to}`;
      case 'comment_added':
        return 'Comment added';
      default:
        return action.replace('_', ' ');
    }
  };

  const handleConverted = () => {
    refetch();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-background border-l border-border shadow-xl z-50 animate-slide-in-right">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {getInitials(lead.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{lead.full_name}</h2>
                {lead.company && (
                  <p className="text-sm text-muted-foreground">{lead.company}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReminderDialogOpen(true)}
                  disabled={isConverted}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Add Reminder
                </Button>
                {!isConverted ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConvertDialogOpen(true)}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Convert to Contact
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary hover:text-primary hover:bg-primary/5"
                    onClick={() => navigate('/contacts')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Contact Record
                  </Button>
                )}
              </div>

              {isConverted && (
                <Alert variant="default" className="bg-primary/5 border-primary/20">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">Converted</AlertTitle>
                  <AlertDescription className="text-muted-foreground">
                    This lead has been converted to a contact. History is now managed on the contact record.
                  </AlertDescription>
                </Alert>
              )}

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Status</span>
                <Select
                  value={lead.status}
                  onValueChange={handleStatusChange}
                  disabled={isConverted}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Contact Information</h3>
                <div className="space-y-2">
                  {lead.email && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${lead.email}`} className="text-sm hover:text-primary">
                        {lead.email}
                      </a>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${lead.phone}`} className="text-sm hover:text-primary">
                        {lead.phone}
                      </a>
                    </div>
                  )}
                  {lead.company && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Building className="w-4 h-4" />
                      <span className="text-sm">{lead.company}</span>
                    </div>
                  )}
                  {lead.value && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">${lead.value.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Created {format(new Date(lead.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reminders */}
              <RemindersWidget id={lead.id} type="lead" maxItems={3} />

              {/* Notes */}
              {lead.notes && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">Notes</h3>
                  <p className="text-sm text-muted-foreground">{lead.notes}</p>
                </div>
              )}

              {/* Tabs */}
              <Tabs defaultValue="comments" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="comments" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Comments
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex-1">
                    Activity
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="comments" className="mt-4 space-y-4">
                  {/* Add Comment */}
                  {!isConverted ? (
                    <form onSubmit={handleAddComment} className="flex gap-2">
                      <Input
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <Button type="submit" size="icon" disabled={isSubmitting || !newComment.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  ) : (
                    <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Comment history is locked for converted leads.
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-4">
                    {commentsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No comments yet.</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 group">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                              {getInitials(comment.user?.full_name || comment.user?.email || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {comment.user?.full_name || comment.user?.email}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                                </span>
                                {comment.user_id === user?.id && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                    onClick={() => handleDeleteComment(comment.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <div className="space-y-4">
                    {activitiesLoading ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : activities.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No activity yet.</p>
                    ) : (
                      activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                          <div className="flex-1">
                            <p className="text-sm">
                              {getActivityLabel(activity.action, activity.details)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.user?.full_name || activity.user?.email} •{' '}
                              {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div >
      </div >

      <AddReminderDialog
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
        leadId={lead.id}
        leadName={lead.full_name}
      />

      <ConvertLeadDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        lead={lead}
        onConverted={handleConverted}
      />
    </>
  );
}
