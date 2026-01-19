// Re-export types from hooks for backwards compatibility
export type { Lead, LeadStatus, LeadSource } from '@/hooks/useLeads';
export type { UserProfile as User, AppRole } from '@/hooks/useUsers';
export type { Group } from '@/hooks/useGroups';
export type { Activity } from '@/hooks/useActivities';
export type { Comment } from '@/hooks/useComments';

// Legacy type aliases
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'agent';

// Dashboard metrics interface
export interface DashboardMetrics {
  totalLeads: number;
  newLeadsToday: number;
  conversionRate: number;
  leadsByStatus: {
    new: number;
    contacted: number;
    follow_up: number;
    converted: number;
    lost: number;
  };
  leadsBySource: Record<string, number>;
}

// Custom field interface
export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'email' | 'phone';
  options?: string[];
  required: boolean;
}

// Filters
export interface LeadFilters {
  search?: string;
  status?: string[];
  source?: string[];
  assignedUserId?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}
