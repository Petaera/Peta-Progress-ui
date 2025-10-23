import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AvailabilityToggleProps {
  isAvailable: boolean;
  onToggle: (available: boolean) => void;
  className?: string;
}

const AvailabilityToggle = ({ isAvailable, onToggle, className }: AvailabilityToggleProps) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <div 
          className={cn(
            "h-2 w-2 rounded-full transition-all",
            isAvailable ? "bg-success pulse-available" : "bg-muted-foreground"
          )}
        />
        {isAvailable && (
          <div className="absolute inset-0 h-2 w-2 rounded-full bg-success animate-ping opacity-75" />
        )}
      </div>
      <Label htmlFor="availability" className="text-sm font-medium cursor-pointer">
        {isAvailable ? "Available" : "Unavailable"}
      </Label>
      <Switch 
        id="availability"
        checked={isAvailable}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-success"
      />
    </div>
  );
};

export default AvailabilityToggle;
