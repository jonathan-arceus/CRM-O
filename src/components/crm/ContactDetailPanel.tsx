
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Contact, useContacts } from '@/hooks/useContacts';
import { useComments } from '@/hooks/useComments';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { AddReminderDialog } from './AddReminderDialog';
import { RemindersWidget } from './RemindersWidget';

interface ContactDetailPanelProps {
    contact: Contact;
    onClose: () => void;
}

export function ContactDetailPanel({ contact, onClose }: ContactDetailPanelProps) {
    const { updateContact } = useContacts();
    const { comments, addComment, deleteComment, loading: commentsLoading } = useComments(contact.id, 'contact');
    const { activities, loading: activitiesLoading } = useActivities(contact.id, 'contact');
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
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
            case 'contact_created':
                return 'Contact created';
            case 'lead_converted':
                return 'Converted from lead';
            case 'comment_added':
                return 'Comment added';
            default:
                return action.replace('_', ' ');
        }
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
                                    {getInitials(contact.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">{contact.full_name}</h2>
                                {contact.company && (
                                    <p className="text-sm text-muted-foreground">{contact.company}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
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
                                >
                                    <Bell className="w-4 h-4 mr-2" />
                                    Add Reminder
                                </Button>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-foreground">Contact Information</h3>
                                <div className="space-y-2">
                                    {contact.email && (
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <Mail className="w-4 h-4" />
                                            <a href={`mailto:${contact.email}`} className="text-sm hover:text-primary">
                                                {contact.email}
                                            </a>
                                        </div>
                                    )}
                                    {contact.phone && (
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <Phone className="w-4 h-4" />
                                            <a href={`tel:${contact.phone}`} className="text-sm hover:text-primary">
                                                {contact.phone}
                                            </a>
                                        </div>
                                    )}
                                    {contact.company && (
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <Building className="w-4 h-4" />
                                            <span className="text-sm">{contact.company}</span>
                                        </div>
                                    )}
                                    {contact.value && (
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <DollarSign className="w-4 h-4" />
                                            <span className="text-sm">${contact.value.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm">
                                            Converted {format(new Date(contact.converted_at), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Reminders */}
                            <RemindersWidget id={contact.id} type="contact" maxItems={3} />

                            {/* Notes */}
                            {contact.notes && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-foreground">Notes</h3>
                                    <p className="text-sm text-muted-foreground">{contact.notes}</p>
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
                </div>
            </div>

            <AddReminderDialog
                open={reminderDialogOpen}
                onOpenChange={setReminderDialogOpen}
                contactId={contact.id}
                contactName={contact.full_name}
            />
        </>
    );
}
