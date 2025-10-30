import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import supabase from '@/utils/supabase';

interface EditDepartmentFormProps {
  department: {
    id: string;
    name: string;
    organization_id: string;
  };
  onDepartmentUpdated: () => void;
  onClose?: () => void;
}

const EditDepartmentForm = ({ department, onDepartmentUpdated, onClose }: EditDepartmentFormProps) => {
  const [name, setName] = useState(department.name || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateDepartment = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a department name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .update({ name: name.trim() })
        .eq('id', department.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Department updated',
        description: `Department renamed to "${data.name}" successfully.`,
      });

      onDepartmentUpdated();
      if (onClose) onClose();
    } catch (error: any) {
      toast({
        title: 'Failed to update department',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dept-name-edit">Department Name *</Label>
        <Input
          id="dept-name-edit"
          placeholder="Enter department name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') updateDepartment(); }}
        />
      </div>

      <Button
        onClick={updateDepartment}
        disabled={loading || !name.trim()}
        className="w-full"
      >
        {loading ? 'Updating Department...' : 'Update Department'}
      </Button>

      <div className="text-xs text-muted-foreground">
        <p>• Department name is required</p>
        <p>• Changes will be visible to all members in this organization</p>
      </div>
    </div>
  );
};

export default EditDepartmentForm;


