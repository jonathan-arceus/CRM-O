import { useState } from 'react';
import { Users, UserPlus, TrendingUp, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CRMLayout } from '@/components/crm/CRMLayout';
import { MetricCard } from '@/components/crm/MetricCard';
import { LeadsTable } from '@/components/crm/LeadsTable';
import { LeadDetailPanel } from '@/components/crm/LeadDetailPanel';
import { RecentActivity } from '@/components/crm/RecentActivity';
import { LeadsBySourceChart } from '@/components/crm/LeadsBySourceChart';
import { LeadsByStatusChart } from '@/components/crm/LeadsByStatusChart';
import { RemindersWidget } from '@/components/crm/RemindersWidget';
import { LeadDialog } from '@/components/crm/LeadDialog';
import { Lead, useLeads } from '@/hooks/useLeads';

export default function Dashboard() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const { leads } = useLeads();

  // Calculate metrics from real data
  const totalLeads = leads.length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newLeadsToday = leads.filter(l => new Date(l.created_at) >= today).length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  const followUpCount = leads.filter(l => l.status === 'follow_up').length;

  return (
    <CRMLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening with your leads today.
            </p>
          </div>
          <Button onClick={() => setAddLeadOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Leads"
            value={totalLeads}
            change={{ value: 12, trend: 'up' }}
            icon={Users}
          />
          <MetricCard
            title="New Today"
            value={newLeadsToday}
            change={{ value: 8, trend: 'up' }}
            icon={UserPlus}
          />
          <MetricCard
            title="Conversion Rate"
            value={`${conversionRate.toFixed(1)}%`}
            change={{ value: 3, trend: 'up' }}
            icon={TrendingUp}
          />
          <MetricCard
            title="Pending Follow-ups"
            value={followUpCount}
            icon={Clock}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <LeadsByStatusChart />
          <LeadsBySourceChart />
          <RecentActivity />
          <RemindersWidget maxItems={5} />
        </div>

        {/* Leads Table */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Leads</h2>
          <LeadsTable onSelectLead={setSelectedLead} />
        </div>
      </div>

      {/* Lead Detail Panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}

      {/* Add Lead Dialog */}
      <LeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} />
    </CRMLayout>
  );
}
