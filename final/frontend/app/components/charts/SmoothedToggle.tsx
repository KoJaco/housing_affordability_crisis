import { Button } from "~/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip";
import { Info } from "lucide-react";

interface SmoothedToggleProps {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    label?: string;
}

export function SmoothedToggle({
    enabled,
    onToggle,
    label = "Use Smoothed Data",
}: SmoothedToggleProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                <Button
                    variant={enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => onToggle(!enabled)}
                >
                    {label}
                </Button>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground"
                                aria-label="What is smoothed data?"
                            >
                                <Info className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p>
                                I have used exponential smoothing, which weights
                                recent quarters more heavily while maintaining
                                responsiveness to trends. This can make patterns
                                easier to see but may hide short-term
                                fluctuations.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}
