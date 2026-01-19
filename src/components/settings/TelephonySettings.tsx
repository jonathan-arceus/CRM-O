import { useState, useEffect } from 'react';
import { Phone, Settings, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTelephony, TelephonyProvider } from '@/hooks/useTelephony';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';

export function TelephonySettings() {
  const { settings, callLogs, updateSettings, loading } = useTelephony();
  const { isSuperAdmin, hasPermission } = usePermissions();
  const [formData, setFormData] = useState({
    is_enabled: false,
    provider: 'tel' as TelephonyProvider,
    api_sid: '',
    api_token: '',
    api_endpoint: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = isSuperAdmin || hasPermission('settings.telephony');

  useEffect(() => {
    if (settings) {
      setFormData({
        is_enabled: settings.is_enabled,
        provider: settings.provider || 'tel',
        api_sid: settings.api_sid || '',
        api_token: settings.api_token || '',
        api_endpoint: settings.api_endpoint || '',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateSettings(formData);
    setIsSaving(false);
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
    <Tabs defaultValue="settings" className="space-y-6">
      <TabsList>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </TabsTrigger>
        <TabsTrigger value="logs" className="flex items-center gap-2">
          <History className="w-4 h-4" />
          Call Logs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Click-to-Call Configuration
            </CardTitle>
            <CardDescription>
              Configure telephony integration for click-to-call functionality.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label className="text-base">Enable Click-to-Call</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users with permission to make calls directly from the CRM.
                </p>
              </div>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                disabled={!canEdit}
              />
            </div>

            {formData.is_enabled && (
              <>
                {/* Provider Selection */}
                <div className="space-y-2">
                  <Label>Telephony Provider</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value: TelephonyProvider) => 
                      setFormData({ ...formData, provider: value })
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tel">Browser Tel: Links (No API needed)</SelectItem>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="vonage">Vonage</SelectItem>
                      <SelectItem value="sip">Generic SIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* API Credentials (for non-tel providers) */}
                {formData.provider !== 'tel' && (
                  <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                    <p className="text-sm font-medium">API Credentials</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Account SID / API Key</Label>
                        <Input
                          type="password"
                          value={formData.api_sid}
                          onChange={(e) => setFormData({ ...formData, api_sid: e.target.value })}
                          disabled={!canEdit}
                          placeholder="Enter your account SID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Auth Token / API Secret</Label>
                        <Input
                          type="password"
                          value={formData.api_token}
                          onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                          disabled={!canEdit}
                          placeholder="Enter your auth token"
                        />
                      </div>
                    </div>

                    {formData.provider === 'sip' && (
                      <div className="space-y-2">
                        <Label>SIP Endpoint</Label>
                        <Input
                          value={formData.api_endpoint}
                          onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                          disabled={!canEdit}
                          placeholder="sip:server.example.com"
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {canEdit && (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Telephony Settings'}
              </Button>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="logs">
        <Card>
          <CardHeader>
            <CardTitle>Call History</CardTitle>
            <CardDescription>
              Recent calls made through the click-to-call feature.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {callLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No call logs yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-mono">{log.phone_number}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          log.call_status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : log.call_status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {log.call_status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.duration_seconds 
                          ? `${Math.floor(log.duration_seconds / 60)}:${(log.duration_seconds % 60).toString().padStart(2, '0')}`
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
