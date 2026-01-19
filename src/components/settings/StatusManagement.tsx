import { useState } from 'react';
import { Plus, Trash2, GripVertical, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLeadStatuses, LeadStatus } from '@/hooks/useLeadStatuses';
import { cn } from '@/lib/utils';

export function StatusManagement() {
  const { statuses, loading, createStatus, updateStatus, deleteStatus } = useLeadStatuses();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ label: '', color: '' });
  const [newStatus, setNewStatus] = useState({ label: '', color: '#6b7280' });
  const [isAdding, setIsAdding] = useState(false);

  const handleEdit = (status: LeadStatus) => {
    setEditingId(status.id);
    setEditForm({ label: status.label, color: status.color });
  };

  const handleSaveEdit = async (id: string, name: string) => {
    await updateStatus(id, { label: editForm.label, color: editForm.color });
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!newStatus.label.trim()) return;
    const name = newStatus.label.toLowerCase().replace(/\s+/g, '_');
    await createStatus({
      name,
      label: newStatus.label,
      color: newStatus.color,
      sort_order: statuses.length,
      is_default: false,
    });
    setNewStatus({ label: '', color: '#6b7280' });
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this status?')) {
      await deleteStatus(id);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lead Statuses</CardTitle>
            <CardDescription>Manage pipeline stages for your leads.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="w-4 h-4 mr-2" />
            Add Status
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {statuses.map((status) => (
            <div
              key={status.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              
              {editingId === status.id ? (
                <>
                  <Input
                    type="color"
                    value={editForm.color}
                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                    className="w-10 h-8 p-1 cursor-pointer"
                  />
                  <Input
                    value={editForm.label}
                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    className="flex-1"
                  />
                  <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(status.id, status.name)}>
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </>
              ) : (
                <>
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="flex-1">{status.label}</span>
                  {status.is_default && (
                    <span className="text-xs text-muted-foreground">(Default)</span>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleEdit(status)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => handleDelete(status.id)}
                    disabled={status.is_default}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))}

          {isAdding && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <Input
                type="color"
                value={newStatus.color}
                onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                className="w-10 h-8 p-1 cursor-pointer"
              />
              <Input
                placeholder="Status name"
                value={newStatus.label}
                onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
                className="flex-1"
              />
              <Button size="icon" variant="ghost" onClick={handleAdd}>
                <Check className="w-4 h-4 text-green-600" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsAdding(false)}>
                <X className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
