import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  allotment: string;
}

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
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
            <Button 
              size="sm" 
              variant={task.status === "in_progress" ? "default" : "outline"}
              className="h-7 px-3 text-xs"
            >
              {task.status === "done" ? "Completed" : "Update Status"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;
