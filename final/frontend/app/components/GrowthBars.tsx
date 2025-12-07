import { useMemo } from "react";
import { formatPercentage } from "~/lib/formatters";
import { isNumber } from "~/lib/typeGuards";

interface GrowthBarsProps {
    suburbs: string[];
    getGrowthValue: (suburb: string) => number | null;
}

export function GrowthBars({ suburbs, getGrowthValue }: GrowthBarsProps) {
    // Calculate all growth values first
    const growthData = useMemo(() => {
        return suburbs
            .map((suburb) => ({
                suburb,
                growth: getGrowthValue(suburb),
            }))
            .map((item) => ({
                suburb: item.suburb,
                growth: isNumber(item.growth) ? item.growth : null,
            }));
    }, [suburbs, getGrowthValue]);

    // Find the maximum absolute growth value for normalization
    const maxGrowth = useMemo(() => {
        const validGrowthValues = growthData
            .filter((item) => item.growth !== null)
            .map((item) => Math.abs(item.growth as number));

        return validGrowthValues.length > 0
            ? Math.max(...validGrowthValues)
            : 1; // Avoid division by zero
    }, [growthData]);

    // Sort by growth value (descending)
    const sortedGrowthData = useMemo(() => {
        return [...growthData].sort((a, b) => {
            const aVal = a.growth ?? -Infinity;
            const bVal = b.growth ?? -Infinity;
            return bVal - aVal;
        });
    }, [growthData]);

    return (
        <div className="space-y-4">
            {sortedGrowthData.map(({ suburb, growth }) => {
                if (growth === null) {
                    return (
                        <div key={suburb} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{suburb}</span>
                                <span className="text-muted-foreground">N/A</span>
                            </div>
                            <div className="h-6 w-full overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className="h-full bg-gray-300"
                                    style={{ width: "0%" }}
                                />
                            </div>
                        </div>
                    );
                }

                // Normalize width: max value = 100%, others proportional
                const normalizedWidth =
                    maxGrowth > 0 ? (Math.abs(growth) / maxGrowth) * 100 : 0;

                return (
                    <div key={suburb} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{suburb}</span>
                            <span
                                className={
                                    growth >= 0 ? "text-green-600" : "text-red-600"
                                }
                            >
                                {formatPercentage(growth)}
                            </span>
                        </div>
                        <div className="h-6 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                                className={`h-full ${
                                    growth >= 0 ? "bg-green-500" : "bg-red-500"
                                }`}
                                style={{
                                    width: `${Math.min(normalizedWidth, 100)}%`,
                                }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

