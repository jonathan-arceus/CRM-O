import { useState, useEffect } from 'react';
import { useLeads, Lead } from '@/hooks/useLeads';
import { useUsers } from '@/hooks/useUsers';
import { useGroups } from '@/hooks/useGroups';
import { useLeadStatuses, LeadStatus as LeadStatusType } from '@/hooks/useLeadStatuses';
import { useLeadSources, LeadSource as LeadSourceType } from '@/hooks/useLeadSources';
import { useCustomFields } from '@/hooks/useCustomFields';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}

export function LeadDialog({ open, onOpenChange, lead }: LeadDialogProps) {
  const { createLead, updateLead } = useLeads();
  const { users } = useUsers();
  const { groups } = useGroups();
  const { statuses, getDefaultStatus } = useLeadStatuses();
  const { sources, getDefaultSource } = useLeadSources();
  const { activeFields } = useCustomFields();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    source: '',
    status: '',
    value: '',
    assigned_user_id: '',
    group_id: '',
    notes: '',
    custom_fields: {} as Record<string, unknown>,
  });

  // Reset or populate form when lead changes or dialog opens
  useEffect(() => {
    if (open) {
      if (lead) {
        setFormData({
          full_name: lead.full_name || '',
          email: lead.email || '',
          phone: lead.phone || '',
          company: lead.company || '',
          source: lead.source || '',
          status: lead.status || '',
          value: lead.value?.toString() || '',
          assigned_user_id: lead.assigned_user_id || '',
          group_id: lead.group_id || '',
          notes: lead.notes || '',
          custom_fields: lead.custom_fields || {},
        });
      } else {
        const defaultSource = getDefaultSource();
        const defaultStatus = getDefaultStatus();
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          company: '',
          source: defaultSource?.name || '',
          status: defaultStatus?.name || '',
          value: '',
          assigned_user_id: '',
          group_id: '',
          notes: '',
          custom_fields: {},
        });
      }
    }
  }, [open, lead, getDefaultSource, getDefaultStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      full_name: formData.full_name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      company: formData.company || undefined,
      source: formData.source as any,
      status: formData.status as any,
      value: formData.value ? parseFloat(formData.value) : undefined,
      assigned_user_id: formData.assigned_user_id || undefined,
      group_id: formData.group_id || undefined,
      notes: formData.notes || undefined,
      custom_fields: formData.custom_fields,
    };

    let result;
    if (lead) {
      result = await updateLead(lead.id, payload);
    } else {
      result = await createLead(payload);
    }

    setIsSubmitting(false);

    if (!result.error) {
      onOpenChange(false);
    }
  };

  const handleCustomFieldChange = (fieldName: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [fieldName]: value,
      },
    }));
  };

  const renderCustomField = (field: typeof activeFields[0]) => {
    const value = formData.custom_fields[field.field_name] || '';

    switch (field.field_type) {
      case 'dropdown':
        return (
          <Select
            value={value as string}
            onValueChange={(v) => handleCustomFieldChange(field.field_name, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.field_label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.dropdown_options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'textarea':
        return (
          <Textarea
            value={value as string}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            rows={2}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value as string}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value as string}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
          />
        );
      default:
        return (
          <Input
            value={value as string}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="value">Value ($)</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
            <div>
              <Label>Source</Label>
              <Select
                value={formData.source}
                onValueChange={(v) => setFormData({ ...formData, source: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign To</Label>
              <Select
                value={formData.assigned_user_id}
                onValueChange={(v) => setFormData({ ...formData, assigned_user_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Group</Label>
              <Select
                value={formData.group_id}
                onValueChange={(v) => setFormData({ ...formData, group_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Fields */}
            {activeFields.map((field) => (
              <div key={field.id} className={field.field_type === 'textarea' ? 'col-span-2' : ''}>
                <Label>
                  {field.field_label}
                  {field.is_required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderCustomField(field)}
              </div>
            ))}

            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (lead ? 'Saving...' : 'Creating...') : (lead ? 'Save Changes' : 'Create Lead')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
