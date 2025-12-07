import { Button } from "~/components/ui/button";
import { type TimePeriod } from "~/lib/dateUtils";

interface TimePeriodSelectorProps {
    timePeriod: TimePeriod;
    onTimePeriodChange: (period: TimePeriod) => void;
    includeMax?: boolean;
    maxLabel?: string;
}

const TIME_PERIODS: Array<{ value: TimePeriod; label: string }> = [
    { value: "1yr", label: "1 Year" },
    { value: "3yr", label: "3 Years" },
    { value: "5yr", label: "5 Years" },
];

export function TimePeriodSelector({
    timePeriod,
    onTimePeriodChange,
    includeMax = true,
    maxLabel = "Max (20 Years)",
}: TimePeriodSelectorProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {TIME_PERIODS.map((period) => (
                <Button
                    key={period.value}
                    variant={
                        timePeriod === period.value ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => onTimePeriodChange(period.value)}
                >
                    {period.label}
                </Button>
            ))}
            {includeMax && (
                <Button
                    variant={timePeriod === "max" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onTimePeriodChange("max")}
                >
                    {maxLabel}
                </Button>
            )}
        </div>
    );
}
