import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lead } from '@/hooks/useLeads';
import { useContacts } from '@/hooks/useContacts';
import { useLeads } from '@/hooks/useLeads';

interface ConvertLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onConverted: () => void;
}

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ConvertLeadDialog({ open, onOpenChange, lead, onConverted }: ConvertLeadDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convertedToCompany, setConvertedToCompany] = useState('');
  const { organizations } = useOrganization();
  const [targetOrgId, setTargetOrgId] = useState<string>(() => {
    return lead.organization_id || (organizations && organizations.length > 0 ? organizations[0].id : '');
  });
  const { toast } = useToast();

  const handleConvert = async () => {
    setIsSubmitting(true);

    try {
      console.log('[ConvertLeadDialog] Starting conversion for lead:', {
        leadId: lead.id,
        currentOrgId: lead.organization_id,
        targetOrgId,
        convertedToCompany
      });

      // Ensure targetOrgId is a valid UUID or null
      const finalTargetOrgId = targetOrgId && targetOrgId.length === 36 ? targetOrgId : lead.organization_id;

      const { data, error } = await (supabase.rpc as any)('convert_lead_to_contact', {
        _lead_id: lead.id,
        _converted_to_company: convertedToCompany || null,
        _target_organization_id: finalTargetOrgId,
      });

      if (error) {
        console.error('[ConvertLeadDialog] RPC Error:', error);
        throw error;
      }

      console.log('[ConvertLeadDialog] Success:', data);

      toast({
        title: 'Lead converted successfully',
        description: `${lead.full_name} is now a contact.`,
      });

      onConverted();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error converting lead:', error);
      toast({
        title: 'Error converting lead',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Convert Lead to Contact</DialogTitle>
          <DialogDescription>
            Convert "{lead.full_name}" to a contact. This will mark the lead as converted
            and create a new contact record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="organization">Target Organization</Label>
            <Select value={targetOrgId} onValueChange={setTargetOrgId}>
              <SelectTrigger id="organization">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name} {org.id === lead.organization_id && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select which organization this contact should belong to.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Converted To (Company)</Label>
            <Input
              id="company"
              placeholder="Enter the company they converted to..."
              value={convertedToCompany}
              onChange={(e) => setConvertedToCompany(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional: The company or product they signed up for
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={isSubmitting}>
            {isSubmitting ? 'Converting...' : 'Convert to Contact'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
