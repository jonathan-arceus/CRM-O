import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCustomFields, CustomFieldDefinition, FieldType } from '@/hooks/useCustomFields';

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'textarea', label: 'Text Area' },
];

export function CustomFieldsManagement() {
  const { fields, loading, createField, updateField, deleteField } = useCustomFields();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CustomFieldDefinition>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newField, setNewField] = useState({
    field_label: '',
    field_type: 'text' as FieldType,
    is_required: false,
    dropdown_options: '',
  });

  const handleEdit = (field: CustomFieldDefinition) => {
    setEditingId(field.id);
    setEditForm({
      field_label: field.field_label,
      field_type: field.field_type,
      is_required: field.is_required,
      dropdown_options: field.dropdown_options,
    });
  };

  const handleSaveEdit = async (id: string) => {
    await updateField(id, editForm);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!newField.field_label.trim()) return;
    const fieldName = newField.field_label.toLowerCase().replace(/\s+/g, '_');
    await createField({
      field_name: fieldName,
      field_label: newField.field_label,
      field_type: newField.field_type,
      is_required: newField.is_required,
      dropdown_options: newField.field_type === 'dropdown' 
        ? newField.dropdown_options.split(',').map(o => o.trim()).filter(Boolean)
        : [],
    });
    setNewField({ field_label: '', field_type: 'text', is_required: false, dropdown_options: '' });
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this custom field?')) {
      await deleteField(id);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateField(id, { is_active: isActive });
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Custom Fields</CardTitle>
            <CardDescription>Add extra fields to capture additional lead information.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {fields.length === 0 && !isAdding && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No custom fields defined. Add your first custom field to capture additional lead data.
            </p>
          )}

          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
            >
              {editingId === field.id ? (
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Field label"
                      value={editForm.field_label}
                      onChange={(e) => setEditForm({ ...editForm, field_label: e.target.value })}
                    />
                    <Select
                      value={editForm.field_type}
                      onValueChange={(v) => setEditForm({ ...editForm, field_type: v as FieldType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((ft) => (
                          <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editForm.is_required}
                        onCheckedChange={(v) => setEditForm({ ...editForm, is_required: v })}
                      />
                      <Label className="text-sm">Required</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(field.id)}>
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{field.field_label}</span>
                      <Badge variant="outline" className="text-xs">
                        {fieldTypes.find(ft => ft.value === field.field_type)?.label}
                      </Badge>
                      {field.is_required && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                      {!field.is_active && (
                        <Badge variant="destructive" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    {field.field_type === 'dropdown' && field.dropdown_options.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Options: {field.dropdown_options.join(', ')}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={field.is_active}
                    onCheckedChange={(v) => handleToggleActive(field.id, v)}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleEdit(field)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => handleDelete(field.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))}

          {isAdding && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Field label"
                  value={newField.field_label}
                  onChange={(e) => setNewField({ ...newField, field_label: e.target.value })}
                />
                <Select
                  value={newField.field_type}
                  onValueChange={(v) => setNewField({ ...newField, field_type: v as FieldType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((ft) => (
                      <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newField.field_type === 'dropdown' && (
                <Input
                  placeholder="Options (comma-separated)"
                  value={newField.dropdown_options}
                  onChange={(e) => setNewField({ ...newField, dropdown_options: e.target.value })}
                />
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newField.is_required}
                    onCheckedChange={(v) => setNewField({ ...newField, is_required: v })}
                  />
                  <Label className="text-sm">Required</Label>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAdd}>
                    <Check className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
