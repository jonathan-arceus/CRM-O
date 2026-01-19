import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Comment {
  id: string;
  lead_id: string | null;
  contact_id: string | null;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    full_name: string | null;
    email: string;
  };
}

export function useComments(id: string, type: 'lead' | 'contact' = 'lead') {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchComments = useCallback(async () => {
    if (!user || !id) {
      setComments([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (type === 'lead') {
        query = query.eq('lead_id', id);
      } else {
        query = query.eq('contact_id', id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set((data || []).map(c => c.user_id).filter(Boolean))];
      let profilesMap: Record<string, { full_name: string | null; email: string }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = { full_name: p.full_name, email: p.email };
            return acc;
          }, {} as Record<string, { full_name: string | null; email: string }>);
        }
      }

      const commentsWithUsers = (data || []).map(comment => ({
        ...comment,
        user: profilesMap[comment.user_id],
      })) as Comment[];

      setComments(commentsWithUsers);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [user, id, type]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const insertData: any = {
        user_id: user.id,
        content,
      };

      if (type === 'lead') {
        insertData.lead_id = id;
      } else {
        insertData.contact_id = id;
      }

      const { data, error } = await supabase
        .from('comments')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      const activityData: any = {
        user_id: user.id,
        action: 'comment_added',
        details: { comment_preview: content.substring(0, 50) },
      };

      if (type === 'lead') {
        activityData.lead_id = id;
      } else {
        activityData.contact_id = id;
      }

      await supabase
        .from('activities')
        .insert(activityData);

      await fetchComments();
      toast({
        title: 'Comment added',
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error adding comment',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const deleteComment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchComments();
      toast({
        title: 'Comment deleted',
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error deleting comment',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return { error };
    }
  };

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    refetch: fetchComments,
  };
}
