import { useState, useMemo, useEffect } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import {
    calculateCutoffDate,
    formatQuarterString,
    sortQuarters,
    filterQuartersByDateRange,
    parseQuarterString,
    type TimePeriod,
} from "~/lib/dateUtils";
import { TimePeriodSelector } from "./TimePeriodSelector";
import { ChartTooltip } from "./ChartTooltip";
import { SmoothedToggle } from "./SmoothedToggle";
import { useChartSettingsStore } from "~/lib/chartSettingsStore";
import { useIsMobileBreakpoint } from "~/hooks/useIsMobile";
import type { BulkSuburbsData, QuarterlyStats } from "~/types";

interface TimeSeriesChartProps {
    data: BulkSuburbsData;
    height?: number;
    dataField: "median_price" | "num_sales";
    formatter: (value: number | null | undefined) => string;
    isValidValue: (value: unknown) => value is number;
    tooltipFormatter?: (value: number | null | undefined) => string;
    useSmoothed?: boolean;
    onSmoothedChange?: (enabled: boolean) => void;
}

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

export function TimeSeriesChart({
    data,
    height = 400,
    dataField,
    formatter,
    isValidValue,
    tooltipFormatter,
    useSmoothed = false,
    onSmoothedChange,
}: TimeSeriesChartProps) {
    const isMobile = useIsMobileBreakpoint();
    // Get sync state from store
    const syncEnabled = useChartSettingsStore((state) => state.syncEnabled);
    const globalTimePeriod = useChartSettingsStore((state) => state.globalTimePeriod);
    const globalUseSmoothed = useChartSettingsStore((state) => state.globalUseSmoothed);
    const setGlobalTimePeriod = useChartSettingsStore((state) => state.setGlobalTimePeriod);
    const setGlobalUseSmoothed = useChartSettingsStore((state) => state.setGlobalUseSmoothed);

    // Local state for when sync is disabled or when externally controlled
    const [localTimePeriod, setLocalTimePeriod] = useState<TimePeriod>("max");
    const [localUseSmoothed, setLocalUseSmoothed] = useState(useSmoothed);
    const suburbs = Object.keys(data);

    // Determine if smoothed is externally controlled
    const isExternallyControlled = onSmoothedChange !== undefined;

    // Use global, external, or local state based on sync and external control
    const timePeriod = syncEnabled ? globalTimePeriod : localTimePeriod;
    const smoothedEnabled = isExternallyControlled
        ? useSmoothed
        : syncEnabled
        ? globalUseSmoothed
        : localUseSmoothed;

    const handleTimePeriodChange = (period: TimePeriod) => {
        if (syncEnabled) {
            setGlobalTimePeriod(period);
        } else {
            setLocalTimePeriod(period);
        }
    };

    const handleSmoothedChange = (enabled: boolean) => {
        if (isExternallyControlled) {
            onSmoothedChange(enabled);
        } else if (syncEnabled) {
            setGlobalUseSmoothed(enabled);
        } else {
            setLocalUseSmoothed(enabled);
        }
    };

    // Sync local state when sync is enabled (only if not externally controlled)
    useEffect(() => {
        if (syncEnabled && !isExternallyControlled) {
            setLocalTimePeriod(globalTimePeriod);
            setLocalUseSmoothed(globalUseSmoothed);
        }
    }, [syncEnabled, globalTimePeriod, globalUseSmoothed, isExternallyControlled]);

    // Determine which field to use
    const effectiveDataField =
        dataField === "median_price" && smoothedEnabled
            ? "median_price_smoothed"
            : dataField;

    if (suburbs.length === 0) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                No data
            </div>
        );
    }

    const cutoffDate = useMemo(
        () => calculateCutoffDate(timePeriod),
        [timePeriod]
    );

    const sortedQuarters = useMemo(() => {
        // Collect all unique quarters from all suburbs
        const allQuarters = new Set<string>();
        suburbs.forEach((suburb) => {
            const suburbData = data[suburb];
            if (!suburbData || !suburbData.quarterly) return;
            suburbData.quarterly.forEach((q) => {
                // For median_price with smoothed, check both smoothed and raw
                let value: number | null = null;
                if (effectiveDataField === "median_price_smoothed") {
                    value = q.median_price_smoothed ?? q.median_price;
                } else {
                    value = q[effectiveDataField as keyof QuarterlyStats] as
                        | number
                        | null;
                }
                if (isValidValue(value)) {
                    allQuarters.add(formatQuarterString(q.year, q.quarter));
                }
            });
        });

        const quarters = sortQuarters(Array.from(allQuarters));

        return filterQuartersByDateRange(quarters, cutoffDate, timePeriod);
    }, [
        data,
        suburbs,
        timePeriod,
        cutoffDate,
        effectiveDataField,
        isValidValue,
    ]);

    const chartData = useMemo(() => {
        return sortedQuarters.map((quarter) => {
            const entry: Record<string, any> = { quarter };
            suburbs.forEach((suburb) => {
                const suburbData = data[suburb];
                if (!suburbData || !suburbData.quarterly) {
                    entry[suburb] = null;
                    return;
                }
                const parsedQuarter = parseQuarterString(quarter);
                const quarterData = parsedQuarter
                    ? suburbData.quarterly.find(
                          (q) =>
                              q.year === parsedQuarter.year &&
                              q.quarter === parsedQuarter.quarter
                      )
                    : null;

                if (!quarterData) {
                    entry[suburb] = null;
                    return;
                }

                // For median_price with smoothed, prefer smoothed, fallback to raw
                let value: number | null = null;
                if (effectiveDataField === "median_price_smoothed") {
                    value =
                        quarterData.median_price_smoothed ??
                        quarterData.median_price;
                } else {
                    value = quarterData[
                        effectiveDataField as keyof QuarterlyStats
                    ] as number | null;
                }

                entry[suburb] = isValidValue(value) ? value : null;
            });
            return entry;
        });
    }, [sortedQuarters, suburbs, data, effectiveDataField, isValidValue]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <TimePeriodSelector
                    timePeriod={timePeriod}
                    onTimePeriodChange={handleTimePeriodChange}
                />
                {dataField === "median_price" && (
                    <SmoothedToggle
                        enabled={smoothedEnabled}
                        onToggle={handleSmoothedChange}
                    />
                )}
            </div>

            <ResponsiveContainer width="100%" height={height}>
                <LineChart
                    data={chartData}
                    margin={{ 
                        top: 5, 
                        right: isMobile ? 10 : 30, 
                        left: isMobile ? 5 : 20, 
                        bottom: 5 
                    }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                    />
                    <XAxis
                        dataKey="quarter"
                        className="text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tickFormatter={formatter}
                        className="text-xs"
                        width={isMobile ? 50 : 80}
                        domain={["dataMin", "dataMax"]}
                    />
                    <Tooltip
                        content={
                            <ChartTooltip
                                formatter={tooltipFormatter || formatter}
                            />
                        }
                    />
                    <Legend />
                    {suburbs.map((suburb, index) => (
                        <Line
                            key={suburb}
                            type="monotone"
                            dataKey={suburb}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
