import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export type FieldType = 'text' | 'number' | 'date' | 'dropdown' | 'textarea';

export interface CustomFieldDefinition {
  id: string;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  dropdown_options: string[];
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCustomFields() {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFields = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      // Parse dropdown_options from JSONB and cast field_type
      const parsed: CustomFieldDefinition[] = (data || []).map(field => ({
        ...field,
        field_type: field.field_type as FieldType,
        dropdown_options: Array.isArray(field.dropdown_options) 
          ? field.dropdown_options as string[]
          : [],
      }));
      
      setFields(parsed);
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      toast({
        title: 'Error fetching custom fields',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const createField = async (data: {
    field_name: string;
    field_label: string;
    field_type: FieldType;
    dropdown_options?: string[];
    is_required?: boolean;
    sort_order?: number;
  }) => {
    try {
      const { error } = await supabase.from('custom_field_definitions').insert({
        ...data,
        dropdown_options: data.dropdown_options || [],
        is_required: data.is_required || false,
        sort_order: data.sort_order || fields.length,
      });
      if (error) throw error;
      await fetchFields();
      toast({ title: 'Custom field created successfully' });
      return { error: null };
    } catch (error: any) {
      console.error('Error creating custom field:', error);
      toast({
        title: 'Error creating custom field',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateField = async (id: string, updates: Partial<CustomFieldDefinition>) => {
    try {
      const { error } = await supabase
        .from('custom_field_definitions')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      await fetchFields();
      toast({ title: 'Custom field updated successfully' });
      return { error: null };
    } catch (error: any) {
      console.error('Error updating custom field:', error);
      toast({
        title: 'Error updating custom field',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const deleteField = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_field_definitions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchFields();
      toast({ title: 'Custom field deleted successfully' });
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting custom field:', error);
      toast({
        title: 'Error deleting custom field',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const activeFields = fields.filter(f => f.is_active);

  return {
    fields,
    activeFields,
    loading,
    createField,
    updateField,
    deleteField,
    refetch: fetchFields,
  };
}
