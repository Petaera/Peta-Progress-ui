import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
}

interface DailyLogFormProps {
  tasks: Task[];
}

const DailyLogForm = ({ tasks }: DailyLogFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    taskId: "",
    hours: "",
    notes: "",
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Implement Supabase submission
    setTimeout(() => {
      toast({
        title: "Daily log submitted!",
        description: `Logged ${formData.hours} hours successfully.`,
      });
      setFormData({
        taskId: "",
        hours: "",
        notes: "",
        date: new Date().toISOString().split('T')[0],
      });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="task">Task</Label>
          <Select 
            value={formData.taskId}
            onValueChange={(value) => setFormData({ ...formData, taskId: value })}
            required
          >
            <SelectTrigger id="task">
              <SelectValue placeholder="Select a task" />
            </SelectTrigger>
            <SelectContent>
              {tasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours">Hours Worked</Label>
          <Input
            id="hours"
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            placeholder="8.0"
            value={formData.hours}
            onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <div className="relative">
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Work Notes</Label>
        <Textarea
          id="notes"
          placeholder="What did you accomplish today?"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          required
        />
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit Daily Log"}
      </Button>
    </form>
  );
};

export default DailyLogForm;
