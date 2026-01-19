import { useState } from 'react';
import { Plus, Building2, Trash2, Edit, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';

export function OrganizationManagement() {
  const { organizations, createOrganization, updateOrganization, deleteOrganization, loading } = useOrganization();
  const { isSuperAdmin } = usePermissions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">You don't have permission to manage organizations.</p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) return;

    if (editingOrg) {
      await updateOrganization(editingOrg, { name: formData.name, slug: formData.slug });
    } else {
      await createOrganization(formData.name, formData.slug);
    }

    setFormData({ name: '', slug: '' });
    setEditingOrg(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (org: any) => {
    setFormData({ name: org.name, slug: org.slug });
    setEditingOrg(org.id);
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (org: any) => {
    await updateOrganization(org.id, { is_active: !org.is_active });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      await deleteOrganization(id);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organizations
          </CardTitle>
          <CardDescription>Manage organizations and their settings.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingOrg(null); setFormData({ name: '', slug: '' }); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingOrg ? 'Edit Organization' : 'Create Organization'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL-friendly identifier)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') 
                  })}
                  placeholder="acme-corp"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingOrg ? 'Update Organization' : 'Create Organization'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {organizations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No organizations found.</p>
          ) : (
            organizations.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{org.name}</span>
                      <Badge variant={org.is_active ? 'default' : 'secondary'}>
                        {org.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">/{org.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(org)}
                    title={org.is_active ? 'Disable' : 'Enable'}
                  >
                    {org.is_active ? (
                      <PowerOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Power className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(org)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(org.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
