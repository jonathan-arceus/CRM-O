import { useState } from 'react';
import { Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CRMLayout } from '@/components/crm/CRMLayout';
import { PipelineBoard } from '@/components/crm/PipelineBoard';
import { LeadDetailPanel } from '@/components/crm/LeadDetailPanel';
import { LeadDialog } from '@/components/crm/LeadDialog';
import { Lead } from '@/hooks/useLeads';

export default function Pipeline() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  return (
    <CRMLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
            <p className="text-muted-foreground mt-1">
              Drag and drop leads to change their status.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
            <Button onClick={() => setAddLeadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Pipeline Board */}
        <div className="bg-card rounded-lg border border-border">
          <PipelineBoard onSelectLead={setSelectedLead} />
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
