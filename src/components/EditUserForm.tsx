import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import supabase from '@/utils/supabase';

interface EditUserFormProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    organization_id?: string;
    department_id?: string;
  };
  departments: Array<{ id: string; name: string }>;
  onUserUpdated: () => void;
  onClose?: () => void;
}

const EditUserForm = ({ user, departments, onUserUpdated, onClose }: EditUserFormProps) => {
  const [departmentId, setDepartmentId] = useState(user.department_id || "none");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateUser = async () => {
    setLoading(true);
    try {
      console.log('Updating user department:', { id: user.id, departmentId });
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          department_id: departmentId === "none" ? null : departmentId || null
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user department:', error);
        throw error;
      }

      console.log('User department updated:', data);

      toast({
        title: "Department updated",
        description: `Department assignment for "${user.full_name}" has been updated successfully.`,
      });

      onUserUpdated();
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to update user department:', error);
      toast({
        title: "Failed to update department",
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
        <Label htmlFor="user-email">Email</Label>
        <Input 
          id="user-email" 
          value={user.email}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-name">Full Name</Label>
        <Input 
          id="user-name" 
          value={user.full_name || 'Not provided'}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">Name cannot be changed by admin</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-role">Role</Label>
        <Input 
          id="user-role" 
          value={user.role}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">Role cannot be changed by admin</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-department">Department</Label>
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger id="user-department">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Department</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={updateUser} 
        disabled={loading}
        className="w-full"
      >
        {loading ? "Updating Department..." : "Update Department"}
      </Button>

      <div className="text-xs text-muted-foreground">
        <p>• Only department assignment can be changed</p>
        <p>• Name and role are managed by the user or system administrator</p>
        <p>• Department assignment affects task visibility and organization structure</p>
      </div>
    </div>
  );
};

export default EditUserForm;

