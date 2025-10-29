import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import supabase from '@/utils/supabase';

interface WorkAllotment {
  id: string;
  title: string;
  description?: string;
  organization_id: string;
}

interface Department {
  id: string;
  name: string;
  organization_id: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  department_id?: string;
}

interface TaskAssignmentFormProps {
  organizationId: string;
  workAllotments: WorkAllotment[];
  departments: Department[];
  users: User[];
  onTaskCreated: () => void;
  onClose?: () => void;
}

const TaskAssignmentForm = ({ 
  organizationId, 
  workAllotments, 
  departments, 
  users, 
  onTaskCreated, 
  onClose 
}: TaskAssignmentFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetHours, setTargetHours] = useState<string>('0');
  const [selectedAllotmentId, setSelectedAllotmentId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [monthlyHours, setMonthlyHours] = useState<{ [userId: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Filter users by selected department
  const filteredUsers = selectedDepartmentId && selectedDepartmentId !== 'all'
    ? users.filter(user => user.department_id === selectedDepartmentId)
    : users;

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
      // Initialize monthly hours for new user
      if (!monthlyHours[userId]) {
        setMonthlyHours(prev => ({ ...prev, [userId]: '40' }));
      }
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      // Remove monthly hours for deselected user
      setMonthlyHours(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    }
  };

  const handleMonthlyHoursChange = (userId: string, hours: string) => {
    setMonthlyHours(prev => ({ ...prev, [userId]: hours }));
  };

  const createTasks = async () => {
    if (!title.trim() || !selectedAllotmentId || selectedUsers.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select at least one user.",
        variant: "destructive",
      });
      return;
    }
    const hoursNumber = Number(targetHours);
    if (isNaN(hoursNumber) || hoursNumber < 0) {
      toast({
        title: "Invalid hours",
        description: "Please enter a valid number for target hours (>= 0).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Creating tasks with data:', {
        title,
        description,
        selectedAllotmentId,
        organizationId,
        selectedUsers,
        monthlyHours,
        targetHours: hoursNumber
      });

      // Create tasks for each selected user
      const taskPromises = selectedUsers.map(async (userId) => {
        console.log('Creating task for user:', userId);
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .insert({
            allotment_id: selectedAllotmentId,
            user_id: userId,
            organization_id: organizationId,
            title: title.trim(),
            description: description.trim() || null,
            status: 'todo',
            hours: hoursNumber
          })
          .select()
          .single();

        if (taskError) {
          console.error('Task creation error for user', userId, ':', taskError);
          throw taskError;
        }

        console.log('Task created successfully for user', userId, ':', task);

        // TODO: Add monthly hours allocation back once basic task creation is working
        // For now, we'll skip monthly hours to debug the basic task creation

        return task;
      });

      const createdTasks = await Promise.all(taskPromises);

      toast({
        title: "Tasks created successfully",
        description: `Created ${createdTasks.length} task(s) for selected users.`,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setTargetHours('0');
      setSelectedAllotmentId('');
      setSelectedDepartmentId('all');
      setSelectedUsers([]);
      setMonthlyHours({});

      onTaskCreated();
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to create tasks:', error);
      toast({
        title: "Failed to create tasks",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="task-title">Task Title *</Label>
          <Input 
            id="task-title" 
            placeholder="Enter task title" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-description">Description</Label>
          <Textarea 
            id="task-description" 
            placeholder="Enter task description" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

      <div className="space-y-2">
        <Label htmlFor="task-hours">Target Hours</Label>
        <Input
          id="task-hours"
          type="number"
          min="0"
          step="0.25"
          value={targetHours}
          onChange={(e) => setTargetHours(e.target.value)}
          placeholder="e.g., 4"
        />
      </div>

        <div className="space-y-2">
          <Label htmlFor="work-allotment">Work Allotment *</Label>
          <Select value={selectedAllotmentId} onValueChange={setSelectedAllotmentId}>
            <SelectTrigger id="work-allotment">
              <SelectValue placeholder="Select work allotment" />
            </SelectTrigger>
            <SelectContent>
              {workAllotments.map((allotment) => (
                <SelectItem key={allotment.id} value={allotment.id}>
                  {allotment.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="department-filter">Filter by Department (Optional)</Label>
          <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
            <SelectTrigger id="department-filter">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assign to Users</CardTitle>
          <CardDescription>Select users to assign the task to</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {selectedDepartmentId ? 'No users found in selected department.' : 'No users available.'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`user-${user.id}`} className="font-medium">
                      {user.full_name || user.email}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {departments.find(d => d.id === user.department_id)?.name || 'No Department'}
                    </p>
                  </div>
                  {/* Monthly hours UI temporarily disabled for debugging
                  {selectedUsers.includes(user.id) && (
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`hours-${user.id}`} className="text-sm">Monthly Hours:</Label>
                      <Input
                        id={`hours-${user.id}`}
                        type="number"
                        min="0"
                        max="200"
                        step="0.5"
                        value={monthlyHours[user.id] || '40'}
                        onChange={(e) => handleMonthlyHoursChange(user.id, e.target.value)}
                        className="w-20"
                      />
                    </div>
                  )}
                  */}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button 
        onClick={createTasks} 
        disabled={loading || !title.trim() || !selectedAllotmentId || selectedUsers.length === 0}
        className="w-full"
      >
        {loading ? "Creating Tasks..." : `Create ${selectedUsers.length} Task(s)`}
      </Button>

      <div className="text-xs text-muted-foreground">
        <p>• Tasks will be created for each selected user</p>
        <p>• Each user will get their own copy of the task</p>
        <p>• Users can log their work hours against these tasks</p>
        <p>• Monthly hours allocation will be added back once basic functionality is working</p>
      </div>
    </div>
  );
};

export default TaskAssignmentForm;
