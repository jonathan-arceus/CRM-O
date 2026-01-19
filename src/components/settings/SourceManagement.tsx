import { useState } from 'react';
import { Plus, Trash2, GripVertical, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLeadSources, LeadSource } from '@/hooks/useLeadSources';

export function SourceManagement() {
  const { sources, loading, createSource, updateSource, deleteSource } = useLeadSources();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ label: '', color: '' });
  const [newSource, setNewSource] = useState({ label: '', color: '#6b7280' });
  const [isAdding, setIsAdding] = useState(false);

  const handleEdit = (source: LeadSource) => {
    setEditingId(source.id);
    setEditForm({ label: source.label, color: source.color });
  };

  const handleSaveEdit = async (id: string) => {
    await updateSource(id, { label: editForm.label, color: editForm.color });
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!newSource.label.trim()) return;
    const name = newSource.label.toLowerCase().replace(/\s+/g, '_');
    await createSource({
      name,
      label: newSource.label,
      color: newSource.color,
      sort_order: sources.length,
      is_default: false,
    });
    setNewSource({ label: '', color: '#6b7280' });
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this source?')) {
      await deleteSource(id);
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
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>Manage where your leads come from.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="w-4 h-4 mr-2" />
            Add Source
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              
              {editingId === source.id ? (
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
                  <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(source.id)}>
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
                    style={{ backgroundColor: source.color }}
                  />
                  <span className="flex-1">{source.label}</span>
                  {source.is_default && (
                    <span className="text-xs text-muted-foreground">(Default)</span>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleEdit(source)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => handleDelete(source.id)}
                    disabled={source.is_default}
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
                value={newSource.color}
                onChange={(e) => setNewSource({ ...newSource, color: e.target.value })}
                className="w-10 h-8 p-1 cursor-pointer"
              />
              <Input
                placeholder="Source name"
                value={newSource.label}
                onChange={(e) => setNewSource({ ...newSource, label: e.target.value })}
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
