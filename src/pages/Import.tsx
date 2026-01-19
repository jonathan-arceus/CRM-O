import { useState, useMemo } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Download,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CRMLayout } from '@/components/crm/CRMLayout';
import { cn } from '@/lib/utils';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { useLeadSources } from '@/hooks/useLeadSources';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useLeads } from '@/hooks/useLeads';

interface ColumnMapping {
  [key: string]: string;
}

export default function Import() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [duplicateCheck, setDuplicateCheck] = useState(true);
  const [roundRobin, setRoundRobin] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);

  const { statuses } = useLeadStatuses();
  const { sources, getDefaultSource, loading: sourcesLoading } = useLeadSources();
  const { activeFields, loading: fieldsLoading } = useCustomFields();
  const { hasPermission } = usePermissions();

  const { toast } = useToast();
  const { createLead, leads } = useLeads();

  const canImport = hasPermission('import.csv');

  // Define required and optional fields
  const requiredFields = useMemo(() => [
    { key: 'full_name', label: 'Full Name', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'company', label: 'Company', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'value', label: 'Value', required: false },
    { key: 'notes', label: 'Notes', required: false },
    ...activeFields.map(f => ({
      key: `custom_${f.field_name}`,
      label: f.field_label,
      required: f.is_required,
    })),
  ], [activeFields]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const handleFileLoad = async (selectedFile: File) => {
    console.log('[CSV UPLOAD] Step 1: Starting file load', { fileName: selectedFile.name, fileSize: selectedFile.size });
    setFile(selectedFile);

    try {
      console.log('[CSV UPLOAD] Step 2: Reading file text...');
      const text = await selectedFile.text();
      console.log('[CSV UPLOAD] Step 3: File read complete, length:', text.length);

      console.log('[CSV UPLOAD] Step 4: Parsing CSV...');
      const parsed = parseCSV(text);
      console.log('[CSV UPLOAD] Step 5: CSV parsed, rows:', parsed.length);

      if (parsed.length < 2) {
        console.error('[CSV UPLOAD] ERROR: Not enough rows');
        toast({
          title: 'Invalid file',
          description: 'CSV must have at least a header row and one data row.',
          variant: 'destructive',
        });
        return;
      }

      console.log('[CSV UPLOAD] Step 6: Setting CSV headers and data...');
      setCsvHeaders(parsed[0]);
      setCsvData(parsed.slice(1));
      console.log('[CSV UPLOAD] Step 7: Headers set:', parsed[0]);

      // Auto-map columns based on header names
      console.log('[CSV UPLOAD] Step 8: Auto-mapping columns...');
      const autoMapping: ColumnMapping = {};
      parsed[0].forEach((header, index) => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const matchingField = requiredFields.find(f =>
          f.key.toLowerCase() === normalizedHeader ||
          f.label.toLowerCase().replace(/[^a-z0-9]/g, '_') === normalizedHeader
        );
        if (matchingField) {
          autoMapping[matchingField.key] = `col_${index}`;
        }
      });
      setColumnMapping(autoMapping);
      console.log('[CSV UPLOAD] Step 9: Column mapping complete:', autoMapping);

      // Set default source
      console.log('[CSV UPLOAD] Step 10: Setting default source...');
      const defaultSource = getDefaultSource();
      if (defaultSource) {
        setSelectedSource(defaultSource.name);
        console.log('[CSV UPLOAD] Step 11: Default source set:', defaultSource.name);
      } else if (sources.length > 0) {
        setSelectedSource(sources[0].name);
        console.log('[CSV UPLOAD] Step 11: Using first source:', sources[0].name);
      } else {
        console.warn('[CSV UPLOAD] WARNING: No sources available!');
      }

      console.log('[CSV UPLOAD] Step 12: Moving to step 2...');
      setStep(2);
      console.log('[CSV UPLOAD] SUCCESS: File load complete!');
    } catch (error) {
      console.error('[CSV UPLOAD] FATAL ERROR during file processing:', error);
      toast({
        title: 'Error reading file',
        description: 'Could not parse the CSV file.',
        variant: 'destructive',
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx'))) {
      handleFileLoad(droppedFile);
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file.',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileLoad(selectedFile);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'Full Name',
      'Email',
      'Phone',
      'Company',
      'Status',
      'Value',
      'Notes',
      ...activeFields.map(f => f.field_label),
    ];

    // Add sample data row
    const sampleRow = [
      'John Doe',
      'john@example.com',
      '+1234567890',
      'Acme Inc',
      statuses[0]?.name || 'new',
      '5000',
      'Sample notes',
      ...activeFields.map(f => {
        if (f.field_type === 'dropdown' && f.dropdown_options.length > 0) {
          return f.dropdown_options[0];
        }
        return '';
      }),
    ];

    // Add comments row with valid values
    const commentRow = [
      '# Required field',
      '# Optional',
      '# Optional',
      '# Optional',
      `# Valid values: ${statuses.map(s => s.name).join(', ')}`,
      '# Numeric value',
      '# Optional text',
      ...activeFields.map(f => {
        if (f.field_type === 'dropdown') {
          return `# Options: ${f.dropdown_options.join(', ')}`;
        }
        return `# ${f.field_type}`;
      }),
    ];

    const csv = [
      headers.join(','),
      sampleRow.map(v => `"${v}"`).join(','),
      commentRow.map(v => `"${v}"`).join(','),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Template downloaded' });
  };

  const validateAndImport = async () => {
    setIsImporting(true);
    const errors: string[] = [];
    let successCount = 0;

    const existingEmails = new Set(leads.map(l => l.email?.toLowerCase()).filter(Boolean));
    const existingPhones = new Set(leads.map(l => l.phone).filter(Boolean));

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNum = i + 2; // Account for header row

      try {
        // Helper to get field value from row
        const getFieldValue = (fieldKey: string): string | undefined => {
          const colIndex = columnMapping[fieldKey];
          if (!colIndex || colIndex === '__UNMAPPED__') return undefined;
          const colNum = parseInt(colIndex.replace('col_', ''));
          return row[colNum]?.trim();
        };

        const fullName = getFieldValue('full_name') || '';
        const email = getFieldValue('email');
        const phone = getFieldValue('phone');
        const company = getFieldValue('company');
        const statusValue = getFieldValue('status');
        const notes = getFieldValue('notes');
        const value = getFieldValue('value');

        // Validate required fields
        if (!fullName) {
          errors.push(`Row ${rowNum}: Full Name is required`);
          continue;
        }

        // Duplicate check
        if (duplicateCheck) {
          if (email && existingEmails.has(email.toLowerCase())) {
            errors.push(`Row ${rowNum}: Email "${email}" already exists`);
            continue;
          }
          if (phone && existingPhones.has(phone)) {
            errors.push(`Row ${rowNum}: Phone "${phone}" already exists`);
            continue;
          }
        }

        // Validate status
        let finalStatus = statusValue;
        if (statusValue) {
          const validStatus = statuses.find(s =>
            s.name.toLowerCase() === statusValue.toLowerCase() ||
            s.label.toLowerCase() === statusValue.toLowerCase()
          );
          if (!validStatus) {
            errors.push(`Row ${rowNum}: Invalid status "${statusValue}"`);
            continue;
          }
          finalStatus = validStatus.name;
        } else {
          finalStatus = statuses.find(s => s.is_default)?.name || statuses[0]?.name || 'new';
        }

        // Build custom fields
        const customFields: Record<string, unknown> = {};
        for (const field of activeFields) {
          const fieldValue = getFieldValue(`custom_${field.field_name}`);
          if (fieldValue) {
            if (field.field_type === 'dropdown' && !field.dropdown_options.includes(fieldValue)) {
              errors.push(`Row ${rowNum}: Invalid value "${fieldValue}" for field "${field.field_label}"`);
              continue;
            }
            customFields[field.field_name] = fieldValue;
          } else if (field.is_required) {
            errors.push(`Row ${rowNum}: ${field.field_label} is required`);
            continue;
          }
        }

        // Create lead
        const { error } = await createLead({
          full_name: fullName,
          email: email || undefined,
          phone: phone || undefined,
          company: company || undefined,
          source: selectedSource as any,
          status: finalStatus as any,
          value: value ? parseFloat(value) : undefined,
          notes: notes || undefined,
        });

        if (error) {
          errors.push(`Row ${rowNum}: ${error.message || 'Failed to create lead'}`);
        } else {
          successCount++;
          if (email) existingEmails.add(email.toLowerCase());
          if (phone) existingPhones.add(phone);
        }
      } catch (err: any) {
        errors.push(`Row ${rowNum}: ${err.message || 'Unknown error'}`);
      }
    }

    setIsImporting(false);
    setImportResults({ success: successCount, errors });

    if (successCount > 0) {
      toast({
        title: 'Import completed',
        description: `Successfully imported ${successCount} leads${errors.length > 0 ? ` with ${errors.length} errors` : ''}.`,
      });
    } else if (errors.length > 0) {
      toast({
        title: 'Import failed',
        description: `All ${errors.length} rows had errors.`,
        variant: 'destructive',
      });
    }
  };

  if (!canImport) {
    return (
      <CRMLayout>
        <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You do not have permission to import leads.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Import Leads</h1>
          <p className="text-muted-foreground mt-1">
            Upload a CSV file to bulk import leads into your CRM.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              <span
                className={cn(
                  'text-sm font-medium hidden sm:block',
                  step >= s ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {s === 1 ? 'Upload File' : s === 2 ? 'Map Columns' : 'Import'}
              </span>
              {s < 3 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground mx-2 hidden sm:block" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && !sourcesLoading && !fieldsLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Your File</CardTitle>
              <CardDescription>
                Drag and drop your CSV file, or click to browse.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer',
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-1">
                  Drop your file here
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports CSV files up to 10MB
                </p>
              </div>

              <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Need a template?</p>
                  <p className="text-xs text-muted-foreground">
                    Download our CSV template with all fields and valid values.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Template
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Map Your Columns</CardTitle>
              <CardDescription>
                Match your file columns to CRM fields. Required fields are marked with *.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {file && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {csvData.length} rows • {csvHeaders.length} columns
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setCsvData([]);
                      setCsvHeaders([]);
                      setColumnMapping({});
                      setStep(1);
                    }}
                  >
                    Change
                  </Button>
                </div>
              )}

              {/* Lead Source Selection */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <Label className="text-sm font-medium">
                  Lead Source for All Imported Leads *
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  All leads from this import will be assigned this source.
                </p>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select lead source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={source.name}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {requiredFields.map((field) => (
                  <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                    <Label className="flex items-center gap-1">
                      {field.label}
                      {field.required && (
                        <span className="text-destructive">*</span>
                      )}
                    </Label>
                    <Select
                      value={columnMapping[field.key] || '__UNMAPPED__'}
                      onValueChange={(v) => setColumnMapping(prev => ({ ...prev, [field.key]: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__UNMAPPED__">— Not mapped —</SelectItem>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={`col_${index}`}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!columnMapping.full_name || !selectedSource}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Import Options & Confirm */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Import Settings</CardTitle>
              <CardDescription>
                Configure import options before processing your leads.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Import Summary</p>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>• {csvData.length} leads to import</p>
                    <p>• Source: {sources.find(s => s.name === selectedSource)?.label}</p>
                    <p>• {Object.keys(columnMapping).filter(k => columnMapping[k]).length} fields mapped</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Duplicate Detection</Label>
                    <p className="text-xs text-muted-foreground">
                      Skip leads with existing email or phone numbers
                    </p>
                  </div>
                  <Switch
                    checked={duplicateCheck}
                    onCheckedChange={setDuplicateCheck}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Round-Robin Assignment</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically distribute leads among team members
                    </p>
                  </div>
                  <Switch
                    checked={roundRobin}
                    onCheckedChange={setRoundRobin}
                  />
                </div>
              </div>

              {importResults && (
                <div className={cn(
                  'p-4 rounded-lg',
                  importResults.errors.length > 0
                    ? 'bg-destructive/10 border border-destructive/20'
                    : 'bg-status-converted/10 border border-status-converted/20'
                )}>
                  <div className="flex items-start gap-3">
                    {importResults.errors.length > 0 ? (
                      <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-status-converted shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {importResults.success} leads imported successfully
                      </p>
                      {importResults.errors.length > 0 && (
                        <div className="mt-2 max-h-32 overflow-y-auto">
                          {importResults.errors.slice(0, 10).map((err, i) => (
                            <p key={i} className="text-xs text-destructive">{err}</p>
                          ))}
                          {importResults.errors.length > 10 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ... and {importResults.errors.length - 10} more errors
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!importResults && (
                <div className="flex items-start gap-3 p-4 bg-status-followup/10 border border-status-followup/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-status-followup shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Ready to import
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This will import {csvData.length} leads from {file?.name}.
                      Invalid rows will be skipped with error messages.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={validateAndImport} disabled={isImporting}>
                  {isImporting ? (
                    <>Importing...</>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Leads
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CRMLayout>
  );
}
