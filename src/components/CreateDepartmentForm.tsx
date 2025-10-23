import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import supabase from '@/utils/supabase';

interface CreateDepartmentFormProps {
  organizationId: string;
  onDepartmentCreated: () => void;
  onClose?: () => void;
}

const CreateDepartmentForm = ({ organizationId, onDepartmentCreated, onClose }: CreateDepartmentFormProps) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createDepartment = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a department name.",
        variant: "destructive",
      });
      return;
    }

    if (!organizationId) {
      toast({
        title: "No organization",
        description: "Please create an organization first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Creating department:', { name, organizationId });
      
      const { data, error } = await supabase
        .from('departments')
        .insert({
          name: name.trim(),
          organization_id: organizationId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating department:', error);
        throw error;
      }

      console.log('Department created:', data);

      toast({
        title: "Department created",
        description: `Department "${data.name}" has been created successfully.`,
      });

      onDepartmentCreated();
      setName('');
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to create department:', error);
      toast({
        title: "Failed to create department",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dept-name">Department Name *</Label>
        <Input 
          id="dept-name" 
          placeholder="Engineering, Marketing, Sales..." 
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && createDepartment()}
        />
      </div>

      <Button 
        onClick={createDepartment} 
        disabled={loading || !name.trim()}
        className="w-full"
      >
        {loading ? "Creating Department..." : "Create Department"}
      </Button>

      <div className="text-xs text-muted-foreground">
        <p>• Department name is required</p>
        <p>• Department will be added to your organization</p>
        <p>• You can assign users to this department later</p>
      </div>
    </div>
  );
};

export default CreateDepartmentForm;

