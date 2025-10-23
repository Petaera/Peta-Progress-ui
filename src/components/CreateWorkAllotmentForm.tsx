import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import supabase from '@/utils/supabase';

interface Department {
  id: string;
  name: string;
  organization_id: string;
}

interface CreateWorkAllotmentFormProps {
  organizationId: string;
  departments: Department[];
  onWorkAllotmentCreated: () => void;
  onClose?: () => void;
}

const CreateWorkAllotmentForm = ({ 
  organizationId, 
  departments, 
  onWorkAllotmentCreated, 
  onClose 
}: CreateWorkAllotmentFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetHours, setTargetHours] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('none');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createWorkAllotment = async () => {
    if (!title.trim() || !targetHours || !startDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields (title, target hours, and start date).",
        variant: "destructive",
      });
      return;
    }

    const hours = parseFloat(targetHours);
    if (isNaN(hours) || hours <= 0) {
      toast({
        title: "Invalid hours",
        description: "Please enter a valid number of hours greater than 0.",
        variant: "destructive",
      });
      return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    if (end && end <= start) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Creating work allotment:', { 
        organizationId, 
        title, 
        description, 
        targetHours: hours, 
        departmentId: selectedDepartmentId === 'none' ? null : selectedDepartmentId,
        startDate,
        endDate: endDate || null
      });
      
      const { data, error } = await supabase
        .from('work_allotments')
        .insert({
          organization_id: organizationId,
          department_id: selectedDepartmentId === 'none' ? null : selectedDepartmentId,
          title: title.trim(),
          description: description.trim() || null,
          target_hours: hours,
          start_date: startDate,
          end_date: endDate || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating work allotment:', error);
        throw error;
      }

      console.log('Work allotment created:', data);

      toast({
        title: "Work allotment created",
        description: `"${title}" has been created successfully.`,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setTargetHours('');
      setSelectedDepartmentId('none');
      setStartDate('');
      setEndDate('');

      onWorkAllotmentCreated();
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to create work allotment:', error);
      toast({
        title: "Failed to create work allotment",
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
        <Label htmlFor="allotment-title">Title *</Label>
        <Input 
          id="allotment-title" 
          placeholder="Q4 Website Redesign" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="allotment-description">Description</Label>
        <Textarea 
          id="allotment-description" 
          placeholder="Redesign the company website with modern UI/UX" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="target-hours">Target Hours *</Label>
          <Input 
            id="target-hours" 
            type="number" 
            step="0.5"
            min="0.5"
            placeholder="100" 
            value={targetHours}
            onChange={(e) => setTargetHours(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
            <SelectTrigger id="department">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date *</Label>
          <Input 
            id="start-date" 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">End Date</Label>
          <Input 
            id="end-date" 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <Button 
        onClick={createWorkAllotment} 
        disabled={loading || !title.trim() || !targetHours || !startDate}
        className="w-full"
      >
        {loading ? "Creating Work Allotment..." : "Create Work Allotment"}
      </Button>

      <div className="text-xs text-muted-foreground">
        <p>• Work allotments define projects or work packages</p>
        <p>• Target hours help track progress and resource allocation</p>
        <p>• Department assignment is optional but helps with organization</p>
        <p>• End date is optional for ongoing projects</p>
      </div>
    </div>
  );
};

export default CreateWorkAllotmentForm;
