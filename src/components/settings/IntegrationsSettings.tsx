import { useState } from 'react';
import { Plus, Trash2, Save, Key, Webhook, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export function IntegrationsSettings() {
  const { settings, loading, updateIntegrations } = useSystemSettings();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyValue, setNewApiKeyValue] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleAddApiKey = async () => {
    if (!newApiKeyName.trim() || !newApiKeyValue.trim()) return;
    
    const updatedKeys = {
      ...settings.integrations.api_keys,
      [newApiKeyName]: newApiKeyValue,
    };
    
    setIsSaving(true);
    await updateIntegrations({ api_keys: updatedKeys });
    setNewApiKeyName('');
    setNewApiKeyValue('');
    setIsSaving(false);
  };

  const handleRemoveApiKey = async (keyName: string) => {
    const updatedKeys = { ...settings.integrations.api_keys };
    delete updatedKeys[keyName];
    
    setIsSaving(true);
    await updateIntegrations({ api_keys: updatedKeys });
    setIsSaving(false);
  };

  const handleWebhookToggle = async (index: number, enabled: boolean) => {
    const updatedWebhooks = [...settings.integrations.webhooks];
    updatedWebhooks[index] = { ...updatedWebhooks[index], enabled };
    
    await updateIntegrations({ webhooks: updatedWebhooks });
  };

  const [newWebhook, setNewWebhook] = useState({ name: '', url: '' });

  const handleAddWebhook = async () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim()) return;
    
    const updatedWebhooks = [
      ...settings.integrations.webhooks,
      { ...newWebhook, enabled: true },
    ];
    
    setIsSaving(true);
    await updateIntegrations({ webhooks: updatedWebhooks });
    setNewWebhook({ name: '', url: '' });
    setIsSaving(false);
  };

  const handleRemoveWebhook = async (index: number) => {
    const updatedWebhooks = settings.integrations.webhooks.filter((_, i) => i !== index);
    
    setIsSaving(true);
    await updateIntegrations({ webhooks: updatedWebhooks });
    setIsSaving(false);
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys for third-party integrations.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.integrations.api_keys).map(([name, value]) => (
            <div key={name} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{name}</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {showKeys[name] ? value : maskApiKey(value)}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowKeys({ ...showKeys, [name]: !showKeys[name] })}
              >
                {showKeys[name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={() => handleRemoveApiKey(name)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Separator />

          <div className="space-y-3">
            <Label>Add New API Key</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Key name (e.g., Mailchimp)"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
              />
              <Input
                type="password"
                placeholder="API key value"
                value={newApiKeyValue}
                onChange={(e) => setNewApiKeyValue(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              onClick={handleAddApiKey}
              disabled={!newApiKeyName.trim() || !newApiKeyValue.trim() || isSaving}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add API Key
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            <div>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Configure webhook endpoints for event notifications.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.integrations.webhooks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No webhooks configured.
            </p>
          )}

          {settings.integrations.webhooks.map((webhook, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{webhook.name}</p>
                <p className="text-sm text-muted-foreground font-mono truncate">{webhook.url}</p>
              </div>
              <Switch
                checked={webhook.enabled}
                onCheckedChange={(v) => handleWebhookToggle(index, v)}
              />
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={() => handleRemoveWebhook(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Separator />

          <div className="space-y-3">
            <Label>Add New Webhook</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Webhook name"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
              />
              <Input
                placeholder="https://example.com/webhook"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
              />
            </div>
            <Button
              size="sm"
              onClick={handleAddWebhook}
              disabled={!newWebhook.name.trim() || !newWebhook.url.trim() || isSaving}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Webhook
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
