import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface AvailabilityToggleProps {
  isAvailable: boolean;
  onToggle: (available: boolean) => void;
  className?: string;
}

const AvailabilityToggle = ({ isAvailable, onToggle, className }: AvailabilityToggleProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex flex-shrink-0 items-center justify-center">
        <span className={cn("h-2 w-2 rounded-full transition-all block", isAvailable ? "bg-success" : "bg-destructive")}></span>
        {isAvailable && (
          <span className="absolute inset-0 h-2 w-2 rounded-full bg-success animate-ping opacity-75" />
        )}
      </span>
      <Switch
        id="availability"
        checked={isAvailable}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-success"
      />
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="ml-0.5 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40" tabIndex={0} aria-label="Availability info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="center" className="max-w-xs text-xs">
          Switch your availability status.<br />
          <span className="inline-flex items-center gap-1 mt-1">
            <span className="inline-block h-2 w-2 rounded-full bg-success" /> Green = Available,
            <span className="inline-block h-2 w-2 rounded-full bg-destructive" /> Red = Unavailable.
          </span>
          <br />Team and admins see your status.
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default AvailabilityToggle;
