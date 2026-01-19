import { useState } from 'react';
import { Save, Shield, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CRMLayout } from '@/components/crm/CRMLayout';
import { StatusManagement } from '@/components/settings/StatusManagement';
import { SourceManagement } from '@/components/settings/SourceManagement';
import { CustomFieldsManagement } from '@/components/settings/CustomFieldsManagement';
import { BrandingSettings } from '@/components/settings/BrandingSettings';
import { IntegrationsSettings } from '@/components/settings/IntegrationsSettings';
import { AuditLogViewer } from '@/components/settings/AuditLogViewer';
import { OrganizationManagement } from '@/components/settings/OrganizationManagement';
import { RoleManagement } from '@/components/settings/RoleManagement';
import { ThemeSettings } from '@/components/settings/ThemeSettings';
import { PhoneVisibilitySettings } from '@/components/settings/PhoneVisibilitySettings';
import { TelephonySettings } from '@/components/settings/TelephonySettings';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

export default function Settings() {
  const { profile, role } = useAuth();
  const { isSuperAdmin, isOrgAdmin, hasPermission } = usePermissions();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [leadAssignmentNotify, setLeadAssignmentNotify] = useState(true);
  const [statusChangeNotify, setStatusChangeNotify] = useState(true);

  const canManageTelephony = isSuperAdmin || hasPermission('settings.telephony');
  const canManagePhoneVisibility = isSuperAdmin || hasPermission('settings.phone_visibility');

  return (
    <CRMLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">
              {isSuperAdmin 
                ? 'Full system configuration and management.' 
                : 'Configure your preferences.'}
            </p>
          </div>
          {isSuperAdmin && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Shield className="w-4 h-4" />
              Super Admin Access
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            {isSuperAdmin && (
              <>
                <TabsTrigger value="organizations">Organizations</TabsTrigger>
                <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
                <TabsTrigger value="statuses">Statuses</TabsTrigger>
                <TabsTrigger value="sources">Sources</TabsTrigger>
                <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
                <TabsTrigger value="theme">Theme</TabsTrigger>
                <TabsTrigger value="audit">Audit Log</TabsTrigger>
              </>
            )}
            {(canManageTelephony || canManagePhoneVisibility) && (
              <>
                {canManagePhoneVisibility && <TabsTrigger value="phone-visibility">Phone Privacy</TabsTrigger>}
                {canManageTelephony && <TabsTrigger value="telephony">Telephony</TabsTrigger>}
              </>
            )}
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Manage your personal information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input defaultValue={profile?.full_name || ''} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={role?.replace('_', ' ') || 'Agent'} disabled className="capitalize" />
                </div>
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Choose which notifications you want to receive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important events.
                    </p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lead Assignment</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when a lead is assigned to you.
                    </p>
                  </div>
                  <Switch
                    checked={leadAssignmentNotify}
                    onCheckedChange={setLeadAssignmentNotify}
                    disabled={!emailNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Status Changes</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when a lead's status changes.
                    </p>
                  </div>
                  <Switch
                    checked={statusChangeNotify}
                    onCheckedChange={setStatusChangeNotify}
                    disabled={!emailNotifications}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Super Admin Only Tabs */}
          {isSuperAdmin && (
            <>
              <TabsContent value="organizations">
                <OrganizationManagement />
              </TabsContent>

              <TabsContent value="roles">
                <RoleManagement />
              </TabsContent>

              <TabsContent value="statuses">
                <StatusManagement />
              </TabsContent>

              <TabsContent value="sources">
                <SourceManagement />
              </TabsContent>

              <TabsContent value="custom-fields">
                <CustomFieldsManagement />
              </TabsContent>

              <TabsContent value="theme">
                <ThemeSettings />
              </TabsContent>

              <TabsContent value="audit">
                <AuditLogViewer />
              </TabsContent>
            </>
          )}

          {/* Admin-accessible tabs */}
          {canManagePhoneVisibility && (
            <TabsContent value="phone-visibility">
              <PhoneVisibilitySettings />
            </TabsContent>
          )}

          {canManageTelephony && (
            <TabsContent value="telephony">
              <TelephonySettings />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </CRMLayout>
  );
}
