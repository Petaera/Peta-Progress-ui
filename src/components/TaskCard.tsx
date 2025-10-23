import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import supabase from "@/utils/supabase";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  allotment: string;
}

interface TaskCardProps {
  task: Task;
  onTaskUpdated?: () => void;
}

const TaskCard = ({ task, onTaskUpdated }: TaskCardProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateTaskStatus = async (newStatus: "todo" | "in_progress" | "done") => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Task updated",
        description: `Task status changed to ${newStatus.replace('_', ' ')}`,
      });

      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (error: any) {
      toast({
        title: "Failed to update task",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getNextStatus = (): "todo" | "in_progress" | "done" | null => {
    switch (task.status) {
      case "todo":
        return "in_progress";
      case "in_progress":
        return "done";
      case "done":
        return null; // No next status for completed tasks
      default:
        return "in_progress";
    }
  };

  const getStatusButtonText = () => {
    switch (task.status) {
      case "todo":
        return "Start Task";
      case "in_progress":
        return "Mark Complete";
      case "done":
        return "Completed";
      default:
        return "Update Status";
    }
  };
  const statusConfig = {
    todo: {
      label: "To Do",
      variant: "secondary" as const,
      icon: Circle,
      color: "text-muted-foreground",
    },
    in_progress: {
      label: "In Progress",
      variant: "default" as const,
      icon: Clock,
      color: "text-primary",
    },
    done: {
      label: "Done",
      variant: "outline" as const,
      icon: CheckCircle2,
      color: "text-success",
    },
  };

  const config = statusConfig[task.status];
  const StatusIcon = config.icon;

  return (
    <Card className="p-4 hover:shadow-medium transition-shadow border-l-4 border-l-primary">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h4 className="font-semibold leading-tight">{task.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          </div>
          <StatusIcon className={`h-5 w-5 flex-shrink-0 ${config.color}`} />
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-xs">
            {task.allotment}
          </Badge>
          
          <div className="flex gap-2">
            {task.status !== "done" && (
              <Button 
                size="sm" 
                variant={task.status === "in_progress" ? "default" : "outline"}
                className="h-7 px-3 text-xs"
                onClick={() => {
                  const nextStatus = getNextStatus();
                  if (nextStatus) {
                    updateTaskStatus(nextStatus);
                  }
                }}
                disabled={loading}
              >
                {loading ? "Updating..." : getStatusButtonText()}
              </Button>
            )}
            {task.status === "done" && (
              <Badge variant="outline" className="h-7 px-3 text-xs">
                ✓ Completed
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;
