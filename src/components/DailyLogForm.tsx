import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Plus, Briefcase } from "lucide-react";
import supabase from "@/utils/supabase";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  allotment?: string;
}

interface WorkAllotment {
  id: string;
  title: string;
  description?: string;
  organization_id: string;
}

interface DailyLogFormProps {
  tasks: Task[];
}

const DailyLogForm = ({ tasks }: DailyLogFormProps) => {
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workAllotments, setWorkAllotments] = useState<WorkAllotment[]>([]);
  const [loadingAllotments, setLoadingAllotments] = useState(true);
  const [formData, setFormData] = useState({
    taskId: "",
    hours: "",
    notes: "",
    date: new Date().toISOString().split('T')[0],
    // New task creation fields
    newTaskTitle: "",
    newTaskDescription: "",
    selectedAllotmentId: "",
  });

  useEffect(() => {
    fetchWorkAllotments();
  }, [authUser]);

  const fetchWorkAllotments = async () => {
    if (!authUser) return;

    try {
      // Get user's organization from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', authUser.id)
        .single();

      if (profile?.organization_id) {
        const { data: allotments, error } = await supabase
          .from('work_allotments')
          .select('id, title, description, organization_id')
          .eq('organization_id', profile.organization_id)
          .order('title');

        if (error) {
          console.error('Error fetching work allotments:', error);
        } else {
          setWorkAllotments(allotments || []);
        }
      }
    } catch (error) {
      console.error('Error fetching work allotments:', error);
    } finally {
      setLoadingAllotments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let taskId = formData.taskId;
      
      // If creating a new task
      if (formData.newTaskTitle && formData.selectedAllotmentId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', authUser?.id)
          .single();

        if (!profile?.organization_id) {
          throw new Error('User organization not found');
        }

        // Create new task
        const { data: newTask, error: taskError } = await supabase
          .from('tasks')
          .insert({
            allotment_id: formData.selectedAllotmentId,
            user_id: authUser?.id,
            organization_id: profile.organization_id,
            title: formData.newTaskTitle,
            description: formData.newTaskDescription,
            status: 'in_progress'
          })
          .select()
          .single();

        if (taskError) {
          throw taskError;
        }

        taskId = newTask.id;
      }

      // Create daily log
      const { error: logError } = await supabase
        .from('daily_logs')
        .insert({
          user_id: authUser?.id,
          task_id: taskId,
          log_date: formData.date,
          tasks_completed: formData.notes,
          hours_spent: parseFloat(formData.hours)
        });

      if (logError) {
        throw logError;
      }

      toast({
        title: "Daily log submitted!",
        description: `Logged ${formData.hours} hours successfully.`,
      });

      // Reset form
      setFormData({
        taskId: "",
        hours: "",
        notes: "",
        date: new Date().toISOString().split('T')[0],
        newTaskTitle: "",
        newTaskDescription: "",
        selectedAllotmentId: "",
      });

    } catch (error: any) {
      toast({
        title: "Error submitting log",
        description: error.message || "Failed to submit daily log.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="existing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Assigned Tasks
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Task
          </TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Log Hours for Assigned Task</CardTitle>
              <CardDescription>
                Select from your currently assigned tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  disabled={isSubmitting || !formData.taskId}
                >
                  {isSubmitting ? "Submitting..." : "Submit Daily Log"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Task & Log Hours</CardTitle>
              <CardDescription>
                Create a new task and log hours for it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="allotment">Work Allotment</Label>
                    <Select 
                      value={formData.selectedAllotmentId}
                      onValueChange={(value) => setFormData({ ...formData, selectedAllotmentId: value })}
                      required
                    >
                      <SelectTrigger id="allotment">
                        <SelectValue placeholder="Select work allotment" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingAllotments ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          workAllotments.map((allotment) => (
                            <SelectItem key={allotment.id} value={allotment.id}>
                              {allotment.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newTaskTitle">Task Title</Label>
                    <Input
                      id="newTaskTitle"
                      placeholder="Enter task title"
                      value={formData.newTaskTitle}
                      onChange={(e) => setFormData({ ...formData, newTaskTitle: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newTaskDescription">Task Description</Label>
                  <Textarea
                    id="newTaskDescription"
                    placeholder="Describe what this task involves"
                    value={formData.newTaskDescription}
                    onChange={(e) => setFormData({ ...formData, newTaskDescription: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newHours">Hours Worked</Label>
                    <Input
                      id="newHours"
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

                  <div className="space-y-2">
                    <Label htmlFor="newDate">Date</Label>
                    <div className="relative">
                      <Input
                        id="newDate"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                      <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newNotes">Work Notes</Label>
                  <Textarea
                    id="newNotes"
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
                  disabled={isSubmitting || !formData.newTaskTitle || !formData.selectedAllotmentId}
                >
                  {isSubmitting ? "Creating Task & Submitting..." : "Create Task & Submit Log"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DailyLogForm;
