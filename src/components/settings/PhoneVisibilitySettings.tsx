import { Phone, Eye, EyeOff, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePhoneVisibility, PhoneVisibilityMode } from '@/hooks/usePhoneVisibility';
import { usePermissions } from '@/hooks/usePermissions';

export function PhoneVisibilitySettings() {
  const { updateVisibility, getRoleVisibility, loading } = usePhoneVisibility();
  const { roles, isSuperAdmin, hasPermission } = usePermissions();

  const canEdit = isSuperAdmin || hasPermission('settings.phone_visibility');

  // Filter to org roles only
  const orgRoles = roles.filter(r => !r.is_system_role);

  const handleChange = async (roleId: string, mode: PhoneVisibilityMode) => {
    await updateVisibility(roleId, mode);
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Phone Number Visibility
        </CardTitle>
        <CardDescription>
          Control how phone numbers are displayed to different roles. Super Admin always sees full numbers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Super Admin info */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
            <Shield className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <span className="font-medium">Super Admin</span>
              <p className="text-sm text-muted-foreground">Always sees full phone numbers</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              Full
            </div>
          </div>

          {/* Role settings */}
          {orgRoles.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No roles configured. Create roles first to set phone visibility.
            </p>
          ) : (
            orgRoles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div>
                  <span className="font-medium">{role.display_name}</span>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
                <Select
                  value={getRoleVisibility(role.id)}
                  onValueChange={(value: PhoneVisibilityMode) => handleChange(role.id, value)}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Full Number
                      </div>
                    </SelectItem>
                    <SelectItem value="masked">
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-center">***</span>
                        Masked
                      </div>
                    </SelectItem>
                    <SelectItem value="hidden">
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4" />
                        Hidden
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))
          )}

          {/* Example */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm font-medium mb-2">Example Phone: +1 555 123 4567</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Full:</span>
                <p className="font-mono">+1 555 123 4567</p>
              </div>
              <div>
                <span className="text-muted-foreground">Masked:</span>
                <p className="font-mono">+1 ••••••••• 67</p>
              </div>
              <div>
                <span className="text-muted-foreground">Hidden:</span>
                <p className="font-mono">••••••••••••••</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
