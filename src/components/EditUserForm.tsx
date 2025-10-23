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
  const [fullName, setFullName] = useState(user.full_name || '');
  const [role, setRole] = useState(user.role || 'user');
  const [departmentId, setDepartmentId] = useState(user.department_id || "none");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateUser = async () => {
    setLoading(true);
    try {
      console.log('Updating user:', { id: user.id, fullName, role, departmentId });
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          role: role,
          department_id: departmentId === "none" ? null : departmentId || null
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }

      console.log('User updated:', data);

      toast({
        title: "User updated",
        description: `User "${fullName}" has been updated successfully.`,
      });

      onUserUpdated();
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast({
        title: "Failed to update user",
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
          placeholder="Enter full name" 
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-role">Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger id="user-role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
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
        disabled={loading || !fullName.trim()}
        className="w-full"
      >
        {loading ? "Updating User..." : "Update User"}
      </Button>

      <div className="text-xs text-muted-foreground">
        <p>• Update user's role and department assignment</p>
        <p>• Admin role grants full organization access</p>
        <p>• User role limits access to assigned tasks</p>
      </div>
    </div>
  );
};

export default EditUserForm;

