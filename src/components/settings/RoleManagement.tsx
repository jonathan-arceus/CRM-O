import { useState } from 'react';
import { Plus, Shield, Trash2, Edit, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { usePermissions, RoleWithPermissions, Permission } from '@/hooks/usePermissions';
import { useOrganization } from '@/hooks/useOrganization';

const SYSTEM_PAGES = [
  { path: '/', label: 'Dashboard' },
  { path: '/leads', label: 'Leads' },
  { path: '/pipeline', label: 'Pipeline' },
  { path: '/contacts', label: 'Contacts' },
  { path: '/import', label: 'Import' },
  { path: '/reports', label: 'Reports' },
  { path: '/users', label: 'Users' },
  { path: '/groups', label: 'Groups' },
  { path: '/settings', label: 'Settings' },
];

export function RoleManagement() {
  const { 
    roles, 
    permissions, 
    isSuperAdmin, 
    createRole, 
    updateRole, 
    deleteRole, 
    setRolePermissions,
    setPageVisibility,
    pageVisibility,
    loading 
  } = usePermissions();
  const { organization } = useOrganization();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    display_name: '', 
    description: '',
    is_org_admin: false 
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">You don't have permission to manage roles.</p>
        </CardContent>
      </Card>
    );
  }

  // Filter to show only org-specific roles (not system roles)
  const orgRoles = roles.filter(r => !r.is_system_role);

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', display_name: '', description: '', is_org_admin: false });
    setSelectedPermissions([]);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (role: RoleWithPermissions) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      is_org_admin: role.is_org_admin,
    });
    setSelectedPermissions(role.permissions.map(p => p.id));
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.display_name) return;

    if (editingRole) {
      await updateRole(editingRole.id, {
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description || null,
        is_org_admin: formData.is_org_admin,
      });
      await setRolePermissions(editingRole.id, selectedPermissions);
    } else {
      const { data } = await createRole({
        name: formData.name.toLowerCase().replace(/\s+/g, '_'),
        display_name: formData.display_name,
        description: formData.description || null,
        organization_id: organization?.id,
        is_org_admin: formData.is_org_admin,
      });
      if (data) {
        await setRolePermissions(data.id, selectedPermissions);
      }
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      await deleteRole(id);
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permId)
        ? prev.filter(id => id !== permId)
        : [...prev, permId]
    );
  };

  const getPageVisibility = (roleId: string, pagePath: string): boolean => {
    const vis = pageVisibility.find(
      pv => pv.role_id === roleId && pv.page_path === pagePath
    );
    return vis?.is_visible ?? true;
  };

  const handlePageVisibilityToggle = async (roleId: string, pagePath: string, isVisible: boolean) => {
    await setPageVisibility(roleId, pagePath, isVisible);
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Dynamic Roles
            </CardTitle>
            <CardDescription>Create and manage custom roles with granular permissions.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role Name</Label>
                    <Input
                      value={formData.display_name}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        display_name: e.target.value,
                        name: e.target.value.toLowerCase().replace(/\s+/g, '_')
                      })}
                      placeholder="Sales Manager"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>System Key</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="sales_manager"
                      disabled={!!editingRole}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the role's purpose"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_org_admin}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_org_admin: checked })}
                  />
                  <Label>Organization Administrator</Label>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Permissions</Label>
                  <div className="grid gap-4">
                    {Object.entries(permissionsByCategory).map(([category, perms]) => (
                      <div key={category} className="space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">{category}</span>
                        <div className="grid grid-cols-2 gap-2">
                          {perms.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50"
                            >
                              <Checkbox
                                checked={selectedPermissions.includes(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                              />
                              <span className="text-sm">{perm.display_name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orgRoles.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No custom roles defined. Create one to get started.
              </p>
            ) : (
              orgRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{role.display_name}</span>
                      {role.is_org_admin && (
                        <Badge variant="secondary">Admin</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {role.permissions.length} permissions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(role)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(role.id)}
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

      {/* Page Visibility Control */}
      <Card>
        <CardHeader>
          <CardTitle>Page Visibility</CardTitle>
          <CardDescription>Control which pages each role can access.</CardDescription>
        </CardHeader>
        <CardContent>
          {orgRoles.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Create roles first to configure page visibility.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Page</th>
                    {orgRoles.map(role => (
                      <th key={role.id} className="text-center py-2 px-3 font-medium">
                        {role.display_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SYSTEM_PAGES.map(page => (
                    <tr key={page.path} className="border-b">
                      <td className="py-2 px-3">{page.label}</td>
                      {orgRoles.map(role => (
                        <td key={role.id} className="text-center py-2 px-3">
                          <Switch
                            checked={getPageVisibility(role.id, page.path)}
                            onCheckedChange={(checked) => 
                              handlePageVisibilityToggle(role.id, page.path, checked)
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
