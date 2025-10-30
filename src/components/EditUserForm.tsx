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
    working_hours?: number;
  };
  departments: Array<{ id: string; name: string }>;
  onUserUpdated: () => void;
  onClose?: () => void;
  currentUserId?: string;
  onUserRemoved?: () => void;
}

const EditUserForm = ({ user, departments, onUserUpdated, onClose, currentUserId, onUserRemoved }: EditUserFormProps) => {
  const [departmentId, setDepartmentId] = useState(user.department_id || "none");
  const [workingHours, setWorkingHours] = useState<string>(
    typeof user.working_hours === 'number' ? String(user.working_hours) : ''
  );
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateUser = async () => {
    setLoading(true);
    try {
      console.log('Updating user:', { id: user.id, departmentId, workingHours });
      const hoursNumber = workingHours === '' ? null : Number(workingHours);
      if (hoursNumber !== null && (isNaN(hoursNumber) || hoursNumber < 0)) {
        throw new Error('Working hours must be a non-negative number');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          department_id: departmentId === "none" ? null : departmentId || null,
          ...(hoursNumber === null ? {} : { working_hours: hoursNumber })
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
        title: "Profile updated",
        description: `Settings for "${user.full_name}" have been updated successfully.`,
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

  const removeFromOrganization = async () => {
    if (user.id === currentUserId) {
      toast({
        title: "Action not allowed",
        description: "You cannot remove yourself from the organization.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ organization_id: null, department_id: null })
        .eq('id', user.id);
      if (error) throw error;
      toast({
        title: 'User removed from organization',
        description: `${user.full_name || user.email} no longer belongs to this organization.`,
      });
      onUserUpdated();
      if (onUserRemoved) onUserRemoved();
      if (onClose) onClose();
    } catch (error: any) {
      toast({
        title: 'Failed to remove user',
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

      <div className="space-y-2">
        <Label htmlFor="working-hours">Monthly Target Hours</Label>
        <Input
          id="working-hours"
          type="number"
          min="0"
          step="0.5"
          placeholder="e.g., 160"
          value={workingHours}
          onChange={(e) => setWorkingHours(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Target working hours per month for this staff member.</p>
      </div>

      <Button 
        onClick={updateUser} 
        disabled={loading}
        className="w-full"
      >
        {loading ? "Updating..." : "Save Changes"}
      </Button>

      <div className="pt-2">
        <Button 
          variant="destructive" 
          onClick={removeFromOrganization}
          disabled={loading || user.id === currentUserId}
          className="w-full"
          title={user.id === currentUserId ? 'You cannot remove yourself' : undefined}
        >
          Remove from Organization
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>• You can change department and monthly target hours</p>
        <p>• Name and role are managed by the user or system administrator</p>
        <p>• Target hours help evaluate performance vs expected effort</p>
      </div>
    </div>
  );
};

export default EditUserForm;

