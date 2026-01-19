import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Palette, Sun, Moon, Sparkles, Upload, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';

export function ThemeSettings() {
  const { settings, updateSettings, loading } = useOrganization();
  const { isSuperAdmin, hasPermission } = usePermissions();
  const [formData, setFormData] = useState({
    theme_mode: 'light' as 'light' | 'dark' | 'custom',
    primary_color: '#8B5CF6',
    secondary_color: '#6366F1',
    button_style: 'rounded' as 'rounded' | 'square' | 'pill',
    crm_name: 'CRM System',
    org_name: '',
  });
  const { organization, uploadLogo, updateOrganization } = useOrganization();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = isSuperAdmin || hasPermission('settings.branding');

  useEffect(() => {
    if (settings) {
      setFormData({
        theme_mode: settings.theme_mode,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        button_style: settings.button_style,
        crm_name: settings.crm_name,
        org_name: organization?.name || '',
      });
      setLogoPreview(organization?.logo_url || null);
    }
  }, [settings, organization]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    // 1. Upload logo if changed
    if (logoFile) {
      setIsUploading(true);
      await uploadLogo(logoFile);
      setLogoFile(null);
      setIsUploading(false);
    }

    // 2. Update Org Name if changed
    if (organization && formData.org_name !== organization.name) {
      await updateOrganization(organization.id, { name: formData.org_name });
    }

    // 3. Update Theme Settings
    const { org_name, ...themeUpdates } = formData;
    await updateSettings(themeUpdates);

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Theme & Branding
          </CardTitle>
          <CardDescription>
            Customize the look and feel of your CRM. Changes apply organization-wide.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CRM Name */}
          {/* Organization Name */}
          <div className="space-y-2">
            <Label>Organization Name</Label>
            <Input
              value={formData.org_name}
              onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
              disabled={!canEdit}
              placeholder="My Company"
            />
            <p className="text-xs text-muted-foreground">The legal name of your organization.</p>
          </div>

          {/* CRM Name */}
          <div className="space-y-2">
            <Label>CRM Name (Display Title)</Label>
            <Input
              value={formData.crm_name}
              onChange={(e) => setFormData({ ...formData, crm_name: e.target.value })}
              disabled={!canEdit}
              placeholder="My CRM"
            />
            <p className="text-xs text-muted-foreground">The title displayed in the sidebar and browser tab.</p>
          </div>

          {/* Logo Upload */}
          <div className="space-y-4">
            <Label>Organization Logo</Label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/30 overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                )}
              </div>

              <div className="space-y-2 flex-1 w-full">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    disabled={!canEdit || isUploading}
                    className="cursor-pointer hidden"
                    id="logo-upload"
                  />
                  <Label
                    htmlFor="logo-upload"
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md border bg-background hover:bg-muted transition-colors cursor-pointer text-sm font-medium",
                      (!canEdit || isUploading) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Upload className="w-4 h-4" />
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </Label>
                  {logoPreview && canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(organization?.logo_url || null);
                      }}
                      disabled={isUploading}
                    >
                      Reset
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended size: 256x256px. Supported formats: PNG, JPG, SVG.
                </p>
              </div>
            </div>
          </div>

          {/* Theme Mode */}
          <div className="space-y-3">
            <Label>Theme Mode</Label>
            <RadioGroup
              value={formData.theme_mode}
              onValueChange={(value: 'light' | 'dark' | 'custom') =>
                setFormData({ ...formData, theme_mode: value })
              }
              disabled={!canEdit}
              className="grid grid-cols-3 gap-4"
            >
              <label
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors ${formData.theme_mode === 'light' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
              >
                <RadioGroupItem value="light" className="sr-only" />
                <Sun className="w-6 h-6" />
                <span className="text-sm font-medium">Light</span>
              </label>
              <label
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors ${formData.theme_mode === 'dark' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
              >
                <RadioGroupItem value="dark" className="sr-only" />
                <Moon className="w-6 h-6" />
                <span className="text-sm font-medium">Dark</span>
              </label>
              <label
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors ${formData.theme_mode === 'custom' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
              >
                <RadioGroupItem value="custom" className="sr-only" />
                <Sparkles className="w-6 h-6" />
                <span className="text-sm font-medium">Custom</span>
              </label>
            </RadioGroup>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  disabled={!canEdit}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  disabled={!canEdit}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  disabled={!canEdit}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  disabled={!canEdit}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Button Style */}
          <div className="space-y-2">
            <Label>Button Style</Label>
            <Select
              value={formData.button_style}
              onValueChange={(value: 'rounded' | 'square' | 'pill') =>
                setFormData({ ...formData, button_style: value })
              }
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rounded">Rounded</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="pill">Pill</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: formData.theme_mode === 'dark' ? '#1a1a2e' : '#f8fafc',
              }}
            >
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 text-white font-medium"
                  style={{
                    backgroundColor: formData.primary_color,
                    borderRadius: formData.button_style === 'pill'
                      ? '9999px'
                      : formData.button_style === 'square'
                        ? '0'
                        : '0.5rem',
                  }}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 py-2 font-medium"
                  style={{
                    backgroundColor: formData.secondary_color + '20',
                    color: formData.secondary_color,
                    borderRadius: formData.button_style === 'pill'
                      ? '9999px'
                      : formData.button_style === 'square'
                        ? '0'
                        : '0.5rem',
                  }}
                >
                  Secondary Button
                </button>
              </div>
            </div>
          </div>

          {canEdit && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Theme Settings'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
