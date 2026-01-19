import { useState } from 'react';
import { Upload, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export function BrandingSettings() {
  const { settings, loading, updateBranding } = useSystemSettings();
  const [crmName, setCrmName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when settings load
  useState(() => {
    if (settings.branding) {
      setCrmName(settings.branding.crm_name);
      setLogoUrl(settings.branding.logo_url || '');
    }
  });

  const handleSave = async () => {
    setIsSaving(true);
    await updateBranding({
      crm_name: crmName || settings.branding.crm_name,
      logo_url: logoUrl || null,
    });
    setIsSaving(false);
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>Customize your CRM appearance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="crm-name">CRM Name</Label>
          <Input
            id="crm-name"
            value={crmName || settings.branding.crm_name}
            onChange={(e) => setCrmName(e.target.value)}
            placeholder="My CRM"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo-url">Logo URL</Label>
          <div className="flex gap-2">
            <Input
              id="logo-url"
              value={logoUrl || settings.branding.logo_url || ''}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter a URL for your company logo. Recommended size: 200x50px
          </p>
        </div>

        {(logoUrl || settings.branding.logo_url) && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
            <img
              src={logoUrl || settings.branding.logo_url || ''}
              alt="Logo preview"
              className="max-h-12 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Branding'}
        </Button>
      </CardContent>
    </Card>
  );
}
