import { useState } from 'react';
import { Plus, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CRMLayout } from '@/components/crm/CRMLayout';
import { LeadsTable } from '@/components/crm/LeadsTable';
import { LeadDetailPanel } from '@/components/crm/LeadDetailPanel';
import { LeadDialog } from '@/components/crm/LeadDialog';
import { Lead } from '@/hooks/useLeads';

export default function Leads() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <CRMLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leads</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all your leads in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => navigate('/import')}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setAddLeadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Leads Table */}
        <LeadsTable onSelectLead={setSelectedLead} />
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
